import openai
from typing import Dict, Any, List, Optional, Tuple
import logging
import json
from datetime import datetime
import pandas as pd
import re

class ReconciliationAgent:
    """
    Enhanced AI-powered agent for reconciling invoices with credit memos.
    Includes proper validation and discrepancy detection.
    """
    
    def __init__(self, api_key: str = None):
        """
        Initialize the reconciliation agent.
        
        Args:
            api_key: OpenAI API key (optional for fallback mode)
        """
        self.api_key = api_key
        if api_key:
            openai.api_key = api_key
        self.logger = logging.getLogger(__name__)
        
    def reconcile_documents(self, invoices: List[Dict[str, Any]], 
                          credit_memos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Reconcile invoices with credit memos using enhanced validation.
        
        Args:
            invoices: List of processed invoice data
            credit_memos: List of processed credit memo data
            
        Returns:
            Dict containing reconciliation results
        """
        try:
            self.logger.info(f"Starting enhanced reconciliation for {len(invoices)} invoices and {len(credit_memos)} credit memos")
            
            # Perform comprehensive validation and matching
            reconciliation_results = self._enhanced_matching(invoices, credit_memos)
            
            # Add analytics and metrics
            reconciliation_results['analytics'] = self._calculate_analytics(reconciliation_results)
            
            return reconciliation_results
            
        except Exception as e:
            self.logger.error(f"Error during enhanced reconciliation: {str(e)}")
            raise
    
    def _enhanced_matching(self, invoices: List[Dict[str, Any]], 
                          credit_memos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Enhanced matching with comprehensive validation.
        
        Args:
            invoices: List of invoice data
            credit_memos: List of credit memo data
            
        Returns:
            Enhanced matching results
        """
        matched_pairs = []
        discrepancies = []
        unmatched_invoices = []
        unmatched_credit_memos = []
        
        # Create lookup dictionaries for efficient matching
        invoice_lookup = {inv.get('invoice_number', '').lower(): inv for inv in invoices}
        credit_memo_lookup = {cm.get('credit_memo_number', '').lower(): cm for cm in credit_memos}
        
        # Track which credit memos have been matched
        matched_credit_memos = set()
        
        # Step 1: Find exact matches based on invoice number
        for inv in invoices:
            inv_number = inv.get('invoice_number', '').lower()
            inv_customer = inv.get('customer_name', '').lower()
            
            # Find credit memos that reference this invoice
            matching_credit_memos = []
            for cm in credit_memos:
                cm_original_inv = cm.get('original_invoice_number', '').lower()
                cm_customer = cm.get('customer_name', '').lower()
                
                if cm_original_inv == inv_number:
                    # Validate the match
                    validation_result = self._validate_match(inv, cm)
                    
                    if validation_result['is_valid']:
                        matching_credit_memos.append((cm, validation_result))
                    else:
                        # This is a discrepancy - wrong credit memo for this invoice
                        discrepancies.append({
                            'type': 'WRONG_CREDIT_MEMO_MATCH',
                            'invoice_number': inv.get('invoice_number'),
                            'credit_memo_number': cm.get('credit_memo_number'),
                            'description': f"Credit memo {cm.get('credit_memo_number')} references invoice {inv.get('invoice_number')} but validation failed: {validation_result['reason']}",
                            'severity': 'high',
                            'validation_details': validation_result
                        })
            
            # Process valid matches
            for cm, validation in matching_credit_memos:
                if cm.get('credit_memo_number', '').lower() not in matched_credit_memos:
                    matched_pairs.append({
                        'invoice': inv,
                        'credit_memo': cm,
                        'match_confidence': validation['confidence'],
                        'match_reason': validation['reason'],
                        'validation_details': validation
                    })
                    matched_credit_memos.add(cm.get('credit_memo_number', '').lower())
        
        # Step 2: Find unmatched invoices
        matched_invoice_numbers = {pair['invoice'].get('invoice_number', '').lower() for pair in matched_pairs}
        for inv in invoices:
            if inv.get('invoice_number', '').lower() not in matched_invoice_numbers:
                unmatched_invoices.append(inv)
        
        # Step 3: Find unmatched credit memos
        for cm in credit_memos:
            if cm.get('credit_memo_number', '').lower() not in matched_credit_memos:
                unmatched_credit_memos.append(cm)
        
        # Step 4: Additional discrepancy checks
        additional_discrepancies = self._check_additional_discrepancies(matched_pairs, invoices, credit_memos)
        discrepancies.extend(additional_discrepancies)
        
        return {
            'matched_pairs': matched_pairs,
            'discrepancies': discrepancies,
            'unmatched_invoices': unmatched_invoices,
            'unmatched_credit_memos': unmatched_credit_memos,
            'summary': {
                'total_matched_pairs': len(matched_pairs),
                'total_discrepancies': len(discrepancies),
                'unmatched_invoices_count': len(unmatched_invoices),
                'unmatched_credit_memos_count': len(unmatched_credit_memos)
            }
        }
    
    def _validate_match(self, invoice: Dict[str, Any], credit_memo: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate if a credit memo properly matches an invoice.
        
        Args:
            invoice: Invoice data
            credit_memo: Credit memo data
            
        Returns:
            Validation result with details
        """
        validation_issues = []
        confidence_score = 100.0
        
        # 1. Customer name validation
        inv_customer = invoice.get('customer_name', '').lower().strip()
        cm_customer = credit_memo.get('customer_name', '').lower().strip()
        
        if inv_customer and cm_customer:
            if inv_customer != cm_customer:
                validation_issues.append(f"Customer mismatch: Invoice customer '{invoice.get('customer_name')}' vs Credit memo customer '{credit_memo.get('customer_name')}'")
                confidence_score -= 50.0  # High penalty for customer mismatch
        
        # 2. Date validation
        try:
            inv_date = datetime.strptime(invoice.get('invoice_date', ''), '%Y-%m-%d')
            cm_date = datetime.strptime(credit_memo.get('credit_memo_date', ''), '%Y-%m-%d')
            
            if cm_date < inv_date:
                validation_issues.append(f"Credit memo date ({credit_memo.get('credit_memo_date')}) is before invoice date ({invoice.get('invoice_date')})")
                confidence_score -= 20.0
        except (ValueError, TypeError):
            validation_issues.append("Invalid date format in invoice or credit memo")
            confidence_score -= 15.0
        
        # 3. Amount validation
        inv_amount = float(invoice.get('total_amount', 0))
        cm_amount = float(credit_memo.get('credit_amount', 0))
        
        if cm_amount > inv_amount:
            validation_issues.append(f"Credit amount (${cm_amount}) exceeds invoice amount (${inv_amount})")
            confidence_score -= 25.0
        
        # 4. Vendor validation (if available)
        inv_vendor = invoice.get('vendor_name', '').lower().strip()
        cm_vendor = credit_memo.get('vendor_name', '').lower().strip()
        
        if inv_vendor and cm_vendor and inv_vendor != cm_vendor:
            validation_issues.append(f"Vendor mismatch: Invoice vendor '{invoice.get('vendor_name')}' vs Credit memo vendor '{credit_memo.get('vendor_name')}'")
            confidence_score -= 15.0
        
        # 5. Currency validation
        inv_currency = invoice.get('currency', 'USD').upper()
        cm_currency = credit_memo.get('currency', 'USD').upper()
        
        if inv_currency != cm_currency:
            validation_issues.append(f"Currency mismatch: Invoice currency '{inv_currency}' vs Credit memo currency '{cm_currency}'")
            confidence_score -= 10.0
        
        # Determine if match is valid
        is_valid = confidence_score >= 80.0 and len(validation_issues) <= 1  # Stricter validation
        
        return {
            'is_valid': is_valid,
            'confidence': max(0.0, confidence_score),
            'issues': validation_issues,
            'reason': 'Valid match' if is_valid else f"Validation failed: {'; '.join(validation_issues)}"
        }
    
    def _check_additional_discrepancies(self, matched_pairs: List[Dict[str, Any]], 
                                       invoices: List[Dict[str, Any]], 
                                       credit_memos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Check for additional discrepancies beyond basic matching.
        
        Args:
            matched_pairs: List of matched invoice-credit memo pairs
            invoices: All invoice data
            credit_memos: All credit memo data
            
        Returns:
            List of additional discrepancies
        """
        discrepancies = []
        
        # Check for duplicate credit memos
        credit_memo_counts = {}
        for cm in credit_memos:
            original_inv = cm.get('original_invoice_number', '').lower()
            if original_inv:
                credit_memo_counts[original_inv] = credit_memo_counts.get(original_inv, 0) + 1
        
        for inv_number, count in credit_memo_counts.items():
            if count > 1:
                discrepancies.append({
                    'type': 'DUPLICATE_CREDIT_MEMOS',
                    'invoice_number': inv_number,
                    'description': f"Multiple credit memos ({count}) reference the same invoice {inv_number}",
                    'severity': 'medium'
                })
        
        # Check for orphaned credit memos (no matching invoice)
        for cm in credit_memos:
            original_inv = cm.get('original_invoice_number', '').lower()
            if original_inv:
                matching_invoice = next((inv for inv in invoices if inv.get('invoice_number', '').lower() == original_inv), None)
                if not matching_invoice:
                    discrepancies.append({
                        'type': 'ORPHANED_CREDIT_MEMO',
                        'credit_memo_number': cm.get('credit_memo_number'),
                        'description': f"Credit memo {cm.get('credit_memo_number')} references non-existent invoice {original_inv}",
                        'severity': 'high'
                    })
        
        # Check for unusual credit amounts
        for pair in matched_pairs:
            invoice = pair['invoice']
            credit_memo = pair['credit_memo']
            
            inv_amount = float(invoice.get('total_amount', 0))
            cm_amount = float(credit_memo.get('credit_amount', 0))
            
            # Flag if credit amount is more than 50% of invoice amount (might be suspicious)
            if cm_amount > inv_amount * 0.5 and cm_amount != inv_amount:
                discrepancies.append({
                    'type': 'LARGE_CREDIT_AMOUNT',
                    'invoice_number': invoice.get('invoice_number'),
                    'credit_memo_number': credit_memo.get('credit_memo_number'),
                    'description': f"Credit amount (${cm_amount}) is {cm_amount/inv_amount*100:.1f}% of invoice amount (${inv_amount})",
                    'severity': 'medium'
                })
        
        return discrepancies
    
    def _calculate_analytics(self, reconciliation_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate analytics and metrics from reconciliation results.
        
        Args:
            reconciliation_results: Results from reconciliation
            
        Returns:
            Analytics data
        """
        matched_pairs = reconciliation_results.get('matched_pairs', [])
        discrepancies = reconciliation_results.get('discrepancies', [])
        unmatched_invoices = reconciliation_results.get('unmatched_invoices', [])
        unmatched_credit_memos = reconciliation_results.get('unmatched_credit_memos', [])
        
        # Calculate amounts
        total_invoice_amount = sum(float(pair['invoice'].get('total_amount', 0)) for pair in matched_pairs)
        total_credit_amount = sum(float(pair['credit_memo'].get('credit_amount', 0)) for pair in matched_pairs)
        
        # Calculate match rate
        total_invoices = len(matched_pairs) + len(unmatched_invoices)
        total_credit_memos = len(matched_pairs) + len(unmatched_credit_memos)
        
        match_rate = (len(matched_pairs) / total_invoices * 100) if total_invoices > 0 else 0
        credit_memo_match_rate = (len(matched_pairs) / total_credit_memos * 100) if total_credit_memos > 0 else 0
        
        # Calculate average confidence
        avg_confidence = sum(pair.get('match_confidence', 0) for pair in matched_pairs) / len(matched_pairs) if matched_pairs else 0
        
        # Categorize discrepancies
        high_severity = len([d for d in discrepancies if d.get('severity') == 'high'])
        medium_severity = len([d for d in discrepancies if d.get('severity') == 'medium'])
        low_severity = len([d for d in discrepancies if d.get('severity') == 'low'])
        
        return {
            'match_rate': round(match_rate, 1),
            'credit_memo_match_rate': round(credit_memo_match_rate, 1),
            'average_confidence': round(avg_confidence, 1),
            'total_invoice_amount': total_invoice_amount,
            'total_credit_amount': total_credit_amount,
            'amount_difference': total_invoice_amount - total_credit_amount,
            'discrepancy_breakdown': {
                'high_severity': high_severity,
                'medium_severity': medium_severity,
                'low_severity': low_severity,
                'total': len(discrepancies)
            }
        }

def fallback_match_documents(invoices: List[Dict[str, Any]], 
                           credit_memos: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Fallback matching function for when AI is not available.
    
    Args:
        invoices: List of invoice data
        credit_memos: List of credit memo data
        
    Returns:
        Basic matching results
    """
    agent = ReconciliationAgent()
    return agent.reconcile_documents(invoices, credit_memos) 