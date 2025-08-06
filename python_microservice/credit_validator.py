#!/usr/bin/env python3
"""
Credit Validation Microservice
Handles precise credit calculations and database validation
"""

import json
import sys
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Any

class CreditValidationService:
    def __init__(self, mock_data: Dict[str, Any]):
        """Initialize with mock database data"""
        self.customers = mock_data.get('customers', [])
        self.invoices = mock_data.get('invoices', [])
    
    def find_customer(self, customer_id: str, customer_name: str = None) -> Optional[Dict]:
        """Find customer by ID or name with precise matching"""
        if customer_id:
            for customer in self.customers:
                if customer['id'].upper() == customer_id.upper():
                    return customer
        
        if customer_name:
            name_lower = customer_name.lower()
            for customer in self.customers:
                customer_name_lower = customer['name'].lower()
                if (name_lower in customer_name_lower or 
                    customer_name_lower in name_lower or
                    any(part in name_lower for part in customer_name_lower.split())):
                    return customer
        
        return None
    
    def find_invoice(self, invoice_id: str = None, customer_id: str = None) -> Optional[Dict]:
        """Find invoice by ID or customer's latest pending invoice"""
        if invoice_id:
            for invoice in self.invoices:
                if invoice['id'].upper() == invoice_id.upper():
                    return invoice
        
        if customer_id:
            # Find customer's latest pending invoice
            customer_invoices = [
                inv for inv in self.invoices 
                if inv['customerId'] == customer_id and inv['status'] == 'pending'
            ]
            if customer_invoices:
                # Sort by date (latest first)
                customer_invoices.sort(key=lambda x: datetime.strptime(x['date'], '%Y-%m-%d'), reverse=True)
                return customer_invoices[0]
        
        return None
    
    def calculate_available_credits(self, customer: Dict) -> Dict[str, Any]:
        """Calculate available credits with precise decimal arithmetic"""
        if not customer or 'credits' not in customer:
            return {
                'total_active': Decimal('0.00'),
                'active_credits': [],
                'expired_credits': [],
                'used_credits': []
            }
        
        now = datetime.now()
        active_credits = []
        expired_credits = []
        used_credits = []
        
        for credit in customer['credits']:
            expiry_date = datetime.strptime(credit['expiryDate'], '%Y-%m-%d')

            if credit['status'] == 'used':
                used_credits.append(credit)
            elif credit['status'] == 'active' and expiry_date > now:
                active_credits.append(credit)
            else:
                expired_credits.append(credit)
        
        # Use Decimal for precise arithmetic
        total_active = sum(Decimal(str(credit['amount'])) for credit in active_credits)
        
        return {
            'total_active': total_active,
            'active_credits': active_credits,
            'expired_credits': expired_credits,
            'used_credits': used_credits
        }
    
    def validate_credit_application(self, customer_id: str, customer_name: str, 
                                  credit_amount: float, invoice_id: str = None) -> Dict[str, Any]:
        """Validate credit application with comprehensive checks"""
        result = {
            'success': False,
            'customer_found': False,
            'invoice_found': False,
            'customer_info': {},
            'invoice_info': {},
            'credit_info': {},
            'validation_errors': [],
            'warnings': []
        }
        
        # Find customer
        customer = self.find_customer(customer_id, customer_name)
        if not customer:
            result['validation_errors'].append(f"Customer not found: {customer_id or customer_name}")
            return result
        
        result['customer_found'] = True
        result['customer_info'] = {
            'id': customer['id'],
            'name': customer['name'],
            'email': customer['email']
        }
        
        # Find invoice
        invoice = self.find_invoice(invoice_id, customer['id'])
        if not invoice:
            result['validation_errors'].append(f"No pending invoice found for customer {customer['name']}")
            return result
        
        result['invoice_found'] = True
        result['invoice_info'] = {
            'id': invoice['id'],
            'original_amount': Decimal(str(invoice['originalAmount'])),
            'current_amount': Decimal(str(invoice['currentAmount'])),
            'credits_applied': Decimal(str(invoice.get('creditsApplied', 0))),
            'status': invoice['status']
        }
        
        # Calculate available credits
        credit_info = self.calculate_available_credits(customer)
        result['credit_info'] = {
            'total_available': float(credit_info['total_active']),
            'active_count': len(credit_info['active_credits']),
            'expired_count': len(credit_info['expired_credits']),
            'active_credits': credit_info['active_credits']
        }
        
        # Validate credit amount
        requested_amount = Decimal(str(credit_amount))
        available_amount = credit_info['total_active']
        invoice_amount = result['invoice_info']['current_amount']
        
        if requested_amount > available_amount:
            result['validation_errors'].append(
                f"Insufficient credits: Available ${available_amount}, Requested ${requested_amount}"
            )
            return result
        
        if requested_amount > invoice_amount:
            result['validation_errors'].append(
                f"Credit amount ${requested_amount} exceeds invoice balance ${invoice_amount}"
            )
            return result
        
        # Add warnings for expired credits
        if credit_info['expired_credits']:
            expired_total = sum(Decimal(str(c['amount'])) for c in credit_info['expired_credits'])
            result['warnings'].append(f"Customer has ${expired_total} in expired credits")
        
        result['success'] = True
        return result
    
    def apply_credits(self, customer_id: str, customer_name: str, 
                     credit_amount: float, invoice_id: str = None) -> Dict[str, Any]:
        """Apply credits with FIFO and precise calculations"""
        # First validate
        validation = self.validate_credit_application(customer_id, customer_name, credit_amount, invoice_id)
        if not validation['success']:
            return validation
        
        # Find customer and invoice again (for safety)
        customer = self.find_customer(customer_id, customer_name)
        invoice = self.find_invoice(invoice_id, customer['id'])
        
        # Apply credits using FIFO (First In, First Out)
        credit_info = self.calculate_available_credits(customer)
        remaining_to_apply = Decimal(str(credit_amount))
        credits_used = []
        
        # Sort active credits by earned date (oldest first)
        active_credits = sorted(credit_info['active_credits'], 
                              key=lambda x: datetime.strptime(x['earnedDate'], '%Y-%m-%d'))
        
        for credit in active_credits:
            if remaining_to_apply <= 0:
                break
            
            available_in_credit = Decimal(str(credit['amount']))
            amount_to_use = min(available_in_credit, remaining_to_apply)
            
            credits_used.append({
                'credit_id': credit.get('id', 'N/A'),
                'description': credit.get('description', 'N/A'),
                'original_amount': float(available_in_credit),
                'amount_used': float(amount_to_use),
                'remaining_in_credit': float(available_in_credit - amount_to_use)
            })
            
            # Update credit in database
            credit['amount'] = float(available_in_credit - amount_to_use)
            if credit['amount'] == 0:
                credit['status'] = 'used'
            
            remaining_to_apply -= amount_to_use
        
        # Update invoice
        original_amount = Decimal(str(invoice['originalAmount']))
        previous_amount = Decimal(str(invoice['currentAmount']))
        credit_amount_decimal = Decimal(str(credit_amount))
        new_amount = previous_amount - credit_amount_decimal
        previous_credits = Decimal(str(invoice.get('creditsApplied', 0)))
        
        invoice['currentAmount'] = float(new_amount)
        invoice['creditsApplied'] = float(previous_credits + credit_amount_decimal)
        
        # Calculate remaining credits
        updated_credit_info = self.calculate_available_credits(customer)
        
        return {
            'success': True,
            'transaction': {
                'customer_id': customer['id'],
                'customer_name': customer['name'],
                'customer_email': customer['email'],
                'invoice_id': invoice['id'],
                'original_invoice_amount': float(original_amount),
                'previous_invoice_amount': float(previous_amount),
                'credit_amount_applied': float(credit_amount_decimal),
                'new_invoice_amount': float(new_amount),
                'remaining_credits': float(updated_credit_info['total_active'])
            },
            'credits_used': credits_used,
            'customer_info': validation['customer_info'],
            'invoice_info': validation['invoice_info']
        }

def main():
    """Main function to handle command line input"""
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No input provided'}))
        sys.exit(1)
    
    try:
        # Parse input JSON
        input_data = json.loads(sys.argv[1])
        
        # Extract parameters
        action = input_data.get('action', 'validate')
        customer_id = input_data.get('customer_id', '')
        customer_name = input_data.get('customer_name', '')
        credit_amount = float(input_data.get('credit_amount', 0))
        invoice_id = input_data.get('invoice_id', '')
        mock_data = input_data.get('mock_data', {})
        
        # Initialize service
        service = CreditValidationService(mock_data)
        
        # Perform action
        if action == 'validate':
            result = service.validate_credit_application(customer_id, customer_name, credit_amount, invoice_id)
        elif action == 'apply':
            result = service.apply_credits(customer_id, customer_name, credit_amount, invoice_id)
        else:
            result = {'error': f'Unknown action: {action}'}
        
        # Output result as JSON
        print(json.dumps(result, default=str))
        
    except Exception as e:
        print(json.dumps({'error': f'Python service error: {str(e)}'}))
        sys.exit(1)

if __name__ == '__main__':
    main()
