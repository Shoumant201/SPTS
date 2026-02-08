#!/usr/bin/env python3
"""
ML Service Runner
Activates virtual environment and runs the FastAPI application
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    # Get the directory where this script is located
    script_dir = Path(__file__).parent.absolute()
    
    # Path to virtual environment
    venv_path = script_dir / "venv"
    
    # Check if virtual environment exists
    if not venv_path.exists():
        print("Virtual environment not found. Please run setup first.")
        print("Run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt")
        sys.exit(1)
    
    # Path to Python in virtual environment
    python_path = venv_path / "bin" / "python"
    
    if not python_path.exists():
        print("Python executable not found in virtual environment.")
        sys.exit(1)
    
    # Change to script directory
    os.chdir(script_dir)
    
    # Run the FastAPI application
    try:
        subprocess.run([
            str(python_path), "-m", "uvicorn", "app:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload"
        ], check=True)
    except KeyboardInterrupt:
        print("\nShutting down ML service...")
    except subprocess.CalledProcessError as e:
        print(f"Error running ML service: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()