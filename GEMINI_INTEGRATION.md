# Gemini LLM Integration Guide

## Overview

This project now supports Google Gemini LLMs through a hybrid architecture:
- **Node.js backend**: Handles Ollama, OpenAI, and Anthropic models directly
- **Python LiteLLM microservice**: Handles ALL Gemini models (2.0/2.5 series) for maximum compatibility

## Architecture

```
Frontend (React) → Node.js Server → Python AI Service (for Gemini)
                ↓
            LiteLLM (for Ollama/OpenAI/etc.)
```

## Setup Instructions

### Quick Start
For a 5-minute setup guide, see `AI_SERVICE_QUICKSTART.md`.

### 1. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Gemini API Key (required for Gemini models)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Custom port for Python AI service
PYTHON_AI_PORT=5001
```

### 2. Install Dependencies

```bash
# Install all dependencies (including Python)
npm run install-all

# Or install separately:
npm install
cd client && npm install
cd python_microservice && pip install -r requirements.txt
```

### 3. Start the Services

#### Option A: Start all services together
```bash
npm run dev
```
This starts:
- Node.js server (port 5000)
- React client (port 3000)
- Python AI service (port 5001)

#### Option B: Start services individually
```bash
# Terminal 1: Node.js server
npm run server

# Terminal 2: React client
npm run client

# Terminal 3: Python AI service
npm run python-ai
```

#### Option C: Platform-specific startup scripts
```bash
# Windows
cd python_microservice
start_ai_service.bat

# Unix/Linux/Mac
cd python_microservice
chmod +x start_ai_service.sh
./start_ai_service.sh
```

## How It Works

### Model Selection
1. Go to **Settings → AI Settings** in the frontend
2. Select **Google Gemini** as the provider
3. Choose a Gemini model (e.g., `gemini-2.5-flash-lite`)
4. Click **Save Changes**

### AI Processing Flow
1. **User sends message** → Frontend
2. **Frontend → Node.js** → Socket.IO
3. **Node.js checks model type**:
   - If **Gemini model** → Routes to Python LiteLLM service (port 5001)
   - If **Other model** → Processes directly with Node.js
4. **Python LiteLLM service** → Processes with latest Gemini models
5. **Response** → Back through the chain to user

### Supported Models

#### Gemini Models (via LiteLLM)
- `gemini-2.5-flash-lite`
- `gemini-2.0-flash`
- `gemini-2.0-flash-lite`

#### Other Models (via Node.js)
- `ollama/llama3.2:3b`
- `ollama/mistral`
- `gpt-4`
- `claude-3-sonnet`

## Testing

### 1. Test Python Service Health
```bash
curl http://localhost:5001/health
```

### 2. Test Gemini Processing
```bash
curl -X POST http://localhost:5001/ai/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello! Please respond with: {\"intent\": \"general\"}",
    "model": "gemini-2.5-flash-lite"
  }'
```

### 3. Test from Frontend
1. Go to **Settings → AI Settings**
2. Select **Google Gemini** provider
3. Click **Test Service** button
4. Check console for results

## Troubleshooting

### Common Issues

#### 1. "Python service test failed"
- **Cause**: Python service not running
- **Solution**: Start Python service with `npm run python-ai`

#### 2. "Gemini API key not configured"
- **Cause**: Missing `GEMINI_API_KEY` in `.env`
- **Solution**: Add your Gemini API key to `.env` file

#### 3. "Model not supported" error
- **Cause**: Using newer Gemini models with Node.js LiteLLM
- **Solution**: The system automatically routes Gemini models to Python LiteLLM service

#### 4. Port conflicts
- **Cause**: Port 5001 already in use
- **Solution**: Change `PYTHON_AI_PORT` in `.env` file or stop conflicting service

### Debug Mode

Enable debug logging in the Python service:

```python
# In python_microservice/ai_service.py
app.run(host='0.0.0.0', port=port, debug=True)
```

### Logs

- **Node.js**: Check terminal running `npm run server`
- **Python**: Check terminal running `npm run python-ai`
- **Frontend**: Check browser console

## Performance

### Latency
- **Ollama (local)**: ~100-500ms
- **Gemini (cloud)**: ~200-1000ms
- **Python overhead**: ~50-100ms

### Cost
- **Ollama**: Free (local)
- **Gemini**: Pay-per-token (Google pricing)
- **Python service**: Minimal resource usage

## Security

- Gemini API key is stored in `.env` file (not committed to git)
- Python service runs on localhost only
- CORS enabled for local development
- No sensitive data logged

## Future Enhancements

- [ ] Add model caching
- [ ] Implement fallback models
- [ ] Add usage analytics
- [ ] Support for more LLM providers
- [ ] Model performance metrics

## Support

If you encounter issues:

1. Check the logs in all terminal windows
2. Verify environment variables are set correctly
3. Ensure all services are running
4. Test individual components separately
5. Check network connectivity for Gemini API

## API Reference

### Python Service Endpoints

- `POST /ai/process` - Process AI query with Gemini
- `POST /ai/general` - Handle general conversation
- `GET /health` - Service health check

### Node.js AI Endpoints

- `POST /api/ai/config` - Set AI model
- `POST /api/ai/test-gemini` - Test Gemini connection
- `POST /api/ai/test-python-gemini` - Test Python service
- `GET /api/ai/models` - Get available models
