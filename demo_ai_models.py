#!/usr/bin/env python3
"""
Demo script showing how to use different AI models for invoice reconciliation.
This demonstrates the new LiteLLM-based client that can easily switch between providers.
"""

import os
import sys
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_config import create_ai_client, get_available_providers, print_available_configs
from reconciliation_agent import ReconciliationAgent

# Load environment variables
load_dotenv()

def demo_ai_models():
    """Demonstrate using different AI models for reconciliation."""
    
    print("🤖 AI Model Demo for Invoice Reconciliation")
    print("=" * 60)
    
    # Show available configurations
    print_available_configs()
    print("\n" + "=" * 60)
    
    # Sample data for testing
    sample_invoices = [{
        'invoice_number': 'INV-2024-001',
        'invoice_date': '2024-01-15',
        'customer_name': 'ABC Corporation',
        'total_amount': 1650.00,
        'currency': 'USD',
        'vendor_name': 'Tech Supplies Inc.'
    }]
    
    sample_credit_memos = [{
        'credit_memo_number': 'CM-2024-001',
        'credit_memo_date': '2024-01-20',
        'original_invoice_number': 'INV-2024-001',
        'customer_name': 'ABC Corporation',
        'credit_amount': 1650.00,
        'currency': 'USD',
        'vendor_name': 'Tech Supplies Inc.'
    }]
    
    # Test different providers
    providers_to_test = get_available_providers()
    
    for provider in providers_to_test:
        print(f"\n🧪 Testing {provider.upper()} Provider")
        print("-" * 40)
        
        try:
            # Create AI client for this provider
            ai_client = create_ai_client(provider=provider)
            
            # Test connection
            if ai_client.is_server_available():
                print(f"✅ {provider.upper()} connection successful")
                
                # Test basic generation
                response = ai_client.generate_response("Hello, please respond with 'OK'", max_tokens=10)
                if response:
                    print(f"✅ Basic generation test passed")
                    
                    # Test reconciliation analysis
                    analysis = ai_client.analyze_reconciliation_data(sample_invoices, sample_credit_memos)
                    if 'error' not in analysis:
                        print(f"✅ Reconciliation analysis successful")
                        if 'summary' in analysis:
                            print(f"   Summary: {analysis['summary']}")
                    else:
                        print(f"⚠️  Analysis error: {analysis['error']}")
                else:
                    print(f"❌ Basic generation failed")
            else:
                print(f"❌ {provider.upper()} connection failed")
                
        except Exception as e:
            print(f"❌ Error testing {provider}: {str(e)}")
    
    print("\n" + "=" * 60)
    print("🎯 Testing Reconciliation Agent with Different Models")
    print("=" * 60)
    
    # Test reconciliation agent with different models
    for provider in providers_to_test:
        print(f"\n🔍 Testing Reconciliation Agent with {provider.upper()}")
        print("-" * 40)
        
        try:
            agent = ReconciliationAgent(provider=provider)
            
            if agent.ai_client.is_server_available():
                print(f"✅ Agent initialized with {provider}")
                
                # Test reconciliation
                results = agent.reconcile_documents(sample_invoices, sample_credit_memos)
                
                # Check results
                matched_pairs = results.get('matched_pairs', [])
                if matched_pairs:
                    print(f"✅ Found {len(matched_pairs)} matched pairs")
                    for pair in matched_pairs:
                        confidence = pair.get('match_confidence', 0)
                        print(f"   Confidence: {confidence:.1f}%")
                else:
                    print("⚠️  No matched pairs found")
                
                # Check AI analysis
                ai_analysis = results.get('ai_analysis', {})
                if 'error' not in ai_analysis:
                    print("✅ AI analysis included")
                else:
                    print(f"⚠️  AI analysis error: {ai_analysis['error']}")
            else:
                print(f"❌ Agent failed to connect to {provider}")
                
        except Exception as e:
            print(f"❌ Error with {provider}: {str(e)}")

def demo_model_switching():
    """Demonstrate how easy it is to switch between models."""
    
    print("\n🔄 Model Switching Demo")
    print("=" * 40)
    
    # Same sample data
    sample_invoices = [{
        'invoice_number': 'INV-2024-002',
        'invoice_date': '2024-02-15',
        'customer_name': 'XYZ Company',
        'total_amount': 2500.00,
        'currency': 'USD'
    }]
    
    sample_credit_memos = [{
        'credit_memo_number': 'CM-2024-002',
        'credit_memo_date': '2024-02-20',
        'original_invoice_number': 'INV-2024-002',
        'customer_name': 'XYZ Company',
        'credit_amount': 2500.00,
        'currency': 'USD'
    }]
    
    # Test with different models
    models_to_test = [
        ("openai", "gpt-3.5-turbo"),
        ("anthropic", "claude-3-sonnet-20240229"),
        ("ollama", "llama2")
    ]
    
    for provider, model in models_to_test:
        print(f"\n🤖 Testing {provider.upper()} with {model}")
        print("-" * 30)
        
        try:
            agent = ReconciliationAgent(provider=provider, model=model)
            
            if agent.ai_client.is_server_available():
                print(f"✅ Connected to {model}")
                
                # Quick validation test
                validation = agent.ai_client.validate_match_with_ai(
                    sample_invoices[0], sample_credit_memos[0]
                )
                
                if 'error' not in validation:
                    is_valid = validation.get('is_valid_match', False)
                    confidence = validation.get('confidence_score', 0)
                    print(f"✅ Validation: {'Valid' if is_valid else 'Invalid'} (Confidence: {confidence:.1%})")
                else:
                    print(f"⚠️  Validation error: {validation['error']}")
            else:
                print(f"❌ Could not connect to {model}")
                
        except Exception as e:
            print(f"❌ Error with {model}: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting AI Model Demo")
    print("=" * 60)
    
    # Run demos
    demo_ai_models()
    demo_model_switching()
    
    print("\n" + "=" * 60)
    print("✅ Demo completed!")
    print("\n💡 Key Benefits of the New System:")
    print("   - Easy switching between AI providers")
    print("   - Consistent interface across all models")
    print("   - Automatic API key detection")
    print("   - Support for local and cloud models")
    print("   - No code changes needed to switch models")
