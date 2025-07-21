#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎵 Goofyy Development Setup${NC}"
echo "=========================================="

# --- Redis Dependency ---
echo -e "${YELLOW}⚠️  Redis is a required dependency for the backend. Please ensure it is running locally.${NC}"
echo -e "   If not installed, you can typically install it via your package manager (e.g., 'brew install redis' on macOS, 'sudo apt-get install redis-server' on Ubuntu).${NC}"
echo -e "   Start Redis before running this script (e.g., 'redis-server' in a new terminal).${NC}"
echo ""

# Check if .env file exists in backend
if [ ! -f "packages/backend/.env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found in packages/backend/${NC}"
    echo -e "${BLUE}📝 Creating .env file from .env.example...${NC}"
    
    if [ -f "packages/backend/.env.example" ]; then
        cp packages/backend/.env.example packages/backend/.env
        echo -e "${GREEN}✅ .env file created from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please update packages/backend/.env with your actual configuration${NC}"
    else
        echo -e "${RED}❌ .env.example not found. Please create packages/backend/.env manually${NC}"
        echo "Required variables:"
        echo "  REDIS_URL=redis://localhost:6379"
        echo "  POSTHOG_API_KEY=your_posthog_api_key_here"
        exit 1
    fi
fi

# Install backend dependencies if not present
if [ ! -d "packages/backend/node_modules" ]; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    (cd packages/backend && npm install)
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install backend dependencies${NC}"
        exit 1
    fi
fi

# Install client dependencies if not present
if [ ! -d "packages/client/node_modules" ]; then
    echo -e "${BLUE}📦 Installing client dependencies...${NC}"
    (cd packages/client && npm install)
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install client dependencies${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}🚀 Starting backend development server...${NC}"
(cd packages/backend && npm run dev) & # Run backend in background
BACKEND_PID=$!

echo -e "${GREEN}🚀 Starting client development server...${NC}"
(cd packages/client && npm run dev) & # Run client in background
CLIENT_PID=$!

echo -e "${BLUE}📍 Backend server will be available at: http://localhost:3000${NC}"
echo -e "💡 To stop both servers, press Ctrl+C.${NC}"

# Trap Ctrl+C to kill background processes
trap "echo -e '\n${YELLOW}Shutting down servers...${NC}'; kill $BACKEND_PID $CLIENT_PID; wait $BACKEND_PID $CLIENT_PID 2>/dev/null; echo -e '${GREEN}Servers stopped.${NC}'; exit 0" INT

wait # Wait for all background processes to finish