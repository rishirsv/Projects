#!/bin/bash

# Kill any existing processes
pkill -f "vite" 2>/dev/null || true
pkill -f "server.js" 2>/dev/null || true

echo "🚀 Starting YouTube Summarizer..."
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3001"
echo ""

# Start backend server
echo "Starting transcript server..."
node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Start frontend
echo "Starting frontend..."
npm run dev &
VITE_PID=$!

echo ""
echo "✅ Both servers started!"
echo "📝 Frontend: http://localhost:5173"
echo "🔧 Backend health: http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping servers...'; kill $SERVER_PID $VITE_PID 2>/dev/null; exit" INT
wait