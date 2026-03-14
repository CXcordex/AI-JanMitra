from app.models.requests import AgentType, Language
from app.services.llm import llm_service
from app.services.vector import vector_service
from typing import Dict, Any, List, Optional

class BaseAgent:
    """Base class for all JanMitra agents"""
    
    def __init__(self, agent_type: AgentType):
        self.agent_type = agent_type
    
    def get_system_prompt(self, language: str) -> str:
        """Override in subclasses"""
        raise NotImplementedError
    
    async def process(
        self,
        message: str,
        language: str = "hi",
        context: Optional[List[Dict[str, str]]] = None,
        image_analysis: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Process user message and return response"""
        raise NotImplementedError


class NyayaMitra(BaseAgent):
    """Legal guidance agent"""
    
    def __init__(self):
        super().__init__(AgentType.NYAYA)
    
    def get_system_prompt(self, language: str = "hi") -> str:
        lang_name = {
            "hi": "Hindi",
            "ta": "Tamil", 
            "bn": "Bengali",
            "te": "Telugu",
            "mr": "Marathi",
            "kn": "Kannada",
            "gu": "Gujarati",
            "ml": "Malayalam",
            "en": "English"
        }.get(language, "English")
        
        return f"""You are Nyaya-Mitra, an AI legal assistant for Indian citizens.

Your role:
- Explain laws (BNS, BNSS, BSA, IPC, Consumer Protection) in simple language
- Help with RTI applications and complaint drafts
- Provide first-step legal guidance only

Important rules:
1. ALWAYS respond in {lang_name}
2. Never give definitive legal advice - always add disclaimer
3. Cite official sources when possible
4. Keep responses concise and actionable
5. If user needs a lawyer, explicitly suggest consulting one

Response format:
- Start with key point
- Use bullet points for steps
- End with: "⚠ यह पहली-कदम मार्गदर्शन है, कानूनी सलाह नहीं। किसी वकील से मिलें।"
"""
    
    async def process(
        self,
        message: str,
        language: str = "hi",
        context: Optional[List[Dict[str, str]]] = None,
        image_analysis: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        # Search for relevant legal documents
        docs = await vector_service.search_legal_documents(message, limit=3)
        
        # Build context from retrieved documents
        context_text = ""
        sources = []
        if docs:
            for doc in docs:
                context_text += f"\n\n{doc.get('content', '')[:500]}"
                sources.append(doc.get('title', 'Legal Document'))
        
        # If image was uploaded, analyze it
        if image_analysis:
            message = f"Image analysis: {image_analysis}\n\nUser question: {message}"
        
        system_prompt = self.get_system_prompt(language)
        if context_text:
            system_prompt += f"\n\nRelevant legal information:\n{context_text}"
        
        content = await llm_service.generate_with_context(
            system_prompt=system_prompt,
            user_message=message,
            context=context or []
        )
        
        return {
            "content": content,
            "agent": self.agent_type.value,
            "sources": sources or ["Indian legal system"],
            "disclaimer": "This is first-step guidance only - consult a lawyer for legal decisions"
        }


class JanSetu(BaseAgent):
    """Government scheme discovery agent"""
    
    def __init__(self):
        super().__init__(AgentType.JANSETU)
    
    def get_system_prompt(self, language: str = "hi") -> str:
        lang_name = {
            "hi": "Hindi",
            "ta": "Tamil",
            "bn": "Bengali",
            "te": "Telugu",
            "mr": "Marathi",
            "kn": "Kannada",
            "gu": "Gujarati",
            "ml": "Malayalam",
            "en": "English"
        }.get(language, "English")
        
        return f"""You are JanSetu, an AI assistant that helps Indian citizens find government schemes and benefits.

Your role:
- Find central and state government schemes user is eligible for
- Explain scheme benefits and application process
- Help with eligibility determination

Important rules:
1. ALWAYS respond in {lang_name}
2. List specific schemes with amounts and eligibility
3. Provide direct links when available
4. Ask for more profile details if needed for better matches

Response format:
- List matching schemes with bullet points
- Include: name, amount, eligibility, how to apply
- End with: "ज्यादा जानकारी के लिए मैं और पूछ सकता हूं।"
"""
    
    async def process(
        self,
        message: str,
        language: str = "hi",
        context: Optional[List[Dict[str, str]]] = None,
        image_analysis: Optional[str] = None,
        user_profile: Optional[Dict[str, str]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        # Build search query from message and user profile
        search_query = message
        if user_profile:
            filters = {
                "state": user_profile.get("state"),
                "occupation": user_profile.get("occupation"),
                "income": user_profile.get("annual_income")
            }
        else:
            filters = None
        
        # Search schemes
        schemes = await vector_service.search_schemes(search_query, filters, limit=5)
        
        context_text = ""
        sources = []
        if schemes:
            for scheme in schemes:
                context_text += f"\n\n{scheme.get('name')}: {scheme.get('description')}"
                if scheme.get('application_url'):
                    sources.append(scheme.get('application_url'))
        
        system_prompt = self.get_system_prompt(language)
        if context_text:
            system_prompt += f"\n\nRelevant schemes:\n{context_text}"
        
        content = await llm_service.generate_with_context(
            system_prompt=system_prompt,
            user_message=message,
            context=context or []
        )
        
        return {
            "content": content,
            "agent": self.agent_type.value,
            "sources": sources or ["myScheme.gov.in", "JanSeva Portal"],
            "schemes": [s.get('name') for s in schemes] if schemes else []
        }


class SurakshaAI(BaseAgent):
    """Scam detection agent"""
    
    def __init__(self):
        super().__init__(AgentType.SURAKSHA)
    
    def get_system_prompt(self, language: str = "hi") -> str:
        lang_name = {
            "hi": "Hindi",
            "ta": "Tamil",
            "bn": "Bengali",
            "te": "Telugu",
            "mr": "Marathi",
            "kn": "Kannada",
            "gu": "Gujarati",
            "ml": "Malayalam",
            "en": "English"
        }.get(language, "English")
        
        return f"""You are Suraksha-AI, an AI assistant that helps Indian citizens detect scams and fraud.

Your role:
- Analyze messages, notices, and documents for scam indicators
- Identify red flags in communications
- Provide safety guidance

Scam red flags to look for:
- Urgency/threat language ("immediate payment", "arrest warrant")
- Unofficial payment methods (UPI to personal accounts)
- Fake sender IDs (.com instead of .gov.in)
- Requests for OTP/UVA
- Too good to be true offers

Important rules:
1. ALWAYS respond in {lang_name}
2. Start with clear verdict: SUSPICIOUS / SAFE / UNVERIFIABLE
3. List specific red flags found
4. Provide safe next steps
5. Cite official sources (RBI, cybercrime.gov.in)

Response format:
- Start with: ⚠ SUSPICIOUS / ✅ SAFE / ❓ UNVERIFIABLE
- List red flags with 🚩
- Provide safe actions
- Sources: RBI, cybercrime.gov.in, National Consumer Helpline
"""
    
    async def process(
        self,
        message: str,
        language: str = "hi",
        context: Optional[List[Dict[str, str]]] = None,
        image_analysis: Optional[str] = None,
        ocr_text: Optional[str] = None,
        extracted_entities: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        # Search known scam patterns
        scam_patterns = await vector_service.search_scam_patterns(
            message if not ocr_text else ocr_text,
            limit=5
        )
        
        # Build analysis context
        analysis_context = ""
        if ocr_text:
            analysis_context += f"\n\nDocument OCR text:\n{ocr_text[:1000]}"
        if extracted_entities:
            analysis_context += f"\n\nExtracted entities: {extracted_entities}"
        
        if scam_patterns:
            for pattern in scam_patterns:
                analysis_context += f"\n\nKnown scam pattern: {pattern.get('description')}"
        
        system_prompt = self.get_system_prompt(language)
        if analysis_context:
            system_prompt += analysis_context
        
        content = await llm_service.generate_with_context(
            system_prompt=system_prompt,
            user_message=message,
            context=context or []
        )
        
        # Determine verdict
        content_lower = content.lower()
        if "suspicious" in content_lower or "scam" in content_lower or "fake" in content_lower:
            verdict = "suspicious"
        elif "safe" in content_lower or "genuine" in content_lower or "real" in content_lower:
            verdict = "safe"
        else:
            verdict = "unverifiable"
        
        return {
            "content": content,
            "agent": self.agent_type.value,
            "verdict": verdict,
            "sources": ["RBI", "cybercrime.gov.in", "National Consumer Helpline"],
            "safe_actions": [
                "Call 1930 for cyber complaints",
                "Report at cybercrime.gov.in",
                "Never share OTP with anyone"
            ]
        }


# Agent factory
def get_agent(agent_type: AgentType) -> BaseAgent:
    agents = {
        AgentType.NYAYA: NyayaMitra(),
        AgentType.JANSETU: JanSetu(),
        AgentType.SURAKSHA: SurakshaAI()
    }
    return agents.get(agent_type, NyayaMitra())
