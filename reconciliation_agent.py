import openai
from typing import Dict, Any, List, Optional
import logging
import json
from datetime import datetime
import pandas as pd

class ReconciliationAgent:
    """
    AI-powered agent for reconciling invoices with credit memos.
    """
    
    def __init__(self, api_key: str):
        """
        Initialize the reconciliation agent.
        
        Args:
            api_key: OpenAI API key
        """
        self.api_key = api_key
        openai.api_key = api_key
        self.logger = logging.getLogger(__name__)
        
    def reconcile_documents(self, invoices: List[Dict[str, Any]], 
                          credit_memos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Reconcile invoices with credit memos using AI.
        
        Args:
            invoices: List of processed invoice data
            credit_memos: List of processed credit memo data
            
        Returns:
            Dict containing reconciliation results
        """
        try:
            self.logger.info(f"Starting AI reconciliation for {len(invoices)} invoices and {len(credit_memos)} credit memos")
            
            # Prepare data for AI analysis
            reconciliation_data = self._prepare_reconciliation_data(invoices, credit_memos)
            
            # Use AI to analyze and match documents
            ai_analysis = self._analyze_with_ai(reconciliation_data)
            
            # Process AI results
            reconciliation_results = self._process_ai_results(ai_analysis, invoices, credit_memos)
            
            return reconciliation_results
            
        except Exception as e:
            self.logger.error(f"Error during AI reconciliation: {str(e)}")
            raise
    
    def _prepare_reconciliation_data(self, invoices: List[Dict[str, Any]], 
                                   credit_memos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Prepare data for AI analysis.
        
        Args:
            invoices: List of invoice data
            credit_memos: List of credit memo data
            
        Returns:
            Dict containing prepared data
        """
        # Extract key information for AI analysis
        invoice_summaries = []
        for inv in invoices:
            summary = {
                'invoice_number': inv.get('invoice_number', ''),
                'invoice_date': inv.get('invoice_date', ''),
                'vendor_name': inv.get('vendor_name', ''),
                'customer_name': inv.get('customer_name', ''),
                'total_amount': inv.get('total_amount', 0.0),
                'currency': inv.get('currency', 'USD'),
                'po_number': inv.get('po_number', ''),
                'notes': inv.get('notes', ''),
                'filename': inv.get('filename', '')
            }
            invoice_summaries.append(summary)
        
        credit_memo_summaries = []
        for cm in credit_memos:
            summary = {
                'credit_memo_number': cm.get('credit_memo_number', ''),
                'credit_memo_date': cm.get('credit_memo_date', ''),
                'original_invoice_number': cm.get('original_invoice_number', ''),
                'original_invoice_date': cm.get('original_invoice_date', ''),
                'vendor_name': cm.get('vendor_name', ''),
                'customer_name': cm.get('customer_name', ''),
                'credit_amount': cm.get('credit_amount', 0.0),
                'currency': cm.get('currency', 'USD'),
                'credit_reason': cm.get('credit_reason', ''),
                'credit_type': cm.get('credit_type', ''),
                'notes': cm.get('notes', ''),
                'filename': cm.get('filename', '')
            }
            credit_memo_summaries.append(summary)
        
        return {
            'invoices': invoice_summaries,
            'credit_memos': credit_memo_summaries,
            'total_invoices': len(invoices),
            'total_credit_memos': len(credit_memos)
        }
    
    def _analyze_with_ai(self, reconciliation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use AI to analyze and match documents.
        
        Args:
            reconciliation_data: Prepared data for analysis
            
        Returns:
            Dict containing AI analysis results
        """
        try:
            # Create prompt for AI analysis
            prompt = self._create_analysis_prompt(reconciliation_data)
            
            # Call OpenAI API
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert financial analyst specializing in invoice and credit memo reconciliation. 
                        Your task is to analyze invoices and credit memos to identify matches and discrepancies.
                        
                        Please provide your analysis in the following JSON format:
                        {
                            "reconciled_items": [
                                {
                                    "invoice_number": "INV-001",
                                    "credit_memo_number": "CM-001",
                                    "match_confidence": 0.95,
                                    "match_reason": "Exact invoice number match",
                                    "amount_difference": 0.0,
                                    "reconciliation_status": "FULLY_RECONCILED"
                                }
                            ],
                            "discrepancies": [
                                {
                                    "invoice_number": "INV-002",
                                    "credit_memo_number": "CM-002",
                                    "discrepancy_type": "AMOUNT_MISMATCH",
                                    "discrepancy_description": "Credit memo amount doesn't match invoice amount",
                                    "invoice_amount": 1000.0,
                                    "credit_amount": 950.0,
                                    "difference": 50.0
                                }
                            ],
                            "unmatched_invoices": ["INV-003", "INV-004"],
                            "unmatched_credit_memos": ["CM-003"],
                            "summary": {
                                "total_reconciled": 5,
                                "total_discrepancies": 2,
                                "unmatched_invoices_count": 2,
                                "unmatched_credit_memos_count": 1
                            }
                        }"""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,
                max_tokens=2000
            )
            
            # Parse AI response
            ai_response = response.choices[0].message.content
            analysis_result = json.loads(ai_response)
            
            return analysis_result
            
        except Exception as e:
            self.logger.error(f"Error in AI analysis: {str(e)}")
            # Fallback to basic matching
            return self._fallback_matching(reconciliation_data)
    
    def _create_analysis_prompt(self, reconciliation_data: Dict[str, Any]) -> str:
        """
        Create prompt for AI analysis.
        
        Args:
            reconciliation_data: Data to analyze
            
        Returns:
            Formatted prompt string
        """
        invoices = reconciliation_data['invoices']
        credit_memos = reconciliation_data['credit_memos']
        
        prompt = f"""
        Please analyze the following invoices and credit memos for reconciliation:
        
        INVOICES ({len(invoices)} total):
        """
        
        for i, inv in enumerate(invoices, 1):
            prompt += f"""
        Invoice {i}:
        - Invoice Number: {inv['invoice_number']}
        - Date: {inv['invoice_date']}
        - Vendor: {inv['vendor_name']}
        - Customer: {inv['customer_name']}
        - Amount: {inv['currency']} {inv['total_amount']}
        - PO Number: {inv['po_number']}
        - Notes: {inv['notes']}
        - Filename: {inv['filename']}
        """
        
        prompt += f"""
        CREDIT MEMOS ({len(credit_memos)} total):
        """
        
        for i, cm in enumerate(credit_memos, 1):
            prompt += f"""
        Credit Memo {i}:
        - Credit Memo Number: {cm['credit_memo_number']}
        - Date: {cm['credit_memo_date']}
        - Original Invoice: {cm['original_invoice_number']}
        - Original Invoice Date: {cm['original_invoice_date']}
        - Vendor: {cm['vendor_name']}
        - Customer: {cm['customer_name']}
        - Credit Amount: {cm['currency']} {cm['credit_amount']}
        - Credit Reason: {cm['credit_reason']}
        - Credit Type: {cm['credit_type']}
        - Notes: {cm['notes']}
        - Filename: {cm['filename']}
        """
        
        prompt += """
        
        Please analyze these documents and provide reconciliation results in the specified JSON format.
        Consider the following matching criteria:
        1. Exact invoice number matches
        2. Vendor name similarity
        3. Customer name similarity
        4. Amount matching (with tolerance for partial credits)
        5. Date proximity
        6. PO number matches
        
        For discrepancies, identify the type and provide detailed explanations.
        """
        
        return prompt
    
    def _fallback_matching(self, reconciliation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fallback matching logic when AI analysis fails.
        
        Args:
            reconciliation_data: Data to match
            
        Returns:
            Basic matching results
        """
        invoices = reconciliation_data['invoices']
        credit_memos = reconciliation_data['credit_memos']
        
        reconciled_items = []
        discrepancies = []
        unmatched_invoices = []
        unmatched_credit_memos = []
        
        # Simple matching based on invoice numbers
        for inv in invoices:
            matched = False
            for cm in credit_memos:
                if (inv['invoice_number'] and cm['original_invoice_number'] and 
                    inv['invoice_number'].lower() == cm['original_invoice_number'].lower()):
                    
                    amount_diff = abs(inv['total_amount'] - cm['credit_amount'])
                    
                    if amount_diff < 0.01:  # Exact match
                        reconciled_items.append({
                            'invoice_number': inv['invoice_number'],
                            'credit_memo_number': cm['credit_memo_number'],
                            'match_confidence': 0.9,
                            'match_reason': 'Exact invoice number and amount match',
                            'amount_difference': amount_diff,
                            'reconciliation_status': 'FULLY_RECONCILED'
                        })
                        matched = True
                        break
                    else:
                        discrepancies.append({
                            'invoice_number': inv['invoice_number'],
                            'credit_memo_number': cm['credit_memo_number'],
                            'discrepancy_type': 'AMOUNT_MISMATCH',
                            'discrepancy_description': f'Amount mismatch: Invoice ${inv["total_amount"]} vs Credit ${cm["credit_amount"]}',
                            'invoice_amount': inv['total_amount'],
                            'credit_amount': cm['credit_amount'],
                            'difference': amount_diff
                        })
                        matched = True
                        break
            
            if not matched:
                unmatched_invoices.append(inv['invoice_number'])
        
        # Find unmatched credit memos
        for cm in credit_memos:
            matched = False
            for inv in invoices:
                if (inv['invoice_number'] and cm['original_invoice_number'] and 
                    inv['invoice_number'].lower() == cm['original_invoice_number'].lower()):
                    matched = True
                    break
            
            if not matched:
                unmatched_credit_memos.append(cm['credit_memo_number'])
        
        return {
            'reconciled_items': reconciled_items,
            'discrepancies': discrepancies,
            'unmatched_invoices': unmatched_invoices,
            'unmatched_credit_memos': unmatched_credit_memos,
            'summary': {
                'total_reconciled': len(reconciled_items),
                'total_discrepancies': len(discrepancies),
                'unmatched_invoices_count': len(unmatched_invoices),
                'unmatched_credit_memos_count': len(unmatched_credit_memos)
            }
        }
    
    def _process_ai_results(self, ai_analysis: Dict[str, Any], 
                           invoices: List[Dict[str, Any]], 
                           credit_memos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Process AI analysis results and add additional context.
        
        Args:
            ai_analysis: Results from AI analysis
            invoices: Original invoice data
            credit_memos: Original credit memo data
            
        Returns:
            Enhanced reconciliation results
        """
        # Add detailed information to reconciled items
        reconciled_items = []
        for item in ai_analysis.get('reconciled_items', []):
            # Find corresponding invoice and credit memo
            invoice_data = next((inv for inv in invoices if inv.get('invoice_number') == item['invoice_number']), {})
            credit_memo_data = next((cm for cm in credit_memos if cm.get('credit_memo_number') == item['credit_memo_number']), {})
            
            enhanced_item = {
                **item,
                'invoice_date': invoice_data.get('invoice_date', ''),
                'credit_memo_date': credit_memo_data.get('credit_memo_date', ''),
                'vendor_name': invoice_data.get('vendor_name', ''),
                'customer_name': invoice_data.get('customer_name', ''),
                'invoice_amount': invoice_data.get('total_amount', 0.0),
                'credit_amount': credit_memo_data.get('credit_amount', 0.0),
                'currency': invoice_data.get('currency', 'USD'),
                'credit_reason': credit_memo_data.get('credit_reason', ''),
                'credit_type': credit_memo_data.get('credit_type', ''),
                'processed_at': datetime.now().isoformat()
            }
            reconciled_items.append(enhanced_item)
        
        # Add detailed information to discrepancies
        discrepancies = []
        for item in ai_analysis.get('discrepancies', []):
            invoice_data = next((inv for inv in invoices if inv.get('invoice_number') == item['invoice_number']), {})
            credit_memo_data = next((cm for cm in credit_memos if cm.get('credit_memo_number') == item['credit_memo_number']), {})
            
            enhanced_discrepancy = {
                **item,
                'invoice_date': invoice_data.get('invoice_date', ''),
                'credit_memo_date': credit_memo_data.get('credit_memo_date', ''),
                'vendor_name': invoice_data.get('vendor_name', ''),
                'customer_name': invoice_data.get('customer_name', ''),
                'currency': invoice_data.get('currency', 'USD'),
                'credit_reason': credit_memo_data.get('credit_reason', ''),
                'credit_type': credit_memo_data.get('credit_type', ''),
                'processed_at': datetime.now().isoformat()
            }
            discrepancies.append(enhanced_discrepancy)
        
        return {
            'reconciled_items': reconciled_items,
            'discrepancies': discrepancies,
            'unmatched_invoices': ai_analysis.get('unmatched_invoices', []),
            'unmatched_credit_memos': ai_analysis.get('unmatched_credit_memos', []),
            'summary': ai_analysis.get('summary', {}),
            'invoices': invoices,
            'credit_memos': credit_memos,
            'processed_at': datetime.now().isoformat()
        } 