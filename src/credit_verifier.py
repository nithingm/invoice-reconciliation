"""
Credit Verifier Module
Core matching pipeline for invoice credit verification
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any
from datetime import datetime

class CreditVerifier:
    def __init__(self, logger):
        self.logger = logger
        self.tolerance = 0.05  # $0.05 tolerance for floating point errors
    
    def verify_credit(self, invoice: pd.Series, credit_memos_df: pd.DataFrame, 
                    credit_usage_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Verify if claimed credit on an invoice can be fulfilled
        """
        invoice_id = invoice['invoice_id']
        customer_id = invoice['customer_id']
        claimed_credit = invoice['claimed_credit']
        invoice_date = invoice['date_issued']
        part_number = invoice.get('part_number')
        
        self.logger.log_info(f"Verifying invoice {invoice_id} for customer {customer_id}, claimed credit: ${claimed_credit}")
        
        # Find eligible credit memos
        eligible_memos = self._find_eligible_memos(
            customer_id, invoice_date, part_number, credit_memos_df
        )
        
        if eligible_memos.empty:
            return self._create_result(invoice_id, False, claimed_credit, [], 0, [], claimed_credit, customer_id)
        
        # Calculate total available credit
        total_remaining_credit = eligible_memos['remaining_credit'].sum()
        
        # Check if credit can be fulfilled
        if total_remaining_credit + self.tolerance >= claimed_credit:
            # Generate allocation plan
            allocation_plan = self._generate_allocation_plan(eligible_memos, claimed_credit)
            matched_memo_ids = [plan['credit_memo_id'] for plan in allocation_plan]
            
            return self._create_result(
                invoice_id, True, claimed_credit, matched_memo_ids, 
                total_remaining_credit, allocation_plan, 0, customer_id
            )
        else:
            # Insufficient credit
            shortfall = claimed_credit - total_remaining_credit
            return self._create_result(
                invoice_id, False, claimed_credit, [], 
                total_remaining_credit, [], shortfall, customer_id
            )
    
    def _find_eligible_memos(self, customer_id: str, invoice_date: datetime, 
                           part_number: str, credit_memos_df: pd.DataFrame) -> pd.DataFrame:
        """Find eligible credit memos for the invoice"""
        
        # Filter by customer
        eligible = credit_memos_df[credit_memos_df['customer_id'] == customer_id].copy()
        
        # Filter by status (Active only)
        eligible = eligible[eligible['status'] == 'Active']
        
        # Filter by date (credit issued before invoice date)
        eligible = eligible[eligible['date_issued'] < invoice_date]
        
        # Filter by remaining credit > 0
        eligible = eligible[eligible['remaining_credit'] > 0]
        
        # Filter by part number if both invoice and memo have part numbers
        if pd.notna(part_number) and part_number:
            eligible = eligible[
                (eligible['part_number'] == part_number) | 
                (pd.isna(eligible['part_number']))
            ]
        
        # Sort by date_issued (FIFO - oldest first for allocation)
        eligible = eligible.sort_values('date_issued')
        
        self.logger.log_info(f"Found {len(eligible)} eligible credit memos for customer {customer_id}")
        
        return eligible
    
    def _generate_allocation_plan(self, eligible_memos: pd.DataFrame, 
                                claimed_credit: float) -> List[Dict[str, Any]]:
        """Generate allocation plan using FIFO approach"""
        allocation_plan = []
        remaining_to_allocate = claimed_credit
        
        for _, memo in eligible_memos.iterrows():
            if remaining_to_allocate <= self.tolerance:
                break
                
            memo_id = memo['credit_memo_id']
            available_credit = memo['remaining_credit']
            
            # Allocate as much as possible from this memo
            amount_to_use = min(remaining_to_allocate, available_credit)
            
            allocation_plan.append({
                'credit_memo_id': memo_id,
                'amount_used': round(amount_to_use, 2)
            })
            
            remaining_to_allocate -= amount_to_use
            
            self.logger.log_info(f"Allocated ${amount_to_use} from memo {memo_id}")
        
        return allocation_plan
    
    def _create_result(self, invoice_id: str, verified: bool, claimed_credit: float,
                      matched_memo_ids: List[str], total_remaining_credit: float,
                      allocation_plan: List[Dict], shortfall: float, customer_id: str = None) -> Dict[str, Any]:
        """Create standardized result dictionary"""
        result = {
            'invoice_id': invoice_id,
            'verified': verified,
            'claimed_credit': claimed_credit,
            'matched_credit_memo_ids': matched_memo_ids,
            'total_remaining_credit': total_remaining_credit,
            'allocation_plan': allocation_plan,
            'shortfall': shortfall
        }
        if customer_id:
            result['customer_id'] = customer_id
        return result

