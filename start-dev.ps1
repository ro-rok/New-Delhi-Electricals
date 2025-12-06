# PowerShell script to start both backend and frontend development servers

Write-Host "Starting Backend and Frontend Development Servers..." -ForegroundColor Green
Write-Host ""

# Get the script directory (root of the project)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Start Backend Server
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Set-Location backend

if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & "venv\Scripts\Activate.ps1"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; uvicorn app.main:app --reload" -WindowStyle Normal
} elseif (Test-Path "venv\Scripts\activate.bat") {
    Write-Host "Activating virtual environment (batch)..." -ForegroundColor Yellow
    Start-Process cmd -ArgumentList "/k", "venv\Scripts\activate.bat && uvicorn app.main:app --reload" -WindowStyle Normal
} else {
    Write-Host "Warning: Virtual environment not found at backend\venv" -ForegroundColor Yellow
    Write-Host "Starting backend without virtual environment..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; uvicorn app.main:app --reload" -WindowStyle Normal
}

Set-Location ..

# Wait a moment before starting frontend
Start-Sleep -Seconds 2

# Start Frontend Server
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Set-Location frontend

if (Test-Path "package.json") {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal
} else {
    Write-Host "Error: package.json not found in frontend directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "Both servers are starting in separate windows..." -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:8080 (or check the terminal output)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to close this window (servers will continue running in separate windows)"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
