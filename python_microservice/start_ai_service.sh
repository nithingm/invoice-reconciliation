#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐍 Starting Python AI Service...${NC}"
echo "================================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo -e "${RED}❌ Python not found${NC}"
        echo "Please install Python 3.7+ and add it to your PATH"
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

echo -e "${GREEN}✅ Python found: $($PYTHON_CMD --version)${NC}"

# Check if we're in the right directory
if [ ! -f "ai_service.py" ]; then
    echo -e "${RED}❌ ai_service.py not found${NC}"
    echo "Please run this script from the python_microservice directory"
    exit 1
fi

# Check if .env file exists in parent directory
if [ ! -f "../.env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found in parent directory${NC}"
    echo "Creating sample .env file..."
    echo "GEMINI_API_KEY=your_api_key_here" > ../.env
    echo -e "${YELLOW}Please edit ../.env and add your actual Gemini API key${NC}"
    echo
fi

echo -e "${GREEN}✅ Environment check passed${NC}"
echo -e "${BLUE}🚀 Starting Python AI Service...${NC}"
echo

# Start the service
$PYTHON_CMD start_ai_service.py

echo
echo -e "${YELLOW}🛑 Service stopped${NC}"

