from db import db
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Any

class CreditValidationService:
    def __init__(self):
        self.customers = db.customers
        self.credits = db.credits
        self.invoices = db.invoices
        self.credit_memos = db.credit_memos
        self.damage_reports = db.damage_reports

    def find_customer(self, customer_id: str, customer_name: str = None) -> Optional[Dict]:
        if customer_id:
            return self.customers.find_one({'id': customer_id})
        if customer_name:
            return self.customers.find_one({'name': {'$regex': customer_name, '$options': 'i'}})
        return None

    def find_invoice(self, invoice_id: str = None, customer_id: str = None) -> Optional[Dict]:
        if invoice_id:
            return self.invoices.find_one({'id': invoice_id})
        if customer_id:
            return self.invoices.find_one({'customerId': customer_id, 'status': 'pending'}, sort=[('date', -1)])
        return None

    def get_customer_credits(self, customer_id: str) -> List[Dict]:
        return list(self.credits.find({'customerId': customer_id}))

    def get_customer_active_credits(self, customer_id: str) -> List[Dict]:
        now = datetime.now()
        return list(self.credits.find({
            'customerId': customer_id,
            'status': {'$in': ['active', 'partially_used']},
            'amount': {'$gt': 0},
            'expiryDate': {'$gt': now}
        }))

    def calculate_total_active_credits(self, customer_id: str) -> Decimal:
        active_credits = self.get_customer_active_credits(customer_id)
        total = Decimal('0.00')
        for credit in active_credits:
            total += Decimal(str(credit['amount']))
        return total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    def calculate_available_credits(self, customer: Dict) -> Dict[str, Any]:
        if not customer:
            return {
                'total_available': 0.00,
                'active_credits': [],
                'expired_credits': [],
                'used_credits': []
            }

        customer_credits = self.get_customer_credits(customer['id'])
        now = datetime.now()
        active_credits = []
        expired_credits = []
        used_credits = []
        total_available = Decimal('0.00')

        for credit in customer_credits:
            credit_amount = Decimal(str(credit.get('amount', 0)))
            expiry_date = credit['expiryDate']

            if credit['status'] == 'used' or credit_amount <= 0:
                used_credits.append(credit)
            elif expiry_date <= now:
                expired_credits.append(credit)
                self.credits.update_one({'_id': credit['_id']}, {'$set': {'status': 'expired'}})
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
        
        credit_info = self.calculate_available_credits(customer)
        result['credit_info'] = {
            'total_available': float(credit_info['total_available']),
            'active_count': len(credit_info['active_credits']),
            'expired_count': len(credit_info['expired_credits']),
            'active_credits': credit_info['active_credits']
        }
        
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
        
        if credit_info['expired_credits']:
            expired_total = sum(Decimal(str(c['amount'])) for c in credit_info['expired_credits'])
            result['warnings'].append(f"Customer has ${expired_total} in expired credits")
        
        result['success'] = True
        return result

    def apply_credits(self, customer_id: str, customer_name: str, 
                     credit_amount: float, invoice_id: str = None) -> Dict[str, Any]:
        validation = self.validate_credit_application(customer_id, customer_name, credit_amount, invoice_id)
        if not validation['success']:
            return validation
        
        customer = self.find_customer(customer_id, customer_name)
        invoice = self.find_invoice(invoice_id, customer['id'])
        
        credit_info = self.calculate_available_credits(customer)
        remaining_to_apply = Decimal(str(credit_amount))
        credits_used = []
        
        active_credits = sorted(credit_info['active_credits'], 
                              key=lambda x: x['earnedDate'])
        
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
            
            new_amount = float(available_in_credit - amount_to_use)
            new_status = 'used' if new_amount == 0 else credit['status']
            self.credits.update_one({'_id': credit['_id']}, {'$set': {'amount': new_amount, 'status': new_status}})
            
            remaining_to_apply -= amount_to_use
        
        original_amount = Decimal(str(invoice['originalAmount']))
        previous_amount = Decimal(str(invoice['currentAmount']))
        credit_amount_decimal = Decimal(str(credit_amount))
        new_amount = previous_amount - credit_amount_decimal
        previous_credits = Decimal(str(invoice.get('creditsApplied', 0)))
        
        self.invoices.update_one({'_id': invoice['_id']}, {'$set': {
            'currentAmount': float(new_amount),
            'creditsApplied': float(previous_credits + credit_amount_decimal)
        }})
        
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
        try:
            customer = self.find_customer(customer_id, customer_name)
            if not customer:
                return {
                    'success': False,
                    'customer_found': False,
                    'error': 'Customer not found'
                }

            credit_info = self.calculate_available_credits(customer)

            active_credits_formatted = []
            for credit in credit_info['active_credits']:
                active_credits_formatted.append({
                    'id': credit['id'],
                    'amount': credit['amount'],
                    'original_amount': credit['originalAmount'],
                    'description': credit['description'],
                    'expiry_date': credit['expiryDate'].isoformat(),
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
        try:
            customer = self.find_customer(customer_id, customer_name)
            if not customer:
                return {
                    'success': False,
                    'customer_found': False,
                    'error': 'Customer not found'
                }

            customer_invoices = list(self.invoices.find({'customerId': customer['id']}).sort('date', -1))

            purchases = []
            for invoice in customer_invoices:
                credits_earned = 0
                for credit_id in invoice.get('earnedCreditIds', []):
                    credit = self.credits.find_one({'id': credit_id})
                    if credit:
                        credits_earned += credit['originalAmount']

                product_descriptions = []
                for item in invoice.get('items', []):
                    product_descriptions.append(item.get('description', 'Unknown item'))

                main_product = ', '.join(product_descriptions[:2])
                if len(product_descriptions) > 2:
                    main_product += f' (+{len(product_descriptions) - 2} more)'

                purchases.append({
                    'invoiceId': invoice.get('id', 'N/A'),
                    'amount': invoice.get('originalAmount', 0),
                    'currentAmount': invoice.get('currentAmount', 0),
                    'creditsApplied': invoice.get('creditsApplied', 0),
                    'date': invoice.get('date', 'N/A').isoformat(),
                    'dueDate': invoice.get('dueDate', 'N/A').isoformat(),
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
        try:
            customer = self.find_customer(customer_id, customer_name)
            if not customer and invoice_id:
                invoice = self.find_invoice(invoice_id)
                if invoice:
                    customer = self.find_customer(invoice['customerId'], None)

            if not customer:
                return {
                    'success': False,
                    'error': f'Customer not found: {customer_id or customer_name or "from invoice " + invoice_id}'
                }

            invoice = self.find_invoice(invoice_id)
            if not invoice:
                return {
                    'success': False,
                    'error': f'Invoice not found: {invoice_id}'
                }

            if invoice['customerId'] != customer['id']:
                return {
                    'success': False,
                    'error': 'Invoice does not belong to this customer'
                }

            affected_item = None
            for item in invoice.get('items', []):
                if item_description:
                    item_desc_lower = item['description'].lower()
                    search_desc_lower = item_description.lower()

                    if (search_desc_lower in item_desc_lower or
                        item_desc_lower in search_desc_lower or
                        any(word in item_desc_lower for word in search_desc_lower.split() if len(word) > 3)):
                        affected_item = item
                        break

                elif item.get('receivedQuantity', 0) < item.get('quantity', 0):
                    affected_item = item
                    break

            if not affected_item and len(invoice.get('items', [])) == 1:
                affected_item = invoice['items'][0]

            if not affected_item:
                items_list = [item['description'] for item in invoice.get('items', [])]
                return {
                    'success': False,
                    'error': f'No quantity discrepancy found. Available items: {", ".join(items_list)}'
                }

            unit_price = affected_item.get('unitPrice', 0)
            credit_amount = missing_quantity * unit_price

            credit_memo = {
                'id': f'CM{self.credit_memos.count_documents({}) + 1:03d}',
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
            self.credit_memos.insert_one(credit_memo)

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
        try:
            customer = self.find_customer(customer_id, customer_name)
            if not customer and invoice_id:
                invoice = self.find_invoice(invoice_id)
                if invoice:
                    customer = self.find_customer(invoice['customerId'], None)

            if not customer:
                return {
                    'success': False,
                    'error': f'Customer not found: {customer_id or customer_name or "from invoice " + invoice_id}'
                }

            invoice = self.find_invoice(invoice_id)
            if not invoice:
                return {
                    'success': False,
                    'error': f'Invoice not found: {invoice_id}'
                }

            if invoice['customerId'] != customer['id']:
                return {
                    'success': False,
                    'error': 'Invoice does not belong to this customer'
                }

            damaged_item = None
            for item in invoice.get('items', []):
                item_desc_lower = item['description'].lower()
                search_desc_lower = item_description.lower()

                if (search_desc_lower in item_desc_lower or
                    item_desc_lower in search_desc_lower or
                    any(word in item_desc_lower for word in search_desc_lower.split() if len(word) > 3)):
                    damaged_item = item
                    break

            if not damaged_item and len(invoice.get('items', [])) == 1:
                damaged_item = invoice['items'][0]

            if not damaged_item:
                items_list = [item['description'] for item in invoice.get('items', [])]
                return {
                    'success': False,
                    'error': f'Item not found in invoice. Available items: {", ".join(items_list)}'
                }

            credit_amount = damaged_item.get('price', 0)

            damage_report = {
                'id': f'DR{self.damage_reports.count_documents({}) + 1:03d}',
                'customerId': customer['id'],
                'invoiceId': invoice_id,
                'itemId': damaged_item.get('id'),
                'reportDate': datetime.now().isoformat(),
                'description': damage_description,
                'status': 'pending_review',
                'estimatedCreditAmount': credit_amount,
                'customerChoice': None
            }
            self.damage_reports.insert_one(damage_report)

            credit_memo = {
                'id': f'CM{self.credit_memos.count_documents({}) + 1:03d}',
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
            self.credit_memos.insert_one(credit_memo)

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
        try:
            credit_memo = self.credit_memos.find_one({'id': credit_memo_id})

            if not credit_memo:
                return {
                    'success': False,
                    'error': f'Credit memo not found: {credit_memo_id}'
                }

            update_data = {
                'status': 'approved',
                'approvedDate': datetime.now().isoformat(),
                'customerChoice': customer_choice
            }

            if customer_choice == 'apply_to_invoice' and target_invoice_id:
                update_data['targetInvoiceId'] = target_invoice_id
                result = self._apply_credit_to_invoice(credit_memo['amount'], target_invoice_id)
                if not result['success']:
                    return result
            elif customer_choice == 'apply_to_account':
                result = self._add_credit_to_account(credit_memo['customerId'], credit_memo['amount'],
                                                   credit_memo['reason'])
                if not result['success']:
                    return result
            elif customer_choice == 'refund':
                update_data['status'] = 'refund_processed'

            update_data['appliedDate'] = datetime.now().isoformat()
            self.credit_memos.update_one({'_id': credit_memo['_id']}, {'$set': update_data})

            return {
                'success': True,
                'credit_memo': self.credit_memos.find_one({'id': credit_memo_id}),
                'message': f'Credit memo {credit_memo_id} processed successfully with choice: {customer_choice}'
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Credit memo approval error: {str(e)}'
            }

    def _get_credit_options(self, payment_status: str) -> List[Dict[str, str]]:
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
        try:
            invoice = self.find_invoice(invoice_id)
            if not invoice:
                return {
                    'success': False,
                    'error': f'Target invoice not found: {invoice_id}'
                }

            self.invoices.update_one({'_id': invoice['_id']}, {
                '$inc': {'creditsApplied': credit_amount, 'currentAmount': -credit_amount}
            })

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
        try:
            customer = self.find_customer(customer_id)
            if not customer:
                return {
                    'success': False,
                    'error': f'Customer not found: {customer_id}'
                }

            new_credit = {
                'id': f'CR{self.credits.count_documents({}) + 1:03d}',
                'customerId': customer_id,
                'customerName': customer['name'],
                'amount': credit_amount,
                'originalAmount': credit_amount,
                'earnedDate': datetime.now(),
                'expiryDate': datetime.now().replace(year=datetime.now().year + 2),
                'status': 'active',
                'sourceInvoiceId': 'CREDIT_MEMO',
                'description': reason,
                'category': 'discrepancy_credit',
                'usageHistory': []
            }
            self.credits.insert_one(new_credit)

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
        try:
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

            invoice = self.invoices.find_one({'id': invoice_id})

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

            total_amount = Decimal(str(invoice_amount)) if invoice_amount else Decimal(str(invoice['currentAmount']))
            remaining_balance = total_amount - paid_amount

            if remaining_balance <= 0:
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

            available_credits = self.get_customer_active_credits(customer['id'])
            total_available = sum(Decimal(str(credit['amount'])) for credit in available_credits)

            if total_available <= 0:
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

            credits_to_apply = []
            credits_applied_amount = Decimal('0')
            remaining_to_cover = remaining_balance

            for credit in available_credits:
                if remaining_to_cover <= 0:
                    break

                credit_amount = Decimal(str(credit['amount']))
                if credit_amount > remaining_to_cover:
                    credits_to_apply.append({
                        'id': credit['id'],
                        'amount': float(remaining_to_cover),
                        'category': credit['category']
                    })
                    credits_applied_amount += remaining_to_cover
                    remaining_to_cover = Decimal('0')
                else:
                    credits_to_apply.append({
                        'id': credit['id'],
                        'amount': float(credit_amount),
                        'category': credit['category']
                    })
                    credits_applied_amount += credit_amount
                    remaining_to_cover -= credit_amount

            final_remaining_balance = remaining_balance - credits_applied_amount
            invoice_fully_paid = final_remaining_balance <= 0

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
