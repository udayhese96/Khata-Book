from sqlalchemy import Column, String, DateTime, Text, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Company(Base):
    """Table 1: Company / Firm details"""
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    firm_name = Column(String, nullable=False)
    owner_name = Column(String, nullable=False)
    owner_phone = Column(String(15), nullable=False)
    address = Column(Text, nullable=False)

    # Multiple contact persons stored as JSONB array
    # Format: [{"name": "John", "phone": "9876543210", "post": "Manager"}, ...]
    contact_persons = Column(JSONB, default=[])

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    purchases = relationship("ProductPurchase", back_populates="company", cascade="all, delete-orphan")
    transactions = relationship("TransactionDetail", back_populates="company", cascade="all, delete-orphan")


class ProductPurchase(Base):
    """Table 2: Product purchases linked to a company"""
    __tablename__ = "product_purchases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)

    # Products purchased that day as JSONB array
    # Format: [{"name": "Cement", "quantity": 10, "unit": "bags", "price_per_unit": 350, "subtotal": 3500}, ...]
    products = Column(JSONB, default=[])

    vehicle_number = Column(String(20), nullable=True)  # e.g. MH12AB1234
    notes = Column(Text, nullable=True)

    # Bill info stored as JSONB
    # Format: {"total_amount": 5000, "amount_paid": 2000, "remaining": 3000}
    bill = Column(JSONB, default={"total_amount": 0, "amount_paid": 0, "remaining": 0})

    purchase_date = Column(String(50), nullable=False)  # IST timestamp string
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    company = relationship("Company", back_populates="purchases")


class TransactionDetail(Base):
    """Table 3: Transaction details (credit/debit ledger)"""
    __tablename__ = "transaction_details"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)

    # Transaction type: "credit" or "debit"
    transaction_type = Column(String(10), nullable=False)

    # Amounts
    amount = Column(Numeric(12, 2), nullable=False)           # Transaction amount
    net_amount = Column(Numeric(12, 2), nullable=False)       # Running net balance (negative = firm owes us, positive = we owe firm)

    # Notes
    transaction_notes = Column(Text, nullable=True)

    # Product details if this transaction is linked to a purchase
    # Format: {"products": [{"name": "Cement", "quantity": 10, ...}], "vehicle_number": "MH12AB1234", "notes": "..."}
    product_details = Column(JSONB, nullable=True)

    vehicle_number = Column(String(20), nullable=True)  # e.g. MH12AB1234
    notes = Column(Text, nullable=True)

    # Amount paid in this transaction
    amount_paid = Column(Numeric(12, 2), nullable=True)

    # Settlement / payment done details as JSONB
    # Format: {"amount_paid": 2000, "paid_by": "firm", "payment_method": "cash", "timestamp": "2024-12-28 15:30:00"}
    transaction_done = Column(JSONB, nullable=True)

    timestamp_ist = Column(String(50), nullable=False)  # IST timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    company = relationship("Company", back_populates="transactions")
