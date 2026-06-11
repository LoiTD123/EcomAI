from fastapi import APIRouter, Header, Depends, HTTPException, Body
from app.models import ChatRequest, ChatResponse, RecommendResponse, ProductScore
from app.services import HybridService
from typing import Optional, List, Dict
import jwt
import os

router = APIRouter()
hybrid_svc = HybridService()

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default-key-for-dev')

def get_user_id_from_token(authorization: Optional[str] = Header(None)) -> Optional[int]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload.get("user_id")
    except Exception:
        return None

@router.post("/chatbot", response_model=ChatResponse)
async def chat_bot(req: ChatRequest):
    try:
        # 1. Fetch History
        history = hybrid_svc.get_chat_history(req.session_id)
        
        # 2. Log current user message to DB
        hybrid_svc.log_chat(req.session_id, req.user_id, "user", req.message)
        
        # 3. Generate response using RAG
        result = hybrid_svc.rag_svc.chatbot_response(
            session_id=req.session_id,
            message=req.message,
            user_id=req.user_id,
            chat_history=history
        )
        
        # 4. Log AI response to DB
        hybrid_svc.log_chat(req.session_id, req.user_id, "model", result['response'])
        
        return ChatResponse(
            response=result['response'],
            suggested_products=result['suggested_products']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommend", response_model=RecommendResponse)
async def recommend(
    authorization: Optional[str] = Header(None),
    user_id: Optional[int] = Depends(get_user_id_from_token),
    limit: int = 10
):
    # Fallback to anonymous user_id (e.g. 0) if not logged in
    uid = user_id if user_id else 0
    try:
        results = hybrid_svc.get_hybrid_recommendations(
            user_id=uid,
            token=authorization,
            limit=limit
        )
        scores = [ProductScore(id=p['id'], name=p['name'], score=p['score']) for p in results]
        return RecommendResponse(results=scores)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/behavior")
async def log_behavior(
    user_id: int = Body(..., embed=True),
    product_id: int = Body(..., embed=True),
    behavior_type: str = Body(..., embed=True)
):
    try:
        hybrid_svc.log_user_behavior(user_id, product_id, behavior_type)
        return {"message": "Behavior logged successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search-log")
async def log_search(
    user_id: Optional[int] = Body(None, embed=True),
    query: str = Body(..., embed=True)
):
    try:
        hybrid_svc.log_search(user_id, query)
        return {"message": "Search log recorded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/index-products")
async def index_products(products: List[Dict] = Body(...)):
    """
    Sync endpoint called to vector-index products into FAISS.
    """
    try:
        hybrid_svc.rag_svc.add_products_to_index(products)
        return {"message": f"Successfully indexed {len(products)} products into FAISS."}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
