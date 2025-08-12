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
        """Initialize with relational mock database data"""
        self.customers = mock_data.get('customers', [])
        self.credits = mock_data.get('credits', [])
        self.invoices = mock_data.get('invoices', [])
        self.credit_memos = mock_data.get('creditMemos', [])
        self.damage_reports = mock_data.get('damageReports', [])
    
    def find_customer(self, customer_id: str, customer_name: str = None) -> Optional[Dict]:
        """Find customer by ID or name with precise matching"""
        if customer_id:
            for customer in self.customers:
                if customer['id'].upper() == customer_id.upper():
                    return customer
        
        if customer_name:
            name_lower = customer_name.lower().strip()
            for customer in self.customers:
                customer_name_lower = customer['name'].lower().strip()

                # Exact match first
                if name_lower == customer_name_lower:
                    return customer

                # Check if all parts of the search name are in the customer name
                search_parts = name_lower.split()
                customer_parts = customer_name_lower.split()

                # All search parts must be found in customer name parts
                if all(any(search_part in customer_part for customer_part in customer_parts)
                       for search_part in search_parts):
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

    def get_customer_credits(self, customer_id: str) -> List[Dict]:
        """Get all credits for a customer"""
        return [credit for credit in self.credits if credit['customerId'] == customer_id]

    def get_customer_active_credits(self, customer_id: str) -> List[Dict]:
        """Get active credits for a customer"""
        now = datetime.now()
        active_credits = []

        for credit in self.credits:
            if (credit['customerId'] == customer_id and
                credit['status'] in ['active', 'partially_used'] and
                credit['amount'] > 0):

                expiry_date = datetime.strptime(credit['expiryDate'], '%Y-%m-%d')
                if expiry_date > now:
                    active_credits.append(credit)

        return active_credits

    def calculate_total_active_credits(self, customer_id: str) -> Decimal:
        """Calculate total active credits for a customer"""
        active_credits = self.get_customer_active_credits(customer_id)
        total = Decimal('0.00')

        for credit in active_credits:
            total += Decimal(str(credit['amount']))

        return total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    def calculate_available_credits(self, customer: Dict) -> Dict[str, Any]:
        """Calculate available credits using relational structure with precise decimal arithmetic"""
        if not customer:
            return {
                'total_available': 0.00,
                'active_credits': [],
                'expired_credits': [],
                'used_credits': []
            }

        # Get all credits for this customer from the credits table
        customer_credits = self.get_customer_credits(customer['id'])

        now = datetime.now()
        active_credits = []
        expired_credits = []
        used_credits = []
        total_available = Decimal('0.00')

        for credit in customer_credits:
            credit_amount = Decimal(str(credit.get('amount', 0)))
            expiry_date = datetime.strptime(credit['expiryDate'], '%Y-%m-%d')

            if credit['status'] == 'used' or credit_amount <= 0:
                used_credits.append(credit)
            elif expiry_date <= now:
                expired_credits.append(credit)
                # Mark as expired if not already
                credit['status'] = 'expired'
            elif credit['status'] in ['active', 'partially_used'] and credit_amount > 0:
                active_credits.append(credit)
                total_available += credit_amount

        return {
            'total_available': float(total_available.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
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
            'total_available': float(credit_info['total_available']),
            'active_count': len(credit_info['active_credits']),
            'expired_count': len(credit_info['expired_credits']),
            'active_credits': credit_info['active_credits']
        }
        
        # Validate credit amount
        requested_amount = Decimal(str(credit_amount))
        available_amount = credit_info['total_available']
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
                'remaining_credits': float(updated_credit_info['total_available'])
            },
            'credits_used': credits_used,
            'customer_info': validation['customer_info'],
            'invoice_info': validation['invoice_info']
        }

    def get_credit_balance(self, customer_id: str = None, customer_name: str = None) -> Dict[str, Any]:
        """Get customer's credit balance and details"""
        try:
            # Find customer
            customer = self.find_customer(customer_id, customer_name)
            if not customer:
                return {
                    'success': False,
                    'customer_found': False,
                    'error': 'Customer not found'
                }

            # Calculate available credits using new relational structure
            credit_info = self.calculate_available_credits(customer)

            # Format active credits for display with detailed information
            active_credits_formatted = []
            for credit in credit_info['active_credits']:
                active_credits_formatted.append({
                    'id': credit['id'],
                    'amount': credit['amount'],
                    'original_amount': credit['originalAmount'],
                    'description': credit['description'],
                    'expiry_date': credit['expiryDate'],
                    'earned_date': credit.get('earnedDate', 'Unknown'),
                    'source_type': credit.get('sourceType', 'purchase_reward'),
                    'category': credit.get('category', 'general'),
                    'status': credit['status'],
                    'usage_history': credit.get('usageHistory', [])
                })

            return {
                'success': True,
                'customer_found': True,
                'customer_info': {
                    'id': customer['id'],
                    'name': customer['name'],
                    'email': customer['email']
                },
                'credit_info': {
                    'total_available': credit_info['total_available'],
                    'active_credits': active_credits_formatted,
                    'expired_credits_count': len(credit_info['expired_credits']),
                    'used_credits_count': len(credit_info['used_credits'])
                }
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Credit balance calculation error: {str(e)}'
            }

    def get_purchase_history(self, customer_id: str = None, customer_name: str = None) -> Dict[str, Any]:
        """Get customer's purchase history from invoices using relational structure"""
        try:
            # Find customer
            customer = self.find_customer(customer_id, customer_name)
            if not customer:
                return {
                    'success': False,
                    'customer_found': False,
                    'error': 'Customer not found'
                }

            # Get all invoices for this customer from the invoices table
            customer_invoices = [invoice for invoice in self.invoices if invoice['customerId'] == customer['id']]

            # Sort by date (newest first)
            customer_invoices_sorted = sorted(customer_invoices, key=lambda x: x.get('date', ''), reverse=True)

            # Format purchase history data from invoices
            purchases = []
            for invoice in customer_invoices_sorted:
                # Calculate credits earned from this invoice
                credits_earned = 0
                for credit_id in invoice.get('earnedCreditIds', []):
                    credit = next((c for c in self.credits if c['id'] == credit_id), None)
                    if credit:
                        credits_earned += credit['originalAmount']

                # Get main product description from items
                product_descriptions = []
                for item in invoice.get('items', []):
                    product_descriptions.append(item.get('description', 'Unknown item'))

                main_product = ', '.join(product_descriptions[:2])  # Show first 2 items
                if len(product_descriptions) > 2:
                    main_product += f' (+{len(product_descriptions) - 2} more)'

                purchases.append({
                    'invoiceId': invoice.get('id', 'N/A'),
                    'amount': invoice.get('originalAmount', 0),
                    'currentAmount': invoice.get('currentAmount', 0),
                    'creditsApplied': invoice.get('creditsApplied', 0),
                    'date': invoice.get('date', 'N/A'),
                    'dueDate': invoice.get('dueDate', 'N/A'),
                    'status': invoice.get('status', 'unknown'),
                    'paymentStatus': invoice.get('paymentStatus', 'unknown'),
                    'product': main_product or 'Transmission service',
                    'creditsEarned': credits_earned,
                    'itemCount': len(invoice.get('items', []))
                })

            return {
                'success': True,
                'customer_found': True,
                'customer_info': {
                    'id': customer['id'],
                    'name': customer['name'],
                    'email': customer['email']
                },
                'purchase_history': purchases
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Purchase history retrieval error: {str(e)}'
            }

    def process_quantity_discrepancy(self, customer_id: str, customer_name: str,
                                   invoice_id: str, missing_quantity: int,
                                   item_description: str = None) -> Dict[str, Any]:
        """Process quantity discrepancy and generate credit memo"""
        try:
            # Find customer - if no customer_id provided, try to find by invoice
            customer = self.find_customer(customer_id, customer_name)
            if not customer and invoice_id:
                # Try to find customer by invoice
                invoice = self.find_invoice(invoice_id)
                if invoice:
                    customer = self.find_customer(invoice['customerId'], None)

            if not customer:
                return {
                    'success': False,
                    'error': f'Customer not found: {customer_id or customer_name or "from invoice " + invoice_id}'
                }

            # Find invoice
            invoice = self.find_invoice(invoice_id)
            if not invoice:
                return {
                    'success': False,
                    'error': f'Invoice not found: {invoice_id}'
                }

            # Verify customer owns the invoice
            if invoice['customerId'] != customer['id']:
                return {
                    'success': False,
                    'error': 'Invoice does not belong to this customer'
                }

            # Find the item with quantity discrepancy - use flexible matching
            affected_item = None
            for item in invoice.get('items', []):
                # Check if item description matches (if provided)
                if item_description:
                    item_desc_lower = item['description'].lower()
                    search_desc_lower = item_description.lower()

                    if (search_desc_lower in item_desc_lower or
                        item_desc_lower in search_desc_lower or
                        any(word in item_desc_lower for word in search_desc_lower.split() if len(word) > 3)):
                        affected_item = item
                        break

                # Or check if there's a quantity discrepancy
                elif item.get('receivedQuantity', 0) < item.get('quantity', 0):
                    affected_item = item
                    break

            # If no specific item found and there's only one item, use it
            if not affected_item and len(invoice.get('items', [])) == 1:
                affected_item = invoice['items'][0]

            if not affected_item:
                items_list = [item['description'] for item in invoice.get('items', [])]
                return {
                    'success': False,
                    'error': f'No quantity discrepancy found. Available items: {", ".join(items_list)}'
                }

            # Calculate credit amount
            unit_price = affected_item.get('unitPrice', 0)
            credit_amount = missing_quantity * unit_price

            # Generate credit memo
            credit_memo = {
                'id': f'CM{len(self.credit_memos) + 1:03d}',
                'customerId': customer['id'],
                'invoiceId': invoice_id,
                'amount': credit_amount,
                'reason': f'Missing quantity - {missing_quantity} units of {affected_item["description"]}',
                'status': 'draft',
                'createdDate': datetime.now().isoformat(),
                'type': 'quantity_shortage',
                'items': [{
                    'itemId': affected_item.get('id'),
                    'description': affected_item['description'],
                    'missingQuantity': missing_quantity,
                    'unitPrice': unit_price,
                    'creditAmount': credit_amount
                }],
                'customerChoice': None
            }

            return {
                'success': True,
                'customer_info': {
                    'id': customer['id'],
                    'name': customer['name'],
                    'email': customer['email']
                },
                'invoice_info': {
                    'id': invoice['id'],
                    'description': invoice['description'],
                    'payment_status': invoice.get('paymentStatus', 'unknown')
                },
                'credit_memo': credit_memo,
                'options': self._get_credit_options(invoice.get('paymentStatus', 'unpaid'))
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Quantity discrepancy processing error: {str(e)}'
            }

    def process_damage_report(self, customer_id: str, customer_name: str,
                            invoice_id: str, item_description: str,
                            damage_description: str) -> Dict[str, Any]:
        """Process damage report and generate credit memo"""
        try:
            # Find customer - if no customer_id provided, try to find by invoice
            customer = self.find_customer(customer_id, customer_name)
            if not customer and invoice_id:
                # Try to find customer by invoice
                invoice = self.find_invoice(invoice_id)
                if invoice:
                    customer = self.find_customer(invoice['customerId'], None)

            if not customer:
                return {
                    'success': False,
                    'error': f'Customer not found: {customer_id or customer_name or "from invoice " + invoice_id}'
                }

            # Find invoice
            invoice = self.find_invoice(invoice_id)
            if not invoice:
                return {
                    'success': False,
                    'error': f'Invoice not found: {invoice_id}'
                }

            # Verify customer owns the invoice
            if invoice['customerId'] != customer['id']:
                return {
                    'success': False,
                    'error': 'Invoice does not belong to this customer'
                }

            # Find the damaged item - use flexible matching
            damaged_item = None
            for item in invoice.get('items', []):
                item_desc_lower = item['description'].lower()
                search_desc_lower = item_description.lower()

                # Check if search terms are in item description or vice versa
                if (search_desc_lower in item_desc_lower or
                    item_desc_lower in search_desc_lower or
                    any(word in item_desc_lower for word in search_desc_lower.split() if len(word) > 3)):
                    damaged_item = item
                    break

            # If no specific item found and there's only one item, use it
            if not damaged_item and len(invoice.get('items', [])) == 1:
                damaged_item = invoice['items'][0]

            if not damaged_item:
                items_list = [item['description'] for item in invoice.get('items', [])]
                return {
                    'success': False,
                    'error': f'Item not found in invoice. Available items: {", ".join(items_list)}'
                }

            # Calculate credit amount (full item price for damage)
            credit_amount = damaged_item.get('price', 0)

            # Generate damage report
            damage_report = {
                'id': f'DR{len(self.damage_reports) + 1:03d}',
                'customerId': customer['id'],
                'invoiceId': invoice_id,
                'itemId': damaged_item.get('id'),
                'reportDate': datetime.now().isoformat(),
                'description': damage_description,
                'status': 'pending_review',
                'estimatedCreditAmount': credit_amount,
                'customerChoice': None
            }

            # Generate credit memo
            credit_memo = {
                'id': f'CM{len(self.credit_memos) + 1:03d}',
                'customerId': customer['id'],
                'invoiceId': invoice_id,
                'amount': credit_amount,
                'reason': f'Damaged item - {damaged_item["description"]}: {damage_description}',
                'status': 'draft',
                'createdDate': datetime.now().isoformat(),
                'type': 'damage_claim',
                'items': [{
                    'itemId': damaged_item.get('id'),
                    'description': damaged_item['description'],
                    'damageDescription': damage_description,
                    'creditAmount': credit_amount
                }],
                'customerChoice': None
            }

            return {
                'success': True,
                'customer_info': {
                    'id': customer['id'],
                    'name': customer['name'],
                    'email': customer['email']
                },
                'invoice_info': {
                    'id': invoice['id'],
                    'description': invoice['description'],
                    'payment_status': invoice.get('paymentStatus', 'unknown')
                },
                'damage_report': damage_report,
                'credit_memo': credit_memo,
                'options': self._get_credit_options(invoice.get('paymentStatus', 'unpaid'))
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Damage report processing error: {str(e)}'
            }

    def approve_credit_memo(self, credit_memo_id: str, customer_choice: str,
                          target_invoice_id: str = None) -> Dict[str, Any]:
        """Approve credit memo and process customer choice"""
        try:
            # Find credit memo (in real implementation, this would update the database)
            credit_memo = None
            for memo in self.credit_memos:
                if memo['id'] == credit_memo_id:
                    credit_memo = memo
                    break

            if not credit_memo:
                return {
                    'success': False,
                    'error': f'Credit memo not found: {credit_memo_id}'
                }

            # Update credit memo status
            credit_memo['status'] = 'approved'
            credit_memo['approvedDate'] = datetime.now().isoformat()
            credit_memo['customerChoice'] = customer_choice

            if customer_choice == 'apply_to_invoice' and target_invoice_id:
                credit_memo['targetInvoiceId'] = target_invoice_id
                # Apply credit to target invoice
                result = self._apply_credit_to_invoice(credit_memo['amount'], target_invoice_id)
                if not result['success']:
                    return result
            elif customer_choice == 'apply_to_account':
                # Add credit to customer account
                result = self._add_credit_to_account(credit_memo['customerId'], credit_memo['amount'],
                                                   credit_memo['reason'])
                if not result['success']:
                    return result
            elif customer_choice == 'refund':
                # Process refund (in real implementation, this would trigger payment processing)
                credit_memo['status'] = 'refund_processed'

            credit_memo['appliedDate'] = datetime.now().isoformat()

            return {
                'success': True,
                'credit_memo': credit_memo,
                'message': f'Credit memo {credit_memo_id} processed successfully with choice: {customer_choice}'
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Credit memo approval error: {str(e)}'
            }

    def _get_credit_options(self, payment_status: str) -> List[Dict[str, str]]:
        """Get available credit options based on payment status"""
        if payment_status == 'paid':
            return [
                {'value': 'apply_to_account', 'label': 'Apply credit to account for future purchases'},
                {'value': 'refund', 'label': 'Issue refund to original payment method'}
            ]
        else:
            return [
                {'value': 'apply_to_invoice', 'label': 'Apply credit to current invoice'},
                {'value': 'apply_to_account', 'label': 'Apply credit to account for future purchases'}
            ]

    def _apply_credit_to_invoice(self, credit_amount: float, invoice_id: str) -> Dict[str, Any]:
        """Apply credit to specific invoice"""
        try:
            invoice = self.find_invoice(invoice_id)
            if not invoice:
                return {
                    'success': False,
                    'error': f'Target invoice not found: {invoice_id}'
                }

            # Update invoice amounts
            invoice['creditsApplied'] += credit_amount
            invoice['currentAmount'] = max(0, invoice['currentAmount'] - credit_amount)

            return {
                'success': True,
                'message': f'Credit of ${credit_amount} applied to invoice {invoice_id}'
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Credit application error: {str(e)}'
            }

    def _add_credit_to_account(self, customer_id: str, credit_amount: float, reason: str) -> Dict[str, Any]:
        """Add credit to customer account"""
        try:
            customer = None
            for cust in self.customers:
                if cust['id'] == customer_id:
                    customer = cust
                    break

            if not customer:
                return {
                    'success': False,
                    'error': f'Customer not found: {customer_id}'
                }

            # Add new credit to customer account
            new_credit = {
                'id': f'CR{len(customer.get("credits", [])) + 1:03d}',
                'amount': credit_amount,
                'earnedDate': datetime.now().isoformat(),
                'expiryDate': (datetime.now().replace(year=datetime.now().year + 2)).isoformat(),
                'status': 'active',
                'sourceInvoice': 'CREDIT_MEMO',
                'description': reason
            }

            if 'credits' not in customer:
                customer['credits'] = []
            customer['credits'].append(new_credit)

            return {
                'success': True,
                'message': f'Credit of ${credit_amount} added to customer account'
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Account credit addition error: {str(e)}'
            }

    def process_partial_payment(self, customer_id: str, customer_name: str, invoice_id: str,
                               paid_amount: Decimal, invoice_amount: Decimal = None) -> Dict[str, Any]:
        """
        Process partial payment and attempt to cover remaining balance with customer credits

        Args:
            customer_id: Customer ID
            customer_name: Customer name
            invoice_id: Invoice ID
            paid_amount: Amount customer actually paid
            invoice_amount: Total invoice amount (optional, will be looked up if not provided)

        Returns:
            Dict with processing results
        """
        try:
            # Find customer
            customer = self.find_customer(customer_id, customer_name)
            if not customer:
                return {
                    'success': False,
                    'error': 'Customer not found',
                    'customer_name': customer_name or customer_id,
                    'invoice_id': invoice_id,
                    'paid_amount': float(paid_amount),
                    'remaining_balance': 0
                }

            # Find invoice
            invoice = None
            for inv in self.invoices:
                if inv['id'].upper() == invoice_id.upper():
                    invoice = inv
                    break

            if not invoice:
                return {
                    'success': False,
                    'error': 'Invoice not found',
                    'customer_name': customer['name'],
                    'customer_email': customer['email'],
                    'invoice_id': invoice_id,
                    'paid_amount': float(paid_amount),
                    'remaining_balance': 0
                }

            # Verify invoice belongs to customer
            if invoice['customerId'] != customer['id']:
                return {
                    'success': False,
                    'error': 'Invoice does not belong to this customer',
                    'customer_name': customer['name'],
                    'customer_email': customer['email'],
                    'invoice_id': invoice_id,
                    'paid_amount': float(paid_amount),
                    'remaining_balance': 0
                }

            # Get invoice amount
            total_amount = Decimal(str(invoice_amount)) if invoice_amount else Decimal(str(invoice['currentAmount']))
            remaining_balance = total_amount - paid_amount

            if remaining_balance <= 0:
                # Payment covers full amount or overpayment
                return {
                    'success': True,
                    'invoice_fully_paid': True,
                    'customer_name': customer['name'],
                    'customer_email': customer['email'],
                    'invoice_id': invoice_id,
                    'paid_amount': float(paid_amount),
                    'credits_applied': 0.0,
                    'applied_credits': [],
                    'remaining_balance': 0.0,
                    'remaining_credits': float(self.calculate_total_active_credits(customer['id']))
                }

            # Get available credits for this customer
            available_credits = self.get_customer_active_credits(customer['id'])
            total_available = sum(Decimal(str(credit['amount'])) for credit in available_credits)

            if total_available <= 0:
                # No credits available
                return {
                    'success': False,
                    'error': 'No credits available for deduction',
                    'customer_name': customer['name'],
                    'customer_email': customer['email'],
                    'invoice_id': invoice_id,
                    'paid_amount': float(paid_amount),
                    'credits_applied': 0.0,
                    'applied_credits': [],
                    'remaining_balance': float(remaining_balance),
                    'remaining_credits': 0.0
                }

            # Apply credits to cover remaining balance
            credits_to_apply = []
            credits_applied_amount = Decimal('0')
            remaining_to_cover = remaining_balance

            for credit in available_credits:
                if remaining_to_cover <= 0:
                    break

                credit_amount = Decimal(str(credit['amount']))
                if credit_amount > remaining_to_cover:
                    # Partial credit usage
                    credits_to_apply.append({
                        'id': credit['id'],
                        'amount': float(remaining_to_cover),
                        'category': credit['category']
                    })
                    credits_applied_amount += remaining_to_cover
                    remaining_to_cover = Decimal('0')
                else:
                    # Full credit usage
                    credits_to_apply.append({
                        'id': credit['id'],
                        'amount': float(credit_amount),
                        'category': credit['category']
                    })
                    credits_applied_amount += credit_amount
                    remaining_to_cover -= credit_amount

            # Calculate final remaining balance
            final_remaining_balance = remaining_balance - credits_applied_amount
            invoice_fully_paid = final_remaining_balance <= 0

            # Calculate remaining credits after application
            remaining_credits = total_available - credits_applied_amount

            return {
                'success': True,
                'invoice_fully_paid': invoice_fully_paid,
                'customer_name': customer['name'],
                'customer_email': customer['email'],
                'invoice_id': invoice_id,
                'paid_amount': float(paid_amount),
                'credits_applied': float(credits_applied_amount),
                'applied_credits': credits_to_apply,
                'remaining_balance': float(final_remaining_balance) if not invoice_fully_paid else 0.0,
                'remaining_credits': float(remaining_credits)
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Partial payment processing error: {str(e)}',
                'customer_name': customer_name or customer_id,
                'invoice_id': invoice_id,
                'paid_amount': float(paid_amount),
                'remaining_balance': 0
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

        # Additional parameters for new actions
        missing_quantity = int(input_data.get('missing_quantity', 0))
        item_description = input_data.get('item_description', '')
        damage_description = input_data.get('damage_description', '')
        credit_memo_id = input_data.get('credit_memo_id', '')
        customer_choice = input_data.get('customer_choice', '')
        target_invoice_id = input_data.get('target_invoice_id', '')

        # Initialize service
        service = CreditValidationService(mock_data)

        # Perform action
        if action == 'validate':
            result = service.validate_credit_application(customer_id, customer_name, credit_amount, invoice_id)
        elif action == 'apply':
            result = service.apply_credits(customer_id, customer_name, credit_amount, invoice_id)
        elif action == 'balance':
            result = service.get_credit_balance(customer_id, customer_name)
        elif action == 'history':
            result = service.get_purchase_history(customer_id, customer_name)
        elif action == 'quantity_discrepancy':
            result = service.process_quantity_discrepancy(customer_id, customer_name, invoice_id,
                                                        missing_quantity, item_description)
        elif action == 'damage_report':
            result = service.process_damage_report(customer_id, customer_name, invoice_id,
                                                 item_description, damage_description)
        elif action == 'approve_credit_memo':
            result = service.approve_credit_memo(credit_memo_id, customer_choice, target_invoice_id)
        elif action == 'partial_payment':
            paid_amount = Decimal(str(input_data.get('paid_amount', 0)))
            invoice_amount_raw = input_data.get('invoice_amount')
            invoice_amount = Decimal(str(invoice_amount_raw)) if invoice_amount_raw is not None else None
            result = service.process_partial_payment(customer_id, customer_name, invoice_id, paid_amount, invoice_amount)
        else:
            result = {'error': f'Unknown action: {action}'}

        # Output result as JSON
        print(json.dumps(result, default=str))

    except Exception as e:
        print(json.dumps({'error': f'Python service error: {str(e)}'}))
        sys.exit(1)

if __name__ == '__main__':
    main()
