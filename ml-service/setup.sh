#!/bin/bash

# ML Service Setup Script
echo "Setting up ML Service..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Create models directory
mkdir -p models

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env file with your API keys if needed"
fi

echo "Setup complete!"
echo ""
echo "To run the service:"
echo "  ./run.py"
echo ""
echo "Or manually:"
echo "  source venv/bin/activate"
echo "  uvicorn app:app --host 0.0.0.0 --port 8000 --reload"