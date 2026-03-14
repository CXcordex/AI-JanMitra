import asyncio
import requests
from bs4 import BeautifulSoup
from app.core.config import settings
from app.services.vector import vector_service
import uuid
import time
from typing import List, Dict, Any

GOVT_SITES = [
    ('https://www.myscheme.gov.in/', 'General'),
    ('https://pmindia.gov.in/en/government_transeperancy/', 'Central'),
    ('https://services.india.gov.in/service/ministry_service/2', 'Services'),
    ('https://rbi.org.in/Scripts/PublicationConsumerSCReport.aspx', 'Finance'),
    ('https://cybercrime.gov.in/', 'Safety')
]

async def scrape_site(url: str, category: str) -> List[Dict[str, Any]]:
    """Async scrape govt sites"""
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    try:
        # Using synchronous requests for simplicity in this script, but could use httpx
        resp = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        schemes = []
        # Generic selectors - adapt per site
        # This is a simplified scraper - real-world would need per-site logic
        cards = soup.find_all(['div', 'li', 'a'], class_=['scheme', 'card', 'list-item', 'service-item'])
        if not cards:
            # Fallback if no cards found - look for links with scheme-like text
            cards = soup.find_all('a', string=lambda t: t and ('Yojana' in t or 'Scheme' in t or 'Grant' in t))
            
        for card in cards[:10]:  # Limit per site
            name = card.find(['h2', 'h3', 'a']) or card
            name_text = name.text.strip() if hasattr(name, 'text') else str(name).strip()
            
            desc = card.find(['p', 'div', 'span'], class_=['desc', 'content', 'summary']) or card
            desc_text = desc.text.strip() if hasattr(desc, 'text') else str(desc).strip()
            
            if len(name_text) > 5 and len(desc_text) > 10:
                schemes.append({
                    'name': name_text[:200],
                    'description': desc_text[:1000],
                    'amount': 'TBD',
                    'benefit_type': 'Subsidy',
                    'category': category,
                    'application_url': url if not hasattr(name, 'get') else name.get('href', url)
                })
        
        return schemes
    except Exception as e:
        print(f"Scrape {url} error: {e}")
        return []

async def scrape_all():
    """Scrape govt sites and save to Supabase"""
    all_schemes = []
    for url, cat in GOVT_SITES:
        print(f"Scraping {url}...")
        schemes = await scrape_site(url, cat)
        all_schemes.extend(schemes)
        await asyncio.sleep(2)  # Polite delay
    
    # Add high-quality demo data if scraping yielded few results
    if len(all_schemes) < 10:
        demo = [
            {'name': 'PM Kisan Samman Nidhi', 'description': 'Direct income support of ₹6,000 per year for farmer families.', 'amount': '₹6000/year', 'benefit_type': 'Direct Benefit Transfer', 'category': 'Agriculture', 'application_url': 'https://pmkisan.gov.in'},
            {'name': 'Ayushman Bharat (PM-JAY)', 'description': 'Health insurance cover of ₹5 lakh per year per family for secondary and tertiary care hospitalization.', 'amount': '₹5L/year', 'benefit_type': 'Health Insurance', 'category': 'Health', 'application_url': 'https://pmjay.gov.in'},
            {'name': 'PM Awas Yojana (Gramin)', 'description': 'Financial assistance for construction of pucca house to all houseless householders living in dilapidated houses in rural areas.', 'amount': 'Up to ₹1.2L', 'benefit_type': 'Housing', 'category': 'Housing', 'application_url': 'https://pmayg.nic.in'},
            {'name': 'PM Ujjwala Yojana', 'description': 'Provides free LPG connections to women from Below Poverty Line (BPL) households.', 'amount': 'Free LPG Connection', 'benefit_type': 'LPG Subsidy', 'category': 'Women Welfare', 'application_url': 'https://pmuy.gov.in'},
            {'name': 'Sukanya Samriddhi Yojana', 'description': 'Small deposit scheme for the girl child as part of Beti Bachao Beti Padhao campaign.', 'amount': 'High interest savings', 'benefit_type': 'Savings', 'category': 'Girl Child', 'application_url': 'https://nsiindia.gov.in'},
            {'name': 'Pradhan Mantri Mudra Yojana', 'description': 'Loans up to ₹10 lakh for non-corporate, non-farm small/micro enterprises.', 'amount': 'Up to ₹10L Loan', 'benefit_type': 'Loan', 'category': 'Business', 'application_url': 'https://mudra.org.in'}
        ]
        all_schemes.extend(demo)
    
    client = vector_service._get_client()
    success_count = 0
    
    for s in all_schemes:
        try:
            # Generate embedding for the scheme description
            embedding = await vector_service.get_embedding(f"{s['name']}: {s['description']}")
            
            data = {
                'name': s['name'],
                'description': s['description'],
                'amount': s['amount'],
                'benefit_type': s['benefit_type'],
                'category': s['category'],
                'application_url': s['application_url'],
                'embedding': embedding,
                'is_active': True
            }
            
            # Upsert into schemes table
            response = client.table('schemes').upsert(data, on_conflict='name').execute()
            success_count += 1
            print(f"✅ Indexed: {s['name']}")
        except Exception as e:
            print(f"❌ Failed to index {s['name']}: {e}")
    
    print(f"\n✅ Scraped and indexed {success_count} schemes!")

if __name__ == '__main__':
    asyncio.run(scrape_all())

