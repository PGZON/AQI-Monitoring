@echo off
REM AQI Monitoring System - Complete Startup Script
REM This script starts both the main backend and ML service

echo ================================================
echo     AQI Monitoring System - Full Startup
echo ================================================
echo.

echo [1/4] Setting up environment...
set NODE_ENV=development
set ML_SERVICE_URL=http://localhost:5001

echo [2/4] Installing Node.js dependencies...
call npm install --silent
if errorlevel 1 (
    echo ERROR: Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo [3/4] Setting up ML service...
cd ml
if exist venv (
    echo    Activating Python virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo    Creating Python virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo    Installing Python dependencies...
    pip install tensorflow==2.16.1 scikit-learn pandas numpy flask flask-cors requests python-dotenv --quiet
)

echo [4/4] Starting services...
echo.
echo ================================================
echo   🚀 Starting AQI Monitoring System
echo ================================================
echo.
echo ✅ Main Backend: http://localhost:5000
echo ✅ ML Service:   http://localhost:5001
echo.
echo Press Ctrl+C to stop all services
echo ================================================
echo.

REM Start both services concurrently
cd ..
start /B "ML Service" cmd /c "cd ml && venv\Scripts\activate.bat && python app.py"
timeout /t 3 /nobreak > nul
echo [INFO] ML Service started on port 5001
start /B "Main Backend" cmd /c "npm run dev"
timeout /t 2 /nobreak > nul
echo [INFO] Main Backend started on port 5000

echo.
echo Both services are now running!
echo Test the integration at: http://localhost:5000
echo.
echo To test ML predictions, use:
echo curl -X POST http://localhost:5001/predict -H "Content-Type: application/json" -d "{\"latitude\":19.076,\"longitude\":72.8777}"
echo.

REM Keep the script running
:loop
timeout /t 10 /nobreak > nul
goto loop
