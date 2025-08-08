# AI Model Switching with LiteLLM

This document explains how to use the new AI model switching capabilities in the invoice reconciliation system.

## Overview

The system now uses **LiteLLM** instead of the direct Ollama client, allowing you to easily switch between different AI providers and models without changing any code.

## Supported AI Providers

### 1. OpenAI
- **Models**: gpt-3.5-turbo, gpt-4, gpt-4-turbo
- **Setup**: Set `OPENAI_API_KEY` environment variable
- **Usage**: Best for high-quality analysis and reasoning

### 2. Anthropic (Claude)
- **Models**: claude-3-sonnet-20240229, claude-3-opus-20240229, claude-3-haiku-20240307
- **Setup**: Set `ANTHROPIC_API_KEY` environment variable
- **Usage**: Excellent for complex financial analysis

### 3. Ollama (Local Models)
- **Models**: llama2, llama2:13b, mistral, codellama
- **Setup**: Install and run Ollama locally
- **Usage**: Privacy-focused, no internet required

### 4. Google (Gemini) - Optional
- **Models**: gemini-2.0-flash, gemini-pro
- **Setup**: Set `GOOGLE_API_KEY` environment variable
- **Usage**: Good for multimodal analysis
- **Note**: Optional - requires `google-auth` and `google-cloud-aiplatform` packages for full functionality

### 5. Cohere
- **Models**: command, command-light
- **Setup**: Set `COHERE_API_KEY` environment variable
- **Usage**: Fast and efficient for text processing

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Up API Keys
Create a `.env` file in your project directory:
```bash
# For OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# For Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# For Google
GOOGLE_API_KEY=your_google_api_key_here

# For Cohere
COHERE_API_KEY=your_cohere_api_key_here
```

### 3. Run the Demo
```bash
python demo_ai_models.py
```

### 4. Start the Web Application
```bash
streamlit run main.py
```

## Usage Examples

### Basic Usage
```python
from ai_config import create_ai_client

# Auto-detect best available provider
client = create_ai_client()

# Or specify a provider
client = create_ai_client(provider="openai", model="gpt-4")
```

### With Reconciliation Agent
```python
from reconciliation_agent import ReconciliationAgent

# Use default provider
agent = ReconciliationAgent()

# Use specific provider
agent = ReconciliationAgent(provider="anthropic", model="claude-3-sonnet-20240229")

# Use local Ollama
agent = ReconciliationAgent(provider="ollama", model="llama2", base_url="http://localhost:11434")
```

### Switching Models Programmatically
```python
from ai_config import get_available_providers, create_ai_client

# Get all available providers
providers = get_available_providers()
print(f"Available providers: {providers}")

# Test different models
for provider in providers:
    client = create_ai_client(provider=provider)
    if client.is_server_available():
        print(f"✅ {provider} is available")
    else:
        print(f"❌ {provider} is not available")
```

## Configuration

### Environment Variables
The system automatically detects available API keys in this order:
1. `OPENAI_API_KEY`
2. `ANTHROPIC_API_KEY`
3. `GOOGLE_API_KEY`
4. `COHERE_API_KEY`
5. Falls back to Ollama (local)

### Provider-Specific Settings

#### OpenAI
```python
client = create_ai_client(
    provider="openai",
    model="gpt-4",
    api_key="your_key_here"  # Optional if set in env
)
```

#### Anthropic
```python
client = create_ai_client(
    provider="anthropic",
    model="claude-3-sonnet-20240229",
    api_key="your_key_here"  # Optional if set in env
)
```

#### Ollama (Local)
```python
client = create_ai_client(
    provider="ollama",
    model="llama2",
    base_url="http://localhost:11434"  # Optional, defaults to localhost
)
```

## Testing

### Run AI Integration Tests
```bash
python test_ai_integration.py
```

### Test Specific Provider
```python
from ai_config import create_ai_client

# Test OpenAI
client = create_ai_client(provider="openai")
if client.is_server_available():
    response = client.generate_response("Hello, world!")
    print(f"Response: {response}")
```

## Benefits of the New System

### 1. **Easy Model Switching**
- No code changes required to switch between providers
- Consistent interface across all models
- Automatic fallback to available providers

### 2. **Flexible Configuration**
- Environment variable-based configuration
- Support for both cloud and local models
- Easy to add new providers

### 3. **Better Error Handling**
- Graceful fallback when models are unavailable
- Clear error messages for setup issues
- Automatic retry logic

### 4. **Cost Optimization**
- Use local models for development
- Switch to cloud models for production
- Mix and match based on requirements

## Troubleshooting

### Common Issues

#### 1. "API Key Not Found"
**Solution**: Set the appropriate environment variable:
```bash
export OPENAI_API_KEY="your_key_here"
```

#### 2. "Ollama Connection Failed"
**Solution**: Install and start Ollama:
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama
ollama serve

# Pull a model
ollama pull llama2
```

#### 3. "Model Not Available"
**Solution**: Check the model name and provider:
```python
from ai_config import AI_CONFIGS
print(AI_CONFIGS["openai"]["model"])  # See available models
```

#### 4. "Google Provider Issues"
**Solution**: Google provider is optional. If you want to use it:
```bash
pip install google-auth google-cloud-aiplatform
```
If you don't need Google provider, simply don't set `GOOGLE_API_KEY` and the system will work with other providers.

### Debug Mode
Enable debug logging to see detailed information:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Migration from OllamaClient

If you were using the old `OllamaClient`, here's how to migrate:

### Old Code
```python
from ollama_client import OllamaClient

client = OllamaClient(base_url="http://localhost:11434", model="llama2")
```

### New Code
```python
from litellm_client import LiteLLMClient

client = LiteLLMClient(
    model="llama2",
    base_url="http://localhost:11434",
    provider="ollama"
)
```

Or use the configuration helper:
```python
from ai_config import create_ai_client

client = create_ai_client(provider="ollama", model="llama2")
```

## Performance Comparison

| Provider | Speed | Quality | Cost | Privacy |
|----------|-------|---------|------|---------|
| OpenAI | Fast | High | Medium | Cloud |
| Anthropic | Medium | Very High | High | Cloud |
| Ollama | Slow | Medium | Free | Local |
| Google | Fast | High | Low | Cloud |
| Cohere | Very Fast | Good | Low | Cloud |

## Best Practices

1. **Development**: Use Ollama for cost-free development
2. **Testing**: Use OpenAI for reliable testing
3. **Production**: Use Anthropic for high-quality analysis
4. **Budget**: Use Google or Cohere for cost-effective solutions

## Future Enhancements

- [ ] Add support for more providers (Azure, AWS Bedrock)
- [ ] Implement model performance tracking
- [ ] Add automatic model selection based on task
- [ ] Support for fine-tuned models
- [ ] Batch processing capabilities
