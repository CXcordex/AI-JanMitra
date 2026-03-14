from supabase import create_client
from app.core.config import settings
from typing import List, Dict, Any, Optional
import json
import httpx

class VectorService:
    def __init__(self):
        self.client = None
        self.hf_url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
        self.headers = {"Authorization": f"Bearer {settings.HUGGINGFACE_API_KEY}"} if settings.HUGGINGFACE_API_KEY else {}
    
    def _get_client(self):
        if self.client is None:
            if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
                print("⚠️ Supabase credentials not set. Vector search will be disabled.")
                return None
            try:
                self.client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_SERVICE_KEY
                )
            except Exception as e:
                print(f"⚠️ Failed to initialize Supabase client: {e}")
                return None
        return self.client
    
    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding from HuggingFace Inference API"""
        if not settings.HUGGINGFACE_API_KEY:
            # Fallback to zero embedding if key missing
            return [0.0] * 384
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.hf_url,
                    headers=self.headers,
                    json={"inputs": text, "options": {"wait_for_model": True}}
                )
                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"HF embedding error: {response.status_code}: {response.text}")
                    return [0.0] * 384
        except Exception as e:
            print(f"Embedding error: {e}")
            return [0.0] * 384

    async def search_similar(
        self,
        query: str,
        table: str,
        match_count: int = 5,
        filter_conditions: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar documents using vector similarity"""
        client = self._get_client()
        if not client:
            return []
            
        embedding = await self.get_embedding(query)
        
        try:
            # Using the match_documents RPC defined in database_setup.sql
            response = client.rpc(
                'match_documents',
                {
                    'query_embedding': embedding,
                    'match_count': match_count,
                    'table_name': table
                }
            ).execute()
            
            return response.data if response.data else []
        except Exception as e:
            print(f"Vector search error in table {table}: {e}")
            return []
    
    async def search_legal_documents(
        self,
        query: str,
        category: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Search legal documents"""
        return await self.search_similar(query, "legal_documents", limit)
    
    async def search_schemes(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search government schemes"""
        # For schemes, we might want to filter by state or other fields
        # But for now, we'll use simple vector search on the 'description' field
        # Note: schemes table doesn't have an embedding column in database_setup.sql!
        # I should probably update the schemes table to include an embedding column.
        return await self.search_similar(query, "schemes", limit)
    
    async def search_scam_patterns(
        self,
        query: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Search known scam patterns"""
        return await self.search_similar(query, "scam_patterns", limit)

vector_service = VectorService()
