from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Any
from datetime import datetime
import re


# =============================================
# Contact Person (embedded in Company JSON)
# =============================================

class ContactPerson(BaseModel):
    name: str
    phone: str
    post: Optional[str] = None


# =============================================
# Company / Firm Schemas
# =============================================

class CompanyCreate(BaseModel):
    firm_name: str
    owner_name: str
    owner_phone: str
    address: str
    contact_persons: List[ContactPerson] = []

    @field_validator('owner_phone')
    @classmethod
    def validate_owner_phone(cls, v):
        if not v.isdigit() or len(v) != 10:
            raise ValueError('Owner phone must be exactly 10 digits')
        return v


class CompanyUpdate(BaseModel):
    firm_name: Optional[str] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    address: Optional[str] = None
    contact_persons: Optional[List[ContactPerson]] = None


class CompanyResponse(BaseModel):
    id: int
    firm_name: str
    owner_name: str
    owner_phone: str
    address: str
    contact_persons: List[Any] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# =============================================
# Product Item (embedded in Purchase JSON)
# =============================================

class ProductItem(BaseModel):
    name: str
    quantity: float
    unit: str
    price_per_unit: float
    subtotal: float


# =============================================
# Bill Info (embedded in Purchase JSON)
# =============================================

class BillInfo(BaseModel):
    total_amount: float
    amount_paid: float
    remaining: float


# =============================================
# Product Purchase Schemas
# =============================================

class ProductPurchaseCreate(BaseModel):
    company_id: int
    products: List[ProductItem] = []
    vehicle_number: Optional[str] = None
    notes: Optional[str] = None
    total_amount: float
    amount_paid: float = 0


class ProductPurchaseResponse(BaseModel):
    id: int
    company_id: int
    products: List[Any] = []
    vehicle_number: Optional[str] = None
    notes: Optional[str] = None
    bill: Any = {}
    purchase_date: str
    created_at: datetime

    model_config = {"from_attributes": True}


# =============================================
# Transaction Done Info (embedded in Transaction JSON)
# =============================================

class TransactionDoneInfo(BaseModel):
    amount_paid: float
    paid_by: Optional[str] = None       # "firm" or "us"
    payment_method: Optional[str] = None  # "cash", "upi", "bank", etc.
    timestamp: Optional[str] = None


# =============================================
# Product Details for Transaction (embedded JSON)
# =============================================

class TransactionProductDetails(BaseModel):
    products: List[ProductItem] = []
    vehicle_number: Optional[str] = None
    notes: Optional[str] = None


# =============================================
# Transaction Detail Schemas
# =============================================

class TransactionDetailCreate(BaseModel):
    company_id: int
    transaction_type: str = Field(..., pattern="^(credit|debit)$")  # "credit" or "debit"
    amount: float
    transaction_notes: Optional[str] = None
    product_details: Optional[TransactionProductDetails] = None
    vehicle_number: Optional[str] = None
    notes: Optional[str] = None
    amount_paid: Optional[float] = None
    transaction_done: Optional[TransactionDoneInfo] = None


class TransactionDetailResponse(BaseModel):
    id: int
    company_id: int
    transaction_type: str
    amount: float
    net_amount: float
    transaction_notes: Optional[str] = None
    product_details: Any = None
    vehicle_number: Optional[str] = None
    notes: Optional[str] = None
    amount_paid: Optional[float] = None
    transaction_done: Any = None
    timestamp_ist: str
    created_at: datetime

    model_config = {"from_attributes": True}


# =============================================
# Company with related data
# =============================================

class CompanyWithPurchases(CompanyResponse):
    purchases: List[ProductPurchaseResponse] = []


class CompanyWithTransactions(CompanyResponse):
    transactions: List[TransactionDetailResponse] = []


class CompanyFull(CompanyResponse):
    purchases: List[ProductPurchaseResponse] = []
    transactions: List[TransactionDetailResponse] = []
    net_balance: float = 0  # Computed: negative = firm owes us, positive = we owe firm
