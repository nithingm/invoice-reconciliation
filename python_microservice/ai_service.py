import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import litellm
from credit_validator import CreditValidationService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set up environment variables for LiteLLM
if os.getenv('GEMINI_API_KEY'):
    os.environ['GOOGLE_API_KEY'] = os.getenv('GEMINI_API_KEY')
    logger.info("✅ Gemini API key configured for LiteLLM")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

credit_service = CreditValidationService()

@app.route('/ai/process', methods=['POST'])
def process_ai_query():
    """Process AI query with Gemini model for intent extraction"""
    try:
        data = request.get_json()
        message = data.get('message')
        model = data.get('model', 'gemini-2.5-flash-lite')
        
        if not message:
            return jsonify({'success': False, 'error': 'Message is required'})
        
        logger.info(f"🐍 Processing with Python Gemini: {model}")
        logger.info(f"📝 Message: {message[:100]}...")
        
        response = litellm.completion(
            model=f"gemini/{model}",
            messages=[{"role": "user", "content": message}],
            stream=False,
            max_tokens=1000
        )
        
        ai_response = response.choices[0].message.content
        logger.info(f"🤖 AI Response: {ai_response[:100]}...")
        
        try:
            json_match = None
            if '{' in ai_response and '}' in ai_response:
                start = ai_response.find('{')
                end = ai_response.rfind('}') + 1
                json_match = ai_response[start:end]
            
            if json_match:
                extracted_info = json.loads(json_match)
                logger.info("✅ Successfully parsed JSON response")
                
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

@app.route('/credit/apply', methods=['POST'])
def apply_credit():
    data = request.get_json()
    result = credit_service.apply_credits(
        data.get('customer_id'),
        data.get('customer_name'),
        data.get('credit_amount'),
        data.get('invoice_id')
    )
    return jsonify(result)

@app.route('/credit/balance', methods=['POST'])
def get_credit_balance():
    data = request.get_json()
    result = credit_service.get_credit_balance(
        data.get('customer_id'),
        data.get('customer_name')
    )
    return jsonify(result)

@app.route('/purchase/history', methods=['POST'])
def get_purchase_history():
    data = request.get_json()
    result = credit_service.get_purchase_history(
        data.get('customer_id'),
        data.get('customer_name')
    )
    return jsonify(result)

@app.route('/discrepancy/quantity', methods=['POST'])
def process_quantity_discrepancy():
    data = request.get_json()
    result = credit_service.process_quantity_discrepancy(
        data.get('customer_id'),
        data.get('customer_name'),
        data.get('invoice_id'),
        data.get('missing_quantity'),
        data.get('item_description')
    )
    return jsonify(result)

@app.route('/discrepancy/damage', methods=['POST'])
def process_damage_report():
    data = request.get_json()
    result = credit_service.process_damage_report(
        data.get('customer_id'),
        data.get('customer_name'),
        data.get('invoice_id'),
        data.get('item_description'),
        data.get('damage_description')
    )
    return jsonify(result)

@app.route('/credit_memo/approve', methods=['POST'])
def approve_credit_memo():
    data = request.get_json()
    result = credit_service.approve_credit_memo(
        data.get('credit_memo_id'),
        data.get('customer_choice'),
        data.get('target_invoice_id')
    )
    return jsonify(result)

@app.route('/payment/partial', methods=['POST'])
def process_partial_payment():
    data = request.get_json()
    result = credit_service.process_partial_payment(
        data.get('customer_id'),
        data.get('customer_name'),
        data.get('invoice_id'),
        data.get('paid_amount'),
        data.get('invoice_amount')
    )
    return jsonify(result)

if __name__ == '__main__':
    port = int(os.environ.get('PYTHON_AI_PORT', 5001))
    logger.info(f"🚀 Starting Python AI Service on port {port}")
    logger.info(f"🔑 Gemini API Key: {'✅ Configured' if os.getenv('GEMINI_API_KEY') else '❌ Not configured'}")
    
    app.run(host='0.0.0.0', port=port, debug=True)

