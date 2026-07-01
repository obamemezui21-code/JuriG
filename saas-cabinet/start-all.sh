#!/bin/bash

echo "=== SaaS Cabinet Setup Script ==="
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Backend setup
echo "=== Setting up Backend ==="
cd backend

if [ ! -f ".env" ]; then
    echo "❌ .env file not found in backend directory"
    exit 1
fi

echo "Installing backend dependencies..."
npm install

echo "Starting backend server..."
npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend server started successfully"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

cd ..

# Frontend setup
echo ""
echo "=== Setting up Frontend ==="
cd frontend

echo "Installing frontend dependencies..."
npm install

echo "Starting frontend development server..."
npm start &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Check if frontend is running
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "✅ Frontend server started successfully"
else
    echo "❌ Frontend server failed to start"
    exit 1
fi

cd ..

echo ""
echo "=== Setup Complete ==="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo ""
echo "📋 Next steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. If you get JWT errors, clear localStorage:"
echo "   - Press F12 → Console"
echo "   - Run: localStorage.removeItem('saas-cabinet-token');"
echo "   - Refresh the page and log in again"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait