"""
Output Handler Module
Manages result generation and file outputs
"""

import pandas as pd
import json
import os
import numpy as np
from typing import List, Dict, Any

class OutputHandler:
    def __init__(self, logger):
        self.logger = logger
    
    def generate_outputs(self, results: List[Dict[str, Any]], output_dir: str):
        """Generate all output files"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Separate verified and unverified results
        verified_results = [r for r in results if r['verified']]
        unverified_results = [r for r in results if not r['verified']]
        
        # Generate results CSV
        self._save_results_csv(verified_results, os.path.join(output_dir, 'results.csv'))
        
        # Generate manual review CSV
        if unverified_results:
            self._save_manual_review_csv(unverified_results, os.path.join(output_dir, 'manual_review.csv'))
        
        # Generate complete results JSON
        self._save_complete_results_json(results, os.path.join(output_dir, 'complete_results.json'))
        
        # Save audit trail
        self.logger.save_audit_trail(os.path.join(output_dir, 'audit_trail.json'))
        
        self.logger.log_info(f"Generated outputs: {len(verified_results)} verified, {len(unverified_results)} for manual review")
    
    def _save_results_csv(self, verified_results: List[Dict[str, Any]], filepath: str):
        """Save verified results to CSV"""
        if not verified_results:
            self.logger.log_info("No verified results to save")
            return
        
        # Flatten allocation plans for CSV
        rows = []
        for result in verified_results:
            base_row = {
                'invoice_id': result['invoice_id'],
                'verified': result['verified'],
                'claimed_credit': result['claimed_credit'],
                'total_remaining_credit': result['total_remaining_credit'],
                'shortfall': result['shortfall']
            }
            
            if result['allocation_plan']:
                for i, allocation in enumerate(result['allocation_plan']):
                    row = base_row.copy()
                    row[f'memo_id_{i+1}'] = allocation['credit_memo_id']
                    row[f'amount_used_{i+1}'] = allocation['amount_used']
                    rows.append(row)
            else:
                rows.append(base_row)
        
        df = pd.DataFrame(rows)
        df.to_csv(filepath, index=False)
        self.logger.log_info(f"Saved {len(verified_results)} verified results to {filepath}")
    
    def _save_manual_review_csv(self, unverified_results: List[Dict[str, Any]], filepath: str):
        """Save unverified results for manual review"""
        rows = []
        for result in unverified_results:
            rows.append({
                'invoice_id': result['invoice_id'],
                'claimed_credit': result['claimed_credit'],
                'total_remaining_credit': result['total_remaining_credit'],
                'shortfall': result['shortfall'],
                'reason': 'Insufficient credit' if result['shortfall'] > 0 else 'No eligible memos',
                'requires_review': True
            })
        
        df = pd.DataFrame(rows)
        df.to_csv(filepath, index=False)
        self.logger.log_info(f"Saved {len(unverified_results)} cases for manual review to {filepath}")
    
    def _save_complete_results_json(self, results: List[Dict], filepath: str):
        """Save complete results with allocation plans to JSON"""
        # Convert numpy/pandas types to native Python types
        serializable_results = []
        for result in results:
            serializable_result = self._convert_to_serializable(result)
            serializable_results.append(serializable_result)
        
        with open(filepath, 'w') as f:
            json.dump(serializable_results, f, indent=2)

    def _convert_to_serializable(self, obj):
        """Convert numpy/pandas types to JSON serializable types"""
        if isinstance(obj, dict):
            return {key: self._convert_to_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_to_serializable(item) for item in obj]
        elif isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif hasattr(obj, 'item'):  # pandas scalars
            return obj.item()
        else:
            return obj

