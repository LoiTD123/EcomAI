"""
=============================================================
  Script Huấn luyện Mô hình LSTM Gợi ý Sản phẩm (v2)
  Hướng dẫn:
    # 1. Seed dữ liệu hành vi (chạy 1 lần):
    docker compose exec ai-service python seed_behaviors.py --users 500 --clear

    # 2. Huấn luyện:
    docker compose exec ai-service python train_lstm.py

    # 3. Train thêm với data mới (fine-tune):
    docker compose exec ai-service python train_lstm.py
=============================================================
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import random
import os
import sys

# ───────────────────────────────────────────────────────────
# 0. Cấu hình
# ───────────────────────────────────────────────────────────
NUM_PRODUCTS  = 10000   # Phải khớp với lstm_service.py
EMBEDDING_DIM = 64
HIDDEN_DIM    = 128
SEQ_LEN       = 5
BATCH_SIZE    = 64      # Tăng batch size để train nhanh hơn với data lớn
EPOCHS        = 50      # Tăng số epoch
LEARNING_RATE = 1e-3
WEIGHTS_PATH  = "data/lstm_weights.pth"
DB_PATH       = "data/ai_logs.db"

# Trọng số ý nghĩa hành vi
BEHAVIOR_WEIGHT = {"VIEW": 1, "ADD_TO_CART": 3, "PURCHASE": 5}

# Catalog thực tế (dựa theo seed_data.py)
CATEGORY_MAP = {
    "sach":       [1, 2, 7, 8, 13, 14, 15],
    "dien_tu":    [3, 4, 9, 10, 16, 17, 18],
    "thoi_trang": [5, 6, 11, 12, 19, 20, 21],
}
ALL_REAL_IDS = [pid for pids in CATEGORY_MAP.values() for pid in pids]

# ───────────────────────────────────────────────────────────
# 1. Load model định nghĩa
# ───────────────────────────────────────────────────────────
sys.path.insert(0, "/app")
from app.models.lstm_model import ProductLSTM


# ───────────────────────────────────────────────────────────
# 2. Load dữ liệu thực từ SQLite
# ───────────────────────────────────────────────────────────
def load_real_sequences():
    from sqlalchemy import create_engine, text
    sequences = []
    try:
        engine = create_engine(f"sqlite:///{DB_PATH}")
        with engine.connect() as conn:
            rows = conn.execute(
                text("SELECT user_id, product_id, behavior_type FROM user_behaviors ORDER BY user_id, created_at")
            ).fetchall()
    except Exception as e:
        print(f"[WARNING] Không thể đọc SQLite: {e}")
        return [], 21

    if not rows:
        return [], 21

    # Nhóm theo user_id, áp trọng số hành vi
    user_products = {}
    for user_id, product_id, behavior_type in rows:
        weight = BEHAVIOR_WEIGHT.get(behavior_type, 1)
        user_products.setdefault(user_id, []).extend([product_id] * weight)

    # Sliding window tạo sequences
    for uid, products in user_products.items():
        if len(products) < 2:
            continue
        for i in range(1, len(products)):
            window = products[max(0, i - SEQ_LEN):i]
            target = products[i]
            padded = [0] * (SEQ_LEN - len(window)) + window
            sequences.append((padded, target))

    # Lấy max product_id thực tế
    max_pid = max(r[1] for r in rows) if rows else 21
    n_users = len(user_products)
    print(f"[INFO] Dữ liệu SQLite: {len(rows):,} bản ghi | {n_users} users | {len(sequences):,} sequences")
    return sequences, max_pid


# ───────────────────────────────────────────────────────────
# 3. Dữ liệu tổng hợp: mô phỏng theo persona + category
# ───────────────────────────────────────────────────────────
PERSONAS = {
    "tech_lover":    {"primary": "dien_tu",    "secondary": "sach",       "n": (30, 60), "p_buy": 0.25},
    "bookworm":      {"primary": "sach",        "secondary": "thoi_trang", "n": (25, 50), "p_buy": 0.30},
    "fashionista":   {"primary": "thoi_trang",  "secondary": "dien_tu",    "n": (25, 55), "p_buy": 0.28},
    "general_buyer": {"primary": None,           "secondary": None,         "n": (15, 40), "p_buy": 0.20},
}
PERSONA_WEIGHTS = [0.28, 0.28, 0.28, 0.16]


def _user_seq_from_persona(persona_key):
    p = PERSONAS[persona_key]
    n = random.randint(*p["n"])

    if p["primary"]:
        primary_pool   = CATEGORY_MAP[p["primary"]]
        secondary_pool = CATEGORY_MAP[p["secondary"]]
        fav = random.sample(primary_pool, min(3, len(primary_pool)))
    else:
        fav = random.sample(ALL_REAL_IDS, 4)
        secondary_pool = ALL_REAL_IDS

    seq = []
    for _ in range(n):
        roll = random.random()
        if roll < 0.55:
            pid = random.choice(fav)
        elif roll < 0.80:
            pid = random.choice(secondary_pool)
        else:
            pid = random.choice(ALL_REAL_IDS)
        seq.append(pid)

        if random.random() < 0.35:
            seq.extend([pid] * 2)          # ADD_TO_CART weight=2 thêm vào seq
        if random.random() < p["p_buy"]:
            seq.extend([pid] * 4)          # PURCHASE weight=4 thêm vào seq
    return seq


def generate_persona_sequences(n_users=500):
    persona_keys = list(PERSONAS.keys())
    sequences = []
    for _ in range(n_users):
        pk = random.choices(persona_keys, weights=PERSONA_WEIGHTS, k=1)[0]
        user_seq = _user_seq_from_persona(pk)
        for i in range(1, len(user_seq)):
            window = user_seq[max(0, i - SEQ_LEN):i]
            padded = [0] * (SEQ_LEN - len(window)) + window
            sequences.append((padded, user_seq[i]))
    print(f"[INFO] Dữ liệu tổng hợp:  {n_users} personas | {len(sequences):,} sequences")
    return sequences


# ───────────────────────────────────────────────────────────
# 4. Dataset
# ───────────────────────────────────────────────────────────
class BehaviorDataset(Dataset):
    def __init__(self, sequences):
        self.data = sequences

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        seq, target = self.data[idx]
        return torch.LongTensor(seq), torch.tensor(target, dtype=torch.long)


# ───────────────────────────────────────────────────────────
# 5. Train
# ───────────────────────────────────────────────────────────
def train():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[INFO] Thiết bị: {device}")
    print(f"[INFO] Config: epochs={EPOCHS}, batch={BATCH_SIZE}, lr={LEARNING_RATE}, seq_len={SEQ_LEN}")

    # 5a. Load dữ liệu
    real_seqs, max_pid = load_real_sequences()
    # Số user persona tổng hợp thêm: 500 nếu data thực ít
    n_synthetic = max(200, 500 - len(real_seqs) // 50)
    synthetic_seqs = generate_persona_sequences(n_users=n_synthetic)
    all_seqs = real_seqs + synthetic_seqs
    random.shuffle(all_seqs)

    if not all_seqs:
        print("[ERROR] Không có dữ liệu!")
        return

    total = len(all_seqs)
    split = int(0.85 * total)
    train_seqs, val_seqs = all_seqs[:split], all_seqs[split:]

    train_loader = DataLoader(BehaviorDataset(train_seqs), batch_size=BATCH_SIZE, shuffle=True,  num_workers=0)
    val_loader   = DataLoader(BehaviorDataset(val_seqs),   batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    print(f"[INFO] Train: {len(train_seqs):,} | Val: {len(val_seqs):,} sequences")

    # 5b. Khởi tạo model
    model = ProductLSTM(num_products=NUM_PRODUCTS, embedding_dim=EMBEDDING_DIM, hidden_dim=HIDDEN_DIM).to(device)
    start_epoch = 1

    if os.path.exists(WEIGHTS_PATH):
        try:
            model.load_state_dict(torch.load(WEIGHTS_PATH, map_location=device))
            print(f"[INFO] Load checkpoint: {WEIGHTS_PATH}")
        except Exception as e:
            print(f"[WARNING] Không load được checkpoint: {e}")

    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-5)
    criterion = nn.CrossEntropyLoss(ignore_index=0)

    # CosineAnnealing scheduler: giảm LR mượt hơn StepLR
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS, eta_min=1e-5)

    # ─ Training loop ─
    print("\n" + "="*60)
    print("  Bắt đầu huấn luyện LSTM (v2 — Enhanced Data)")
    print("="*60)

    best_val_loss = float("inf")
    patience_counter = 0
    PATIENCE = 10  # Early stopping sau 10 epoch không cải thiện

    for epoch in range(start_epoch, EPOCHS + 1):
        # ── Train ──
        model.train()
        t_loss, t_correct, t_total = 0.0, 0, 0
        for seqs, targets in train_loader:
            seqs, targets = seqs.to(device), targets.to(device)
            optimizer.zero_grad()
            out  = model(seqs)
            loss = criterion(out, targets)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            t_loss    += loss.item() * seqs.size(0)
            t_correct += (out.argmax(1) == targets).sum().item()
            t_total   += seqs.size(0)

        # ── Val ──
        model.eval()
        v_loss, v_correct, v_total = 0.0, 0, 0
        with torch.no_grad():
            for seqs, targets in val_loader:
                seqs, targets = seqs.to(device), targets.to(device)
                out  = model(seqs)
                loss = criterion(out, targets)
                v_loss    += loss.item() * seqs.size(0)
                v_correct += (out.argmax(1) == targets).sum().item()
                v_total   += seqs.size(0)

        scheduler.step()

        tl = t_loss / t_total;  ta = 100.0 * t_correct / t_total
        vl = v_loss / v_total;  va = 100.0 * v_correct / v_total
        lr_now = scheduler.get_last_lr()[0]

        marker = " *" if vl < best_val_loss else ""
        print(f"  Ep [{epoch:>2}/{EPOCHS}]  "
              f"Train Loss={tl:.4f} Acc={ta:.1f}%  |  "
              f"Val Loss={vl:.4f} Acc={va:.1f}%  "
              f"LR={lr_now:.6f}{marker}")

        if vl < best_val_loss:
            best_val_loss = vl
            patience_counter = 0
            os.makedirs("data", exist_ok=True)
            torch.save(model.state_dict(), WEIGHTS_PATH)
        else:
            patience_counter += 1
            if patience_counter >= PATIENCE:
                print(f"\n[STOP] Early stopping tại epoch {epoch} (không cải thiện {PATIENCE} epoch liên tiếp)")
                break

    print("\n" + "="*60)
    print(f"  Hoan tat! Best Val Loss: {best_val_loss:.4f}")
    print(f"  Trong so luu tai: {WEIGHTS_PATH}")
    print("="*60)


if __name__ == "__main__":
    train()
