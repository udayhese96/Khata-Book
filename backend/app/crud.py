from sqlalchemy.orm import Session
from sqlalchemy import desc
import models
import schemas
from datetime import datetime
from decimal import Decimal
import pytz

IST = pytz.timezone('Asia/Kolkata')


def get_ist_time_str():
    return datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S")


# =============================================
# Company CRUD
# =============================================

def get_company(db: Session, company_id: int):
    return db.query(models.Company).filter(models.Company.id == company_id).first()


def get_all_companies(db: Session):
    return db.query(models.Company).all()


def search_companies(db: Session, query: str, limit: int = 10):
    """Search companies by firm name (case-insensitive partial match)"""
    search_term = f"%{query}%"
    return db.query(models.Company).filter(
        models.Company.firm_name.ilike(search_term)
    ).limit(limit).all()


def create_company(db: Session, company: schemas.CompanyCreate):
    # Convert contact persons to list of dicts for JSONB
    contact_data = [cp.model_dump() for cp in company.contact_persons]

    db_company = models.Company(
        firm_name=company.firm_name,
        owner_name=company.owner_name,
        owner_phone=company.owner_phone,
        address=company.address,
        contact_persons=contact_data,
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company


def update_company(db: Session, company_id: int, update_data: schemas.CompanyUpdate):
    company = get_company(db, company_id)
    if not company:
        return None

    update_dict = update_data.model_dump(exclude_unset=True)

    # Convert contact_persons if provided
    if "contact_persons" in update_dict and update_dict["contact_persons"] is not None:
        update_dict["contact_persons"] = [cp.model_dump() if hasattr(cp, 'model_dump') else cp for cp in update_data.contact_persons]

    for key, value in update_dict.items():
        setattr(company, key, value)

    db.commit()
    db.refresh(company)
    return company


def delete_company(db: Session, company_id: int):
    company = get_company(db, company_id)
    if not company:
        return False
    db.delete(company)
    db.commit()
    return True


# =============================================
# Product Purchase CRUD
# =============================================

def get_purchase(db: Session, purchase_id: int):
    return db.query(models.ProductPurchase).filter(models.ProductPurchase.id == purchase_id).first()


def get_purchases_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.ProductPurchase).filter(
        models.ProductPurchase.company_id == company_id
    ).order_by(desc(models.ProductPurchase.created_at)).offset(skip).limit(limit).all()


def get_all_purchases(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.ProductPurchase).order_by(
        desc(models.ProductPurchase.created_at)
    ).offset(skip).limit(limit).all()


def create_purchase(db: Session, purchase: schemas.ProductPurchaseCreate):
    company = get_company(db, purchase.company_id)
    if not company:
        return None

    # Build products JSONB
    products_data = [p.model_dump() for p in purchase.products]

    # Calculate bill
    remaining = purchase.total_amount - purchase.amount_paid
    bill_data = {
        "total_amount": purchase.total_amount,
        "amount_paid": purchase.amount_paid,
        "remaining": remaining,
    }

    new_purchase = models.ProductPurchase(
        company_id=purchase.company_id,
        products=products_data,
        vehicle_number=purchase.vehicle_number,
        notes=purchase.notes,
        bill=bill_data,
        purchase_date=get_ist_time_str(),
    )

    db.add(new_purchase)
    db.commit()
    db.refresh(new_purchase)
    
    # --- Auto-generate ledger transactions ---
    # 1. Total Bill
    if purchase.total_amount > 0:
        bill_txn = schemas.TransactionDetailCreate(
            company_id=purchase.company_id,
            transaction_type="credit",
            amount=purchase.total_amount,
            transaction_notes=f"Purchase Bill (Total Value)",
            vehicle_number=purchase.vehicle_number,
            notes=purchase.notes
        )
        create_transaction(db, bill_txn)

    # 2. Amount Paid Upfront
    if purchase.amount_paid > 0:
        payment_txn = schemas.TransactionDetailCreate(
            company_id=purchase.company_id,
            transaction_type="debit",
            amount=purchase.amount_paid,
            transaction_notes=f"Payment Made for Purchase",
            transaction_done=schemas.TransactionDoneInfo(
                amount_paid=purchase.amount_paid,
                paid_by="us"
            )
        )
        create_transaction(db, payment_txn)

    return new_purchase



# =============================================
# Transaction Detail CRUD
# =============================================

def get_transaction(db: Session, transaction_id: int):
    return db.query(models.TransactionDetail).filter(models.TransactionDetail.id == transaction_id).first()


def get_transactions_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.TransactionDetail).filter(
        models.TransactionDetail.company_id == company_id
    ).order_by(desc(models.TransactionDetail.created_at)).offset(skip).limit(limit).all()


def get_all_transactions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.TransactionDetail).order_by(
        desc(models.TransactionDetail.created_at)
    ).offset(skip).limit(limit).all()


def get_company_net_balance(db: Session, company_id: int) -> float:
    """Calculate current net balance for a company from all transactions.
    Negative = firm owes us, Positive = we owe firm.
    """
    transactions = db.query(models.TransactionDetail).filter(
        models.TransactionDetail.company_id == company_id
    ).all()

    net = 0.0
    for t in transactions:
        if t.transaction_type == "credit":
            net += float(t.amount)
        elif t.transaction_type == "debit":
            net -= float(t.amount)

    return net


def create_transaction(db: Session, txn: schemas.TransactionDetailCreate):
    company = get_company(db, txn.company_id)
    if not company:
        return None

    # Calculate net amount after this transaction
    current_net = get_company_net_balance(db, txn.company_id)
    if txn.transaction_type == "credit":
        new_net = current_net + txn.amount
    else:  # debit
        new_net = current_net - txn.amount

    # Build product_details JSONB if provided
    product_details_data = None
    if txn.product_details:
        product_details_data = txn.product_details.model_dump()

    # Build transaction_done JSONB if provided
    transaction_done_data = None
    if txn.transaction_done:
        done = txn.transaction_done.model_dump()
        if not done.get("timestamp"):
            done["timestamp"] = get_ist_time_str()
        transaction_done_data = done

    new_transaction = models.TransactionDetail(
        company_id=txn.company_id,
        transaction_type=txn.transaction_type,
        amount=Decimal(str(txn.amount)),
        net_amount=Decimal(str(new_net)),
        transaction_notes=txn.transaction_notes,
        product_details=product_details_data,
        vehicle_number=txn.vehicle_number,
        notes=txn.notes,
        amount_paid=Decimal(str(txn.amount_paid)) if txn.amount_paid is not None else None,
        transaction_done=transaction_done_data,
        timestamp_ist=get_ist_time_str(),
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    return new_transaction


def get_company_full(db: Session, company_id: int):
    """Get company with all purchases and transactions"""
    company = get_company(db, company_id)
    if not company:
        return None

    purchases = get_purchases_by_company(db, company_id)
    transactions = get_transactions_by_company(db, company_id)
    net_balance = get_company_net_balance(db, company_id)

    return {
        "company": company,
        "purchases": purchases,
        "transactions": transactions,
        "net_balance": net_balance,
    }
