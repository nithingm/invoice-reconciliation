"""
LLM Analyzer Module
Uses local Ollama for intelligent analysis of manual review cases
"""

import requests
import json
from typing import Dict, List, Any, Optional
import pandas as pd

class LLMAnalyzer:
    def __init__(self, logger, model_name: str = "llama3.2", base_url: str = "http://localhost:11434"):
        self.logger = logger
        self.model_name = model_name
        self.base_url = base_url
        self.api_url = f"{base_url}/api/generate"
    
    def analyze_manual_review_cases(self, manual_review_cases: List[Dict], 
                                credit_memos_df: pd.DataFrame) -> List[Dict]:
        """Analyze manual review cases using LLM"""
        analyzed_cases = []
        
        for case in manual_review_cases:
            try:
                analysis = self._analyze_single_case(case, credit_memos_df)
                case['llm_analysis'] = analysis
                analyzed_cases.append(case)
                self.logger.log_info(f"LLM analyzed case {case['invoice_id']}")
            except Exception as e:
                self.logger.log_error(f"LLM analysis failed for {case['invoice_id']}: {str(e)}")
                case['llm_analysis'] = {
                    'recommendation': 'MANUAL_REVIEW',
                    'confidence': 0.0,
                    'reasoning': f"LLM analysis failed: {str(e)}",
                    'suggested_action': 'Requires human review due to analysis error'
                }
                analyzed_cases.append(case)
        
        return analyzed_cases
    
    def _analyze_single_case(self, case: Dict, credit_memos_df: pd.DataFrame) -> Dict:
        """Analyze a single manual review case"""
        # Get relevant credit memos for context
        customer_memos = credit_memos_df[
            credit_memos_df['customer_id'] == case['customer_id']
        ]
        
        prompt = self._build_analysis_prompt(case, customer_memos)
        response = self._call_ollama(prompt)
        
        return self._parse_llm_response(response)
    
    def _build_analysis_prompt(self, case: Dict, customer_memos: pd.DataFrame) -> str:
        """Build analysis prompt for the LLM"""
        memo_context = ""
        if not customer_memos.empty:
            memo_context = "\nAvailable Credit Memos:\n"
            for _, memo in customer_memos.iterrows():
                memo_context += f"- {memo['credit_memo_id']}: ${memo['remaining_credit']} remaining, issued {memo['date_issued']}, part: {memo.get('part_number', 'N/A')}\n"
        
        prompt = f"""
You are an expert financial analyst reviewing invoice credit verification cases. Analyze this case and provide a recommendation.

CASE DETAILS:
- Invoice ID: {case['invoice_id']}
- Customer ID: {case['customer_id']}
- Claimed Credit: ${case['claimed_credit']}
- Available Credit: ${case.get('total_remaining_credit', 0)}
- Shortfall: ${case.get('shortfall', 0)}
- Part Number: {case.get('part_number', 'N/A')}
- Reason for Manual Review: {case.get('reason', 'Unknown')}

{memo_context}

ANALYSIS REQUIREMENTS:
1. Determine if the credit claim is legitimate
2. Consider timing, amounts, and part number matching
3. Assess risk level (LOW/MEDIUM/HIGH)
4. Provide specific recommendation

Respond in this exact JSON format:
{{
    "recommendation": "APPROVE|REJECT|PARTIAL_APPROVE|MANUAL_REVIEW",
    "confidence": 0.85,
    "risk_level": "LOW|MEDIUM|HIGH",
    "reasoning": "Detailed explanation of your analysis",
    "suggested_action": "Specific next steps",
    "approved_amount": 0.00
}}
"""
        return prompt
    
    def _call_ollama(self, prompt: str) -> str:
        """Call local Ollama API"""
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.1,
                "top_p": 0.9,
                "num_predict": 500
            }
        }
        
        try:
            response = requests.post(
                self.api_url,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            
            result = response.json()
            return result.get('response', '')
            
        except requests.exceptions.ConnectionError:
            raise Exception("Cannot connect to Ollama. Please ensure Ollama is running on localhost:11434")
        except requests.exceptions.Timeout:
            raise Exception("Ollama request timed out")
        except Exception as e:
            raise Exception(f"Ollama API error: {str(e)}")
    
    def _parse_llm_response(self, response: str) -> Dict:
        """Parse LLM response into structured format"""
        try:
            # Try to extract JSON from response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx != -1 and end_idx != 0:
                json_str = response[start_idx:end_idx]
                parsed = json.loads(json_str)
                
                # Validate required fields
                required_fields = ['recommendation', 'confidence', 'reasoning', 'suggested_action']
                for field in required_fields:
                    if field not in parsed:
                        parsed[field] = 'Not provided'
                
                # Ensure confidence is a float between 0 and 1
                if isinstance(parsed.get('confidence'), (int, float)):
                    parsed['confidence'] = max(0.0, min(1.0, float(parsed['confidence'])))
                else:
                    parsed['confidence'] = 0.5
                
                return parsed
            else:
                raise ValueError("No JSON found in response")
                
        except Exception as e:
            self.logger.log_error(f"Failed to parse LLM response: {str(e)}")
            return {
                'recommendation': 'MANUAL_REVIEW',
                'confidence': 0.0,
                'risk_level': 'HIGH',
                'reasoning': f'Failed to parse LLM response: {response[:200]}...',
                'suggested_action': 'Requires human review due to parsing error',
                'approved_amount': 0.0
            }
    
    def test_connection(self) -> bool:
        """Test connection to Ollama"""
        try:
            test_response = self._call_ollama("Hello, respond with 'OK'")
            return 'ok' in test_response.lower()
        except Exception as e:
            self.logger.log_error(f"Ollama connection test failed: {str(e)}")
            return False