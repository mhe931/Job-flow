#!/bin/bash
# JobFlow AI - macOS/Linux Quick Start Script
# This script automates the setup process

set -e  # Exit on error

echo "========================================"
echo "  JobFlow AI - Quick Start Setup"
echo "========================================"
echo ""

# Check Python installation
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    echo "Please install Python 3.11+ from https://www.python.org/downloads/"
    exit 1
fi

echo "[1/6] Python detected"
python3 --version

# Create virtual environment
echo ""
echo "[2/6] Creating virtual environment..."
if [ -d "venv" ]; then
    echo "Virtual environment already exists, skipping..."
else
    python3 -m venv venv
    echo "Virtual environment created"
fi

# Activate virtual environment
echo ""
echo "[3/6] Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo ""
echo "[4/6] Installing dependencies..."
pip install -r requirements.txt

# Setup environment variables
echo ""
echo "[5/6] Setting up environment variables..."
if [ -f ".env" ]; then
    echo ".env file already exists, skipping..."
else
    cp .env.example .env
    echo ".env file created"
    echo ""
    echo "IMPORTANT: Edit .env file and add your GEMINI_API_KEY"
    echo ""
    read -p "Press Enter to edit .env file..."
    ${EDITOR:-nano} .env
fi

# Initialize database
echo ""
echo "[6/6] Initializing database..."
python -c "from database import init_db; init_db()"
echo "Database initialized successfully"

echo ""
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "To run the application:"
echo "  1. Activate virtual environment: source venv/bin/activate"
echo "  2. Run Streamlit: streamlit run app.py"
echo "  3. Open browser: http://localhost:8501"
echo ""
read -p "Press Enter to start the application now..."

# Run the application
echo ""
echo "Starting JobFlow AI..."
streamlit run app.py
