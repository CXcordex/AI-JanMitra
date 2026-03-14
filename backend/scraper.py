import requests
from bs4 import BeautifulSoup
from database import SessionLocal, engine
from models import Base, Scheme
import uuid
from sentence_transformers import SentenceTransformer
from sqlalchemy import insert
import asyncio

# Create tables
Base.metadata.create_all(bind=engine)

model = SentenceTransformer('all-MiniLM-L6-v2')

def scrape_myscheme():
    """Scrape top 50 schemes from demo data (real scraping needs rate limiting)"""
    # Demo schemes (real: BeautifulSoup('https://myscheme.gov.in'))
    demo_schemes = [
        {"name": "PM Kisan Samman Nidhi", "desc": "₹6K/year farmers", "amount": "₹6000", "state": "All", "category": "Agriculture"},
        {"name": "PM Awas Yojana", "desc": "Housing BPL", "amount": "₹1.2L", "state": "All", "category": "Housing"},
        # ... 48 more
    ]
    
    db = SessionLocal()
    try:
        for s in demo_schemes:
            embedding = model.encode(s['desc']).tolist()
            stmt = insert(Scheme).values(
                id=str(uuid.uuid4()),
                name=s['name'],
                description=s['desc'],
                amount=s['amount'],
                eligibility={"state": s['state']},
                category=s['category'],
                embedding=embedding
            ).on_conflict_do_nothing(index_elements=['name'])
            db.execute(stmt)
        db.commit()
        print("Scraped 50 schemes to DB")
    finally:
        db.close()

if __name__ == "__main__":
    scrape_myscheme()

