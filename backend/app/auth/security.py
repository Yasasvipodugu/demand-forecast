import os
import hashlib
import secrets

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        bytes.fromhex(salt),
        100000
    )
    return f"{salt}${key.hex()}"

def verify_password(password: str, hashed_value: str) -> bool:
    try:
        parts = hashed_value.split('$')
        if len(parts) != 2:
            return False
        salt, expected_hex = parts
        key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            bytes.fromhex(salt),
            100000
        )
        return secrets.compare_digest(key.hex(), expected_hex)
    except Exception:
        return False

def generate_session_token() -> str:
    return secrets.token_urlsafe(32)
