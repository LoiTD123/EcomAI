from neo4j import GraphDatabase
import os
import logging

logger = logging.getLogger(__name__)

NEO4J_URI = os.getenv('NEO4J_URI', 'bolt://neo4j:7687')
NEO4J_USER = os.getenv('NEO4J_USER', 'neo4j')
NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD', 'password')

class GraphService:
    def __init__(self):
        self.driver = None
        try:
            self.driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
            # Verify connectivity
            self.driver.verify_connectivity()
            print("Connected to Neo4j successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j at {NEO4J_URI}: {e}")
            self.driver = None

    def close(self):
        if self.driver:
            self.driver.close()

    def record_behavior(self, user_id: int, product_id: int, behavior_type: str):
        """
        Creates User, Product nodes and draws BUY or VIEW relationship between them.
        """
        if not self.driver:
            return
            
        cypher = f"""
        MERGE (u:User {{id: $user_id}})
        MERGE (p:Product {{id: $product_id}})
        MERGE (u)-[r:{behavior_type.upper()}]->(p)
        ON CREATE SET r.created_at = timestamp()
        """
        try:
            with self.driver.session() as session:
                session.run(cypher, user_id=user_id, product_id=product_id)
        except Exception as e:
            logger.error(f"Neo4j record_behavior error: {e}")

    def get_graph_recommendations(self, user_id: int, limit: int = 10):
        """
        Collaborative filtering on Graph:
        Find products viewed/bought by other users who viewed/bought the same products as the current user.
        """
        if not self.driver:
            return {}
            
        cypher = """
        MATCH (u:User {id: $user_id})-[r1:VIEW|PURCHASE]->(p1:Product)<-[r2:VIEW|PURCHASE]-(other:User)-[r3:VIEW|PURCHASE]->(p2:Product)
        WHERE NOT (u)-[:VIEW|PURCHASE]->(p2) AND u <> other
        RETURN p2.id AS product_id, count(distinct other) AS score
        ORDER BY score DESC
        LIMIT $limit
        """
        try:
            results = {}
            with self.driver.session() as session:
                result = session.run(cypher, user_id=user_id, limit=limit)
                # Normalize scores
                records = list(result)
                if not records:
                    return {}
                max_score = max(r['score'] for r in records) if records else 1
                for record in records:
                    pid = record['product_id']
                    score = record['score']
                    results[pid] = float(score / max_score)
            return results
        except Exception as e:
            logger.error(f"Neo4j get_graph_recommendations error: {e}")
            return {}
            
    def set_product_similarity(self, p1_id: int, p2_id: int, score: float):
        """
        Establishes SIMILAR relationship between products.
        """
        if not self.driver:
            return
            
        cypher = """
        MERGE (p1:Product {id: $p1_id})
        MERGE (p2:Product {id: $p2_id})
        MERGE (p1)-[r:SIMILAR]->(p2)
        SET r.score = $score
        """
        try:
            with self.driver.session() as session:
                session.run(cypher, p1_id=p1_id, p2_id=p2_id, score=score)
        except Exception as e:
            logger.error(f"Neo4j set_product_similarity error: {e}")
