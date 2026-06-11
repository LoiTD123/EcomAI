from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router
import uvicorn

app = FastAPI(
    title="E-Commerce AI Service",
    description="FastAPI service for PyTorch LSTM, Neo4j, and FAISS+Gemini RAG Recommendations.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1/ai", tags=["AI Services"])

@app.get("/")
def read_root():
    return {"message": "Welcome to E-Commerce AI Recommendation & RAG Chatbot Service!"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
