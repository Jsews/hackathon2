import os, json
from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
import requests

app = FastAPI(title="FoodLink AI API")

# --- CORS (open for dev) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # okay for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DB config (local dev defaults) ---
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "foodlink")

PAYSTACK_SECRET = os.getenv("PAYSTACK_SECRET", "")  # leave empty for demo mode

def get_db():
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        autocommit=True
    )

# --- Simple demo header auth ---
async def require_user(authorization: str = Header(None)):
    # For dev/demo, always return a fake user
    return {"email": "demo@foodlink.ai", "role": "buyer"}

# --- Models ---
class ItemIn(BaseModel):
    org_id: int | None = None
    title: str
    description: str | None = None
    category: str | None = None
    photo_url: str | None = None
    portions: int = 1
    price_cents: int = 0
    expires_at: str | None = None
    pickup_window_start: str | None = None
    pickup_window_end: str | None = None
    dietary: dict | None = None

class CheckoutIn(BaseModel):
    order_id: int

# --- Routes ---
@app.get("/health")
def health():
    return {"ok": True}

@app.get("/items")
def list_items(limit: int = 50):
    try:
        db = get_db()
        cur = db.cursor(dictionary=True)
        cur.execute(
            "SELECT * FROM items WHERE status='active' ORDER BY created_at DESC LIMIT %s",
            (limit,)
        )
        rows = cur.fetchall()
        cur.close(); db.close()
        return rows
    except Exception as e:
        raise HTTPException(500, f"DB error: {e}")

@app.post("/items")
def create_item(item: ItemIn, user=Depends(require_user)):
    try:
        db = get_db()
        cur = db.cursor()
        sql = ("""
            INSERT INTO items
            (org_id, title, description, category, photo_url, portions, price_cents,
             expires_at, pickup_window_start, pickup_window_end)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """)
        cur.execute(sql, (
            item.org_id, item.title, item.description, item.category,
            item.photo_url, item.portions, item.price_cents,
            item.expires_at, item.pickup_window_start, item.pickup_window_end
        ))
        new_id = cur.lastrowid
        cur.close(); db.close()
        return {"id": new_id}
    except Exception as e:
        raise HTTPException(500, f"DB insert error: {e}")

@app.post("/checkout")
def checkout(data: CheckoutIn, user=Depends(require_user)):
    if not PAYSTACK_SECRET:
        # Demo flow for local dev
        return {"payment_url": "https://paystack.com/pay/demo-foodlink-checkout"}

    # Example amount — in real use, fetch order amount from DB
    amount_kobo = 5000
    email = user.get("email", "buyer@example.com")

    headers = {"Authorization": f"Bearer {PAYSTACK_SECRET}", "Content-Type": "application/json"}
    payload = {"email": email, "amount": amount_kobo, "currency": "NGN"}
    r = requests.post(
        "https://api.paystack.co/transaction/initialize",
        headers=headers, json=payload, timeout=20
    )
    if r.status_code != 200:
        raise HTTPException(502, f"Paystack error: {r.text}")
    return r.json()

@app.post("/webhooks/paystack")
async def paystack_webhook(request: Request):
    # For local dev, just print payload
    body = await request.body()
    print("PAYSTACK HOOK:", body[:200])
    return {"ok": True}
