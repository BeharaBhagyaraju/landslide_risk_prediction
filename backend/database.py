import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "data.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Tables for location-based assessments
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assessments (
        id TEXT PRIMARY KEY,
        date TEXT,
        location_name TEXT,
        lat REAL,
        lng REAL,
        risk_level TEXT,
        confidence REAL,
        details TEXT,
        created_at TEXT
    )
    """)
    # Migration: add created_at column to existing databases
    try:
        cursor.execute("ALTER TABLE assessments ADD COLUMN created_at TEXT")
    except Exception:
        pass  # Column already exists

    # Table for users (auth)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # Table for OTP verifications (email confirmation)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS otp_verifications (
        email TEXT PRIMARY KEY,
        otp TEXT NOT NULL,
        expires_at TEXT NOT NULL
    )
    """)

    # Table for historical events (CSV uploads)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS historical_events (
        id TEXT PRIMARY KEY,
        name TEXT,
        year TEXT,
        lat REAL,
        lng REAL,
        severity TEXT,
        description TEXT
    )
    """)

    conn.commit()
    conn.close()

# ── Users / Auth ──────────────────────────────────────────────────────────────

def create_user(email: str, password_hash: str):
    conn = get_db()
    cursor = conn.cursor()
    from datetime import timezone, timedelta
    ist_tz = timezone(timedelta(hours=5, minutes=30))
    created_at = datetime.now(ist_tz).isoformat()
    cursor.execute(
        "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
        (email, password_hash, created_at)
    )
    conn.commit()
    conn.close()

def get_user_by_email(email: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "email": row["email"],
        "password_hash": row["password_hash"],
        "created_at": row["created_at"],
    }

# ── OTP Verifications ─────────────────────────────────────────────────────────

def save_otp(email: str, otp: str, expires_at: str):
    """Insert or replace an OTP for the given email."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO otp_verifications (email, otp, expires_at) VALUES (?, ?, ?)",
        (email, otp, expires_at)
    )
    conn.commit()
    conn.close()

def get_otp(email: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM otp_verifications WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {"email": row["email"], "otp": row["otp"], "expires_at": row["expires_at"]}

def delete_otp(email: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM otp_verifications WHERE email = ?", (email,))
    conn.commit()
    conn.close()



def save_assessment(assessment_id, location_name, lat, lng, risk_level, confidence, details):
    conn = get_db()
    cursor = conn.cursor()
    # Explicitly calculate IST (UTC + 5:30)
    from datetime import timezone, timedelta
    ist_tz = timezone(timedelta(hours=5, minutes=30))
    ist_time = datetime.now(ist_tz)
    date_str = ist_time.strftime("%d %b %Y, %I:%M %p")  # e.g. 25 Feb 2026, 11:30 PM
    created_at_iso = ist_time.isoformat()                # e.g. 2026-02-25T23:30:00+05:30
    
    cursor.execute(
        "INSERT INTO assessments (id, date, location_name, lat, lng, risk_level, confidence, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (assessment_id, date_str, location_name, lat, lng, risk_level, confidence, json.dumps(details), created_at_iso)
    )
    conn.commit()
    conn.close()

def get_assessments():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM assessments ORDER BY created_at DESC, date DESC")
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {
            "id": row["id"],
            "date": row["date"],
            "location": row["location_name"],
            "coordinates": f"{row['lat']:.4f}, {row['lng']:.4f}",
            "riskLevel": row["risk_level"],
            "confidence": row["confidence"],
            "details": json.loads(row["details"]),
            "createdAt": row["created_at"] or ""
        } for row in rows
    ]

def delete_assessment(assessment_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM assessments WHERE id = ?", (assessment_id,))
    conn.commit()
    conn.close()

def get_assessment_by_id(assessment_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM assessments WHERE id = ?", (assessment_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "date": row["date"],
        "location": row["location_name"],
        "coordinates": f"{row['lat']:.4f}, {row['lng']:.4f}",
        "lat": row["lat"],
        "lng": row["lng"],
        "riskLevel": row["risk_level"],
        "confidence": row["confidence"],
        "details": json.loads(row["details"]),
        "createdAt": row["created_at"] or ""
    }

# ── Historical Events ────────────────────────────────────────────────────────

def save_historical_events(events):
    conn = get_db()
    cursor = conn.cursor()
    
    for event in events:
        cursor.execute(
            "INSERT OR REPLACE INTO historical_events (id, name, year, lat, lng, severity, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (event["id"], event["name"], str(event["year"]), event["lat"], event["lng"], event["severity"], event["description"])
        )
    
    conn.commit()
    conn.close()

def get_historical_events():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM historical_events")
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "year": row["year"],
            "lat": row["lat"],
            "lng": row["lng"],
            "severity": row["severity"],
            "description": row["description"],
            "source": "Local Database"
        } for row in rows
    ]
