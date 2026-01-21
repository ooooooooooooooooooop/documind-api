# app/schemas/chat.py
from typing import List
from pydantic import BaseModel


class ChatRequest(BaseModel):
    query: str
    model_name: str = "gemini-3-pro-high"


class SourceDocument(BaseModel):
    source: str
    page_content: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceDocument] = []
