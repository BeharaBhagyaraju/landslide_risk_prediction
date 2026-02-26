"""
LandslideWatch — FastAPI Backend
---------------------------------
Endpoints:
  POST /analyze-image   → Runs Predefined LRASPP on uploaded satellite image
  GET  /predict         → Returns risk prediction for given lat/lng coordinates

Run with:
    uvicorn main:app --reload --port 8000
"""

import io
import os

import numpy as np
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
try:
    from model import LandslideModel
    from database import init_db, save_assessment, get_assessments, save_historical_events, get_historical_events, delete_assessment
except ImportError:
    from backend.model import LandslideModel
    from backend.database import init_db, save_assessment, get_assessments, save_historical_events, get_historical_events, delete_assessment
from pydantic import BaseModel
from typing import List, Optional

# ── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(title="LandslideWatch API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database
@app.on_event("startup")
async def startup_event():
    init_db()
    print("🗄️ Database initialized and ready")

# ── Load LandslideModel (Predefined LRASPP) ──────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "landslide_model.pth")

if os.path.exists(MODEL_PATH):
    try:
        # Re-initialize the model structure
        model = LandslideModel(n_channels=3, n_classes=1)
        # Load the state_dict
        state_dict = torch.load(MODEL_PATH, map_location="cpu")
        model.load_state_dict(state_dict)
        model.eval()
        print(f"✅ Predefined LandslideModel loaded successfully from {MODEL_PATH}")
    except Exception as e:
        print(f"⚠️  Could not load model: {e}")
        import traceback
        traceback.print_exc()
        model = None
else:
    print(f"⚠️  Model file not found at {MODEL_PATH} — using mock predictions")


def _mock_prediction(landslide_pct: float) -> dict:
    """Return a structured mock result when the model is unavailable."""
    risk = "High" if landslide_pct > 20 else ("Medium" if landslide_pct > 5 else "Low")
    return {
        "riskLevel": risk,
        "confidence": round(50 + landslide_pct, 1),
        "landslideAreaPercent": round(landslide_pct, 2),
        "featuresDetected": [
            f"Landslide area: {landslide_pct:.1f}% of image (mock)",
            "Model file not loaded — place landslide_model.pth in /backend",
            f"Slope instability {'detected' if risk == 'High' else 'not detected'}",
        ],
        "recommendation": (
            "Immediate geotechnical inspection required."
            if risk == "High"
            else "No immediate action required. Continue monitoring."
        ),
        "source": "mock",
    }


# ── /analyze-image ────────────────────────────────────────────────────────────
@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """
    PURE PIXEL-BASED ANALYSIS: Performs segmentation on the uploaded image ONLY.
    This endpoint ignores GPS coordinates, moisture, and all other metadata.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    img_bytes = await file.read()

    # Pre-process: resize to 224x224 (best for MobileNetV3 backbone)
    try:
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB").resize((224, 224))
        img_array = np.array(img).astype(np.float32) / 255.0
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    if model is None:
        import random
        return _mock_prediction(round(random.uniform(2, 45), 2))

    try:
        # PURE PIXEL INFERENCE: Using 3-channel RGB image tensor
        t = torch.tensor(img_array).permute(2, 0, 1).float().unsqueeze(0)
        
        with torch.no_grad():
            outputs = model(t)
            probs = torch.sigmoid(outputs)
            probs_np = probs.squeeze().cpu().numpy()

        max_prob = float(probs_np.max())
        mean_prob = float(probs_np.mean())
        
        # LOGGING FOR DIAGNOSIS (Pixel-level confidence)
        print(f"DEBUG [Pixel Analysis]: Max Prob: {max_prob:.4f}, Area Signal: {mean_prob:.4f}")

        # Detection logic (based solely on image segmentation mask)
        threshold = 0.5
        mask = (probs_np > threshold)
        landslide_pct = float(mask.mean() * 100)
        confidence = round(max_prob * 100, 1)

        # IMAGE VALIDATION: If peak visual signal is too low, reject
        if max_prob < 0.2:
            print(f"REJECTED: Visual signal too weak ({max_prob:.4f}). Ignoring metadata fallback.")
            return {
                "riskLevel": "Low",
                "confidence": confidence,
                "landslideAreaPercent": 0.0,
                "featuresDetected": ["No visual landslide patterns in this image section"],
                "recommendation": "no landslides found upload correct image",
                "status": "warning",
                "source": "api"
            }

        # Visual Risk Mapping
        risk = "Low"
        if landslide_pct > 15 and max_prob > 0.7:
            risk = "High"
        elif landslide_pct > 0.5 or max_prob > 0.4:
            risk = "Medium"

        print(f"ACCEPTED: Pixel analysis detected {risk} Risk. Area: {landslide_pct:.2f}%")

        return {
            "riskLevel": risk,
            "confidence": confidence,
            "landslideAreaPercent": round(landslide_pct, 2),
            "featuresDetected": [
                f"Visual confidence: {confidence}%",
                f"Sensed landslide area: {landslide_pct:.1f}%",
                "Pure Visual Analysis (Coordinate-independent)",
            ],
            "recommendation": (
                "High density of landslide pixels detected. Immediate visual inspection required."
                if risk == "High"
                else ("Visual features consistent with terrain instability." if risk == "Medium" else "No significant landslide patterns detected in this image section.")
            ),
            "source": "api",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")


# ── /predict ──────────────────────────────────────────────────────────────────
@app.get("/predict")
def predict(lat: float, lng: float):
    """
    Return a landslide risk prediction for given coordinates.
    """
    import math, random
    # Simple proxy logic
    base_risk = abs(math.sin(lat * 0.5) * math.cos(lng * 0.3))
    risk_score = round(min(base_risk + random.uniform(-0.05, 0.05), 1.0), 3)
    risk_level = "High" if risk_score > 0.65 else ("Medium" if risk_score > 0.35 else "Low")

    return {
        "riskLevel": risk_level,
        "riskScore": risk_score,
        "lat": lat,
        "lng": lng,
    }

# ── Data Persistence Endpoints ───────────────────────────────────────────────

class AssessmentSaveRequest(BaseModel):
    id: str
    location_name: str
    lat: float
    lng: float
    risk_level: str
    confidence: float
    details: dict

@app.post("/assessments")
async def api_save_assessment(req: AssessmentSaveRequest):
    try:
        save_assessment(req.id, req.location_name, req.lat, req.lng, req.risk_level, req.confidence, req.details)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/assessments")
async def api_get_assessments():
    return get_assessments()

@app.delete("/assessments/{assessment_id}")
async def api_delete_assessment(assessment_id: str):
    try:
        delete_assessment(assessment_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class HistoricalEvent(BaseModel):
    id: str
    name: str
    year: str
    lat: float
    lng: float
    severity: str
    description: str

@app.post("/historical-events")
async def api_save_historical_events(events: List[HistoricalEvent]):
    try:
        save_historical_events([event.dict() for event in events])
        return {"status": "success", "count": len(events)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/historical-events")
async def api_get_historical_events():
    return get_historical_events()


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model_version": "1.1.0 (LRASPP)", "model_loaded": model is not None}
