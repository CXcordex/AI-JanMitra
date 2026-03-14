# AI JanMitra Backend Implementation TODO

## Phase 1: Backend Setup (Today) ✓ COMPLETE
- [x] Create backend/ folder with FastAPI structure  
- [x] requirements.txt + Dockerfile for Render  
- [x] Basic /health + CORS  
- [ ] Supabase connection (env vars)  
- [ ] Mock DB tables (schemes, chats)

## Phase 2: Core APIs (Tomorrow)
- [ ] POST /api/chat - Ollama/OpenRouter integration
- [ ] POST /api/scan - Tesseract mock OCR
- [ ] GET /api/schemes/search - SQL query mock

## Phase 3: Data & Scraping
- [ ] Scrape myscheme.gov.in (50 schemes)
- [ ] RBI scam patterns JSON
- [ ] pgvector setup for semantic search

## Phase 4: Frontend Integration
- [ ] Vite proxy to backend
- [ ] Replace FloatingWidget mock → fetch('/api/chat')
- [ ] Test end-to-end chat flow

## Phase 5: Deploy & Polish
- [ ] Render deploy backend
- [ ] Vercel frontend
- [ ] Voice + 8lang test
- [ ] PWA install prompt

**Current Progress: Starting Phase 1**
