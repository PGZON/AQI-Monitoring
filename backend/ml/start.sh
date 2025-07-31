#!/bin/bash

# AQI ML Service Startup Script
echo "🚀 Starting AQI ML Forecasting Service..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip."
    exit 1
fi

# Navigate to ML directory
cd "$(dirname "$0")"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📋 Installing Python dependencies..."
pip install -r requirements.txt

# Create necessary directories
mkdir -p saved_models
mkdir -p logs

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️ .env file not found. Please create one based on .env.example"
    exit 1
fi

# Start the Flask application
echo "🌟 Starting Flask ML service..."
python app.py
