import requests
import json
import logging
from typing import Dict, Any, List, Optional
import time

class OllamaClient:
    """
    Client for communicating with local Ollama server for AI-powered reconciliation.
    """
    
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama2"):
        """
        Initialize the Ollama client.
        
        Args:
            base_url: Ollama server URL (default: localhost:11434)
            model: Model name to use (default: llama2)
        """
        self.base_url = base_url.rstrip('/')
        self.model = model
        self.logger = logging.getLogger(__name__)
        
    def is_server_available(self) -> bool:
        """
        Check if Ollama server is available.
        
        Returns:
            True if server is available, False otherwise
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except Exception as e:
            self.logger.warning(f"Ollama server not available: {str(e)}")
            return False
    
    def get_available_models(self) -> List[str]:
        """
        Get list of available models.
        
        Returns:
            List of available model names
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            if response.status_code == 200:
                data = response.json()
                return [model['name'] for model in data.get('models', [])]
            return []
        except Exception as e:
            self.logger.error(f"Error getting available models: {str(e)}")
            return []
    
    def generate_response(self, prompt: str, system_prompt: str = None, 
                         temperature: float = 0.1, max_tokens: int = 2000) -> str:
        """
        Generate response from Ollama model.
        
        Args:
            prompt: The user prompt
            system_prompt: System prompt (optional)
            temperature: Temperature for generation (0.0-1.0)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated response text
        """
        try:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }
            
            if system_prompt:
                payload["system"] = system_prompt
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('response', '')
            else:
                self.logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                return ""
                
        except Exception as e:
            self.logger.error(f"Error generating response: {str(e)}")
            return ""
    
    def analyze_reconciliation_data(self, invoices: List[Dict[str, Any]], 
                                  credit_memos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze reconciliation data using AI.
        
        Args:
            invoices: List of invoice data
            credit_memos: List of credit memo data
            
        Returns:
            AI analysis results
        """
        if not self.is_server_available():
            return {"error": "Ollama server not available"}
        
        # Prepare data for analysis
        invoice_summary = self._prepare_invoice_summary(invoices)
        credit_memo_summary = self._prepare_credit_memo_summary(credit_memos)
        
        system_prompt = """You are an expert financial analyst specializing in invoice and credit memo reconciliation. 
        Analyze the provided data and identify potential issues, patterns, and insights. 
        Provide your analysis in JSON format with the following structure:
        {
            "analysis_type": "reconciliation_analysis",
            "key_insights": ["list of key insights"],
            "potential_issues": ["list of potential issues"],
            "recommendations": ["list of recommendations"],
            "confidence_score": 0.85,
            "summary": "brief summary of findings"
        }"""
        
        prompt = f"""
        Please analyze the following invoice and credit memo data for reconciliation purposes:
        
        INVOICES SUMMARY:
        {invoice_summary}
        
        CREDIT MEMOS SUMMARY:
        {credit_memo_summary}
        
        Please provide a comprehensive analysis focusing on:
        1. Potential matching issues
        2. Data quality concerns
        3. Unusual patterns or discrepancies
        4. Recommendations for reconciliation
        
        Respond in JSON format as specified in the system prompt.
        """
        
        response = self.generate_response(prompt, system_prompt, temperature=0.1)
        
        try:
            # Try to parse JSON response
            if response.strip().startswith('{'):
                return json.loads(response)
            else:
                # If not JSON, return as text analysis
                return {
                    "analysis_type": "text_analysis",
                    "raw_response": response,
                    "summary": "AI analysis completed"
                }
        except json.JSONDecodeError:
            return {
                "analysis_type": "text_analysis",
                "raw_response": response,
                "summary": "AI analysis completed (non-JSON response)"
            }
    
    def _prepare_invoice_summary(self, invoices: List[Dict[str, Any]]) -> str:
        """Prepare summary of invoice data for AI analysis."""
        if not invoices:
            return "No invoices provided"
        
        summary = f"Total invoices: {len(invoices)}\n"
        summary += "Invoice details:\n"
        
        for i, inv in enumerate(invoices[:5]):  # Limit to first 5 for summary
            summary += f"  {i+1}. Invoice #{inv.get('invoice_number', 'N/A')} - "
            summary += f"Customer: {inv.get('customer_name', 'N/A')} - "
            summary += f"Amount: ${inv.get('total_amount', 'N/A')} - "
            summary += f"Date: {inv.get('invoice_date', 'N/A')}\n"
        
        if len(invoices) > 5:
            summary += f"  ... and {len(invoices) - 5} more invoices\n"
        
        return summary
    
    def _prepare_credit_memo_summary(self, credit_memos: List[Dict[str, Any]]) -> str:
        """Prepare summary of credit memo data for AI analysis."""
        if not credit_memos:
            return "No credit memos provided"
        
        summary = f"Total credit memos: {len(credit_memos)}\n"
        summary += "Credit memo details:\n"
        
        for i, cm in enumerate(credit_memos[:5]):  # Limit to first 5 for summary
            summary += f"  {i+1}. Credit Memo #{cm.get('credit_memo_number', 'N/A')} - "
            summary += f"Original Invoice: {cm.get('original_invoice_number', 'N/A')} - "
            summary += f"Customer: {cm.get('customer_name', 'N/A')} - "
            summary += f"Amount: ${cm.get('credit_amount', 'N/A')} - "
            summary += f"Date: {cm.get('credit_memo_date', 'N/A')}\n"
        
        if len(credit_memos) > 5:
            summary += f"  ... and {len(credit_memos) - 5} more credit memos\n"
        
        return summary
    
    def validate_match_with_ai(self, invoice: Dict[str, Any], 
                              credit_memo: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use AI to validate a potential match between invoice and credit memo.
        
        Args:
            invoice: Invoice data
            credit_memo: Credit memo data
            
        Returns:
            AI validation results
        """
        if not self.is_server_available():
            return {"error": "Ollama server not available"}
        
        system_prompt = """You are an expert in financial document validation. 
        Analyze whether an invoice and credit memo are a valid match based on:
        1. Invoice number matching
        2. Customer name consistency
        3. Amount reasonableness
        4. Currency consistency
        
        Respond in JSON format:
        {
            "is_valid_match": true/false,
            "confidence_score": 0.85,
            "reasoning": "detailed explanation",
            "issues": ["list of issues if any"],
            "recommendations": ["list of recommendations"]
        }"""
        
        prompt = f"""
        Please validate if this invoice and credit memo are a valid match:
        
        INVOICE:
        - Number: {invoice.get('invoice_number', 'N/A')}
        - Customer: {invoice.get('customer_name', 'N/A')}
        - Amount: ${invoice.get('total_amount', 'N/A')}
        - Currency: {invoice.get('currency', 'N/A')}
        
        CREDIT MEMO:
        - Number: {credit_memo.get('credit_memo_number', 'N/A')}
        - Original Invoice: {credit_memo.get('original_invoice_number', 'N/A')}
        - Customer: {credit_memo.get('customer_name', 'N/A')}
        - Amount: ${credit_memo.get('credit_amount', 'N/A')}
        - Currency: {credit_memo.get('currency', 'N/A')}
        
        Please provide your analysis in JSON format as specified.
        """
        
        response = self.generate_response(prompt, system_prompt, temperature=0.1)
        
        try:
            if response.strip().startswith('{'):
                return json.loads(response)
            else:
                return {
                    "error": "Invalid JSON response",
                    "raw_response": response
                }
        except json.JSONDecodeError:
            return {
                "error": "Failed to parse JSON response",
                "raw_response": response
            } 