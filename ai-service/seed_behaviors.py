"""
Script seed dữ liệu hành vi mô phỏng vào SQLite cho LSTM Training.
Chạy trong container:
  docker compose exec ai-service python seed_behaviors.py [--users 500] [--clear]

Dữ liệu được thiết kế dựa theo catalog thực tế (21 sản phẩm, 3 danh mục).
"""
import argparse
import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
import os

# ── Cấu hình ─────────────────────────────────────────────────────────────
DB_PATH = "data/ai_logs.db"

# Map danh mục → product IDs (dựa theo seed_data.py)
CATEGORIES = {
    "sach":       [1, 2, 7, 8, 13, 14, 15],   # 7 sách
    "dien_tu":    [3, 4, 9, 10, 16, 17, 18],   # 7 điện tử
    "thoi_trang": [5, 6, 11, 12, 19, 20, 21],  # 7 thời trang
}
ALL_PRODUCT_IDS = [pid for pids in CATEGORIES.values() for pid in pids]

# Các loại hành vi và xác suất
BEHAVIOR_TYPES = ["VIEW", "ADD_TO_CART", "PURCHASE"]

# Persona: mô tả hành vi người dùng theo phân khúc
PERSONAS = {
    "tech_lover": {          # Mê công nghệ
        "primary": "dien_tu",
        "secondary": "sach",
        "interactions": (25, 50),
        "purchase_rate": 0.25,
    },
    "bookworm": {            # Mê đọc sách
        "primary": "sach",
        "secondary": "thoi_trang",
        "interactions": (20, 40),
        "purchase_rate": 0.30,
    },
    "fashionista": {         # Mê thời trang
        "primary": "thoi_trang",
        "secondary": "dien_tu",
        "interactions": (20, 45),
        "purchase_rate": 0.28,
    },
    "general_buyer": {       # Mua sắm tổng hợp
        "primary": None,
        "secondary": None,
        "interactions": (15, 35),
        "purchase_rate": 0.20,
    },
}

PERSONA_WEIGHTS = [0.28, 0.28, 0.28, 0.16]  # tỉ lệ phân phối persona


def generate_user_sequence(user_id: int, persona_name: str, start_user_id: int = 100):
    """Tạo chuỗi hành vi thực tế cho một user theo persona."""
    persona = PERSONAS[persona_name]
    n_interactions = random.randint(*persona["interactions"])
    purchase_rate = persona["purchase_rate"]

    # Chọn sản phẩm ưa thích theo persona
    if persona["primary"]:
        primary_pool   = CATEGORIES[persona["primary"]]
        secondary_pool = CATEGORIES[persona["secondary"]]
        other_pools    = [
            pid for cat, pids in CATEGORIES.items()
            for pid in pids
            if cat != persona["primary"] and cat != persona["secondary"]
        ]
        # Mỗi user trong persona chú ý đến cluster nhỏ hơn trong category
        fav_primary   = random.sample(primary_pool,   min(3, len(primary_pool)))
        fav_secondary = random.sample(secondary_pool, min(2, len(secondary_pool)))
    else:
        fav_primary   = random.sample(ALL_PRODUCT_IDS, 4)
        fav_secondary = random.sample(ALL_PRODUCT_IDS, 3)
        other_pools   = ALL_PRODUCT_IDS

    events = []
    # Tạo thời gian ngẫu nhiên trong 90 ngày qua (trải đều)
    base_time = datetime.now() - timedelta(days=90)
    time_cursor = base_time + timedelta(minutes=random.randint(0, 60 * 24 * 89))

    for _ in range(n_interactions):
        # Chọn sản phẩm theo xác suất
        roll = random.random()
        if roll < 0.55:
            pid = random.choice(fav_primary)
        elif roll < 0.80:
            pid = random.choice(fav_secondary)
        else:
            pid = random.choice(ALL_PRODUCT_IDS)

        # Chuỗi hành vi tự nhiên: VIEW → (ADD_TO_CART?) → (PURCHASE?)
        events.append((user_id, pid, "VIEW", time_cursor))
        time_cursor += timedelta(minutes=random.randint(1, 30))

        if random.random() < 0.35:   # 35% add to cart sau VIEW
            events.append((user_id, pid, "ADD_TO_CART", time_cursor))
            time_cursor += timedelta(minutes=random.randint(1, 60))

            if random.random() < purchase_rate:  # mua theo tỉ lệ persona
                events.append((user_id, pid, "PURCHASE", time_cursor))
                time_cursor += timedelta(minutes=random.randint(5, 120))

        # Khoảng cách giữa các tương tác
        time_cursor += timedelta(hours=random.randint(0, 12))

    return events


def seed(n_users: int = 300, start_user_id: int = 100, clear_existing: bool = False):
    os.makedirs("data", exist_ok=True)
    engine = create_engine(f"sqlite:///{DB_PATH}")

    with engine.connect() as conn:
        # Đảm bảo bảng tồn tại
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS user_behaviors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                behavior_type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()

        if clear_existing:
            # Chỉ xóa user giả lập (id >= start_user_id), giữ nguyên user thật
            conn.execute(text(f"DELETE FROM user_behaviors WHERE user_id >= {start_user_id}"))
            conn.commit()
            print(f"[INFO] Đã xóa dữ liệu cũ của user_id >= {start_user_id}")

        # Đếm data hiện có
        existing = conn.execute(text("SELECT COUNT(*) FROM user_behaviors")).fetchone()[0]
        print(f"[INFO] Dữ liệu hiện có: {existing} bản ghi")

        # Seed người dùng giả lập
        persona_names = list(PERSONAS.keys())
        total_inserted = 0
        batch = []
        BATCH_SIZE = 500

        for i in range(n_users):
            uid = start_user_id + i
            persona = random.choices(persona_names, weights=PERSONA_WEIGHTS, k=1)[0]
            events = generate_user_sequence(uid, persona, start_user_id)

            for user_id, pid, btype, ts in events:
                batch.append({
                    "user_id": user_id,
                    "product_id": pid,
                    "behavior_type": btype,
                    "created_at": ts.strftime("%Y-%m-%d %H:%M:%S"),
                })
                total_inserted += 1

            # Flush batch
            if len(batch) >= BATCH_SIZE:
                conn.execute(
                    text("INSERT INTO user_behaviors (user_id, product_id, behavior_type, created_at) "
                         "VALUES (:user_id, :product_id, :behavior_type, :created_at)"),
                    batch,
                )
                conn.commit()
                batch = []
                print(f"  Đã chèn {total_inserted:,} bản ghi... (user {uid})")

        # Flush phần còn lại
        if batch:
            conn.execute(
                text("INSERT INTO user_behaviors (user_id, product_id, behavior_type, created_at) "
                     "VALUES (:user_id, :product_id, :behavior_type, :created_at)"),
                batch,
            )
            conn.commit()

        total_in_db = conn.execute(text("SELECT COUNT(*) FROM user_behaviors")).fetchone()[0]
        print(f"\n[OK] Hoàn tất! Đã chèn {total_inserted:,} bản ghi mới.")
        print(f"[OK] Tổng dữ liệu trong DB: {total_in_db:,} bản ghi")
        print(f"[OK] Số user giả lập: {n_users} (ID {start_user_id} → {start_user_id + n_users - 1})")

        # Thống kê nhanh
        stats = conn.execute(text(
            "SELECT behavior_type, COUNT(*) FROM user_behaviors GROUP BY behavior_type"
        )).fetchall()
        print("\n[STATS] Phân phối hành vi:")
        for btype, cnt in stats:
            print(f"  {btype:<15}: {cnt:,}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed behavior data for LSTM training")
    parser.add_argument("--users", type=int, default=300, help="Số user giả lập (mặc định: 300)")
    parser.add_argument("--clear", action="store_true", help="Xóa dữ liệu giả lập cũ trước khi seed")
    args = parser.parse_args()
    seed(n_users=args.users, clear_existing=args.clear)
