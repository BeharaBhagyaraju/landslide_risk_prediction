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
        details TEXT
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

# ── Assessments ──────────────────────────────────────────────────────────────

def save_assessment(assessment_id, location_name, lat, lng, risk_level, confidence, details):
    conn = get_db()
    cursor = conn.cursor()
    # Explicitly calculate IST (UTC + 5:30)
    from datetime import timezone, timedelta
    ist_time = datetime.now(timezone(timedelta(hours=5, minutes=30)))
    date_str = ist_time.strftime("%d %b %Y, %I:%M %p") # e.g. 25 Feb 2026, 11:30 PM
    
    cursor.execute(
        "INSERT INTO assessments (id, date, location_name, lat, lng, risk_level, confidence, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (assessment_id, date_str, location_name, lat, lng, risk_level, confidence, json.dumps(details))
    )
    conn.commit()
    conn.close()

def get_assessments():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM assessments ORDER BY date DESC")
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
            "details": json.loads(row["details"])
        } for row in rows
    ]

def delete_assessment(assessment_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM assessments WHERE id = ?", (assessment_id,))
    conn.commit()
    conn.close()

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
