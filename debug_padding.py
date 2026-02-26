import torch
import numpy as np
from backend.model import TinyAttentionUNet
import os

MODEL_PATH = "backend/tiny_attention_unet.pth"

def debug():
    if not os.path.exists(MODEL_PATH): return

    checkpoint = torch.load(MODEL_PATH, map_location="cpu")
    sd = checkpoint["model_state_dict"] if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint else checkpoint
    
    model = TinyAttentionUNet(n_channels=6)
    model.load_state_dict(sd, strict=False)
    model.train() # BN workaround

    base_rgb = torch.rand(1, 3, 128, 128)
    
    inputs = {
        "Repeated RGB": torch.cat([base_rgb, base_rgb], dim=1),
        "Zeros Padding": torch.cat([base_rgb, torch.zeros_like(base_rgb)], dim=1),
        "Half-Padding": torch.cat([base_rgb, torch.ones_like(base_rgb) * 0.5], dim=1)
    }

    for name, tensor in inputs.items():
        with torch.no_grad():
            output = model(tensor)
            probs = torch.sigmoid(output)
            print(f"--- {name} ---")
            print(f"Max Prob: {probs.max().item():.4f}")
            print(f"Mean Prob: {probs.mean().item():.4f}")
            print()

if __name__ == "__main__":
    debug()
