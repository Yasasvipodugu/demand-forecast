import sqlite3
from datetime import datetime, timedelta
import random
from typing import Dict, Any, List, Optional
import pandas as pd
from app.core.config import DATA_DIR, SYNTHETIC_DATA_DIR

DB_PATH = DATA_DIR / "users.db"

def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_shop_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Products table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            sku_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            subcategory TEXT NOT NULL,
            brand_tier TEXT NOT NULL,
            price REAL NOT NULL,
            cost REAL NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
            min_stock INTEGER NOT NULL DEFAULT 20,
            lead_time_days INTEGER NOT NULL DEFAULT 14,
            status TEXT NOT NULL DEFAULT 'Active',
            created_at TEXT NOT NULL
        )
    """)

    # 2. Sales transactions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku_id TEXT NOT NULL,
            product_name TEXT NOT NULL,
            sale_date TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            total_amount REAL NOT NULL,
            channel TEXT NOT NULL DEFAULT 'In-Store',
            created_at TEXT NOT NULL,
            FOREIGN KEY (sku_id) REFERENCES products(sku_id)
        )
    """)

    # 3. Inventory transactions / movements table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inventory_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku_id TEXT NOT NULL,
            product_name TEXT NOT NULL,
            transaction_type TEXT NOT NULL,
            quantity_delta INTEGER NOT NULL,
            stock_after INTEGER NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (sku_id) REFERENCES products(sku_id)
        )
    """)

    # 4. Store settings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS store_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    # Check if products table is already populated
    cursor.execute("SELECT COUNT(*) as cnt FROM products")
    count = cursor.fetchone()["cnt"]

    if count == 0:
        # Pre-seed with the 150 new SKU attributes
        new_skus_csv = SYNTHETIC_DATA_DIR / "new_sku_attributes.csv"
        if new_skus_csv.exists():
            df = pd.read_csv(new_skus_csv, keep_default_na=False)
            now_iso = datetime.utcnow().isoformat()
            
            random.seed(42)
            seeded_products = []
            
            for _, row in df.iterrows():
                sku_id = str(row["sku_id"])
                name = str(row.get("product_name", sku_id))
                cat = str(row.get("category", "General"))
                subcat = str(row.get("subcategory", "General"))
                tier = str(row.get("brand_tier", "Mainstream"))
                price = float(row.get("retail_price", 65.0))
                cost = float(row.get("cost_price", 25.0))
                
                # Deterministic realistic stock based on tier & price
                stock = random.randint(15, 140)
                min_stock = random.choice([15, 20, 25, 30])
                lead_time = random.choice([7, 10, 14, 21])
                
                cursor.execute("""
                    INSERT INTO products (sku_id, name, category, subcategory, brand_tier, price, cost, stock, min_stock, lead_time_days, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (sku_id, name, cat, subcat, tier, price, cost, stock, min_stock, lead_time, 'Active', now_iso))
                
                seeded_products.append({
                    "sku_id": sku_id,
                    "name": name,
                    "price": price,
                    "stock": stock
                })

            conn.commit()

            # Seed realistic initial inventory receipts
            for p in seeded_products[:50]:
                cursor.execute("""
                    INSERT INTO inventory_transactions (sku_id, product_name, transaction_type, quantity_delta, stock_after, notes, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    p["sku_id"],
                    p["name"],
                    "Initial Stock Inflow",
                    p["stock"],
                    p["stock"],
                    "Store launch initial inventory intake",
                    (datetime.utcnow() - timedelta(days=random.randint(10, 30))).isoformat()
                ))

            # Seed 35 realistic recent sales
            channels = ["In-Store POS", "Online Storefront", "Curbside Pickup", "B2B Order"]
            for i in range(35):
                p = random.choice(seeded_products[:40])
                qty = random.randint(1, 4)
                tot = round(qty * p["price"], 2)
                sale_time = (datetime.utcnow() - timedelta(days=random.randint(0, 7), hours=random.randint(1, 23))).isoformat()
                
                cursor.execute("""
                    INSERT INTO sales (sku_id, product_name, sale_date, quantity, unit_price, total_amount, channel, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (p["sku_id"], p["name"], sale_time[:10], qty, p["price"], tot, random.choice(channels), sale_time))
                
                # Record transaction deduction
                cursor.execute("""
                    INSERT INTO inventory_transactions (sku_id, product_name, transaction_type, quantity_delta, stock_after, notes, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (p["sku_id"], p["name"], "Customer Sale", -qty, max(0, p["stock"] - qty), f"Order fulfillment ({qty} units)", sale_time))

            conn.commit()

    # Pre-seed default store settings if missing
    default_settings = [
        ("store_name", "Nordic Flagship Store #104"),
        ("currency", "USD ($)"),
        ("default_lead_time_days", "14"),
        ("target_service_level", "90"),
        ("auto_reorder_enabled", "true"),
        ("understock_penalty_rate", "40.0"),
        ("overstock_holding_rate", "15.0"),
        ("default_order_policy", "Newsvendor Q* Expected Profit Optimization")
    ]
    for k, v in default_settings:
        cursor.execute("SELECT key FROM store_settings WHERE key = ?", (k,))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO store_settings (key, value, updated_at) VALUES (?, ?, ?)", (k, v, datetime.utcnow().isoformat()))
            
    conn.commit()
    conn.close()

# ---------------- Product Operations ----------------

def list_products(search: Optional[str] = None, category: Optional[str] = None, brand_tier: Optional[str] = None, limit: int = 200) -> List[Dict[str, Any]]:
    init_shop_db()
    conn = get_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM products WHERE 1=1"
    params = []
    
    if search:
        query += " AND (sku_id LIKE ? OR name LIKE ? OR subcategory LIKE ?)"
        s = f"%{search.strip()}%"
        params.extend([s, s, s])
        
    if category and category != "All":
        query += " AND category = ?"
        params.append(category)
        
    if brand_tier and brand_tier != "All":
        query += " AND brand_tier = ?"
        params.append(brand_tier)
        
    query += " ORDER BY sku_id ASC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        stock = r["stock"]
        min_stock = r["min_stock"]
        if stock <= 0:
            status_stock = "Out of Stock"
        elif stock <= min_stock:
            status_stock = "Low Stock"
        elif stock > min_stock * 4:
            status_stock = "Overstocked"
        else:
            status_stock = "Healthy"
            
        results.append({
            "sku_id": r["sku_id"],
            "name": r["name"],
            "category": r["category"],
            "subcategory": r["subcategory"],
            "brand_tier": r["brand_tier"],
            "price": r["price"],
            "cost": r["cost"],
            "stock": r["stock"],
            "min_stock": r["min_stock"],
            "lead_time_days": r["lead_time_days"],
            "status": r["status"],
            "stock_status": status_stock,
            "created_at": r["created_at"]
        })
    return results

def get_product(sku_id: str) -> Optional[Dict[str, Any]]:
    init_shop_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE sku_id = ?", (sku_id.strip(),))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)

def create_product(data: Dict[str, Any]) -> Dict[str, Any]:
    init_shop_db()
    conn = get_connection()
    cursor = conn.cursor()
    sku_id = data["sku_id"].strip().upper()
    name = data["name"].strip()
    category = data.get("category", "General").strip()
    subcategory = data.get("subcategory", "General").strip()
    brand_tier = data.get("brand_tier", "Mainstream").strip()
    price = float(data.get("price", 49.99))
    cost = float(data.get("cost", 20.00))
    stock = int(data.get("stock", 50))
    min_stock = int(data.get("min_stock", 20))
    lead_time_days = int(data.get("lead_time_days", 14))
    status = data.get("status", "Active").strip()
    now = datetime.utcnow().isoformat()
    
    try:
        cursor.execute("""
            INSERT INTO products (sku_id, name, category, subcategory, brand_tier, price, cost, stock, min_stock, lead_time_days, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (sku_id, name, category, subcategory, brand_tier, price, cost, stock, min_stock, lead_time_days, status, now))
        
        # Log initial inventory transaction
        cursor.execute("""
            INSERT INTO inventory_transactions (sku_id, product_name, transaction_type, quantity_delta, stock_after, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (sku_id, name, "New Product Cataloging", stock, stock, "Created product via catalog management", now))
        
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise ValueError(f"Product with SKU '{sku_id}' already exists.")
    finally:
        conn.close()
        
    return get_product(sku_id)

def update_product(sku_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    init_shop_db()
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM products WHERE sku_id = ?", (sku_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise ValueError(f"SKU '{sku_id}' not found.")
        
    name = data.get("name", row["name"]).strip()
    category = data.get("category", row["category"]).strip()
    subcategory = data.get("subcategory", row["subcategory"]).strip()
    brand_tier = data.get("brand_tier", row["brand_tier"]).strip()
    price = float(data.get("price", row["price"]))
    cost = float(data.get("cost", row["cost"]))
    min_stock = int(data.get("min_stock", row["min_stock"]))
    lead_time_days = int(data.get("lead_time_days", row["lead_time_days"]))
    status = data.get("status", row["status"]).strip()
    
    cursor.execute("""
        UPDATE products
        SET name = ?, category = ?, subcategory = ?, brand_tier = ?, price = ?, cost = ?, min_stock = ?, lead_time_days = ?, status = ?
        WHERE sku_id = ?
    """, (name, category, subcategory, brand_tier, price, cost, min_stock, lead_time_days, status, sku_id))
    
    conn.commit()
    conn.close()
    return get_product(sku_id)

def delete_product(sku_id: str) -> bool:
    init_shop_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM products WHERE sku_id = ?", (sku_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

# ---------------- Sales Operations ----------------

def record_sale(sku_id: str, quantity: int, unit_price: Optional[float] = None, channel: str = "In-Store POS", sale_date: Optional[str] = None) -> Dict[str, Any]:
    init_shop_db()
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM products WHERE sku_id = ?", (sku_id,))
    prod = cursor.fetchone()
    if not prod:
        conn.close()
        raise ValueError(f"Product '{sku_id}' not found.")
        
    price = unit_price if unit_price is not None else prod["price"]
    total = round(quantity * price, 2)
    s_date = sale_date if sale_date else datetime.utcnow().strftime("%Y-%m-%d")
    now = datetime.utcnow().isoformat()
    
    new_stock = max(0, prod["stock"] - quantity)
    
    # 1. Insert sale record
    cursor.execute("""
        INSERT INTO sales (sku_id, product_name, sale_date, quantity, unit_price, total_amount, channel, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (sku_id, prod["name"], s_date, quantity, price, total, channel, now))
    sale_id = cursor.lastrowid
    
    # 2. Update product stock
    cursor.execute("UPDATE products SET stock = ? WHERE sku_id = ?", (new_stock, sku_id))
    
    # 3. Log inventory movement
    cursor.execute("""
        INSERT INTO inventory_transactions (sku_id, product_name, transaction_type, quantity_delta, stock_after, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (sku_id, prod["name"], "Customer Sale", -quantity, new_stock, f"Sale ID #{sale_id} via {channel}", now))
    
    conn.commit()
    conn.close()
    
    return {
        "sale_id": sale_id,
        "sku_id": sku_id,
        "product_name": prod["name"],
        "quantity": quantity,
        "unit_price": price,
        "total_amount": total,
        "channel": channel,
        "sale_date": s_date,
        "stock_remaining": new_stock
    }

def list_sales(limit: int = 100, sku_id: Optional[str] = None) -> List[Dict[str, Any]]:
    init_shop_db()
    conn = get_connection()
    cursor = conn.cursor()
    
    if sku_id:
        cursor.execute("SELECT * FROM sales WHERE sku_id = ? ORDER BY id DESC LIMIT ?", (sku_id, limit))
    else:
        cursor.execute("SELECT * FROM sales ORDER BY id DESC LIMIT ?", (limit,))
        
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_sales_metrics() -> Dict[str, Any]:
    init_shop_db()
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            COUNT(*) as total_orders,
            COALESCE(SUM(quantity), 0) as total_units_sold,
            COALESCE(SUM(total_amount), 0.0) as total_revenue,
            COALESCE(AVG(total_amount), 0.0) as avg_order_value
        FROM sales
    """)
    row = cursor.fetchone()
    
    # Also get today's sales
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    cursor.execute("SELECT COALESCE(SUM(total_amount), 0.0) as today_rev, COALESCE(SUM(quantity), 0) as today_units FROM sales WHERE sale_date = ?", (today_str,))
    today_row = cursor.fetchone()
    
    conn.close()
    
    return {
        "total_orders": row["total_orders"],
        "total_units_sold": row["total_units_sold"],
        "total_revenue": round(row["total_revenue"], 2),
        "avg_order_value": round(row["avg_order_value"], 2),
        "today_revenue": round(today_row["today_rev"], 2),
        "today_units_sold": today_row["today_units"]
    }

# ---------------- Inventory Operations ----------------

def adjust_stock(sku_id: str, adjustment_type: str, quantity_delta: int, notes: str = "") -> Dict[str, Any]:
    init_shop_db()
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM products WHERE sku_id = ?", (sku_id,))
    prod = cursor.fetchone()
    if not prod:
        conn.close()
        raise ValueError(f"Product '{sku_id}' not found.")
        
    curr_stock = prod["stock"]
    
    if adjustment_type == "Set Absolute Stock":
        new_stock = max(0, quantity_delta)
        delta = new_stock - curr_stock
    else:
        # relative change (+ or -)
        new_stock = max(0, curr_stock + quantity_delta)
        delta = new_stock - curr_stock
        
    now = datetime.utcnow().isoformat()
    
    cursor.execute("UPDATE products SET stock = ? WHERE sku_id = ?", (new_stock, sku_id))
    cursor.execute("""
        INSERT INTO inventory_transactions (sku_id, product_name, transaction_type, quantity_delta, stock_after, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (sku_id, prod["name"], adjustment_type, delta, new_stock, notes.strip(), now))
    
    conn.commit()
    conn.close()
    
    return {
        "sku_id": sku_id,
        "product_name": prod["name"],
        "adjustment_type": adjustment_type,
        "delta": delta,
        "previous_stock": curr_stock,
        "new_stock": new_stock,
        "notes": notes
    }

def list_inventory_transactions(limit: int = 100, sku_id: Optional[str] = None) -> List[Dict[str, Any]]:
    init_shop_db()
    conn = get_connection()
    cursor = conn.cursor()
    
    if sku_id:
        cursor.execute("SELECT * FROM inventory_transactions WHERE sku_id = ? ORDER BY id DESC LIMIT ?", (sku_id, limit))
    else:
        cursor.execute("SELECT * FROM inventory_transactions ORDER BY id DESC LIMIT ?", (limit,))
        
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_inventory_summary() -> Dict[str, Any]:
    init_shop_db()
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            COUNT(*) as total_skus,
            COALESCE(SUM(stock), 0) as total_units_in_stock,
            COALESCE(SUM(stock * cost), 0.0) as total_cost_value,
            COALESCE(SUM(stock * price), 0.0) as total_retail_value
        FROM products
    """)
    totals = cursor.fetchone()
    
    cursor.execute("SELECT COUNT(*) as low_stock_count FROM products WHERE stock > 0 AND stock <= min_stock")
    low_stock = cursor.fetchone()["low_stock_count"]
    
    cursor.execute("SELECT COUNT(*) as out_of_stock_count FROM products WHERE stock <= 0")
    out_of_stock = cursor.fetchone()["out_of_stock_count"]
    
    cursor.execute("SELECT COUNT(*) as overstock_count FROM products WHERE stock > (min_stock * 4)")
    overstock = cursor.fetchone()["overstock_count"]
    
    conn.close()
    
    return {
        "total_skus": totals["total_skus"],
        "total_units_in_stock": totals["total_units_in_stock"],
        "total_cost_value": round(totals["total_cost_value"], 2),
        "total_retail_value": round(totals["total_retail_value"], 2),
        "low_stock_skus": low_stock,
        "out_of_stock_skus": out_of_stock,
        "overstocked_skus": overstock,
        "healthy_skus": max(0, totals["total_skus"] - low_stock - out_of_stock - overstock)
    }

# ---------------- Settings Operations ----------------

def get_all_settings() -> Dict[str, str]:
    init_shop_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM store_settings")
    rows = cursor.fetchall()
    conn.close()
    return {r["key"]: r["value"] for r in rows}

def update_setting(key: str, value: str):
    init_shop_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO store_settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    """, (key, value, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()
