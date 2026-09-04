from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
import requests
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File, Query, Header
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field


# ============ Config ============
JWT_ALGORITHM = "HS256"
APP_NAME = os.environ.get("APP_NAME", "bizmatch")
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ============ Auth Helpers ============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True,
                        samesite="none", max_age=604800, path="/")


def serialize_user(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    doc.pop("password_hash", None)
    for k, v in list(doc.items()):
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
    return doc


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return serialize_user(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ============ Object Storage ============
storage_key = None


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    if not EMERGENT_KEY:
        logger.warning("EMERGENT_LLM_KEY not set; storage disabled")
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=503, detail="Storage unavailable")
    resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": key, "Content-Type": content_type},
                        data=data, timeout=120)
    if resp.status_code == 404:
        init_storage(force=True)
        key = storage_key
        resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                            headers={"X-Storage-Key": key, "Content-Type": content_type},
                            data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=503, detail="Storage unavailable")
    resp = requests.get(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail="File not found")
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ============ Pydantic Models ============
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    role: Literal["business", "investor"]
    display_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    logo_path: Optional[str] = None
    # Business fields
    company_size: Optional[str] = None
    stage: Optional[str] = None
    funding_needed: Optional[str] = None
    revenue: Optional[str] = None
    looking_for: Optional[List[str]] = None
    # Investor fields
    firm_type: Optional[str] = None
    ticket_size: Optional[str] = None
    focus_industries: Optional[List[str]] = None
    portfolio_count: Optional[int] = None


class SwipeRequest(BaseModel):
    target_id: str
    direction: Literal["like", "pass"]


class MessageRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


# ============ Auth Routes ============
@api_router.post("/auth/register")
async def register(payload: RegisterRequest, response: Response):
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    now = datetime.now(timezone.utc)
    doc = {
        "email": email,
        "password_hash": hash_password(payload.password),
        "role": payload.role,
        "display_name": payload.display_name.strip(),
        "tagline": "",
        "description": "",
        "industry": "",
        "location": "",
        "website": "",
        "logo_path": None,
        "profile_complete": False,
        "created_at": now,
    }
    if payload.role == "business":
        doc.update({"company_size": "", "stage": "", "funding_needed": "", "revenue": "",
                    "looking_for": []})
    else:
        doc.update({"firm_type": "", "ticket_size": "", "focus_industries": [],
                    "portfolio_count": 0})
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)
    token = create_access_token(user_id, email)
    set_auth_cookie(response, token)
    doc["_id"] = result.inserted_id
    return serialize_user(doc)


@api_router.post("/auth/login")
async def login(payload: LoginRequest, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]), email)
    set_auth_cookie(response, token)
    return serialize_user(user)


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ============ Profile Routes ============
@api_router.put("/profile")
async def update_profile(payload: ProfileUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if updates:
        # Auto-mark profile as complete if key fields are filled
        current = await db.users.find_one({"_id": ObjectId(user["id"])})
        merged = {**current, **updates}
        core_ok = bool(merged.get("display_name") and merged.get("industry") and merged.get("description"))
        updates["profile_complete"] = core_ok
        await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": updates})
    updated = await db.users.find_one({"_id": ObjectId(user["id"])})
    return serialize_user(updated)


@api_router.get("/profile/{user_id}")
async def get_profile(user_id: str, _: dict = Depends(get_current_user)):
    try:
        doc = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_user(doc)


# ============ File Upload ============
@api_router.post("/upload")
async def upload(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    content_type = file.content_type or "application/octet-stream"
    if content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only image uploads allowed")
    ext = (file.filename.split(".")[-1] if file.filename and "." in file.filename else "bin").lower()
    path = f"{APP_NAME}/uploads/{user['id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    result = put_object(path, data, content_type)
    await db.files.insert_one({
        "storage_path": result["path"],
        "owner_id": user["id"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"path": result["path"]}


@api_router.get("/files/{path:path}")
async def download(path: str):
    # Public read for simplicity in MVP (logos are meant to be seen)
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    data, ct = get_object(path)
    return Response(content=data, media_type=record.get("content_type", ct))


# ============ Discovery / Swipe / Match ============
@api_router.get("/discover")
async def discover(user: dict = Depends(get_current_user)):
    # Business sees investors; Investor sees businesses
    target_role = "investor" if user["role"] == "business" else "business"
    # Get IDs the user has already swiped on
    swiped = await db.swipes.find({"swiper_id": user["id"]}).to_list(10000)
    swiped_ids = {ObjectId(s["target_id"]) for s in swiped}
    query = {"role": target_role, "_id": {"$nin": list(swiped_ids)}, "profile_complete": True}
    cursor = db.users.find(query).limit(30)
    results = []
    async for doc in cursor:
        results.append(serialize_user(doc))
    return results


@api_router.post("/swipe")
async def swipe(payload: SwipeRequest, user: dict = Depends(get_current_user)):
    if payload.target_id == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot swipe on yourself")
    try:
        target = await db.users.find_one({"_id": ObjectId(payload.target_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Target not found")
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    now = datetime.now(timezone.utc)
    await db.swipes.update_one(
        {"swiper_id": user["id"], "target_id": payload.target_id},
        {"$set": {"direction": payload.direction, "created_at": now.isoformat()}},
        upsert=True,
    )

    matched = False
    match_id = None
    if payload.direction == "like":
        reciprocal = await db.swipes.find_one({
            "swiper_id": payload.target_id,
            "target_id": user["id"],
            "direction": "like",
        })
        if reciprocal:
            # Create match (idempotent)
            u1, u2 = sorted([user["id"], payload.target_id])
            existing = await db.matches.find_one({"user1_id": u1, "user2_id": u2})
            if existing:
                match_id = str(existing["_id"])
            else:
                res = await db.matches.insert_one({
                    "user1_id": u1,
                    "user2_id": u2,
                    "created_at": now.isoformat(),
                })
                match_id = str(res.inserted_id)
            matched = True

    return {"matched": matched, "match_id": match_id,
            "target": serialize_user(target) if matched else None}


@api_router.get("/matches")
async def list_matches(user: dict = Depends(get_current_user)):
    cursor = db.matches.find({"$or": [{"user1_id": user["id"]}, {"user2_id": user["id"]}]}).sort("created_at", -1)
    matches = []
    async for m in cursor:
        other_id = m["user2_id"] if m["user1_id"] == user["id"] else m["user1_id"]
        try:
            other = await db.users.find_one({"_id": ObjectId(other_id)})
        except Exception:
            other = None
        if not other:
            continue
        # Get last message for preview
        last_msg = await db.messages.find_one({"match_id": str(m["_id"])}, sort=[("created_at", -1)])
        matches.append({
            "match_id": str(m["_id"]),
            "created_at": m["created_at"],
            "other_user": serialize_user(other),
            "last_message": last_msg["text"] if last_msg else None,
            "last_message_at": last_msg["created_at"] if last_msg else None,
        })
    return matches


# ============ Messages ============
async def _verify_match_access(match_id: str, user_id: str):
    try:
        m = await db.matches.find_one({"_id": ObjectId(match_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Match not found")
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")
    if user_id not in (m["user1_id"], m["user2_id"]):
        raise HTTPException(status_code=403, detail="Not a participant")
    return m


@api_router.get("/matches/{match_id}/messages")
async def get_messages(match_id: str, user: dict = Depends(get_current_user)):
    await _verify_match_access(match_id, user["id"])
    cursor = db.messages.find({"match_id": match_id}).sort("created_at", 1)
    msgs = []
    async for msg in cursor:
        msgs.append({
            "id": str(msg["_id"]),
            "match_id": msg["match_id"],
            "sender_id": msg["sender_id"],
            "text": msg["text"],
            "created_at": msg["created_at"],
        })
    return msgs


@api_router.post("/matches/{match_id}/messages")
async def send_message(match_id: str, payload: MessageRequest, user: dict = Depends(get_current_user)):
    await _verify_match_access(match_id, user["id"])
    now_iso = datetime.now(timezone.utc).isoformat()
    res = await db.messages.insert_one({
        "match_id": match_id,
        "sender_id": user["id"],
        "text": payload.text.strip(),
        "created_at": now_iso,
    })
    return {
        "id": str(res.inserted_id),
        "match_id": match_id,
        "sender_id": user["id"],
        "text": payload.text.strip(),
        "created_at": now_iso,
    }


# ============ Seed ============
SEED_BUSINESSES = [
    {"display_name": "Nova Logistics", "industry": "Logistics", "location": "Berlin, DE",
     "tagline": "Next-day cross-border delivery for SMBs", "stage": "Series A",
     "company_size": "50-100", "funding_needed": "$5M", "revenue": "$8M ARR",
     "description": "AI-routed European logistics network serving 400+ D2C brands with sub-24hr fulfilment.",
     "looking_for": ["Growth capital", "Warehouse partners"]},
    {"display_name": "Loomcraft Textiles", "industry": "Manufacturing", "location": "Chennai, IN",
     "tagline": "Sustainable textile mill, 40 years in the making", "stage": "Growth",
     "company_size": "200-500", "funding_needed": "$12M", "revenue": "$22M ARR",
     "description": "Vertically integrated organic cotton mill exporting to 18 countries. Seeking capex funding for solar loom expansion.",
     "looking_for": ["Debt financing", "Distribution partners"]},
    {"display_name": "Kinetic Robotics", "industry": "Robotics", "location": "Boston, US",
     "tagline": "Warehouse automation that pays for itself in 9 months", "stage": "Seed",
     "company_size": "10-25", "funding_needed": "$3M", "revenue": "$400K ARR",
     "description": "Autonomous mobile robots for mid-market 3PLs. Piloting with 6 warehouses in North America.",
     "looking_for": ["Seed capital", "Pilot customers"]},
    {"display_name": "Verdant Farms", "industry": "AgriTech", "location": "Nairobi, KE",
     "tagline": "Precision agriculture for smallholder farmers", "stage": "Series B",
     "company_size": "100-200", "funding_needed": "$15M", "revenue": "$18M ARR",
     "description": "Satellite-driven crop insurance and inputs marketplace serving 250K farmers across East Africa.",
     "looking_for": ["Impact capital", "Insurance partners"]},
    {"display_name": "Solstice Coffee Co.", "industry": "Consumer Goods", "location": "Portland, US",
     "tagline": "Farm-direct specialty coffee, cold-brewed daily", "stage": "Seed",
     "company_size": "10-25", "funding_needed": "$1.5M", "revenue": "$2.1M ARR",
     "description": "DTC specialty coffee brand growing 12% MoM. Building a nationwide subscription and wholesale channel.",
     "looking_for": ["Growth capital", "Retail distribution"]},
    {"display_name": "Aegis Cyber", "industry": "Cybersecurity", "location": "Tel Aviv, IL",
     "tagline": "Zero-trust security for regulated enterprises", "stage": "Series A",
     "company_size": "25-50", "funding_needed": "$8M", "revenue": "$4M ARR",
     "description": "Compliance-first SASE platform used by 40 mid-market banks and healthcare networks.",
     "looking_for": ["Series A extension", "Channel partners"]},
    {"display_name": "Marina Biotech", "industry": "Biotech", "location": "San Diego, US",
     "tagline": "Ocean-derived enzymes for industrial cleaning", "stage": "Seed",
     "company_size": "5-10", "funding_needed": "$4M", "revenue": "Pre-revenue",
     "description": "Patented marine enzyme platform replacing harsh industrial chemicals. FDA GRAS pending.",
     "looking_for": ["Seed capital", "Strategic industrial partners"]},
    {"display_name": "Trailhead Outdoor", "industry": "Retail", "location": "Denver, US",
     "tagline": "Membership-driven outdoor gear rental", "stage": "Growth",
     "company_size": "50-100", "funding_needed": "$6M", "revenue": "$11M ARR",
     "description": "32-location outdoor gear rental chain with a $79/mo unlimited membership. 18K active members.",
     "looking_for": ["Growth equity", "Franchise partners"]},
]

SEED_INVESTORS = [
    {"display_name": "Northlight Ventures", "industry": "Venture Capital", "location": "London, UK",
     "tagline": "Series A/B partner for European B2B SaaS", "firm_type": "Venture Capital",
     "ticket_size": "$3M - $12M", "focus_industries": ["SaaS", "Fintech", "AI"], "portfolio_count": 42,
     "description": "$450M fund II. We lead Series A rounds in European B2B SaaS. 18 unicorns in portfolio."},
    {"display_name": "Meridian Capital Partners", "industry": "Private Equity", "location": "New York, US",
     "tagline": "Buy-and-build in industrial services", "firm_type": "Private Equity",
     "ticket_size": "$25M - $150M", "focus_industries": ["Manufacturing", "Logistics", "Industrials"],
     "portfolio_count": 18,
     "description": "$1.2B middle-market PE fund. Operational value creation for founder-led industrial businesses."},
    {"display_name": "Baobab Impact Fund", "industry": "Impact Investing", "location": "Nairobi, KE",
     "tagline": "Patient capital for African founders", "firm_type": "Impact Fund",
     "ticket_size": "$500K - $5M", "focus_industries": ["AgriTech", "Fintech", "HealthTech"],
     "portfolio_count": 27,
     "description": "$120M pan-African fund backing revenue-stage companies with measurable impact and unit economics."},
    {"display_name": "Ravenwood Angels", "industry": "Angel Syndicate", "location": "Austin, US",
     "tagline": "180 operators writing $50K-$500K checks", "firm_type": "Angel Syndicate",
     "ticket_size": "$50K - $500K", "focus_industries": ["Consumer", "Marketplace", "AI"],
     "portfolio_count": 96,
     "description": "Curated syndicate of 180 unicorn operators. Fast decisions, founder-led diligence, deep network."},
    {"display_name": "Silvergate Growth", "industry": "Growth Equity", "location": "San Francisco, US",
     "tagline": "Non-dilutive growth capital for $5M+ ARR SaaS", "firm_type": "Growth Debt",
     "ticket_size": "$5M - $40M", "focus_industries": ["SaaS", "Fintech", "Enterprise"],
     "portfolio_count": 63,
     "description": "Revenue-based financing and MRR lines for capital-efficient SaaS between Series A and B."},
    {"display_name": "Kairos Family Office", "industry": "Family Office", "location": "Zurich, CH",
     "tagline": "Multi-generational capital, hands-off partners", "firm_type": "Family Office",
     "ticket_size": "$2M - $20M", "focus_industries": ["Consumer Goods", "Real Estate", "Health"],
     "portfolio_count": 34,
     "description": "European family office deploying long-duration capital into founder-led, cash-flowing businesses."},
    {"display_name": "Halcyon Deep Tech", "industry": "Deep Tech VC", "location": "Boston, US",
     "tagline": "Series Seed & A for hard tech", "firm_type": "Venture Capital",
     "ticket_size": "$1M - $8M", "focus_industries": ["Robotics", "Biotech", "Climate"],
     "portfolio_count": 29,
     "description": "$280M deep-tech fund. Ex-MIT/DARPA GPs backing science-first founders from lab to market."},
    {"display_name": "Coastal Trade Finance", "industry": "Trade Finance", "location": "Singapore, SG",
     "tagline": "Purchase-order & inventory financing", "firm_type": "Stock Funder",
     "ticket_size": "$250K - $10M", "focus_industries": ["Manufacturing", "Retail", "Import/Export"],
     "portfolio_count": 210,
     "description": "Asia-Pacific trade finance house. Fund inventory, purchase orders, and receivables at competitive rates."},
]

LOGO_POOL = [
    "https://images.unsplash.com/photo-1758626101945-ed0068aad9f9?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.unsplash.com/photo-1758626104169-6835c0bd03e3?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.unsplash.com/photo-1758626099012-2904337e9c60?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.unsplash.com/photo-1614786269829-d24616faf56d?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.unsplash.com/photo-1718209881007-c0ecdfc00f9d?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.unsplash.com/photo-1617761141732-d481912af1a9?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
]


async def seed_data():
    # Only seed if there are no non-admin users
    count = await db.users.count_documents({"role": {"$in": ["business", "investor"]}})
    if count > 0:
        logger.info(f"Seed skipped: {count} users already exist")
        return

    now = datetime.now(timezone.utc)
    all_seeds = []
    for i, biz in enumerate(SEED_BUSINESSES):
        all_seeds.append({
            "email": f"biz{i+1}@bizmatch.com",
            "password_hash": hash_password("password123"),
            "role": "business",
            **biz,
            "logo_url": LOGO_POOL[i % len(LOGO_POOL)],
            "logo_path": None,
            "website": "",
            "profile_complete": True,
            "created_at": now,
        })
    for i, inv in enumerate(SEED_INVESTORS):
        all_seeds.append({
            "email": f"inv{i+1}@bizmatch.com",
            "password_hash": hash_password("password123"),
            "role": "investor",
            **inv,
            "logo_url": LOGO_POOL[(i + 3) % len(LOGO_POOL)],
            "logo_path": None,
            "website": "",
            "profile_complete": True,
            "created_at": now,
        })
    if all_seeds:
        await db.users.insert_many(all_seeds)
        logger.info(f"Seeded {len(all_seeds)} users")


async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@bizmatch.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    now = datetime.now(timezone.utc)
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "role": "business",
            "display_name": "Admin Demo Co.",
            "tagline": "Demo business for testing",
            "industry": "SaaS",
            "location": "Remote",
            "description": "Admin demo account.",
            "company_size": "10-25",
            "stage": "Seed",
            "funding_needed": "$2M",
            "revenue": "$500K ARR",
            "looking_for": ["Seed capital"],
            "logo_url": LOGO_POOL[0],
            "logo_path": None,
            "website": "",
            "profile_complete": True,
            "created_at": now,
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.swipes.create_index([("swiper_id", 1), ("target_id", 1)], unique=True)
    await db.matches.create_index([("user1_id", 1), ("user2_id", 1)], unique=True)
    await db.messages.create_index([("match_id", 1), ("created_at", 1)])
    init_storage()
    await seed_admin()
    await seed_data()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


@api_router.get("/")
async def root():
    return {"message": "BizMatch API", "status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
