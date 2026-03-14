from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from enum import Enum

class AgentType(str, Enum):
    NYAYA = "nyaya"      # Legal
    JANSETU = "jansetu"  # Schemes
    SURAKSHA = "suraksha"  # Scam detection

class Language(str, Enum):
    HI = "hi"  # Hindi
    TA = "ta"  # Tamil
    BN = "bn"  # Bengali
    TE = "te"  # Telugu
    MR = "mr"  # Marathi
    KN = "kn"  # Kannada
    GU = "gu"  # Gujarati
    ML = "ml"  # Malayalam
    EN = "en"  # English

# Request Models
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    language: Language = Language.HI
    agent: Optional[AgentType] = None
    session_id: Optional[UUID] = None
    image_base64: Optional[str] = None

class ScanDocumentRequest(BaseModel):
    image_base64: str
    scan_type: Optional[str] = "scam"  # scam, legal, general
    language: Optional[Language] = Language.HI

class SchemeSearchRequest(BaseModel):
    state: Optional[str] = None
    age_group: Optional[str] = None
    annual_income: Optional[str] = None
    category: Optional[str] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None

class UserProfileRequest(BaseModel):
    state: str
    age_group: str
    annual_income: str
    category: str
    gender: str
    occupation: str

# Response Models
class MessageSource(BaseModel):
    name: str
    url: Optional[str] = None

class ChatResponse(BaseModel):
    content: str
    agent: AgentType
    sources: Optional[List[str]] = None
    disclaimer: Optional[str] = None
    session_id: Optional[UUID] = None
    reasoning: Optional[str] = None

class ScanResponse(BaseModel):
    ocr_text: str
    verdict: str  # suspicious, safe, unverifiable
    confidence: float
    red_flags: List[str]
    safe_actions: List[str]
    sources_verified: List[str]

class SchemeResponse(BaseModel):
    id: UUID
    name: str
    description: str
    amount: Optional[str]
    benefit_type: str
    eligibility: Dict[str, Any]
    application_url: Optional[str]
    match_percentage: float

class SchemeListResponse(BaseModel):
    schemes: List[SchemeResponse]
    total: int

class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str

class IntentDetectionResponse(BaseModel):
    intent: str
    confidence: float
    suggested_agent: AgentType
    entities: Optional[Dict[str, str]] = None
