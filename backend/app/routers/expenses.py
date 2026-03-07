from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import crud
import schemas
import database

router = APIRouter(
    prefix="/purchase",
    tags=["product_purchases"]
)


@router.post("/add", response_model=schemas.ProductPurchaseResponse)
def add_purchase(purchase: schemas.ProductPurchaseCreate, db: Session = Depends(database.get_db)):
    """Add a new product purchase for a company"""
    result = crud.create_purchase(db, purchase)
    if not result:
        raise HTTPException(status_code=404, detail="Company not found")
    return result


@router.get("/all", response_model=List[schemas.ProductPurchaseResponse])
def get_all_purchases(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all product purchases"""
    return crud.get_all_purchases(db, skip=skip, limit=limit)


@router.get("/company/{company_id}", response_model=List[schemas.ProductPurchaseResponse])
def get_purchases_by_company(company_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Get all product purchases for a specific company"""
    company = crud.get_company(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return crud.get_purchases_by_company(db, company_id, skip=skip, limit=limit)


@router.get("/{purchase_id}", response_model=schemas.ProductPurchaseResponse)
def get_purchase(purchase_id: int, db: Session = Depends(database.get_db)):
    """Get a single purchase by ID"""
    purchase = crud.get_purchase(db, purchase_id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return purchase
