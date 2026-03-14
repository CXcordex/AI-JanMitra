-- AI JanMitra Database Setup for Supabase
-- Run this in Supabase SQL Editor

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- User Profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state VARCHAR(100),
    age_group VARCHAR(50),
    annual_income VARCHAR(50),
    category VARCHAR(50),
    gender VARCHAR(20),
    occupation VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    agent_type VARCHAR(50),
    language VARCHAR(10) DEFAULT 'hi',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id),
    role VARCHAR(20),
    content TEXT,
    sources TEXT[],
    agent_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schemes table
CREATE TABLE IF NOT EXISTS schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    description TEXT,
    amount VARCHAR(200),
    benefit_type VARCHAR(100),
    eligibility_criteria JSONB,
    category VARCHAR(100),
    ministry VARCHAR(200),
    state_specific VARCHAR(100),
    application_url TEXT,
    documents_required TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_verified TIMESTAMP WITH TIME ZONE,
    embedding VECTOR(384),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal Documents table (for RAG)
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    content TEXT,
    summary TEXT,
    language VARCHAR(20) DEFAULT 'en',
    embedding VECTOR(384),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scam Patterns table
CREATE TABLE IF NOT EXISTS scam_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type VARCHAR(100),
    description TEXT,
    red_flags TEXT[],
    safe_actions TEXT[],
    source_urls TEXT[],
    is_active BOOLEAN DEFAULT true,
    embedding VECTOR(384),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Scans table
CREATE TABLE IF NOT EXISTS document_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    ocr_text TEXT,
    extracted_entities JSONB,
    verdict VARCHAR(50),
    confidence FLOAT,
    red_flags_found TEXT[],
    sources_verified TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE scam_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_scans ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (allow all for development)
CREATE POLICY "Allow all access to user_profiles" ON user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to chat_sessions" ON chat_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to chat_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to schemes" ON schemes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to legal_documents" ON legal_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to scam_patterns" ON scam_patterns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to document_scans" ON document_scans FOR ALL USING (true) WITH CHECK (true);

-- Create vector search function
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding VECTOR(384),
    match_count INT,
    table_name TEXT
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY EXECUTE format(
        'SELECT id, content, 1 - (embedding <=> $1) AS similarity 
         FROM %I 
         ORDER BY embedding <=> $1 
         LIMIT $2',
        table_name
    )
    USING query_embedding, match_count;
END;
$$;

-- Create index for vector search
CREATE INDEX IF NOT EXISTS legal_documents_embedding_idx 
ON legal_documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Insert sample data for schemes
INSERT INTO schemes (name, description, amount, benefit_type, category, ministry, eligibility_criteria) VALUES
('PM Kisan Samman Nidhi', 'Direct income support for farmer families', '₹6,000/year', 'Direct Benefit Transfer', 'Agriculture', 'Ministry of Agriculture', 
 '{"landholding": "Below 2 hectares", "category": "All"}'),

('PM Awas Yojana (Gramin)', 'Free pucca house for rural poor', 'Up to ₹1.20 lakh', 'Housing', 'Rural Development', 'Ministry of Rural Development',
 '{"income": "Below ₹3 lakh", "category": "BPL"}'),

('Ayushman Bharat PM-JAY', 'Health insurance coverage for eligible families', '₹5 lakh/year', 'Health Insurance', 'Health', 'Ministry of Health',
 '{"income": "Below ₹5 lakh"}'),

('PM Jeevan Jyoti Bima Yojana', 'Life insurance cover at nominal premium', '₹2 lakh', 'Insurance', 'Finance', 'Ministry of Finance',
 '{"age": "18-50", "premium": "₹436/year"}'),

('PM Suraksha Bima Yojana', 'Accident insurance cover', '₹2 lakh', 'Insurance', 'Finance', 'Ministry of Finance',
 '{"age": "18-70", "premium": "₹20/year"}');

-- Insert sample scam patterns
INSERT INTO scam_patterns (pattern_type, description, red_flags, safe_actions, source_urls) VALUES
('UPI Payment Scam', 'Fraudulent UPI payment requests', 
 ARRAY['UPI to personal account', 'Immediate payment demand', 'No official reference'], 
 ARRAY['Call 1930', 'Report at cybercrime.gov.in', 'Verify with official website'],
 ARRAY['https://rbi.org.in', 'https://cybercrime.gov.in']),

('Court Notice Scam', 'Fake court notices demanding payment',
 ARRAY['UPI payment for court fee', 'Threat of arrest', 'Unofficial sender'],
 ARRAY['Verify from official court website', 'Contact court registry', 'Call 1930'],
 ARRAY['https://cybercrime.gov.in']),

('Electricity Disconnection Scam', 'Fake electricity bill threats',
 ARRAY['Immediate payment via UPI', 'Threat of disconnection', 'Unofficial WhatsApp message'],
 ARRAY['Check official DISCOM website', 'Visit nearest office', 'Call customer care'],
 ARRAY['https://crime.gov.in']),

('KYC Update Scam', 'Fake KYC update required messages',
 ARRAY['OTP/UVA request', 'Link to update KYC', 'Threat of account block'],
 ARRAY['Never share OTP', 'Verify from official app', 'Report at cybercrime.gov.in'],
 ARRAY['https://rbi.org.in', 'https://banking.gov.in']);
