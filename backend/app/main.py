from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add the app directory to the path so imports work from any directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base
from routers import companies, expenses, transactions

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="B2B Expense Tracker API",
    description="Backend for a B2B expense tracker with Company, Product Purchase, and Transaction tables.",
    version="3.0.0"
)

# CORS Setup - Allow all for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(companies.router)
app.include_router(expenses.router)
app.include_router(transactions.router)

@app.get("/")
def read_root():
    return {"message": "B2B Expense Tracker Backend Running v3.0"}
