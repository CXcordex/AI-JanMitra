from sqlalchemy import Column, Integer, String, Text, JSON, TIMESTAMP, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    state = Column(String)
    age_group = Column(String)
    annual_income = Column(String)
    category = Column(String)
    gender = Column(String)
    occupation = Column(String)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True))
    agent_type = Column(String)  # nyaya, jansetu, suraksha
    language = Column(String, default="hi")
    created_at = Column(TIMESTAMP, server_default=func.now())

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True))
    role = Column(String)  # user, assistant
    content = Column(Text)
    sources = Column(ARRAY(String))
    agent_type = Column(String)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Scheme(Base):
    __tablename__ = "schemes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text)
    amount = Column(String)
    benefit_type = Column(String)
    eligibility_criteria = Column(JSON)
    category = Column(String)
    ministry = Column(String)
    state_specific = Column(String)
    application_url = Column(String)
    documents_required = Column(ARRAY(String))
    is_active = Column(Boolean, default=True)
    last_verified = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())

class LegalDocument(Base):
    __tablename__ = "legal_documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    category = Column(String)  # bns, bnss, bsa, rti, consumer
    content = Column(Text)
    summary = Column(Text)
    language = Column(String, default="en")
    embedding = Column(ARRAY(Float))
    created_at = Column(TIMESTAMP, server_default=func.now())

class ScamPattern(Base):
    __tablename__ = "scam_patterns"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pattern_type = Column(String)
    description = Column(Text)
    red_flags = Column(ARRAY(String))
    safe_actions = Column(ARRAY(String))
    source_urls = Column(ARRAY(String))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

class DocumentScan(Base):
    __tablename__ = "document_scans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True))
    ocr_text = Column(Text)
    extracted_entities = Column(JSON)
    verdict = Column(String)
    confidence = Column(Float)
    red_flags_found = Column(ARRAY(String))
    sources_verified = Column(ARRAY(String))
    created_at = Column(TIMESTAMP, server_default=func.now())
