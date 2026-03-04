import torch

def inspect_pth(file_path):
    print(f"Inspecting: {file_path}\n")
    try:
        data = torch.load(file_path, map_location='cpu')
        print(f"Type: {type(data)}")
        
        if isinstance(data, dict):
            print("--- Keys found ---")
            for k in data.keys():
                print(f"- {k}")
                if k == 'model_state_dict':
                    print("\n--- model_state_dict structure ---")
                    sd = data[k]
                    # Print first 20 keys to see layer naming
                    keys = list(sd.keys())
                    for sk in keys[:20]:
                        print(f"  {sk}: {sd[sk].shape}")
                    if len(keys) > 20:
                        print(f"  ... (+ {len(keys)-20} more keys)")
        else:
            print("Not a dictionary. Likely a raw state_dict or model object.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_pth('tiny_attention_unet.pth')
