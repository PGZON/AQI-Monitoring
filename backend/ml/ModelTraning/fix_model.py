"""
Fix LSTM Model Loading Issues
Removes problematic .h5 files and ensures clean model training
"""
import os
import glob
from config import MODEL_DIR

def fix_model_issues():
    """Remove problematic model files"""
    
    print("🔧 Fixing LSTM Model Issues")
    print("=" * 40)
    
    # Create models directory if it doesn't exist
    os.makedirs(MODEL_DIR, exist_ok=True)
    print(f"✅ Models directory: {MODEL_DIR}")
    
    # Remove existing .h5 files that might cause deserialization issues
    h5_files = glob.glob(f"{MODEL_DIR}/*.h5")
    
    if h5_files:
        print(f"\n🗑️ Removing {len(h5_files)} .h5 model files:")
        for h5_file in h5_files:
            try:
                os.remove(h5_file)
                print(f"   ✅ Removed: {os.path.basename(h5_file)}")
            except Exception as e:
                print(f"   ❌ Failed to remove {os.path.basename(h5_file)}: {e}")
    else:
        print("\n✅ No .h5 files found to remove")
    
    # List remaining model files
    keras_files = glob.glob(f"{MODEL_DIR}/*.keras")
    other_files = glob.glob(f"{MODEL_DIR}/*")
    other_files = [f for f in other_files if not f.endswith(('.h5', '.keras'))]
    
    print(f"\n📋 Current model files:")
    if keras_files:
        print(f"   .keras files: {len(keras_files)}")
        for f in keras_files:
            print(f"     - {os.path.basename(f)}")
    
    if other_files:
        print(f"   Other files: {len(other_files)}")
        for f in other_files:
            if os.path.isfile(f):
                print(f"     - {os.path.basename(f)}")
    
    if not keras_files and not other_files:
        print("   (no model files found)")
    
    print("\n🎯 Next Steps:")
    print("   1. Run training again with: python main.py")
    print("   2. Model will now save in .keras format")
    print("   3. No more deserialization errors!")
    
    return True

if __name__ == "__main__":
    fix_model_issues()
    input("\nPress Enter to continue...")
