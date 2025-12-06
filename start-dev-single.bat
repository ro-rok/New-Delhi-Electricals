@echo off
echo Starting Backend and Frontend Development Servers in single window...
echo.

REM Get the script directory (root of the project)
cd /d "%~dp0"

REM Start Backend Server in background
echo Starting Backend Server...
cd backend
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    start /b uvicorn app.main:app --reload
) else (
    echo Warning: Virtual environment not found at backend\venv
    echo Starting backend without virtual environment...
    start /b uvicorn app.main:app --reload
)
cd ..

REM Wait a moment before starting frontend
timeout /t 2 /nobreak >nul

REM Start Frontend Server in background
echo Starting Frontend Server...
cd frontend
if exist package.json (
    start /b npm run dev
) else (
    echo Error: package.json not found in frontend directory
    pause
    exit /b 1
)
cd ..

echo.
echo Both servers are running in the background...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:8080 (or check the terminal output)
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Keep the window open and wait for Ctrl+C
:loop
timeout /t 1 /nobreak >nul
goto loop
