import torch
import os
from model import LandslideModel

def init_model():
    MODEL_PATH = os.path.join(os.path.dirname(__file__), "landslide_model.pth")
    
    # Initialize the model with 3 channels (RGB)
    model = LandslideModel(n_channels=3, n_classes=1)
    
    # Save the state_dict instead of the whole model object (safer)
    torch.save(model.state_dict(), MODEL_PATH)
    print(f"✅ Predefined LandslideModel state_dict initialized and saved to {MODEL_PATH}")

if __name__ == "__main__":
    init_model()
