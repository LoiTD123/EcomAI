from app.services.lstm_service import LSTMService
from app.services.graph_service import GraphService
from app.services.rag_service import RAGService
from typing import Optional
import requests
import os
import logging
from sqlalchemy import create_engine, text

logger = logging.getLogger(__name__)

PRODUCT_SERVICE_URL = os.getenv('PRODUCT_SERVICE_URL', 'http://product-service:8000')
SQL_DATABASE_URL = os.getenv('SQL_DATABASE_URL', 'sqlite:///data/ai_logs.db')

class HybridService:
    def __init__(self):
        self.lstm_svc = LSTMService()
        self.graph_svc = GraphService()
        self.rag_svc = RAGService()
        
        # Connect to SQLite for logging behaviors
        os.makedirs('data', exist_ok=True)
        self.engine = create_engine(SQL_DATABASE_URL)
        self.init_sql_db()

    def init_sql_db(self):
        with self.engine.connect() as conn:
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS user_behaviors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                behavior_type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )"""))
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS search_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                query TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )"""))
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                user_id INTEGER,
                role TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )"""))
            conn.commit()

    def log_user_behavior(self, user_id: int, product_id: int, behavior_type: str):
        # 1. Log to SQLite
        try:
            with self.engine.connect() as conn:
                conn.execute(
                    text("INSERT INTO user_behaviors (user_id, product_id, behavior_type) VALUES (:user_id, :product_id, :behavior_type)"),
                    {"user_id": user_id, "product_id": product_id, "behavior_type": behavior_type}
                )
                conn.commit()
        except Exception as e:
            logger.error(f"SQLite log behavior error: {e}")
            
        # 2. Log to Neo4j Graph
        self.graph_svc.record_behavior(user_id, product_id, behavior_type)

    def log_search(self, user_id: Optional[int], query: str):
        try:
            with self.engine.connect() as conn:
                conn.execute(
                    text("INSERT INTO search_logs (user_id, query) VALUES (:user_id, :query)"),
                    {"user_id": user_id, "query": query}
                )
                conn.commit()
        except Exception as e:
            logger.error(f"SQLite log search error: {e}")

    def get_chat_history(self, session_id: str) -> list:
        try:
            with self.engine.connect() as conn:
                result = conn.execute(
                    text("SELECT role, message FROM chat_history WHERE session_id = :session_id ORDER BY created_at ASC"),
                    {"session_id": session_id}
                )
                return [{"role": r[0], "message": r[1]} for r in result]
        except Exception as e:
            logger.error(f"SQLite get chat history error: {e}")
            return []

    def log_chat(self, session_id: str, user_id: Optional[int], role: str, message: str):
        try:
            with self.engine.connect() as conn:
                conn.execute(
                    text("INSERT INTO chat_history (session_id, user_id, role, message) VALUES (:session_id, :user_id, :role, :message)"),
                    {"session_id": session_id, "user_id": user_id, "role": role, "message": message}
                )
                conn.commit()
        except Exception as e:
            logger.error(f"SQLite log chat error: {e}")

    def get_hybrid_recommendations(self, user_id: int, token: str = None, limit: int = 10):
        # 1. Fetch User Behavior Sequence (SQLite)
        sequence = []
        try:
            with self.engine.connect() as conn:
                result = conn.execute(
                    text("SELECT product_id FROM user_behaviors WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 5"),
                    {"user_id": user_id}
                )
                sequence = [r[0] for r in result]
                # Reverse to make it chronological (oldest to newest)
                sequence.reverse()
        except Exception as e:
            logger.error(f"Error fetching user behaviors sequence: {e}")

        # 2. Get LSTM prediction scores
        lstm_scores = {}
        if sequence:
            lstm_scores = self.lstm_svc.predict_next_products(sequence, top_k=50)

        # 3. Get Graph collaborative filtering scores
        graph_scores = self.graph_svc.get_graph_recommendations(user_id, limit=50)

        # 4. Get RAG text-semantic scores from user search history
        rag_scores = {}
        last_query = ""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(
                    text("SELECT query FROM search_logs WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 1"),
                    {"user_id": user_id}
                )
                row = result.fetchone()
                if row:
                    last_query = row[0]
        except Exception as e:
            logger.error(f"Error fetching last search query: {e}")
            
        if last_query:
            rag_pids = self.rag_svc.search_similar_products(last_query, top_k=20)
            # RAG returns matched list, we give uniform decaying scores
            for i, pid in enumerate(rag_pids):
                rag_scores[pid] = float(1.0 - (i * 0.05))

        # 5. Hybrid Scoring merger:
        # Score = 0.4 * LSTM + 0.3 * Graph + 0.3 * RAG
        candidate_ids = set(lstm_scores.keys()) | set(graph_scores.keys()) | set(rag_scores.keys())
        
        hybrid_results = []
        for pid in candidate_ids:
            s_lstm = lstm_scores.get(pid, 0.0)
            s_graph = graph_scores.get(pid, 0.0)
            s_rag = rag_scores.get(pid, 0.0)
            
            final_score = 0.4 * s_lstm + 0.3 * s_graph + 0.3 * s_rag
            hybrid_results.append((pid, final_score))

        # Sort by final score descending
        hybrid_results.sort(key=lambda x: x[1], reverse=True)
        top_candidates = hybrid_results[:limit]

        # 6. Fetch details for final candidates from Product Service
        final_list = []
        headers = {"Authorization": token} if token else {}
        
        for pid, score in top_candidates:
            try:
                resp = requests.get(f"{PRODUCT_SERVICE_URL}/api/v1/products/{pid}", headers=headers, timeout=2)
                if resp.status_code == 200:
                    data = resp.json()
                    final_list.append({
                        "id": pid,
                        "name": data['name'],
                        "score": round(score, 4)
                    })
            except Exception as e:
                logger.error(f"Error querying product details {pid} from product service: {e}")
                # Fallback to name placeholder if service is down
                final_list.append({
                    "id": pid,
                    "name": f"Sản phẩm ID {pid}",
                    "score": round(score, 4)
                })

        # Fallback: if list is empty, return popular products or default products
        if not final_list:
            # Call Product Service to get default top products
            try:
                resp = requests.get(f"{PRODUCT_SERVICE_URL}/api/v1/products?limit={limit}", headers=headers, timeout=2)
                if resp.status_code == 200:
                    data = resp.json()
                    for p in data.get('results', []):
                        final_list.append({
                            "id": p['id'],
                            "name": p['name'],
                            "score": 0.0
                        })
            except Exception:
                pass
                
        return final_list
