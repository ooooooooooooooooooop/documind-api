# app/schemas/api.py
from pydantic import BaseModel
from typing import List, Optional

class APIQueryRequest(BaseModel):
    query: str
    top_k: int = 3

class APIQueryResponse(BaseModel):
    answer: str
    sources: List[str]
