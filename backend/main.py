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
import base64
import h5py
from datetime import datetime, timezone, timedelta

import numpy as np
import torch
import torch.nn as nn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
try:
    from model import LandslideModel
    from database import init_db, save_assessment, get_assessments, get_assessment_by_id, save_historical_events, get_historical_events, delete_assessment, create_user, get_user_by_email, save_otp, get_otp, delete_otp
except ImportError:
    from backend.model import LandslideModel
    from backend.database import init_db, save_assessment, get_assessments, get_assessment_by_id, save_historical_events, get_historical_events, delete_assessment, create_user, get_user_by_email, save_otp, get_otp, delete_otp
from pydantic import BaseModel, EmailStr
from typing import List, Optional

# ── Auth helpers ──────────────────────────────────────────────────────────────
from jose import jwt, JWTError


SECRET_KEY = "landslidewatch-super-secret-key-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

import hashlib
import bcrypt as _bcrypt

def _pre_hash(password: str) -> bytes:
    """SHA-256 so any length password becomes 32 bytes — safe for bcrypt."""
    return hashlib.sha256(password.encode()).digest()

def hash_password(password: str) -> str:
    return _bcrypt.hashpw(_pre_hash(password), _bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(_pre_hash(plain), hashed.encode())

def create_access_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": email, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

# Keras Support
try:
    import tensorflow as tf
    from tensorflow.keras import layers, models
    HAVE_TF = True
except ImportError:
    HAVE_TF = False

# ── Tiny Attention U-Net Architecture (Fallback) ──────────────────────────
def AttentionBlock(x, gating, inter_shape):
    shape_x = tf.keras.backend.int_shape(x)
    shape_g = tf.keras.backend.int_shape(gating)
    phi_g = layers.Conv2D(inter_shape, (1, 1), padding='same')(gating)
    theta_x = layers.Conv2D(inter_shape, (2, 2), strides=(2, 2), padding='same')(x)
    add_xg = layers.add([phi_g, theta_x])
    relu_xg = layers.Activation('relu')(add_xg)
    psi = layers.Conv2D(1, (1, 1), padding='same')(relu_xg)
    sigmoid_xg = layers.Activation('sigmoid')(psi)
    upsample_psi = layers.UpSampling2D(size=(2, 2))(sigmoid_xg)
    y = layers.multiply([upsample_psi, x])
    result = layers.Conv2D(shape_x[3], (1, 1), padding='same')(y)
    result_bn = layers.BatchNormalization()(result)
    return result_bn

def create_tiny_unet(input_shape=(128, 128, 14)):
    inputs = layers.Input(input_shape)
    c1 = layers.Conv2D(16, (3, 3), activation='relu', padding='same')(inputs)
    p1 = layers.MaxPooling2D((2, 2))(c1)
    c2 = layers.Conv2D(32, (3, 3), activation='relu', padding='same')(p1)
    p2 = layers.MaxPooling2D((2, 2))(c2)
    b1 = layers.Conv2D(64, (3, 3), activation='relu', padding='same')(p2)
    g1 = layers.Conv2D(32, (1, 1), padding='same')(b1)
    a1 = AttentionBlock(c2, g1, 32)
    u1 = layers.UpSampling2D((2, 2))(b1)
    m1 = layers.concatenate([u1, a1])
    c3 = layers.Conv2D(32, (3, 3), activation='relu', padding='same')(m1)
    u2 = layers.UpSampling2D((2, 2))(c3)
    c4 = layers.Conv2D(16, (3, 3), activation='relu', padding='same')(u2)
    outputs = layers.Conv2D(1, (1, 1), activation='sigmoid')(c4)
    return models.Model(inputs, outputs)

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
    print("[SUCCESS] Database initialized and ready")

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
        print(f"[SUCCESS] Predefined LandslideModel loaded successfully from {MODEL_PATH}")
    except Exception as e:
        print(f"[WARNING] Could not load model: {e}")
        import traceback
        traceback.print_exc()
        model = None
else:
    print(f"⚠️  Model file not found at {MODEL_PATH} — using mock predictions")

# ── Global Keras Model State ────────────────────────────────────────────────
keras_model = None
KERAS_MODEL_PATH = os.path.join(os.path.dirname(__file__), "custom_model.h5")
CUSTOM_DATASET_PATH = os.path.join(os.path.dirname(__file__), "custom_dataset.h5")
PTH_MODEL_PATH = os.path.join(os.path.dirname(__file__), "tiny_attention_unet.pth")

# --- CUSTOM PYTORCH MODEL (TinyAttentionUNet) ---
# We'll define a simple PyTorch version of the architecture to support .pth files
class PyTorchTinyAttentionUNet(nn.Module):
    def __init__(self, n_channels=6, n_classes=1):
        super(PyTorchTinyAttentionUNet, self).__init__()
        # Note: The user's model expects 6 channels.
        # We'll define a slightly more descriptive structure, though it may still mismatch
        # if the user's architecture is significantly different.
        self.encoder = nn.Sequential(
            nn.Conv2d(n_channels, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2)
        )
        self.decoder = nn.Sequential(
            nn.Upsample(scale_factor=2),
            nn.Conv2d(16, n_classes, kernel_size=1),
            nn.Sigmoid()
        )
    def forward(self, x):
        return self.decoder(self.encoder(x))

def load_custom_pth_model():
    global model
    if os.path.exists(PTH_MODEL_PATH):
        try:
            # Try loading into our PyTorch version with 6 channels
            temp_model = PyTorchTinyAttentionUNet(n_channels=6, n_classes=1)
            checkpoint = torch.load(PTH_MODEL_PATH, map_location="cpu")
            
            # Handle dictionary wrapper
            if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
                state_dict = checkpoint['model_state_dict']
            else:
                state_dict = checkpoint
                
            # Try specific loading with strict=False to handle minor naming mismatches
            missing, unexpected = temp_model.load_state_dict(state_dict, strict=False)
            print(f"[INFO] .pth loading - Missing: {len(missing)}, Unexpected: {len(unexpected)}")
            
            # If we loaded something substantial, use it
            if len(unexpected) > 0 or len(missing) < 5:
                temp_model.eval()
                model = temp_model
                print(f"[SUCCESS] Custom PyTorch model (TinyAttentionUNet) loaded from {PTH_MODEL_PATH}")
                return True, "Success"
            else:
                return False, "Layer mismatch"
        except Exception as e:
            print(f"[INFO] Could not load {PTH_MODEL_PATH}: {e}")
            return False, str(e)
    return False, "File not found"

def load_keras_model():
    global keras_model
    if HAVE_TF and os.path.exists(KERAS_MODEL_PATH):
        try:
            # Try loading full model (architecture + weights)
            keras_model = tf.keras.models.load_model(KERAS_MODEL_PATH, compile=False)
            print(f"[SUCCESS] Custom Keras model loaded from {KERAS_MODEL_PATH}")
            return True, "Success"
        except Exception as e:
            err_msg = str(e)
            # Check for typical "weights only" error messages
            if "No model config found" in err_msg or "not found in the archive" in err_msg:
                print(f"[INFO] Weight-only file detected. Attempting to load into TinyAttentionUNet architecture...")
                try:
                    # Initialize our predefined architecture
                    keras_model = create_tiny_unet()
                    # Try loading weights into it
                    keras_model.load_weights(KERAS_MODEL_PATH)
                    print(f"[SUCCESS] Weights loaded into TinyAttentionUNet architecture successfully.")
                    return True, "Success"
                except Exception as load_err:
                    err_msg = (
                        f"This H5 file only contains weights, but they don't match the TinyAttentionUNet architecture. "
                        f"Error: {str(load_err)}"
                    )
            
            print(f"[WARNING] Error loading Keras model: {err_msg}")
            return False, err_msg
    return False, "Model file or TensorFlow missing"

# Try loading custom models on startup
load_keras_model()
load_custom_pth_model()


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


# ── /upload-model ─────────────────────────────────────────────────────────────
@app.post("/upload-model")
async def upload_model(file: UploadFile = File(...)):
    """
    Saves and loads a custom .h5 Keras model.
    """
    if not HAVE_TF:
        raise HTTPException(status_code=500, detail="TensorFlow is not installed on the server.")
        
    if not file.filename.endswith(".h5"):
        raise HTTPException(status_code=400, detail="Only .h5 files are supported.")

    try:
        content = await file.read()
        temp_path = os.path.join(os.path.dirname(__file__), "temp_upload.h5")
        with open(temp_path, "wb") as f:
            f.write(content)
        
        # Check if it's a dataset
        is_dataset = False
        try:
            with h5py.File(temp_path, "r") as f:
                if 'img' in f or any(len(f[k].shape) >= 3 for k in f.keys()):
                    is_dataset = True
        except: pass

        target_path = CUSTOM_DATASET_PATH if is_dataset else KERAS_MODEL_PATH
        if os.path.exists(target_path): os.remove(target_path)
        os.rename(temp_path, target_path)

        # If it's a dataset, try to extract an image preview
        if is_dataset:
            print(f"[INFO] Checking if H5 is a dataset...")
            try:
                with h5py.File(CUSTOM_DATASET_PATH, "r") as f:
                    dataset_names = list(f.keys())
                    preview_base64 = None
                    for name in dataset_names:
                        ds = f[name]
                        shape = ds.shape
                        print(f"[INFO] Dataset '{name}' shape: {shape}")
                        
                        # Case 1: Single image (H, W, C) e.g. (128, 128, 14)
                        if len(shape) == 3 and shape[2] >= 3:
                            sample = ds[:]  # Load the whole thing
                        # Case 2: Batched images (N, H, W, C) e.g. (100, 128, 128, 14)
                        elif len(shape) == 4 and shape[3] >= 3:
                            sample = ds[0]  # Take first sample
                        else:
                            continue

                        # Extract RGB bands
                        if sample.shape[-1] == 14:
                            # Sentinel-2 style: band index 3=Red, 2=Green, 1=Blue
                            rgb_preview = sample[:, :, [3, 2, 1]]
                        else:
                            rgb_preview = sample[:, :, :3]

                        # Normalize to 0-255
                        rgb_min, rgb_max = rgb_preview.min(), rgb_preview.max()
                        if rgb_max > rgb_min:
                            rgb_preview = (rgb_preview - rgb_min) / (rgb_max - rgb_min)
                        rgb_preview = (rgb_preview * 255).astype(np.uint8)

                        pil_img = Image.fromarray(rgb_preview)
                        buffered = io.BytesIO()
                        pil_img.save(buffered, format="PNG")
                        preview_base64 = base64.b64encode(buffered.getvalue()).decode()
                        print(f"[SUCCESS] H5 preview extracted from '{name}' shape={shape}")
                        break
                    if preview_base64:
                        return {
                            "status": "success", 
                            "message": "H5 Dataset uploaded. Image extracted.",
                            "isDataset": True,
                            "preview": f"data:image/png;base64,{preview_base64}"
                        }
            except Exception as e:
                print(f"Extraction failed: {e}")
            
            # Always return a valid response, even if preview extraction failed
            return {
                "status": "success",
                "message": "H5 Dataset uploaded. Could not extract a preview image.",
                "isDataset": True,
                "preview": None
            }
        else:
            # If it's a model, try to load it
            success, err_detail = load_keras_model()
            if not success:
                raise Exception(f"Keras load error: {err_detail}")
            return {"status": "success", "message": "Model uploaded and loaded successfully.", "isModel": True}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process H5 file: {str(e)}")


# ── /analyze-image ────────────────────────────────────────────────────────────
@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """
    PURE PIXEL-BASED ANALYSIS: Performs segmentation on the uploaded image ONLY.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    img_bytes = await file.read()

    try:
        # Resize to 128x128 to match common satellite dataset shapes for UNet
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB").resize((128, 128))
        img_array = np.array(img).astype(np.float32) / 255.0
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    if model is None and keras_model is None:
        import random
        return _mock_prediction(round(random.uniform(2, 45), 2))

    # --- Keras Inference Path ---
    if keras_model is not None:
        try:
            # Check model input shape
            input_shape = keras_model.input_shape
            expected_channels = input_shape[-1]
            
            x = np.expand_dims(img_array, axis=0)
            
            # If model expects 14 channels (Sentinel-2 style), pad with zeros
            if expected_channels == 14:
                # Create a 14-channel blank canvas
                x_full = np.zeros((1, 128, 128, 14), dtype=np.float32)
                # Map RGB to standard Sentinel-2 preview indices (3, 2, 1) or simply the first 3
                x_full[0, :, :, [3, 2, 1]] = img_array
                x = x_full
            elif expected_channels != 3:
                # Dynamic padding for other counts
                padding = np.zeros((1, 128, 128, expected_channels - 3), dtype=np.float32)
                x = np.concatenate([x, padding], axis=-1)

            preds = keras_model.predict(x)
            if isinstance(preds, list): preds = preds[0]
            if np.max(preds) > 1.0 or np.min(preds) < 0.0:
                preds = 1 / (1 + np.exp(-preds))
            
            preds_flat = preds.flatten()
            max_score = float(np.max(preds_flat))
            mask_bool = (preds_flat > 0.5)
            landslide_pct = round(float(mask_bool.mean()) * 100, 2)
            confidence = round(max_score * 100, 1)
            
            risk = "Low"
            if landslide_pct > 15 or (max_score > 0.8 and landslide_pct > 2): risk = "High"
            elif landslide_pct > 0.5 or max_score > 0.4: risk = "Medium"
            
            # Mask generation
            mask_img_array = (preds[0] * 255).astype(np.uint8)
            if len(mask_img_array.shape) > 2: mask_img_array = mask_img_array.squeeze(-1)
            heatmap = np.zeros((*mask_img_array.shape, 4), dtype=np.uint8)
            heatmap[mask_img_array > 127] = [230, 153, 214, 180] # Pink overlay
            
            mask_pil = Image.fromarray(heatmap, mode="RGBA")
            mask_buf = io.BytesIO()
            mask_pil.save(mask_buf, format="PNG")
            mask_base64 = base64.b64encode(mask_buf.getvalue()).decode()

            return {
                "riskLevel": risk,
                "confidence": confidence,
                "landslideAreaPercent": landslide_pct,
                "maskBase64": f"data:image/png;base64,{mask_base64}",
                "featuresDetected": [f"Keras Inference: {confidence}%", f"Area: {landslide_pct}%", "Using custom h5"],
                "recommendation": "Analysis complete using custom model.",
                "source": "keras_api",
            }
        except Exception as e:
            print(f"[ERROR] Keras failed: {e}")

    # --- Torch Inference Path ---
    try:
        # Resize to 128x128 for consistency with custom models
        img_pt = Image.open(io.BytesIO(img_bytes)).convert("RGB").resize((128, 128))
        img_array_pt = np.array(img_pt).astype(np.float32) / 255.0
        
        # Check if we are using a custom model vs the predefined one
        is_custom_pt = not isinstance(model, LandslideModel)
        
        t = torch.tensor(img_array_pt).permute(2, 0, 1).float().unsqueeze(0)
        
        if is_custom_pt:
            # Custom 6-channel model handling
            if t.shape[1] < 6:
                padding = torch.zeros((1, 6 - t.shape[1], 128, 128))
                t = torch.cat([t, padding], dim=1)
            elif t.shape[1] > 6:
                t = t[:, :6, :, :]
        
        with torch.no_grad():
            outputs = model(t)
            probs = torch.sigmoid(outputs)
            probs_np = probs.squeeze().cpu().numpy()

        max_prob = float(probs_np.max())
        mask = (probs_np > 0.5)
        landslide_pct = float(mask.mean() * 100)
        confidence = round(max_prob * 100, 1)

        # Torch Mask generation
        mask_overlay = np.zeros((*probs_np.shape, 4), dtype=np.uint8)
        mask_overlay[probs_np > 0.5] = [230, 153, 214, 180]
        mask_pil = Image.fromarray(mask_overlay, mode="RGBA")
        mask_buf = io.BytesIO()
        mask_pil.save(mask_buf, format="PNG")
        mask_base64 = base64.b64encode(mask_buf.getvalue()).decode()

        risk = "Low"
        if landslide_pct > 15 and max_prob > 0.7: risk = "High"
        elif landslide_pct > 0.5 or max_prob > 0.4: risk = "Medium"

        return {
            "riskLevel": risk,
            "confidence": confidence,
            "landslideAreaPercent": round(landslide_pct, 2),
            "maskBase64": f"data:image/png;base64,{mask_base64}",
            "featuresDetected": [f"Visual confidence: {confidence}%", f"Area: {landslide_pct:.1f}%"],
            "recommendation": "Analysis complete using predefined model.",
            "source": "api",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")
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

@app.get("/assessments/{assessment_id}")
async def api_get_assessment(assessment_id: str):
    record = get_assessment_by_id(assessment_id)
    if not record:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return record

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


# ── Auth Endpoints ────────────────────────────────────────────────────────────
import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ── SMTP config — set these in your environment or a .env file ────────────────
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")   # your Gmail address
SMTP_PASS = os.environ.get("SMTP_PASS", "")   # Gmail App Password
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USER)

def _send_otp_email(to_email: str, otp: str):
    """Send a 6-digit OTP to the given email using SMTP."""
    subject = "LandslideWatch — Email Verification Code"
    body = f"""
<html>
<body style="font-family: Arial, sans-serif; background:#0f172a; color:#e2e8f0; padding:40px;">
  <div style="max-width:480px; margin:auto; background:#1e293b; border-radius:16px; padding:32px; border:1px solid #334155;">
    <h2 style="color:#a78bfa; margin-bottom:8px;">LandslideWatch</h2>
    <p style="color:#94a3b8; font-size:13px; margin-bottom:24px;">AI Early Warning System</p>
    <p style="color:#e2e8f0;">Your email verification code is:</p>
    <div style="font-size:40px; font-weight:bold; letter-spacing:12px; color:#a78bfa; text-align:center; padding:24px 0;">
      {otp}
    </div>
    <p style="color:#94a3b8; font-size:13px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
  </div>
</body>
</html>
"""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_FROM, to_email, msg.as_string())

class AuthRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    otp: str

class SendOtpRequest(BaseModel):
    email: str

@app.post("/auth/send-otp")
async def send_otp(req: SendOtpRequest):
    """Generate a 6-digit OTP, save it, and email it to the user."""
    if not req.email or "@" not in req.email:
        raise HTTPException(status_code=400, detail="Invalid email address.")

    # Check if already registered
    if get_user_by_email(req.email):
        raise HTTPException(status_code=409, detail="Email already registered. Please sign in.")

    # Generate OTP
    otp = "".join(random.choices(string.digits, k=6))
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    save_otp(req.email, otp, expires_at)

    # Try to send email; fall back to logging OTP for local dev
    if SMTP_USER and SMTP_PASS:
        try:
            _send_otp_email(req.email, otp)
            print(f"[OTP] Sent OTP to {req.email}")
        except Exception as e:
            print(f"[OTP] Email send failed: {e}. OTP for {req.email}: {otp}")
            raise HTTPException(
                status_code=500,
                detail=f"Could not send email. Check your SMTP settings. Dev OTP: {otp}"
            )
    else:
        # No SMTP configured — return OTP in the response for local development
        print(f"[OTP] No SMTP configured. OTP for {req.email}: {otp}")
        return {"status": "dev", "message": "SMTP not configured. Check server console for OTP.", "dev_otp": otp}

    return {"status": "sent", "message": f"OTP sent to {req.email}"}

@app.post("/auth/register")
async def register(req: RegisterRequest):
    """Register a new user — requires verified OTP."""
    if not req.email or "@" not in req.email:
        raise HTTPException(status_code=400, detail="Invalid email address.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if get_user_by_email(req.email):
        raise HTTPException(status_code=409, detail="Email already registered.")

    # Verify OTP
    record = get_otp(req.email)
    if not record:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new code.")
    if record["otp"] != req.otp.strip():
        raise HTTPException(status_code=400, detail="Incorrect OTP. Please try again.")
    if datetime.fromisoformat(record["expires_at"]) < datetime.now(timezone.utc):
        delete_otp(req.email)
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new code.")

    # Create user & cleanup
    hashed = hash_password(req.password)
    create_user(req.email, hashed)
    delete_otp(req.email)
    token = create_access_token(req.email)
    return {"access_token": token, "token_type": "bearer", "email": req.email}

@app.post("/auth/login")
async def login(req: AuthRequest):
    """Login with email and password."""
    user = get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token(req.email)
    return {"access_token": token, "token_type": "bearer", "email": req.email}


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "1.2.0 (Keras Support)",
        "torch_model_loaded": model is not None,
        "keras_model_loaded": keras_model is not None,
        "tensorflow_available": HAVE_TF
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
