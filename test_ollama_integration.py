#!/usr/bin/env python3
"""
Test script for Ollama integration in the invoice reconciliation system.
"""

import sys
import os
import requests
import json
from datetime import datetime

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ollama_client import OllamaClient
from reconciliation_agent import ReconciliationAgent

def test_ollama_connection():
    """Test basic Ollama server connection."""
    print("🔗 Testing Ollama Connection")
    print("=" * 40)
    
    client = OllamaClient()
    
    if client.is_server_available():
        print("✅ Ollama server is accessible")
        
        # Get available models
        models = client.get_available_models()
        if models:
            print(f"📋 Available models: {', '.join(models)}")
        else:
            print("⚠️  No models found. You may need to pull a model first.")
            print("   Try: ollama pull llama2")
        
        return True
    else:
        print("❌ Ollama server is not accessible")
        print("   Make sure Ollama is installed and running:")
        print("   1. Install from https://ollama.ai/")
        print("   2. Start the service")
        print("   3. Pull a model: ollama pull llama2")
        return False

def test_ollama_generation():
    """Test basic text generation with Ollama."""
    print("\n🤖 Testing Ollama Text Generation")
    print("=" * 40)
    
    client = OllamaClient()
    
    if not client.is_server_available():
        print("❌ Skipping generation test - server not available")
        return False
    
    # Test simple generation
    prompt = "What is 2 + 2? Please respond with just the number."
    response = client.generate_response(prompt, temperature=0.1)
    
    if response:
        print(f"✅ Generation successful")
        print(f"Prompt: {prompt}")
        print(f"Response: {response.strip()}")
        return True
    else:
        print("❌ Generation failed")
        return False

def test_reconciliation_agent():
    """Test the reconciliation agent with Ollama."""
    print("\n🔍 Testing Reconciliation Agent")
    print("=" * 40)
    
    # Create sample data
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
    
    try:
        agent = ReconciliationAgent()
        print("✅ Reconciliation agent initialized")
        
        # Test reconciliation
        results = agent.reconcile_documents(sample_invoices, sample_credit_memos)
        print("✅ Reconciliation completed")
        
        # Check for AI analysis
        if 'ai_analysis' in results:
            ai_analysis = results['ai_analysis']
            if 'error' not in ai_analysis:
                print("✅ AI analysis included in results")
                if 'summary' in ai_analysis:
                    print(f"   Summary: {ai_analysis['summary']}")
            else:
                print(f"⚠️  AI analysis error: {ai_analysis['error']}")
        else:
            print("⚠️  No AI analysis in results")
        
        # Check matched pairs
        matched_pairs = results.get('matched_pairs', [])
        if matched_pairs:
            print(f"✅ Found {len(matched_pairs)} matched pairs")
            for pair in matched_pairs:
                confidence = pair.get('match_confidence', 0)
                print(f"   Confidence: {confidence:.1f}%")
        else:
            print("⚠️  No matched pairs found")
        
        return True
        
    except Exception as e:
        print(f"❌ Reconciliation agent test failed: {str(e)}")
        return False

def test_validation_with_ai():
    """Test AI-powered validation."""
    print("\n✅ Testing AI Validation")
    print("=" * 40)
    
    client = OllamaClient()
    
    if not client.is_server_available():
        print("❌ Skipping validation test - server not available")
        return False
    
    # Test validation
    invoice = {
        'invoice_number': 'INV-2024-001',
        'customer_name': 'ABC Corporation',
        'total_amount': 1650.00,
        'invoice_date': '2024-01-15',
        'currency': 'USD'
    }
    
    credit_memo = {
        'credit_memo_number': 'CM-2024-001',
        'original_invoice_number': 'INV-2024-001',
        'customer_name': 'ABC Corporation',
        'credit_amount': 1650.00,
        'credit_memo_date': '2024-01-20',
        'currency': 'USD'
    }
    
    result = client.validate_match_with_ai(invoice, credit_memo)
    
    if 'error' not in result:
        print("✅ AI validation successful")
        print(f"   Is valid match: {result.get('is_valid_match', 'Unknown')}")
        print(f"   Confidence: {result.get('confidence_score', 0):.1%}")
        if 'reasoning' in result:
            print(f"   Reasoning: {result['reasoning']}")
        return True
    else:
        print(f"❌ AI validation failed: {result['error']}")
        return False

def main():
    """Run all tests."""
    print("🧪 Ollama Integration Test Suite")
    print("=" * 50)
    print()
    
    tests = [
        ("Ollama Connection", test_ollama_connection),
        ("Text Generation", test_ollama_generation),
        ("Reconciliation Agent", test_reconciliation_agent),
        ("AI Validation", test_validation_with_ai)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*60}")
        print(f"Running: {test_name}")
        print(f"{'='*60}")
        
        try:
            if test_func():
                passed += 1
                print(f"✅ {test_name} - PASSED")
            else:
                print(f"❌ {test_name} - FAILED")
        except Exception as e:
            print(f"❌ {test_name} - ERROR: {str(e)}")
    
    print(f"\n{'='*60}")
    print(f"Test Results: {passed}/{total} tests passed")
    print(f"{'='*60}")
    
    if passed == total:
        print("🎉 All tests passed! Ollama integration is working correctly.")
    elif passed > 0:
        print("⚠️  Some tests passed. Check the output above for details.")
    else:
        print("❌ No tests passed. Please check your Ollama setup.")
    
    print("\nNext steps:")
    print("1. If tests passed, you can run the main application:")
    print("   streamlit run main.py")
    print("2. If tests failed, check your Ollama installation:")
    print("   - Install from https://ollama.ai/")
    print("   - Start the service")
    print("   - Pull a model: ollama pull llama2")

if __name__ == "__main__":
    main() 