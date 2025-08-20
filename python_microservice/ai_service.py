#!/usr/bin/env python3
"""
AI Service for Gemini Models
Handles AI processing when Node.js LiteLLM can't support Gemini
"""

import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import litellm

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set up environment variables for LiteLLM
if os.getenv('GEMINI_API_KEY'):
    os.environ['GOOGLE_API_KEY'] = os.getenv('GEMINI_API_KEY')
    logger.info("✅ Gemini API key configured for LiteLLM")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/ai/process', methods=['POST'])
def process_ai_query():
    """Process AI query with Gemini model for intent extraction"""
    try:
        data = request.get_json()
        message = data.get('message')
        model = data.get('model', 'gemini-2.5-flash-lite')
        context = data.get('context')
        
        if not message:
            return jsonify({'success': False, 'error': 'Message is required'})
        
        logger.info(f"🐍 Processing with Python Gemini: {model}")
        logger.info(f"📝 Message: {message[:100]}...")
        
        # Use LiteLLM to process with Gemini
        response = litellm.completion(
            model=f"gemini/{model}",
            messages=[{"role": "user", "content": message}],
            stream=False,
            max_tokens=1000
        )
        
        ai_response = response.choices[0].message.content
        logger.info(f"🤖 AI Response: {ai_response[:100]}...")
        
        # Parse the JSON response
        try:
            # Find JSON in the response
            json_match = None
            if '{' in ai_response and '}' in ai_response:
                start = ai_response.find('{')
                end = ai_response.rfind('}') + 1
                json_match = ai_response[start:end]
            
            if json_match:
                extracted_info = json.loads(json_match)
                logger.info("✅ Successfully parsed JSON response")
                
                # Ensure numeric fields are numbers
                if 'creditAmount' in extracted_info and isinstance(extracted_info['creditAmount'], str):
                    extracted_info['creditAmount'] = float(extracted_info['creditAmount']) or 0
                if 'missingQuantity' in extracted_info and isinstance(extracted_info['missingQuantity'], str):
                    extracted_info['missingQuantity'] = int(extracted_info['missingQuantity']) or 0
                if 'paidAmount' in extracted_info and isinstance(extracted_info['paidAmount'], str):
                    extracted_info['paidAmount'] = float(extracted_info['paidAmount']) or 0
                if 'invoiceAmount' in extracted_info and isinstance(extracted_info['invoiceAmount'], str):
                    extracted_info['invoiceAmount'] = float(extracted_info['invoiceAmount']) or 0
                
                return jsonify({
                    'success': True,
                    'extractedInfo': extracted_info,
                    'rawResponse': ai_response
                })
            else:
                logger.warning("⚠️ No JSON found in AI response")
                return jsonify({
                    'success': False,
                    'error': 'No structured response from AI',
                    'rawResponse': ai_response
                })
                
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing error: {e}")
            return jsonify({
                'success': False,
                'error': f'Failed to parse AI response: {str(e)}',
                'rawResponse': ai_response
            })
            
    except Exception as e:
        logger.error(f"❌ Processing error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/ai/general', methods=['POST'])
def handle_general_query():
    """Handle general conversation queries with Gemini"""
    try:
        data = request.get_json()
        message = data.get('message')
        model = data.get('model', 'gemini-2.5-flash-lite')
        
        if not message:
            return jsonify({'success': False, 'error': 'Message is required'})
        
        logger.info(f"💬 General query with Python Gemini: {model}")
        
        # Use LiteLLM to process with Gemini
        response = litellm.completion(
            model=f"gemini/{model}",
            messages=[{"role": "user", "content": message}],
            stream=False,
            max_tokens=500
        )
        
        ai_response = response.choices[0].message.content
        logger.info(f"💬 General response: {ai_response[:100]}...")
        
        return jsonify({
            'success': True,
            'response': ai_response
        })
        
    except Exception as e:
        logger.error(f"❌ General query error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Python AI Service',
        'gemini_configured': bool(os.getenv('GEMINI_API_KEY'))
    })

if __name__ == '__main__':
    port = int(os.environ.get('PYTHON_AI_PORT', 5001))
    logger.info(f"🚀 Starting Python AI Service on port {port}")
    logger.info(f"🔑 Gemini API Key: {'✅ Configured' if os.getenv('GEMINI_API_KEY') else '❌ Not configured'}")
    
    app.run(host='0.0.0.0', port=port, debug=True)

