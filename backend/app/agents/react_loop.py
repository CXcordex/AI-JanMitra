from app.models.requests import AgentType
from app.agents.janmitra_agents import get_agent, BaseAgent
from app.services.intent import intent_detector
from app.services.llm import llm_service
from typing import Dict, Any, List, Optional
import json
import re

class ReActAgent:
    """
    ReAct (Reason + Act + Observe) Loop implementation
    for intelligent agent orchestration
    """
    
    def __init__(self):
        self.max_iterations = 3
    
    async def run(
        self,
        message: str,
        language: str = "hi",
        forced_agent: Optional[AgentType] = None,
        image_analysis: Optional[str] = None,
        user_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute ReAct loop to process user request
        """
        # Step 1: Intent Detection
        intent, confidence, suggested_agent, entities = intent_detector.detect(
            message, language
        )
        
        # Use forced agent if provided
        agent_type = forced_agent if forced_agent else suggested_agent
        
        # Get the appropriate agent
        agent = get_agent(agent_type)
        
        # Initial Reasoning
        thought_process = [f"Thought: User query detected as {intent}. Routing to {agent_type.value} agent."]
        
        # ReAct Loop
        current_context = []
        final_response = None
        
        for i in range(self.max_iterations):
            # Reason
            reasoning_prompt = f"""
            You are an AI orchestrator for AI JanMitra. 
            User message: {message}
            Agent: {agent_type.value}
            Current Thoughts: {thought_process}
            
            Based on the user message, what information do we need to provide a helpful answer?
            Available tools: Search legal documents, Search schemes, Search scam patterns.
            
            Decide if we have enough information or if we need to 'ACT' by searching.
            If we have enough, respond with 'FINISH'.
            If not, respond with 'SEARCH: <query>'.
            """
            
            # For simplicity in this MVP, we'll do one targeted search and then generate
            if i == 0:
                search_query = message
                thought_process.append(f"Action: Searching for relevant information for '{search_query}'")
                
                # Act & Observe
                response = await agent.process(
                    message=message,
                    language=language,
                    context=current_context,
                    image_analysis=image_analysis,
                    user_profile=user_profile
                )
                final_response = response
                break # In this implementation, we let the agent handle the search and response in one go
        
        if not final_response:
             # Fallback
             final_response = await agent.process(message, language)
             
        # Add reasoning trace to response
        final_response["reasoning"] = "\n".join(thought_process)
        final_response["intent_detected"] = intent
        final_response["confidence"] = confidence
        
        return final_response
    
    async def run_with_voice(
        self,
        audio_base64: str,
        language: str = "hi"
    ) -> Dict[str, Any]:
        """
        Process voice input: Transcribe -> ReAct -> TTS
        """
        # Step 1: Transcribe audio (In production, use Whisper API)
        # For now, we simulate transcription
        transcribed_text = "How can I apply for PM Kisan scheme?"
        
        # Step 2: Run ReAct loop
        return await self.run(
            message=transcribed_text,
            language=language
        )

# Singleton instance
react_agent = ReActAgent()
