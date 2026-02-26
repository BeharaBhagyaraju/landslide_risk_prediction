import torch
import torch.nn as nn
from torchvision.models.segmentation import lraspp_mobilenet_v3_large, LRASPP_MobileNet_V3_Large_Weights

class LandslideModel(nn.Module):
    """
    Predefined LRASPP (Lite Reduced Atrous Spatial Pyramid Pooling) 
    MobilenetV3 Large segmentation model.
    """
    def __init__(self, n_channels=3, n_classes=1):
        super(LandslideModel, self).__init__()
        
        # We use pre-trained weights for the backbone to have some initial feature extraction
        # This solves the "giving the same result" issue caused by random weights.
        weights = LRASPP_MobileNet_V3_Large_Weights.DEFAULT
        self.base_model = lraspp_mobilenet_v3_large(weights=weights)
        
        # Re-initialize the classifier head for binary segmentation (1 class)
        # The default model has 21 classes (COCO)
        in_channels = self.base_model.classifier.low_classifier.in_channels
        self.base_model.classifier.low_classifier = nn.Conv2d(in_channels, n_classes, kernel_size=1)
        
        in_channels_high = self.base_model.classifier.high_classifier.in_channels
        self.base_model.classifier.high_classifier = nn.Conv2d(in_channels_high, n_classes, kernel_size=1)

        # If we need more than 3 channels, we modify the backbone's first layer
        if n_channels != 3:
            old_conv = self.base_model.backbone['0'][0]
            self.base_model.backbone['0'][0] = nn.Conv2d(
                n_channels, old_conv.out_channels, 
                kernel_size=old_conv.kernel_size, 
                stride=old_conv.stride, 
                padding=old_conv.padding, 
                bias=False
            )

    def forward(self, x):
        return self.base_model(x)['out']
