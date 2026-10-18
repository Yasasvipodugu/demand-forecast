import urllib.request
import urllib.error
import json
import uuid

BASE_URL = "http://127.0.0.1:8000/api/auth"

def test_demo_login():
    print("Testing Demo Buyer Login (buyer@retail.com)...")
    req = urllib.request.Request(
        f"{BASE_URL}/login",
        data=json.dumps({"email": "buyer@retail.com", "password": "demo123"}).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode('utf-8'))
        assert data["status"] == "success"
        assert data["user"]["email"] == "buyer@retail.com"
        assert "token" in data
        print("  -> PASSED: Demo login returned valid user and session token.")
        return data["token"]

def test_me_endpoint():
    print("Testing GET /api/auth/me with Bearer token...")
    # Obtain token first
    req_login = urllib.request.Request(
        f"{BASE_URL}/login",
        data=json.dumps({"email": "buyer@retail.com", "password": "demo123"}).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req_login) as resp_login:
        token = json.loads(resp_login.read().decode('utf-8'))["token"]

    req = urllib.request.Request(
        f"{BASE_URL}/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode('utf-8'))
        assert data["user"]["email"] == "buyer@retail.com"
        print("  -> PASSED: User profile retrieved successfully.")

def test_user_registration():
    random_email = f"buyer_{uuid.uuid4().hex[:6]}@fashionretail.com"
    print(f"Testing User Registration with {random_email}...")
    req = urllib.request.Request(
        f"{BASE_URL}/register",
        data=json.dumps({
            "name": "David Kim",
            "email": random_email,
            "company": "Nordstrom Group",
            "role": "Senior Buyer",
            "password": "retailSecurePassword99"
        }).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode('utf-8'))
        assert data["user"]["email"] == random_email
        assert "token" in data
        print(f"  -> PASSED: New user {data['user']['name']} registered successfully.")

def test_invalid_login():
    print("Testing Invalid Login Credentials...")
    req = urllib.request.Request(
        f"{BASE_URL}/login",
        data=json.dumps({"email": "buyer@retail.com", "password": "wrong_password_test"}).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req)
        assert False, "Expected 401 Unauthorized"
    except urllib.error.HTTPError as e:
        assert e.code == 401
        print("  -> PASSED: Correctly rejected invalid credentials with 401 Unauthorized.")

def test_forgot_password():
    print("Testing POST /api/auth/forgot-password...")
    req = urllib.request.Request(
        f"{BASE_URL}/forgot-password",
        data=json.dumps({"email": "buyer@retail.com"}).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode('utf-8'))
        assert "message" in data
        print("  -> PASSED: Password reset instructions returned.")

if __name__ == "__main__":
    token = test_demo_login()
    test_me_endpoint(token)
    test_user_registration()
    test_invalid_login()
    test_forgot_password()
    print("\nALL AUTHENTICATION TESTS PASSED PERFECTLY!")
