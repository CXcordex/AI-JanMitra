from app.models.requests import AgentType
from typing import Dict, Any, List, Optional, Tuple
import re

class IntentDetector:
    """Determines user intent and routes to appropriate agent"""
    
    # Keywords for each agent
    LEGAL_KEYWORDS = [
        'law', 'legal', 'bns', 'bnss', 'bsa', 'ipc', 'crpc',
        'rti', 'right to information', 'court', 'police', 'complaint',
        'consumer rights', 'property', 'divorce', 'marriage', 'land',
        'ticket', 'fine', 'arrest', 'bail', 'lawyer', 'advocate',
        'section', 'act', 'notification', 'ordinance'
    ]
    
    SCHEME_KEYWORDS = [
        'scheme', 'yojana', 'योजना', 'subsidy', 'grant', 'benefit',
        'pm kisan', 'pmay', 'ayushman', 'jan aadhar', 'ration',
        'pension', 'scholarship', 'loan', 'housing', 'pm awas',
        'mudra', 'stand up india', 'startup', 'skill', 'training'
    ]
    
    SCAM_KEYWORDS = [
        'scam', 'fraud', 'fake', 'suspicious', 'धोखाधड़ी', 'फर्जी',
        'fake notice', 'fake message', 'phishing', 'upi scam',
        'cybercrime', 'hacked', 'otp', 'kyc', 'account blocked',
        'electricity scam', 'court notice scam', 'lottery scam',
        'job scam', 'loan scam', 'emergency', 'urgent payment'
    ]
    
    def detect(self, message: str, language: str = "hi") -> Tuple[str, float, AgentType, Dict[str, str]]:
        """
        Detect intent from user message
        Returns: (intent, confidence, suggested_agent, entities)
        """
        message_lower = message.lower()
        
        # Count keyword matches
        legal_score = self._count_matches(message_lower, self.LEGAL_KEYWORDS)
        scheme_score = self._count_matches(message_lower, self.SCHEME_KEYWORDS)
        scam_score = self._count_matches(message_lower, self.SCAM_KEYWORDS)
        
        # Extract entities
        entities = self._extract_entities(message)
        
        # Determine best agent
        scores = {
            'legal': legal_score,
            'scheme': scheme_score,
            'scam': scam_score
        }
        
        max_score = max(scores.values())
        
        if max_score == 0:
            # Default to legal (most common use case)
            return ("general_query", 0.5, AgentType.NYAYA, entities)
        
        if scam_score >= scheme_score and scam_score >= legal_score:
            intent = "scam_detection"
            confidence = min(scam_score / 3.0, 1.0)
            agent = AgentType.SURAKSHA
        elif scheme_score >= legal_score:
            intent = "scheme_inquiry"
            confidence = min(scheme_score / 3.0, 1.0)
            agent = AgentType.JANSETU
        else:
            intent = "legal_guidance"
            confidence = min(legal_score / 3.0, 1.0)
            agent = AgentType.NYAYA
        
        return (intent, confidence, agent, entities)
    
    def _count_matches(self, text: str, keywords: List[str]) -> int:
        count = 0
        for keyword in keywords:
            if keyword in text:
                count += 1
        return count
    
    def _extract_entities(self, message: str) -> Dict[str, str]:
        entities = {}
        
        # Extract state
        indian_states = [
            'bihar', 'up', 'uttar pradesh', 'maharashtra', 'tamil nadu',
            'karnataka', 'kerala', 'gujarat', 'rajasthan', 'west bengal',
            'madhya pradesh', 'punjab', 'haryana', 'delhi', 'telangana',
            'andhra pradesh', 'odisha', 'jharkhand', 'chhattisgarh',
            'uttarakhand', 'himachal pradesh', 'goa', 'sikkim'
        ]
        
        message_lower = message.lower()
        for state in indian_states:
            if state in message_lower:
                entities['state'] = state.title()
                break
        
        # Extract occupation
        occupations = [
            'farmer', 'student', 'worker', 'labor', 'business', 'job',
            'employee', 'self employed', 'daily wage', 'agriculture'
        ]
        for occ in occupations:
            if occ in message_lower:
                entities['occupation'] = occ
                break
        
        return entities

intent_detector = IntentDetector()
