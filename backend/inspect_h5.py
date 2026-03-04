import h5py

def inspect_h5(file_path):
    print(f"Inspecting: {file_path}\n")
    try:
        with h5py.File(file_path, 'r') as f:
            print("--- Attributes ---")
            for attr in f.attrs:
                print(f"{attr}: {f.attrs[attr]}")
            
            print("\n--- Keys/Groups ---")
            def print_structure(name, obj):
                print(f"{'  ' * name.count('/')}{name} ({type(obj)})")
                if isinstance(obj, h5py.Dataset):
                    print(f"{'  ' * (name.count('/')+1)}Shape: {obj.shape}")
            
            f.visititems(print_structure)
            
            if 'model_weights' in f:
                print("\n--- Model Weights Substructure ---")
                f['model_weights'].visititems(print_structure)
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_h5('custom_model.h5')
