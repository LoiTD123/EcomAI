from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    session_id: str
    message: str
    user_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str
    suggested_products: List[int]

class ProductScore(BaseModel):
    id: int
    name: str
    score: float

class RecommendResponse(BaseModel):
    results: List[ProductScore]
