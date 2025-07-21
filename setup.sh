#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎵 Goofyy All-in-One Setup and Development Script${NC}"
echo "=================================================="

# --- Dependency Checks and Installations ---

# Function to check for command existence
command_exists () {
  command -v "$1" >/dev/null 2>&1
}

# Check for Node.js and npm
echo -e "${BLUE}Checking for Node.js and npm...${NC}"
if ! command_exists node || ! command_exists npm; then
    echo -e "${RED}❌ Node.js or npm not found.${NC}"
    echo -e "${YELLOW}Please install Node.js (which includes npm) from https://nodejs.org/ or via your system's package manager.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js and npm found.${NC}"

# Check for yt-dlp
echo -e "${BLUE}Checking for yt-dlp...${NC}"
if ! command_exists yt-dlp; then
    echo -e "${RED}❌ yt-dlp not found.${NC}"
    echo -e "${YELLOW}Please install yt-dlp. Recommended method: 'pip install yt-dlp' (ensure pip is installed).${NC}"
    exit 1
fi
echo -e "${GREEN}✅ yt-dlp found.${NC}"

# Check for ffmpeg
echo -e "${BLUE}Checking for ffmpeg...${NC}"
if ! command_exists ffmpeg; then
    echo -e "${RED}❌ ffmpeg not found.${NC}"
    echo -e "${YELLOW}Please install ffmpeg via your system's package manager (e.g., 'brew install ffmpeg' on macOS, 'sudo apt-get install ffmpeg' on Ubuntu).${NC}"
    exit 1
fi
echo -e "${GREEN}✅ ffmpeg found.${NC}"

# Check for Redis
echo -e "${BLUE}Checking for Redis server...${NC}"
if ! command_exists redis-server; then
    echo -e "${RED}❌ Redis server not found.${NC}"
    echo -e "${YELLOW}Please install Redis via your system's package manager (e.g., 'brew install redis' on macOS, 'sudo apt-get install redis-server' on Ubuntu).${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Redis server found.${NC}"

# --- Redis Server Management ---
echo -e "${BLUE}Ensuring Redis server is running...${NC}"
if pgrep -x "redis-server" > /dev/null; then
    echo -e "${YELLOW}⚠️  Redis server is already running.${NC}"
else
    echo -e "${BLUE}Starting Redis server in background...${NC}"
    redis-server --daemonize yes
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Redis server started successfully.${NC}"
    else
        echo -e "${RED}❌ Failed to start Redis server. Please check your Redis installation.${NC}"
        exit 1
    fi
    sleep 2 # Give Redis a moment to start
fi

# --- Node.js Dependencies Installation ---

# Install backend dependencies
if [ ! -d "packages/backend/node_modules" ]; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    (cd packages/backend && npm install)
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install backend dependencies${NC}"
        exit 1
    fi
fi

# Install client dependencies
if [ ! -d "packages/client/node_modules" ]; then
    echo -e "${BLUE}📦 Installing client dependencies...${NC}"
    (cd packages/client && npm install)
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install client dependencies${NC}"
        exit 1
    fi
fi

# --- Backend .env File Setup ---
if [ ! -f "packages/backend/.env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found in packages/backend/${NC}"
    echo -e "${BLUE}📝 Creating .env file from .env.example...${NC}"
    
    if [ -f "packages/backend/.env.example" ]; then
        cp packages/backend/.env.example packages/backend/.env
        echo -e "${GREEN}✅ .env file created from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please update packages/backend/.env with your actual configuration (e.g., POSTHOG_API_KEY) if needed.${NC}"
    else
        echo -e "${RED}❌ .env.example not found. Please create packages/backend/.env manually${NC}"
        echo "Required variables:"
        echo "  REDIS_URL=redis://localhost:6379"
        echo "  POSTHOG_API_KEY=your_posthog_api_key_here"
        exit 1
    fi
fi

# --- Start Development Servers ---
echo -e "${GREEN}🚀 Starting backend development server...${NC}"
(cd packages/backend && npm run dev) & # Run backend in background
BACKEND_PID=$!

echo -e "${GREEN}🚀 Starting client development server...${NC}"
(cd packages/client && npm run dev) & # Run client in background
CLIENT_PID=$!

echo -e "${BLUE}📍 Backend server will be available at: http://localhost:3000${NC}"
echo -e "${BLUE}💡 To stop both servers, press Ctrl+C.${NC}"

# Trap Ctrl+C to kill background processes
trap "echo -e '\n${YELLOW}Shutting down servers...${NC}'; kill $BACKEND_PID $CLIENT_PID; wait $BACKEND_PID $CLIENT_PID 2>/dev/null; echo -e '${GREEN}Servers stopped.${NC}'; exit 0" INT

wait # Wait for all background processes to finish
