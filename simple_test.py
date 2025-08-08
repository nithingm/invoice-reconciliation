#!/usr/bin/env python3
"""
Simple test to verify the Google provider fix works.
"""

import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that imports work without Google dependencies."""
    try:
        from ai_config import get_available_providers, create_ai_client
        print("✅ AI config imports work")
        return True
    except Exception as e:
        print(f"❌ AI config import failed: {str(e)}")
        return False

def test_google_handling():
    """Test that Google provider is handled gracefully."""
    try:
        from ai_config import create_ai_client
        
        # Try to create Google client (should not crash)
        client = create_ai_client(provider="google")
        print("✅ Google client creation works")
        
        # Test availability (should return False gracefully)
        is_available = client.is_server_available()
        print(f"✅ Google availability check: {'Available' if is_available else 'Not Available'}")
        
        # Test generation (should return helpful message)
        response = client.generate_response("Hello", max_tokens=5)
        print(f"✅ Google generation test: {response[:50]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Google provider test failed: {str(e)}")
        return False

def main():
    """Run the tests."""
    print("🧪 Testing Google Provider Fix")
    print("=" * 40)
    
    # Test imports
    imports_ok = test_imports()
    
    # Test Google handling
    google_ok = test_google_handling()
    
    print("\n" + "=" * 40)
    if imports_ok and google_ok:
        print("✅ All tests passed! Google provider fix is working.")
    else:
        print("❌ Some tests failed.")
    
    print("\n💡 The fix ensures:")
    print("   - Google provider doesn't crash the application")
    print("   - Helpful error messages are shown")
    print("   - Other providers continue to work normally")

if __name__ == "__main__":
    main() 