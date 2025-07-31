@echo off
REM AQI ML Service Startup Script for Windows

echo 🚀 Starting AQI ML Forecasting Service...

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Navigate to ML directory
cd /d "%~dp0"

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo ⬆️ Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo 📋 Installing Python dependencies...
pip install -r requirements.txt

REM Create necessary directories
if not exist "saved_models" mkdir saved_models
if not exist "logs" mkdir logs

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️ .env file not found. Please create one based on the provided template.
    pause
    exit /b 1
)

REM Start the Flask application
echo 🌟 Starting Flask ML service...
python app.py

pause
