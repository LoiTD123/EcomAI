import torch
import torch.nn as nn

class ProductLSTM(nn.Module):
    def __init__(self, num_products=10000, embedding_dim=64, hidden_dim=128):
        super(ProductLSTM, self).__init__()
        # 0 is used as padding index
        self.embedding = nn.Embedding(num_products + 1, embedding_dim, padding_idx=0)
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, num_products + 1)

    def forward(self, x):
        # x shape: (batch_size, sequence_length)
        embedded = self.embedding(x)
        # lstm_out shape: (batch_size, sequence_length, hidden_dim)
        lstm_out, _ = self.lstm(embedded)
        # Take output of the last sequence step
        last_hidden = lstm_out[:, -1, :]
        out = self.fc(last_hidden)
        return out
