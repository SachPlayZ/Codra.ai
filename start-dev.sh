#!/bin/bash

echo "🚀 Starting Codra AI Development Servers..."
echo ""

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set up signal handling
trap cleanup EXIT INT TERM

# Check if .env exists in backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found!"
    echo "🔧 Run 'cd backend && npm run setup' to create it"
    echo ""
fi

# Start backend
echo "🔧 Starting backend server (http://localhost:5000)..."
cd backend && pnpm run dev &
BACKEND_PID=$!

# Start frontend
echo "🎨 Starting frontend server (http://localhost:3000)..."
cd frontend && pnpm run dev &
FRONTEND_PID=$!

# Wait for Ctrl+C
echo ""
echo "✅ Servers started!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for background processes
wait 