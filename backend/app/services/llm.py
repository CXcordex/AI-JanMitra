from openai import AsyncOpenAI
import httpx
import json
import os
from typing import Optional, Dict, Any, List
from app.core.config import settings

class LLMService:
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY", "your-fallback-key"),
        )
    
    async def generate(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.3,
        max_tokens: int = 1000
    ) -> str:
        try:
            response = await self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            if "401" in str(e) or "key" in str(e).lower():
                return "This is a mock fallback response because the OpenRouter API key is missing or invalid. Please check your .env file."
            raise Exception(f"LLM generation failed: {str(e)}")
    
    async def generate_with_context(
        self,
        system_prompt: str,
        user_message: str,
        context: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1000
    ) -> str:
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add context as previous messages
        for ctx in context:
            messages.append({
                "role": ctx.get("role", "assistant"),
                "content": ctx.get("content", "")
            })
        
        messages.append({"role": "user", "content": user_message})
        
        try:
            response = await self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            if "401" in str(e) or "key" in str(e).lower():
                return "This is a mock fallback response because the OpenRouter API key is missing or invalid. Please check your .env file."
            raise Exception(f"LLM generation failed: {str(e)}")

    async def analyze_image(
        self,
        image_base64: str,
        prompt: str = "Analyze this document image and extract its text content."
    ) -> str:
        """Analyze an image or PDF using a Vision-capable model (Gemini Flash 1.5)"""
        try:
            # Handle data URL prefix
            if image_base64.startswith('data:'):
                url = image_base64
            else:
                # Default to image if no prefix
                url = f"data:image/jpeg;base64,{image_base64}"
                
            response = await self.client.chat.completions.create(
                model="llama-3.2-11b-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": url
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Vision analysis failed: {str(e)}")
            return f"[Vision OCR failed: {str(e)}]"

llm_service = LLMService()
