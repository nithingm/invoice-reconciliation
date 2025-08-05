#!/usr/bin/env python3
"""
Test script to verify installation and dependencies.
Run this script to check if all required packages are installed correctly.
"""

import sys
import importlib

def test_imports():
    """Test if all required packages can be imported."""
    required_packages = [
        'streamlit',
        'pandas',
        'numpy',
        'pdfplumber',
        'openai',
        'python_dotenv',
        'plotly',
        'PIL',
        'requests',
        'pydantic'
    ]
    
    failed_imports = []
    
    print("🔍 Testing package imports...")
    
    for package in required_packages:
        try:
            if package == 'python_dotenv':
                importlib.import_module('dotenv')
            else:
                importlib.import_module(package.replace('-', '_'))
            print(f"✅ {package}")
        except ImportError as e:
            print(f"❌ {package}: {e}")
            failed_imports.append(package)
    
    return failed_imports

def test_local_modules():
    """Test if local modules can be imported."""
    local_modules = [
        'invoice_processor',
        'credit_memo_processor',
        'reconciliation_agent',
        'utils'
    ]
    
    failed_imports = []
    
    print("\n🔍 Testing local module imports...")
    
    for module in local_modules:
        try:
            importlib.import_module(module)
            print(f"✅ {module}")
        except ImportError as e:
            print(f"❌ {module}: {e}")
            failed_imports.append(module)
    
    return failed_imports

def test_python_version():
    """Test Python version compatibility."""
    print(f"\n🐍 Python version: {sys.version}")
    
    if sys.version_info < (3, 8):
        print("⚠️  Warning: Python 3.8 or higher is recommended")
        return False
    else:
        print("✅ Python version is compatible")
        return True

def main():
    """Run all tests."""
    print("🚀 AI Invoice Reconciliation Agent - Installation Test")
    print("=" * 60)
    
    # Test Python version
    python_ok = test_python_version()
    
    # Test package imports
    failed_packages = test_imports()
    
    # Test local modules
    failed_modules = test_local_modules()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    
    if python_ok and not failed_packages and not failed_modules:
        print("🎉 All tests passed! Your installation is ready.")
        print("\nTo run the application:")
        print("1. Set up your OpenAI API key (see README.md)")
        print("2. Run: streamlit run main.py")
        print("3. Open your browser to http://localhost:8501")
    else:
        print("❌ Some tests failed. Please fix the issues:")
        
        if not python_ok:
            print("- Upgrade to Python 3.8 or higher")
        
        if failed_packages:
            print(f"- Install missing packages: pip install {' '.join(failed_packages)}")
        
        if failed_modules:
            print("- Check that all project files are in the correct directory")
    
    print("\nFor help, see the README.md file.")

if __name__ == "__main__":
    main() 