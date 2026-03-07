from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import crud
import schemas
import database

router = APIRouter(
    prefix="/company",
    tags=["companies"]
)


@router.post("/register", response_model=schemas.CompanyResponse)
def register_company(company: schemas.CompanyCreate, db: Session = Depends(database.get_db)):
    """Register a new company/firm with contact persons"""
    return crud.create_company(db=db, company=company)


@router.get("/all", response_model=List[schemas.CompanyResponse])
def get_all_companies(db: Session = Depends(database.get_db)):
    """Get all registered companies"""
    return crud.get_all_companies(db)


@router.get("/search", response_model=List[schemas.CompanyResponse])
def search_companies(q: str = "", db: Session = Depends(database.get_db)):
    """Search companies by firm name for autocomplete"""
    if len(q) < 2:
        return []
    return crud.search_companies(db, query=q, limit=10)


@router.get("/{company_id}", response_model=schemas.CompanyResponse)
def get_company(company_id: int, db: Session = Depends(database.get_db)):
    """Get a single company by ID"""
    company = crud.get_company(db, company_id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.get("/{company_id}/full")
def get_company_full(company_id: int, db: Session = Depends(database.get_db)):
    """Get company with all purchases, transactions, and net balance"""
    result = crud.get_company_full(db, company_id)
    if not result:
        raise HTTPException(status_code=404, detail="Company not found")

    company = result["company"]
    return {
        "id": company.id,
        "firm_name": company.firm_name,
        "owner_name": company.owner_name,
        "owner_phone": company.owner_phone,
        "address": company.address,
        "contact_persons": company.contact_persons,
        "created_at": company.created_at,
        "updated_at": company.updated_at,
        "purchases": result["purchases"],
        "transactions": result["transactions"],
        "net_balance": result["net_balance"],
    }


@router.put("/{company_id}", response_model=schemas.CompanyResponse)
def update_company(company_id: int, update: schemas.CompanyUpdate, db: Session = Depends(database.get_db)):
    """Update company details"""
    company = crud.update_company(db, company_id, update)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.delete("/{company_id}", status_code=204)
def delete_company(company_id: int, db: Session = Depends(database.get_db)):
    """Delete a company and all its related data"""
    if not crud.delete_company(db, company_id):
        raise HTTPException(status_code=404, detail="Company not found")
    return None
