import sqlite3
from datetime import datetime
from typing import Optional, Dict, Any
from app.core.config import DATA_DIR
from app.auth.security import hash_password, verify_password, generate_session_token

DB_PATH = DATA_DIR / "users.db"

def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            company TEXT NOT NULL,
            role TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.commit()

    # Pre-seed default demo account if not exists
    cursor.execute("SELECT id FROM users WHERE email = ?", ("buyer@retail.com",))
    if not cursor.fetchone():
        hashed = hash_password("demo123")
        cursor.execute("""
            INSERT INTO users (email, name, company, role, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            "buyer@retail.com",
            "Sarah Jenkins",
            "Nordic Retail Group",
            "Lead Merchandise Planner",
            hashed,
            datetime.utcnow().isoformat()
        ))
        conn.commit()
    conn.close()

def create_user(email: str, name: str, company: str, role: str, password: str) -> Dict[str, Any]:
    init_db()
    email_clean = email.strip().lower()
    hashed = hash_password(password)
    now = datetime.utcnow().isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO users (email, name, company, role, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (email_clean, name.strip(), company.strip(), role.strip(), hashed, now))
        conn.commit()
        user_id = cursor.lastrowid
        return {
            "id": user_id,
            "email": email_clean,
            "name": name.strip(),
            "company": company.strip(),
            "role": role.strip(),
            "created_at": now
        }
    except sqlite3.IntegrityError:
        raise ValueError("An account with this email address already exists.")
    finally:
        conn.close()

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    init_db()
    email_clean = email.strip().lower()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email_clean,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None
    
    if verify_password(password, row["password_hash"]):
        return {
            "id": row["id"],
            "email": row["email"],
            "name": row["name"],
            "company": row["company"],
            "role": row["role"],
            "created_at": row["created_at"]
        }
    return None

def create_session(user_id: int) -> str:
    init_db()
    token = generate_session_token()
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sessions (token, user_id, created_at)
        VALUES (?, ?, ?)
    """, (token, user_id, now))
    conn.commit()
    conn.close()
    return token

def get_user_by_token(token: str) -> Optional[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.email, u.name, u.company, u.role, u.created_at
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ?
    """, (token,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "id": row["id"],
            "email": row["email"],
            "name": row["name"],
            "company": row["company"],
            "role": row["role"],
            "created_at": row["created_at"]
        }
    return None

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    init_db()
    email_clean = email.strip().lower()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name, company, role, created_at FROM users WHERE email = ?", (email_clean,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "id": row["id"],
            "email": row["email"],
            "name": row["name"],
            "company": row["company"],
            "role": row["role"],
            "created_at": row["created_at"]
        }
    return None
