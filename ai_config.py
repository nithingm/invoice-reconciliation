"""
AI Model Configuration for Invoice Reconciliation System

This module provides easy configuration for different AI models and providers.
You can easily switch between OpenAI, Anthropic, Ollama, and other providers.
"""

import os
from typing import Dict, Any, Optional

# Default configurations for different providers
AI_CONFIGS = {
    "openai": {
        "model": "gpt-3.5-turbo",
        "api_key_env": "OPENAI_API_KEY",
        "base_url": None,
        "provider": "openai"
    },
    "anthropic": {
        "model": "claude-3-sonnet-20240229",
        "api_key_env": "ANTHROPIC_API_KEY",
        "base_url": None,
        "provider": "anthropic"
    },
    "ollama": {
        "model": "llama2",
        "api_key_env": None,
        "base_url": "http://localhost:11434",
        "provider": "ollama"
    },
    "google": {
        "model": "gemini/gemini-2.0-flash",
        "api_key_env": "GOOGLE_API_KEY",
        "base_url": None,
        "provider": "google"
    },
    "cohere": {
        "model": "command",
        "api_key_env": "COHERE_API_KEY",
        "base_url": None,
        "provider": "cohere"
    }
}

def get_ai_config(provider: str = "openai") -> Dict[str, Any]:
    """
    Get configuration for a specific AI provider.
    
    Args:
        provider: Provider name (openai, anthropic, ollama, google, cohere)
        
    Returns:
        Configuration dictionary
    """
    if provider not in AI_CONFIGS:
        raise ValueError(f"Unknown provider: {provider}. Available providers: {list(AI_CONFIGS.keys())}")
    
    config = AI_CONFIGS[provider].copy()
    
    # Get API key from environment if specified
    if config["api_key_env"]:
        config["api_key"] = os.getenv(config["api_key_env"])
    
    return config

def get_available_providers() -> list:
    """Get list of available AI providers."""
    return list(AI_CONFIGS.keys())

def get_default_provider() -> str:
    """
    Get the default provider based on available API keys.
    
    Returns:
        Default provider name
    """
    # Check for API keys in order of preference
    if os.getenv("OPENAI_API_KEY"):
        return "openai"
    elif os.getenv("ANTHROPIC_API_KEY"):
        return "anthropic"
    elif os.getenv("GOOGLE_API_KEY"):
        return "google"
    elif os.getenv("COHERE_API_KEY"):
        return "cohere"
    else:
        # Default to ollama for local models
        return "ollama"

def create_ai_client(provider: str = None, model: str = None, 
                    api_key: str = None, base_url: str = None) -> 'LiteLLMClient':
    """
    Create an AI client with the specified configuration.
    
    Args:
        provider: Provider name (if None, will auto-detect)
        model: Model name (if None, will use provider default)
        api_key: API key (if None, will use environment variable)
        base_url: Base URL for local models
        
    Returns:
        Configured LiteLLMClient instance
    """
    from litellm_client import LiteLLMClient
    
    if provider is None:
        provider = get_default_provider()
    
    config = get_ai_config(provider)
    
    # Override with provided parameters
    if model:
        config["model"] = model
    if api_key:
        config["api_key"] = api_key
    if base_url:
        config["base_url"] = base_url
    
    return LiteLLMClient(
        model=config["model"],
        api_key=config.get("api_key"),
        base_url=config.get("base_url"),
        provider=config["provider"]
    )

def print_available_configs():
    """Print all available AI configurations."""
    print("🤖 Available AI Model Configurations")
    print("=" * 50)
    
    for provider, config in AI_CONFIGS.items():
        print(f"\n📋 {provider.upper()}")
        print(f"   Model: {config['model']}")
        if config['api_key_env']:
            api_key = os.getenv(config['api_key_env'])
            status = "✅ Set" if api_key else "❌ Not set"
            print(f"   API Key ({config['api_key_env']}): {status}")
        if config['base_url']:
            print(f"   Base URL: {config['base_url']}")
    
    print(f"\n🎯 Default Provider: {get_default_provider()}")
    print("\n💡 To use a different provider:")
    print("   - Set the appropriate API key environment variable")
    print("   - Or specify provider when creating the client")

if __name__ == "__main__":
    print_available_configs()
