import os
import sys
from pathlib import Path
import uvicorn

# Root directory
ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

# Verify backend model path
default_model = ROOT_DIR / "backend" / "models" / "best.pt"
if not default_model.exists():
    fallback_model = ROOT_DIR / "models" / "best.pt"
    if fallback_model.exists():
        default_model = fallback_model

if "MODEL_PATH" not in os.environ:
    os.environ["MODEL_PATH"] = str(default_model)

if __name__ == "__main__":
    print("=" * 68)
    print("   CLINISCAN AI — FULL-STACK EXPLAINABLE CHEST X-RAY DASHBOARD")
    print("=" * 68)
    print(f"   Model Checkpoint : {os.environ['MODEL_PATH']}")
    print("   FastAPI Backend  : http://127.0.0.1:8000")
    print("   Interactive Docs : http://127.0.0.1:8000/docs")
    print("   React Dashboard  : http://127.0.0.1:8000 (Production build)")
    print("   Vite Dev Server  : http://localhost:5173 (Development mode)")
    print("=" * 68)
    
    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
        log_level="info"
    )
