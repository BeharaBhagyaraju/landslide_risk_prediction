"""
LandslideWatch — FastAPI Backend
---------------------------------
Endpoints:
  POST /analyze-image   → Runs Tiny Attention U-Net on uploaded satellite image
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

# ── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(title="LandslideWatch API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Allow the Vite dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load Tiny Attention U-Net model ──────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "tiny_attention_unet.pth")

model = None
if os.path.exists(MODEL_PATH):
    try:
        model = torch.load(MODEL_PATH, map_location="cpu")
        model.eval()
        print(f"✅ Model loaded from {MODEL_PATH}")
    except Exception as e:
        print(f"⚠️  Could not load model: {e}")
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
            "Model file not loaded — place tiny_attention_unet.pth in /backend",
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
    Accept a satellite/drone image and run Tiny Attention U-Net segmentation.
    Returns risk level, confidence, landslide area percentage and recommendations.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    img_bytes = await file.read()

    # Pre-process: resize to 128×128, normalise to [0, 1]
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB").resize((128, 128))
    img_array = np.array(img) / 255.0
    tensor = torch.tensor(img_array).permute(2, 0, 1).float().unsqueeze(0)  # [1, 3, 128, 128]

    if model is None:
        # No model loaded — return a demo response
        import random
        return _mock_prediction(round(random.uniform(2, 45), 2))

    try:
        with torch.no_grad():
            output = model(tensor)                          # [1, 1, H, W]
            probs  = output.sigmoid()
            mask   = (probs > 0.5).squeeze().numpy()       # binary mask

        landslide_pct = float(mask.mean() * 100)
        confidence    = round(float(probs.max()) * 100, 1)
        risk          = "High" if landslide_pct > 20 else ("Medium" if landslide_pct > 5 else "Low")

        return {
            "riskLevel": risk,
            "confidence": confidence,
            "landslideAreaPercent": round(landslide_pct, 2),
            "featuresDetected": [
                f"Landslide area: {landslide_pct:.1f}% of image",
                "Tiny Attention U-Net segmentation complete",
                f"Slope instability {'detected' if risk != 'Low' else 'not detected'}",
            ],
            "recommendation": (
                "Immediate geotechnical inspection required."
                if risk == "High"
                else "No immediate action required. Continue monitoring."
            ),
            "source": "api",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {str(e)}")


# ── /predict ──────────────────────────────────────────────────────────────────
@app.get("/predict")
def predict(lat: float, lng: float):
    """
    Return a landslide risk prediction for the given coordinates.
    Called by the frontend every 60 seconds for continuous monitoring.
    Replace the mock logic below with your actual geospatial model.
    """
    # TODO: Replace with real geospatial model inference
    import math, random
    # Simple demo: higher risk near steep terrain proxies
    base_risk = abs(math.sin(lat * 0.5) * math.cos(lng * 0.3))
    risk_score = round(min(base_risk + random.uniform(-0.05, 0.05), 1.0), 3)
    risk_level = "High" if risk_score > 0.65 else ("Medium" if risk_score > 0.35 else "Low")

    return {
        "riskLevel": risk_level,
        "riskScore": risk_score,
        "lat": lat,
        "lng": lng,
    }


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}
