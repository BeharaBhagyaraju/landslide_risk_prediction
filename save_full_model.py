import tensorflow as tf
from tensorflow.keras import layers, models

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

def TinyAttentionUNet(input_shape=(224, 224, 3)):
    inputs = layers.Input(input_shape)
    
    # Simple Encoder
    c1 = layers.Conv2D(16, (3, 3), activation='relu', padding='same')(inputs)
    p1 = layers.MaxPooling2D((2, 2))(c1)
    
    c2 = layers.Conv2D(32, (3, 3), activation='relu', padding='same')(p1)
    p2 = layers.MaxPooling2D((2, 2))(c2)
    
    # Bridge
    b1 = layers.Conv2D(64, (3, 3), activation='relu', padding='same')(p2)
    
    # Decoder with Attention
    g1 = layers.Conv2D(32, (1, 1), padding='same')(b1)
    a1 = AttentionBlock(c2, g1, 32)
    u1 = layers.UpSampling2D((2, 2))(b1)
    m1 = layers.concatenate([u1, a1])
    c3 = layers.Conv2D(32, (3, 3), activation='relu', padding='same')(m1)
    
    u2 = layers.UpSampling2D((2, 2))(c3)
    c4 = layers.Conv2D(16, (3, 3), activation='relu', padding='same')(u2)
    
    outputs = layers.Conv2D(1, (1, 1), activation='sigmoid')(c4)
    
    return models.Model(inputs, outputs)

if __name__ == "__main__":
    # 1. Initialize the architecture
    model = TinyAttentionUNet()
    
    # 2. Try to load your weights
    # Replace 'your_weights.h5' with the actual filename
    weights_path = 'your_weights.h5' 
    try:
        model.load_weights(weights_path)
        print(f"Successfully loaded weights from {weights_path}")
        
        # 3. Save as a FULL model (Architecture + Weights)
        model.save('full_model_tiny_unet.h5')
        print("Success! 'full_model_tiny_unet.h5' is ready for upload.")
    except Exception as e:
        print(f"Error: {e}")
        print("\nNote: If your architecture differs, please update the TinyAttentionUNet function above.")
