@echo off
echo ==========================================
echo   Starting AuraFit - Fitness Tracker
echo ==========================================
echo.

REM Create virtual environment if it doesn't exist
if not exist "venv\Scripts\activate.bat" (
    echo [0] Creating virtual environment...
    py -3 -m venv venv
    call venv\Scripts\activate.bat
    echo [0] Installing Python dependencies...
    pip install -r requirements.txt
    echo.
) else (
    call venv\Scripts\activate.bat
)

REM Start Backend
echo [1] Starting Backend (Django) on http://127.0.0.1:8000 ...
start "Backend - Django" cmd /k "cd /d %~dp0 && venv\Scripts\activate.bat && py manage.py runserver"

REM Wait for backend to initialize
timeout /t 3 /nobreak >nul

REM Start Frontend
echo [2] Starting Frontend (Vite) on http://127.0.0.1:5173 ...
start "Frontend - Vite" cmd /k "cd /d %~dp0frontend && npm run dev -- --host"

echo.
echo Both servers started!
echo   Backend  -> http://127.0.0.1:8000
echo   Frontend -> http://127.0.0.1:5173
echo.
echo Close this window or press any key to exit...
pause >nul
