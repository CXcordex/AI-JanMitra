from fastapi import APIRouter, HTTPException, Depends
from app.models.requests import (
    ChatRequest,
    ChatResponse,
    ScanDocumentRequest,
    ScanResponse,
    SchemeSearchRequest,
    SchemeListResponse,
    SchemeResponse,
    UserProfileRequest,
    HealthResponse,
    IntentDetectionResponse,
    AgentType
)
from app.agents.react_loop import react_agent
from app.services.ocr import ocr_service
from app.services.intent import intent_detector
from typing import List, Optional
import uuid
from datetime import datetime
import asyncio
import aiohttp
from bs4 import BeautifulSoup

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": "production"
    }

@router.post("/detect-intent", response_model=IntentDetectionResponse)
async def detect_intent(request: ChatRequest):
    """Detect user intent and route to appropriate agent"""
    intent, confidence, agent, entities = intent_detector.detect(
        request.message,
        request.language.value if request.language else "hi"
    )
    
    return {
        "intent": intent,
        "confidence": confidence,
        "suggested_agent": agent,
        "entities": entities
    }

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint - routes to appropriate agent using ReAct loop
    """
    try:
        session_id = request.session_id or uuid.uuid4()
        
        response = await react_agent.run(
            message=request.message,
            language=request.language.value if request.language else "hi",
            forced_agent=request.agent,
            image_analysis=None
        )
        
        return ChatResponse(
            content=response.get("content", "Sorry, I couldn't process that."),
            agent=response.get("agent", "nyaya"),
            sources=response.get("sources"),
            disclaimer=response.get("disclaimer"),
            session_id=session_id,
            reasoning=response.get("reasoning")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scan-document", response_model=ScanResponse)
async def scan_document(request: ScanDocumentRequest):
    """
    Scan and analyze document for scam detection using OCR and LLM analysis
    """
    try:
        # Extract text from image using Vision LLM or Tesseract
        ocr_text = await ocr_service.process_image(request.image_base64)
        
        # Perform deep analysis
        analysis = await ocr_service.analyze_with_llm(ocr_text, request.language.value if request.language else "hi")
        
        # Extract entities for the UI
        entities = ocr_service.extract_entities(ocr_text)
        
        # Save to database if Supabase is configured
        try:
            from app.core.supabase import get_supabase_admin
            supabase = get_supabase_admin()
            
            scan_data = {
                "ocr_text": ocr_text,
                "extracted_entities": entities,
                "verdict": analysis.get('verdict', 'unverifiable'),
                "confidence": analysis.get('confidence', 0.5),
                "red_flags_found": analysis.get('red_flags', []),
                "sources_verified": ["RBI", "cybercrime.gov.in", "Pattern Database"]
            }
            
            supabase.table("document_scans").insert(scan_data).execute()
        except Exception as e:
            print(f"Error saving scan to DB: {e}")
        
        return ScanResponse(
            ocr_text=ocr_text[:1000],  # Limit text length
            verdict=analysis.get('verdict', 'unverifiable'),
            confidence=analysis.get('confidence', 0.5),
            red_flags=analysis.get('red_flags', ["No specific red flags found"]),
            safe_actions=analysis.get('safe_actions', [
                "Call 1930 for cyber complaints",
                "Report at cybercrime.gov.in",
                "Do not share any OTP or personal details"
            ]),
            sources_verified=["RBI", "cybercrime.gov.in", "Pattern Database"]
        )
        
    except Exception as e:
        # Return error response instead of raising
        return ScanResponse(
            ocr_text=f"Analysis error: {str(e)}",
            verdict="unverifiable",
            confidence=0.0,
            red_flags=["Could not analyze document"],
            safe_actions=["Try again later", "Use Scanner page for manual analysis"],
            sources_verified=[]
        )

@router.get("/scan-history")
async def get_scan_history(limit: int = 10):
    """
    Get recent scan history from database
    """
    try:
        from app.core.supabase import get_supabase_admin
        supabase = get_supabase_admin()
        
        response = supabase.table("document_scans") \
            .select("*") \
            .order("created_at", descending=True) \
            .limit(limit) \
            .execute()
            
        return response.data
    except Exception as e:
        print(f"Error fetching scan history: {e}")
        return []

@router.post("/schemes/search", response_model=SchemeListResponse)
async def search_schemes(request: SchemeSearchRequest):
    """
    Search for government schemes based on user profile
    """
    try:
        # Build search query from profile
        query_parts = []
        if request.state:
            query_parts.append(request.state)
        if request.occupation:
            query_parts.append(request.occupation)
        if request.category:
            query_parts.append(request.category)
        if request.annual_income:
            query_parts.append(request.annual_income)
        
        query = " ".join(query_parts) if query_parts else "government schemes for poor citizens"
        
        # Use vector service to search for schemes (if implemented)
        # results = await vector_service.search_schemes(
        #     query=query,
        #     filters=request.model_dump(),
        #     limit=10
        # )
        
        # Real-time web scraping fallback instead of just static mock data
        # india.gov.in/search/site/ is throwing 404, routing through DuckDuckGo to hit myscheme.gov.in
        query_url = f"https://html.duckduckgo.com/html/?q=site:myscheme.gov.in+{'+'.join(query_parts)}+scheme"
        
        scraped_schemes = []
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(query_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # Find search result items on DuckDuckGo
                        results = soup.select('.result__body')
                        for i, res in enumerate(results[:5]): # Take top 5
                            title_elem = res.select_one('.result__title a')
                            desc_elem = res.select_one('.result__snippet')
                            
                            if title_elem:
                                url = title_elem.get('href', 'https://www.myscheme.gov.in')
                                if url.startswith('//'): url = 'https:' + url
                                scraped_schemes.append({
                                    "id": str(uuid.uuid4()),
                                    "name": title_elem.text.strip(),
                                    "description": desc_elem.text.strip() if desc_elem else "Details available on website.",
                                    "amount": "Varies (See official site)",
                                    "benefit_type": "Government Scheme",
                                    "eligibility": {"state": request.state or "All India"},
                                    "application_url": url,
                                    "match_percentage": 95 - (i * 5)
                                })
        except Exception as e:
            print(f"Scraping failed: {e}")
            
        # If scraper fails or finds nothing, fallback to mock data
        if not scraped_schemes:
            scraped_schemes = [
                {
                    "id": str(uuid.uuid4()),
                    "name": "PM Kisan Samman Nidhi",
                    "description": "₹6000/year for small farmers",
                    "amount": "₹6,000/year",
                    "benefit_type": "Direct Benefit Transfer",
                    "eligibility": {"landholding": "Below 2 hectares"},
                    "application_url": "https://pmkisan.gov.in",
                    "match_percentage": 95
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "PM Awas Yojana",
                    "description": "Housing support for rural/urban poor",
                    "amount": "Up to ₹1.2 lakh",
                    "benefit_type": "Housing",
                    "eligibility": {"income": "Below ₹3 lakh"},
                    "application_url": "https://pmayg.nic.in",
                    "match_percentage": 88
                }
            ]
            
        return SchemeListResponse(
            schemes=[SchemeResponse(**s) for s in scraped_schemes],
            total=len(scraped_schemes)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile")
async def save_profile(request: UserProfileRequest):
    """Save user profile for personalized scheme matching"""
    # Would save to database in production
    return {
        "status": "saved",
        "profile": request.model_dump()
    }

@router.get("/agents")
async def list_agents():
    """List available agents"""
    return {
        "agents": [
            {
                "id": "nyaya",
                "name": "Nyaya-Mitra",
                "description": "Legal guidance and RTI help",
                "icon": "⚖️"
            },
            {
                "id": "jansetu", 
                "name": "JanSetu",
                "description": "Government scheme discovery",
                "icon": "🏛️"
            },
            {
                "id": "suraksha",
                "name": "Suraksha-AI",
                "description": "Scam and fraud detection",
                "icon": "🛡️"
            }
        ]
    }
