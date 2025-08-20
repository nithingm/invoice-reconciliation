# AI Service Quick Start Guide

## 🚀 Quick Start (5 minutes)

**Get Google Gemini 2.0/2.5 models working with LiteLLM in 5 minutes!**

### 1. Install Dependencies
```bash
# Install Python dependencies
npm run install:python

# Or manually:
cd python_microservice
pip install -r requirements.txt
```

### 2. Set Up Environment
Create `.env` file in the root directory:
```bash
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Start the AI Service

#### Option A: Using npm scripts
```bash
# Start AI service only
npm run python-ai

# Start all services together
npm run dev
```

#### Option B: Using platform-specific scripts
```bash
# Windows
cd python_microservice
start_ai_service.bat

# Unix/Linux/Mac
cd python_microservice
chmod +x start_ai_service.sh
./start_ai_service.sh
```

#### Option C: Direct Python execution
```bash
cd python_microservice
python start_ai_service.py
```

### 4. Verify Service is Running
```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Python AI Service",
  "gemini_configured": true
}
```

## 🔧 Configuration

### Environment Variables
- `GEMINI_API_KEY`: Your Gemini API key (required)
- `PYTHON_AI_PORT`: Python service port (default: 5001)

### Supported Models
- `gemini-2.5-flash-lite` (recommended for cost efficiency)
- `gemini-2.0-flash` (recommended for speed)
- `gemini-2.0-flash-lite` (recommended for low latency)

## 🧪 Testing

### Test from Frontend
1. Go to **Settings → AI Settings**
2. Select **Google Gemini** provider
3. Choose a model (e.g., `gemini-2.5-flash-lite`)
4. Click **Test Service**

### Test from Command Line
```bash
# Test AI processing
curl -X POST http://localhost:5001/ai/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello! Please respond with: {\"intent\": \"general\"}",
    "model": "gemini-2.5-flash-lite"
  }'
```

## 🐛 Troubleshooting

### Service Won't Start
```bash
# Check Python version
python --version  # Should be 3.7+

# Check dependencies
pip list | grep -E "(flask|litellm|dotenv)"

# Install missing packages
pip install flask flask-cors litellm python-dotenv
```

### Gemini Connection Issues
```bash
# Test API key
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://generativelanguage.googleapis.com/v1beta/models"

# Check environment
echo $GEMINI_API_KEY
```

### Port Already in Use
```bash
# Find process using port 5001
netstat -ano | findstr :5001  # Windows
lsof -i :5001                 # Unix/Linux/Mac

# Kill process or change port in .env
echo "PYTHON_AI_PORT=5002" >> .env
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:5001/health
```

### Logs
The service outputs detailed logs including:
- 🐍 Service startup information
- 🔍 Environment checks
- 🧪 Connection tests
- 📝 Request processing
- 🤖 AI responses
- ❌ Error details

### Performance Metrics
- **Startup time**: ~2-5 seconds
- **Request latency**: ~200-1000ms (depending on Gemini model)
- **Memory usage**: ~50-100MB
- **CPU usage**: Minimal (mostly I/O bound)

## 🔄 Integration

### With Node.js Backend
The AI service automatically integrates with your Node.js backend:
1. Backend detects Gemini model selection
2. Routes requests to Python service
3. Python service processes with Gemini
4. Returns structured response to backend
5. Backend formats and sends to frontend

### API Endpoints
- `POST /ai/process` - Main AI processing endpoint
- `POST /ai/general` - General conversation handling
- `GET /health` - Service health and status

## 🚨 Emergency Stop
```bash
# Find and kill the process
pkill -f "start_ai_service.py"  # Unix/Linux/Mac
taskkill /F /IM python.exe      # Windows

# Or use Ctrl+C in the terminal running the service
```

## 📚 Next Steps

- Read `GEMINI_INTEGRATION.md` for detailed setup
- Check `README.md` for full project overview
- Explore the Settings page in the frontend
- Test different Gemini models
- Monitor performance and adjust as needed

## 🆘 Need Help?

1. Check the logs in the terminal
2. Verify your `.env` configuration
3. Test the health endpoint
4. Review this guide and `GEMINI_INTEGRATION.md`
5. Check if all dependencies are installed
6. Verify your Gemini API key is valid

