"""
AURA - Portkey LLM Gateway Configuration
Routes LLM requests to the optimal model based on task type.
- Attack generation -> Groq (llama-3.1-70b) - fast and free
- Recon probing -> Groq (llama-3.1-8b) - ultra fast
- Report writing -> OpenAI (GPT-4o) - best quality
- Evaluation -> Groq (llama-3.1-70b) - good balance
"""
