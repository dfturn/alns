#!/bin/bash

# Start the Air, Land & Sea application locally

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Air, Land & Sea...${NC}"

# Start backend in background
echo -e "${GREEN}Starting backend...${NC}"
go run main.go &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
echo -e "${GREEN}Starting frontend...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!

echo -e "${BLUE}Application started!${NC}"
echo "Backend running on http://localhost:8080"
echo "Frontend running on http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${BLUE}Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to call cleanup on Ctrl+C
trap cleanup INT

# Wait for processes
wait
