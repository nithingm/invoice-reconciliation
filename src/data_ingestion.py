"""
Data Ingestion & Normalization Module
Handles CSV loading and data validation
"""

import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any

class DataIngestionPipeline:
    def __init__(self, logger):
        self.logger = logger
        
        # Expected column schemas
        self.invoice_schema = [
            'invoice_id', 'customer_id', 'invoice_amount', 'date_issued',
            'part_number', 'paid_amount', 'claimed_credit'
        ]
        
        self.credit_memo_schema = [
            'credit_memo_id', 'customer_id', 'credit_amount', 'date_issued',
            'reason', 'related_invoice_id', 'status', 'part_number', 'remaining_credit'
        ]
        
        self.credit_usage_schema = [
            'usage_id', 'credit_memo_id', 'invoice_id', 'amount_used',
            'date_used', 'verified'
        ]
    
    def load_csv_files(self, invoices_path: str, credit_memos_path: str, 
                      credit_usage_path: str) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """Load and normalize CSV files"""
        
        # Load raw data
        invoices_df = pd.read_csv(invoices_path)
        credit_memos_df = pd.read_csv(credit_memos_path)
        credit_usage_df = pd.read_csv(credit_usage_path)
        
        self.logger.log_info(f"Loaded {len(invoices_df)} invoices, {len(credit_memos_df)} credit memos, {len(credit_usage_df)} usage records")
        
        # Normalize and validate
        invoices_df = self._normalize_invoices(invoices_df)
        credit_memos_df = self._normalize_credit_memos(credit_memos_df, credit_usage_df)
        credit_usage_df = self._normalize_credit_usage(credit_usage_df)
        
        return invoices_df, credit_memos_df, credit_usage_df
    
    def _normalize_invoices(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize invoice data"""
        df = df.copy()
        
        # Convert dates
        df['date_issued'] = pd.to_datetime(df['date_issued'])
        
        # Compute claimed_credit if not present
        if 'claimed_credit' not in df.columns:
            df['claimed_credit'] = df['invoice_amount'] - df['paid_amount'].fillna(0)
        
        # Filter out invalid invoices
        initial_count = len(df)
        
        # Skip invoices with missing paid_amount
        df = df.dropna(subset=['paid_amount'])
        
        # Exclude invoices with claimed_credit <= 0
        df = df[df['claimed_credit'] > 0]
        
        filtered_count = initial_count - len(df)
        if filtered_count > 0:
            self.logger.log_info(f"Filtered out {filtered_count} invoices (missing paid_amount or claimed_credit <= 0)")
        
        return df
    
    def _normalize_credit_memos(self, df: pd.DataFrame, usage_df: pd.DataFrame) -> pd.DataFrame:
        """Normalize credit memo data and compute remaining_credit"""
        df = df.copy()
        
        # Convert dates
        df['date_issued'] = pd.to_datetime(df['date_issued'])
        
        # Compute remaining_credit
        if 'remaining_credit' not in df.columns:
            df['remaining_credit'] = df['credit_amount']
            
            # Subtract used amounts
            usage_summary = usage_df.groupby('credit_memo_id')['amount_used'].sum()
            for memo_id, used_amount in usage_summary.items():
                df.loc[df['credit_memo_id'] == memo_id, 'remaining_credit'] -= used_amount
        
        # Update status based on remaining_credit
        df.loc[df['remaining_credit'] <= 0, 'status'] = 'Redeemed'
        
        return df
    
    def _normalize_credit_usage(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize credit usage data"""
        df = df.copy()
        
        # Convert dates
        df['date_used'] = pd.to_datetime(df['date_used'])
        
        # Ensure verified column exists
        if 'verified' not in df.columns:
            df['verified'] = False
        
        return df