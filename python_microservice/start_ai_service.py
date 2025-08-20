#!/usr/bin/env python3
"""
Startup script for the Python AI Service
This service handles Gemini model processing for the Node.js backend
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def check_dependencies():
    """Check if required Python packages are installed"""
    required_packages = ['flask', 'flask_cors', 'litellm', 'dotenv']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"[ERROR] Missing required packages: {', '.join(missing_packages)}")
        print("[INFO] Installing missing packages...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing_packages)
            print("[SUCCESS] Dependencies installed successfully")
        except subprocess.CalledProcessError:
            print("[ERROR] Failed to install dependencies. Please run manually:")
            print(f"   pip install {' '.join(missing_packages)}")
            return False
    return True

def check_environment():
    """Check environment configuration"""
    print("[INFO] Checking environment configuration...")
    
    # Load environment variables first
    from dotenv import load_dotenv
    env_file = Path(__file__).parent.parent / '.env'
    if env_file.exists():
        print("[SUCCESS] .env file found")
        load_dotenv(env_file)
    else:
        print("[WARNING] .env file not found in root directory")
        print("   Create .env file with GEMINI_API_KEY=your_api_key")
        return False
    
    # Check Gemini API key
    gemini_key = os.getenv('GEMINI_API_KEY')
    if gemini_key:
        print(f"[SUCCESS] Gemini API key configured (length: {len(gemini_key)})")
        # Set for LiteLLM
        os.environ['GOOGLE_API_KEY'] = gemini_key
        os.environ['GOOGLE_GENERATIVE_AI_API_KEY'] = gemini_key
    else:
        print("[ERROR] GEMINI_API_KEY not found in environment")
        print("   Please set GEMINI_API_KEY in your .env file")
        return False
    
    return True

def test_litellm_connection():
    """Test if LiteLLM can connect to Gemini"""
    try:
        import litellm
        print("[INFO] Testing LiteLLM Gemini connection...")
        
        # Test with a simple prompt
        response = litellm.completion(
            model="gemini/gemini-2.5-flash-lite",
            messages=[{"role": "user", "content": "Hello! Respond with 'OK'"}],
            stream=False,
            max_tokens=10
        )
        
        if response.choices and response.choices[0].message.content:
            print("[SUCCESS] LiteLLM Gemini connection successful!")
            return True
        else:
            print("[ERROR] LiteLLM response was empty")
            return False
            
    except Exception as e:
        print(f"[ERROR] LiteLLM test failed: {str(e)}")
        return False

def start_service():
    """Start the Flask AI service"""
    try:
        # Add the current directory to Python path
        current_dir = Path(__file__).parent
        sys.path.insert(0, str(current_dir))
        
        # Import the Flask app
        from ai_service import app
        
        port = int(os.environ.get('PYTHON_AI_PORT', 5001))
        
        print(f"\n[STARTUP] Starting Python AI Service...")
        print(f"[INFO] Port: {port}")
        print(f"[INFO] Service URL: http://localhost:{port}")
        print(f"[INFO] Health Check: http://localhost:{port}/health")
        print(f"[INFO] API Endpoints:")
        print(f"   POST /ai/process - Process AI queries")
        print(f"   POST /ai/general - Handle general queries")
        print(f"   GET /health - Service health")
        print(f"\n[STATUS] Service Status: Running")
        print("[INFO] Press Ctrl+C to stop the service")
        print("=" * 60)
        
        # Start the Flask app
        app.run(
            host='0.0.0.0', 
            port=port, 
            debug=True,
            use_reloader=False  # Disable reloader to avoid duplicate processes
        )
        
    except ImportError as e:
        print(f"[ERROR] Import error: {e}")
        print("[INFO] Make sure all dependencies are installed:")
        print("   pip install -r requirements.txt")
    except Exception as e:
        print(f"[ERROR] Service startup failed: {e}")
        return False
    
    return True

def main():
    """Main startup function"""
    print("Python AI Service Startup")
    print("=" * 40)
    
    # Check dependencies
    if not check_dependencies():
        print("[ERROR] Dependency check failed. Exiting.")
        sys.exit(1)
    
    # Check environment
    if not check_environment():
        print("[ERROR] Environment check failed. Exiting.")
        sys.exit(1)
    
    # Test LiteLLM connection
    if not test_litellm_connection():
        print("[ERROR] LiteLLM connection test failed. Exiting.")
        sys.exit(1)
    
    print("\n[SUCCESS] All checks passed! Starting service...")
    
    # Start the service
    try:
        start_service()
    except KeyboardInterrupt:
        print("\n\n[INFO] Service stopped by user")
        print("[INFO] Goodbye!")
    except Exception as e:
        print(f"\n[ERROR] Service crashed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
