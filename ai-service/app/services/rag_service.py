# pyrefly: ignore [missing-import]
import faiss
import numpy as np
import json
import os
import google.generativeai as genai
import requests
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
FAISS_INDEX_PATH = os.getenv('FAISS_INDEX_PATH', 'data/products.index')
MAPPING_PATH = os.getenv('FAISS_MAPPING_PATH', 'data/products_mapping.json')
PRODUCT_SERVICE_URL = os.getenv('PRODUCT_SERVICE_URL', 'http://product-service:8000')

# Configure Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY is not set. Chatbot and RAG will run in mockup fallback mode.")

class RAGService:
    def __init__(self):
        self.dimension = 3072 # Dimension for models/gemini-embedding-001
        self.index = None
        self.product_ids = []
        self.load_index()

    def load_index(self):
        if os.path.exists(FAISS_INDEX_PATH) and os.path.exists(MAPPING_PATH):
            try:
                self.index = faiss.read_index(FAISS_INDEX_PATH)
                with open(MAPPING_PATH, 'r', encoding='utf-8') as f:
                    self.product_ids = json.load(f)
                print(f"Loaded FAISS index with {len(self.product_ids)} items.")
            except Exception as e:
                logger.error(f"Error loading FAISS index: {e}")
                self.create_empty_index()
        else:
            self.create_empty_index()

    def create_empty_index(self):
        self.index = faiss.IndexFlatIP(self.dimension) # Inner Product for Cosine Similarity
        self.product_ids = []
        print("Created empty FAISS index.")

    def save_index(self):
        os.makedirs('data', exist_ok=True)
        faiss.write_index(self.index, FAISS_INDEX_PATH)
        with open(MAPPING_PATH, 'w', encoding='utf-8') as f:
            json.dump(self.product_ids, f, ensure_ascii=False)
        print("Saved FAISS index and mapping successfully.")

    def get_embedding(self, text: str) -> List[float]:
        if not GEMINI_API_KEY:
            # Return random mock vector if API key is not provided
            np.random.seed(hash(text) % (2**32))
            vector = np.random.randn(self.dimension)
            vector = vector / np.linalg.norm(vector)
            return vector.tolist()
            
        try:
            result = genai.embed_content(
                model="models/gemini-embedding-001",
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Error calling Gemini Embedding API: {e}")
            # Mock fallback on error
            return np.random.randn(self.dimension).tolist()

    def add_products_to_index(self, products: List[Dict]):
        """
        products format: [{"id": 1, "name": "Book Name", "description": "Book Desc"}]
        """
        vectors = []
        new_ids = []
        for p in products:
            text = f"{p['name']}. {p.get('description', '')}"
            embedding = self.get_embedding(text)
            vectors.append(embedding)
            new_ids.append(p['id'])
            
        if vectors:
            np_vectors = np.array(vectors).astype('float32')
            # L2 normalize for cosine similarity
            faiss.normalize_L2(np_vectors)
            self.index.add(np_vectors)
            self.product_ids.extend(new_ids)
            self.save_index()

    def search_similar_products(self, query: str, top_k: int = 5) -> List[int]:
        if not self.index or len(self.product_ids) == 0:
            return []
            
        query_vector = np.array([self.get_embedding(query)]).astype('float32')
        faiss.normalize_L2(query_vector)
        
        scores, indices = self.index.search(query_vector, min(top_k, len(self.product_ids)))
        
        matched_ids = []
        for idx in indices[0]:
            if idx != -1 and idx < len(self.product_ids):
                matched_ids.append(self.product_ids[idx])
        return matched_ids

    def chatbot_response(self, session_id: str, message: str, user_id: int = None, chat_history: List[Dict] = None) -> Dict:
        # 1. Search relevant products using FAISS
        matched_ids = self.search_similar_products(message, top_k=3)
        
        # 2. Fetch product details from Product Service
        products_context = []
        for pid in matched_ids:
            try:
                resp = requests.get(f"{PRODUCT_SERVICE_URL}/api/v1/products/{pid}", timeout=3)
                if resp.status_code == 200:
                    prod = resp.json()
                    products_context.append(f"- ID {prod['id']}: {prod['name']} (Giá: {prod['price']}đ, Loại: {prod['product_type']}) - {prod.get('description', '')[:200]}...")
            except Exception as e:
                logger.error(f"Error fetching context product {pid}: {e}")

        context_str = "\n".join(products_context) if products_context else "Không tìm thấy sản phẩm nào liên quan trong kho."

        # 3. Construct prompt with context & history
        history_str = ""
        if chat_history:
            for chat in chat_history[-6:]: # Take last 6 messages
                role = "User" if chat['role'] == 'user' else "Assistant"
                history_str += f"{role}: {chat['message']}\n"

        prompt = f"""
        Bạn là Trợ lý Mua sắm thông minh của hệ thống thương mại điện tử.
        Hãy tư vấn cho khách hàng một cách lịch sự, hữu ích và thuyết phục bằng Tiếng Việt.
        Hãy sử dụng thông tin các sản phẩm liên quan trong cơ sở dữ liệu dưới đây làm ngữ cảnh chính để trả lời khách hàng. 
        Nếu khách hàng hỏi mua, hãy giới thiệu các sản phẩm này kèm theo tên và ID sản phẩm để họ dễ tìm kiếm.

        SẢN PHẨM PHÙ HỢP NHẤT TRONG KHO (CONTEXT):
        {context_str}

        LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY:
        {history_str}

        CÂU HỎI HIỆN TẠI CỦA KHÁCH HÀNG:
        {message}

        Hãy trả lời khách hàng một cách tự nhiên nhất:
        """

        # 4. Generate response via Gemini API or Mock
        bot_response = ""
        if GEMINI_API_KEY:
            try:
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(prompt)
                bot_response = response.text
            except Exception as e:
                logger.error(f"Gemini generation error: {e}")
                bot_response = f"Tôi đã tìm thấy sản phẩm liên quan nhưng gặp lỗi hệ thống khi phân tích. Các sản phẩm gợi ý cho bạn: {', '.join([str(i) for i in matched_ids])}."
        else:
            bot_response = f"[Mock Response] Cảm ơn câu hỏi của bạn. Dựa trên thông tin tìm kiếm, tôi đề xuất bạn nên xem sản phẩm ID: {', '.join([str(i) for i in matched_ids])}. Bạn có muốn tôi giới thiệu thêm không?"

        return {
            "response": bot_response,
            "suggested_products": matched_ids
        }
