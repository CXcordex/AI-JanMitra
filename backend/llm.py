import httpx
import json

async def chat_completion(message: str, language: str = 'hi', agent: str = 'general'):
    """
    Ollama Llama3.1 for multi-language chat
    Free local - no API key needed
    """
    prompt = f"""
You are JanMitra AI - people's friend for Indian citizens.
Language: {language}
Agent: {agent}

Context: Provide first-step guidance only. Always disclaimer: 'Not legal advice'.
Sources: RBI, cybercrime.gov.in, myscheme.gov.in

User: {message}

JanMitra helpful response:
"""
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3.1",
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "top_p": 0.9,
                        "num_predict": 512
                    }
                }
            )
            result = response.json()
            content = result['response'].strip()
            
            # Extract structured data if scam/legal
            verdict = None
            flags = []
            sources = []
            if agent == 'scam':
                sources = ['RBI advisory', 'cybercrime.gov.in']
                if 'scam' in content.lower():
                    verdict = 'suspicious'
                    flags = ['UPI demand', 'Threat language', 'No ref ID']
            
            return {
                "content": content,
                "verdict": verdict,
                "flags": flags,
                "sources": sources
            }
    except Exception as e:
        return {
            "content": f"AI service temp unavailable: {str(e)}. Mock fallback.",
            "sources": ["system"]
        }

