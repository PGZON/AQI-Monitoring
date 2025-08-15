@echo off
REM AQI-Monitoring Full Setup Script
REM This script installs dependencies and starts all services in separate terminals.

REM Step 1: Install frontend dependencies
cd /d "%~dp0"
echo Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Frontend npm install failed!
    pause
    exit /b 1
)
echo Frontend dependencies installed.

REM Step 2: Install backend dependencies
cd backend

echo Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Backend npm install failed!
    pause
    exit /b 1
)
echo Backend dependencies installed.

REM Step 3: Set up Python virtual environment for ML
cd ml

echo Creating Python virtual environment...
call python -m venv venv
if %errorlevel% neq 0 (
    echo Python venv creation failed!
    pause
    exit /b 1
)
echo Python virtual environment created.

REM Step 4: Activate venv and install Python dependencies
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo Failed to activate Python venv!
    pause
    exit /b 1
)
echo Python venv activated.

echo Installing Python dependencies...
call pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Python dependencies installation failed!
    pause
    exit /b 1
)
echo Python dependencies installed.

echo All dependencies installed successfully.

REM Step 5: Start servers in separate terminals
cd /d "%~dp0"

echo Starting frontend server in new terminal...
start "Frontend" cmd /k "npm start"

echo Starting backend server in new terminal...
start "Backend" cmd /k "cd backend && npm start"

echo Starting ML server in new terminal...
start "ML" cmd /k "cd backend\ml && call venv\Scripts\activate.bat && python app.py"

echo All servers started in separate terminals.
pause
