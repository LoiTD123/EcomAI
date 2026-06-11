import torch
import torch.nn.functional as F
from app.models import ProductLSTM
import os

MODEL_WEIGHTS_PATH = os.getenv('LSTM_WEIGHTS_PATH', 'data/lstm_weights.pth')
NUM_PRODUCTS = 10000

class LSTMService:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = ProductLSTM(num_products=NUM_PRODUCTS).to(self.device)
        
        # Load weights if available, otherwise runs with random weights for demo
        if os.path.exists(MODEL_WEIGHTS_PATH):
            try:
                self.model.load_state_dict(torch.load(MODEL_WEIGHTS_PATH, map_location=self.device))
                self.model.eval()
                print("Loaded LSTM model weights successfully.")
            except Exception as e:
                print(f"Error loading LSTM weights: {e}. Running with uninitialized weights.")
        else:
            print("LSTM weights file not found. Running model with default initial weights.")
            self.model.eval()

    def predict_next_products(self, product_sequence, top_k=10):
        """
        Input: list of product_ids (up to 5 elements)
        Output: list of tuple (product_id, probability_score)
        """
        # Padding sequence to length 5
        seq_len = 5
        padded_seq = [0] * seq_len
        
        # Take the last 5 elements
        for i, pid in enumerate(product_sequence[-seq_len:]):
            # Map index
            if pid <= NUM_PRODUCTS:
                padded_seq[seq_len - len(product_sequence[-seq_len:]) + i] = pid

        x = torch.LongTensor([padded_seq]).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(x)
            probabilities = F.softmax(outputs, dim=-1)[0]
            
        # Get top-k products (excluding padding index 0)
        prob_values, indices = torch.topk(probabilities[1:], k=min(top_k, NUM_PRODUCTS))
        
        results = {}
        for prob, idx in zip(prob_values, indices):
            product_id = idx.item() + 1 # shift index because we sliced probabilities[1:]
            results[product_id] = float(prob.item())
            
        return results
