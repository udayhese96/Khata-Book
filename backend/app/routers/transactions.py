from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import crud
import schemas
import database

router = APIRouter(
    prefix="/transaction",
    tags=["transactions"]
)


@router.post("/add", response_model=schemas.TransactionDetailResponse)
def add_transaction(txn: schemas.TransactionDetailCreate, db: Session = Depends(database.get_db)):
    """Add a new transaction (credit/debit) for a company.
    
    - credit = firm gives us money (net goes up / positive)
    - debit = firm owes us money (net goes down / negative)
    - If net_amount is negative → firm needs to pay us
    - If net_amount is positive → we need to pay firm
    """
    result = crud.create_transaction(db, txn)
    if not result:
        raise HTTPException(status_code=404, detail="Company not found")
    return result


@router.get("/all", response_model=List[schemas.TransactionDetailResponse])
def get_all_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all transactions across all companies"""
    return crud.get_all_transactions(db, skip=skip, limit=limit)


@router.get("/company/{company_id}", response_model=List[schemas.TransactionDetailResponse])
def get_transactions_by_company(company_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all transactions for a specific company"""
    company = crud.get_company(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return crud.get_transactions_by_company(db, company_id, skip=skip, limit=limit)


@router.get("/company/{company_id}/balance")
def get_company_balance(company_id: int, db: Session = Depends(database.get_db)):
    """Get the net balance for a company.
    
    Returns:
    - net_balance: negative = firm owes us, positive = we owe firm
    - status: "firm_owes_us" or "we_owe_firm" or "settled"
    """
    company = crud.get_company(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    net = crud.get_company_net_balance(db, company_id)
    if net < 0:
        status_text = "firm_owes_us"
    elif net > 0:
        status_text = "we_owe_firm"
    else:
        status_text = "settled"

    return {
        "company_id": company_id,
        "firm_name": company.firm_name,
        "net_balance": net,
        "status": status_text,
    }


@router.get("/{transaction_id}", response_model=schemas.TransactionDetailResponse)
def get_transaction(transaction_id: int, db: Session = Depends(database.get_db)):
    """Get a single transaction by ID"""
    txn = crud.get_transaction(db, transaction_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn
