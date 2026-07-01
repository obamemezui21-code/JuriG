@echo off
echo === SaaS Cabinet Setup Script ===
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed
echo.

REM Navigate to project directory
cd /d "%~dp0"

REM Backend setup
echo === Setting up Backend ===
cd backend

if not exist ".env" (
    echo ❌ .env file not found in backend directory
    pause
    exit /b 1
)

echo Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

echo Starting backend server...
start "Backend Server" cmd /c "npm start"
timeout /t 3 /nobreak >nul

echo ✅ Backend server started
cd ..

REM Frontend setup
echo.
echo === Setting up Frontend ===
cd frontend

echo Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

echo Starting frontend development server...
start "Frontend Server" cmd /c "npm start"
timeout /t 5 /nobreak >nul

echo ✅ Frontend server started
cd ..

echo.
echo === Setup Complete ===
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:5000
echo.
echo 📋 Next steps:
echo 1. Open http://localhost:3000 in your browser
echo 2. If you get JWT errors, clear localStorage:
echo    - Press F12 → Console
echo    - Run: localStorage.removeItem('saas-cabinet-token');
echo    - Refresh the page and log in again
echo.
echo Press any key to exit...
pause >nul