@echo off
chcp 65001 >nul
echo 🐍 Starting Python AI Service...
echo =================================

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found in PATH
    echo Please install Python and add it to your PATH
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "ai_service.py" (
    echo ❌ ai_service.py not found
    echo Please run this script from the python_microservice directory
    pause
    exit /b 1
)

REM Check if .env file exists in parent directory
if not exist "..\.env" (
    echo ⚠️  .env file not found in parent directory
    echo Creating sample .env file...
    echo GEMINI_API_KEY=your_api_key_here > ..\.env
    echo Please edit ..\.env and add your actual Gemini API key
    echo.
)

echo ✅ Environment check passed
echo 🚀 Starting Python AI Service...
echo.

REM Start the service
python start_ai_service.py

echo.
echo 🛑 Service stopped
pause

