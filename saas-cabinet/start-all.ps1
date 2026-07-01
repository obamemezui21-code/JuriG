# SaaS Cabinet Setup Script
Write-Host "=== SaaS Cabinet Setup Script ===" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = & node --version 2>$null
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    $npmVersion = & npm --version 2>$null
    Write-Host "✅ npm is installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Backend setup
Write-Host "=== Setting up Backend ===" -ForegroundColor Cyan
Set-Location "backend"

if (!(Test-Path ".env")) {
    Write-Host "❌ .env file not found in backend directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
& npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/c npm start" -WindowStyle Normal
Start-Sleep 3

Write-Host "✅ Backend server started" -ForegroundColor Green
Set-Location ".."

# Frontend setup
Write-Host ""
Write-Host "=== Setting up Frontend ===" -ForegroundColor Cyan
Set-Location "frontend"

Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
& npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting frontend development server..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/c npm start" -WindowStyle Normal
Start-Sleep 5

Write-Host "✅ Frontend server started" -ForegroundColor Green
Set-Location ".."

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Blue
Write-Host "🔧 Backend: http://localhost:5000" -ForegroundColor Blue
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "2. If you get JWT errors, clear localStorage:" -ForegroundColor White
Write-Host "   - Press F12 → Console" -ForegroundColor White
Write-Host "   - Run: localStorage.removeItem('saas-cabinet-token');" -ForegroundColor White
Write-Host "   - Refresh the page and log in again" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to exit..." -ForegroundColor Gray
Read-Host