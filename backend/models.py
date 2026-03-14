from sqlalchemy import Column, Integer, String, Text, JSON, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID, VECTOR
from sqlalchemy.sql import func
from sqlalchemy import String, Text, JSON, TIMESTAMP
from database import Base
import uuid

class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text)
    amount = Column(String)
    eligibility = Column(JSON)
    category = Column(String)
    state = Column(String)
    embedding = Column(VECTOR(384))
    scraped_at = Column(TIMESTAMP, server_default=func.now())

class ChatSession(Base):
    __tablename__ = "chats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_message = Column(Text)
    ai_response = Column(Text)
    language = Column(String)
    agent = Column(String)
    created_at = Column(TIMESTAMP, server_default=func.now())

