#!/bin/bash

# Location-Based AQI Data Collection & LSTM Training Setup Script

echo "🚀 Setting up Location-Based AQI Forecasting Pipeline..."

# Create data and models directories
mkdir -p data
mkdir -p models

echo "📁 Directories created"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ Dependencies installed"

# Check if OpenAQ API key is set
if [ -z "$OPENAQ_API_KEY" ]; then
    echo "⚠️  WARNING: OpenAQ API key not set!"
    echo "📝 Please:"
    echo "   1. Sign up at https://openaq.org"
    echo "   2. Get your API key"
    echo "   3. Run: export OPENAQ_API_KEY='your-key-here'"
    echo "   4. Or edit config.py and update OPENAQ_API_KEY"
else
    echo "✅ OpenAQ API key configured"
fi

echo ""
echo "🎯 Setup complete! Run the pipeline with:"
echo "   python main.py"
echo ""
echo "📊 Pipeline steps:"
echo "   1. Data Collection from OpenAQ API"
echo "   2. Data Preprocessing & Feature Engineering"
echo "   3. LSTM Model Training & Evaluation"
echo ""
