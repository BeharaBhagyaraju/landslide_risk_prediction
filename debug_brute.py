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

    # Use a fixed "image-like" input (e.g. noise with some structure)
    base_rgb = torch.rand(1, 3, 128, 128)
    
    configs = [
        ("RGB [0, 1]", base_rgb),
        ("BGR [0, 1]", base_rgb[:, [2, 1, 0]]),
        ("RGB [-1, 1]", base_rgb * 2 - 1),
        ("BGR [-1, 1]", base_rgb[:, [2, 1, 0]] * 2 - 1),
        ("RGB [Unscaled 0-255]", base_rgb * 255.0),
        ("Imagenet Std", (base_rgb - torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1)) / torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1))
    ]

    for name, img in configs:
        # Test both "Repeat" and "Zero-fill" for the extra 3 channels
        for fill in ["Repeat", "Zeros"]:
            if fill == "Repeat":
                tensor = torch.cat([img, img], dim=1)
            else:
                tensor = torch.cat([img, torch.zeros_like(img)], dim=1)
                
            with torch.no_grad():
                output = model(tensor)
                probs = torch.sigmoid(output)
                print(f"{name} ({fill}) -> Max Prob: {probs.max().item():.4f}")

if __name__ == "__main__":
    debug()
