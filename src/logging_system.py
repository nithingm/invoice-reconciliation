"""
Logging System
Handles all logging and audit trail generation
"""

import logging
import json
from datetime import datetime
from typing import List, Dict, Any
import numpy as np

class LoggingSystem:
    def __init__(self, log_file: str = "reconciliation.log"):
        self.log_file = log_file
        self.audit_trail = []
        
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def log_info(self, message: str):
        """Log info message"""
        self.logger.info(message)
        self.audit_trail.append({
            'timestamp': datetime.now().isoformat(),
            'level': 'INFO',
            'message': message
        })
    
    def log_error(self, message: str):
        """Log error message"""
        self.logger.error(message)
        self.audit_trail.append({
            'timestamp': datetime.now().isoformat(),
            'level': 'ERROR',
            'message': message
        })
    
    def log_verification_attempt(self, invoice_id: str, result: Dict[str, Any]):
        """Log verification attempt with detailed result"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'type': 'VERIFICATION_ATTEMPT',
            'invoice_id': invoice_id,
            'result': result
        }
        
        self.audit_trail.append(log_entry)
        
        status = "VERIFIED" if result['verified'] else "FAILED"
        self.log_info(f"Verification {status} for invoice {invoice_id}")
    
    def log_warning(self, message: str):
        """Log warning message"""
        self.logger.warning(message)
        self.audit_trail.append({
            'timestamp': datetime.now().isoformat(),
            'level': 'WARNING',
            'message': message
        })
    def get_audit_trail(self) -> List[Dict[str, Any]]:
        """Get complete audit trail"""
        return self.audit_trail
    
    def save_audit_trail(self, filepath: str):
        """Save audit trail to JSON file"""
        with open(filepath, 'w') as f:
            json.dump(self.audit_trail, f, indent=2, default=self._convert_to_serializable)
            
    def _convert_to_serializable(self, obj):
        if isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        elif hasattr(obj, 'item'):
            return obj.item()
        else:
            return str(obj)