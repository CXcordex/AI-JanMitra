import httpx
from openai import AsyncOpenAI
import asyncio
import os
import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY required in .env")

client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

async def chat_completion(message: str, language: str = "hi", agent: str = "general"):
    system_prompt = f"""You are JanMitra - AI people's friend for Indian citizens.

Language: {language.upper()}
Agent mode: {agent.upper()}

RULES:
1. First-step guidance ONLY - end with "⚠ Not legal advice"
2. Cite sources: RBI, cybercrime.gov.in, myscheme.gov.in
3. Structured if scam: verdict, flags, sources
4. Simple Hindi/English per language

User message: {message}"""

    try:
        response = await client.chat.completions.create(
            model="meta-llama/llama-3.1-8b-instruct:free",  # Free tier model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.3,
            max_tokens=800,
            stream=False
        )
        
        content = response.choices[0].message.content.strip()
        
        # Parse structured
        verdict = None
        flags = []
        sources = []
        if agent == "scam":
            sources = ["RBI", "cybercrime.gov.in"]
            if "scam" in content.lower() or "suspicious" in content.lower():
                verdict = "suspicious"
                flags = ["Check UPI demands", "Threats = red flag", "Call 1930"]
        
        return {
            "content": content,
            "verdict": verdict,
            "flags": flags,
            "sources": sources
        }
    except Exception as e:
        return {
            "content": f"Temporary AI service issue: {str(e)}. Try again.",
            "sources": ["system"]
        }

