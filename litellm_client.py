import litellm
import json
import logging
from typing import Dict, Any, List, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LiteLLMClient:
    """
    Client for communicating with various AI models using LiteLLM for AI-powered reconciliation.
    Supports multiple providers including OpenAI, Anthropic, Ollama, and others.
    """
    
    def __init__(self, model: str = "gpt-3.5-turbo", api_key: str = None, 
                 base_url: str = None, provider: str = None):
        """
        Initialize the LiteLLM client.
        
        Args:
            model: Model name to use (default: gpt-3.5-turbo)
            api_key: API key for the model provider
            base_url: Base URL for the API (for local models like Ollama)
            provider: Provider name (openai, anthropic, ollama, etc.)
        """
        self.model = model
        self.api_key = api_key or os.getenv('OPENAI_API_KEY') or os.getenv('ANTHROPIC_API_KEY')
        self.base_url = base_url
        self.provider = provider
        self.logger = logging.getLogger(__name__)
        
        # Configure litellm
        if self.base_url:
            litellm.api_base = self.base_url
        if self.api_key:
            litellm.api_key = self.api_key
            
        # Handle Google provider configuration
        if provider == "google":
            google_api_key = os.getenv('GOOGLE_API_KEY')
            if google_api_key:
                litellm.api_key = google_api_key
            else:
                self.logger.warning("GOOGLE_API_KEY not found. Google provider may not work properly.")
            
    def is_server_available(self) -> bool:
        """
        Check if the AI model server is available.
        
        Returns:
            True if server is available, False otherwise
        """
        try:
            # Handle Google provider specially
            if self.provider == "google":
                try:
                    # Test with a simple prompt
                    response = self.generate_response("Hello", max_tokens=5)
                    return bool(response) and not response.startswith("Google provider requires")
                except Exception as e:
                    self.logger.warning(f"Google provider not available: {str(e)}")
                    return False
            else:
                # Test with a simple prompt
                response = self.generate_response("Hello", max_tokens=5)
                return bool(response)
        except Exception as e:
            self.logger.warning(f"AI model server not available: {str(e)}")
            return False
    
    def get_available_models(self) -> List[str]:
        """
        Get list of available models (this is a simplified version).
        
        Returns:
            List of available model names
        """
        # Common models for different providers
        models = {
            "openai": ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"],
            "anthropic": ["claude-3-sonnet-20240229", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
            "ollama": ["llama2", "llama2:13b", "llama2:70b", "mistral", "codellama"],
            "google": ["gemini/gemini-2.0-flash", "gemini-pro"],
            "cohere": ["command", "command-light"]
        }
        
        if self.provider and self.provider in models:
            return models[self.provider]
        else:
            # Return all models if no specific provider
            all_models = []
            for provider_models in models.values():
                all_models.extend(provider_models)
            return all_models
    
    def generate_response(self, prompt: str, system_prompt: str = None, 
                         temperature: float = 0.1, max_tokens: int = 2000) -> str:
        """
        Generate response from AI model using LiteLLM.
        
        Args:
            prompt: The user prompt
            system_prompt: System prompt (optional)
            temperature: Temperature for generation (0.0-1.0)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated response text
        """
        try:
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})
            
            # Handle Google provider specially to avoid dependency issues
            if self.provider == "google":
                try:
                    # Try to use Google provider
                    response = litellm.completion(
                        model=self.model,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens
                    )
                except Exception as google_error:
                    self.logger.warning(f"Google provider failed: {str(google_error)}")
                    # Return a helpful message instead of crashing
                    return "Google provider requires additional setup. Please install google-auth and google-cloud-aiplatform packages, or use a different provider."
            else:
                response = litellm.completion(
                    model=self.model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
            
            return response.choices[0].message.content
            
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
            return {"error": "AI model server not available"}
        
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
            return {"error": "AI model server not available"}
        
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
