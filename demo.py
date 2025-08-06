#!/usr/bin/env python3
"""
Demo script for the AI Invoice Reconciliation Agent.
This script demonstrates how to use the agent programmatically.
"""

import os
import json
from datetime import datetime
from invoice_processor import InvoiceProcessor
from credit_memo_processor import CreditMemoProcessor
from reconciliation_agent import ReconciliationAgent
from utils import calculate_reconciliation_metrics, format_currency

def create_sample_data():
    """Create sample invoice and credit memo data for demonstration."""
    
    # Sample invoice data
    sample_invoice = {
        'invoice_number': 'INV-2024-001',
        'invoice_date': '01/15/2024',
        'due_date': '02/15/2024',
        'vendor_name': 'Tech Supplies Inc.',
        'vendor_address': '123 Business St, Tech City, TC 12345',
        'customer_name': 'ABC Corporation',
        'customer_address': '456 Corporate Ave, Business City, BC 67890',
        'subtotal': 1500.00,
        'tax_amount': 150.00,
        'total_amount': 1650.00,
        'currency': 'USD',
        'line_items': [
            {
                'quantity': 10,
                'description': 'Laptop Computers',
                'unit_price': 150.00,
                'amount': 1500.00
            }
        ],
        'payment_terms': 'Net 30',
        'po_number': 'PO-2024-001',
        'notes': 'Standard order',
        'filename': 'sample_invoice.pdf',
        'processed_at': datetime.now().isoformat()
    }
    
    # Sample credit memo data
    sample_credit_memo = {
        'credit_memo_number': 'CM-2024-001',
        'credit_memo_date': '01/20/2024',
        'original_invoice_number': 'INV-2024-001',
        'original_invoice_date': '01/15/2024',
        'vendor_name': 'Tech Supplies Inc.',
        'vendor_address': '123 Business St, Tech City, TC 12345',
        'customer_name': 'ABC Corporation',
        'customer_address': '456 Corporate Ave, Business City, BC 67890',
        'credit_amount': 1650.00,
        'currency': 'USD',
        'credit_reason': 'Return of defective items',
        'line_items': [
            {
                'quantity': 10,
                'description': 'Laptop Computers (Returned)',
                'unit_price': 150.00,
                'amount': 1500.00
            }
        ],
        'notes': 'Full credit for returned items',
        'credit_type': 'Return',
        'filename': 'sample_credit_memo.pdf',
        'processed_at': datetime.now().isoformat()
    }
    
    return [sample_invoice], [sample_credit_memo]

def demo_basic_processing():
    """Demonstrate basic PDF processing functionality."""
    print("🔍 Demo: Basic PDF Processing")
    print("=" * 50)
    
    # Initialize processors
    invoice_processor = InvoiceProcessor()
    credit_memo_processor = CreditMemoProcessor()
    
    print("✅ Processors initialized successfully")
    print("📄 Invoice processor ready to extract data from PDFs")
    print("📝 Credit memo processor ready to extract data from PDFs")
    print()

def demo_ai_reconciliation(ollama_url="http://localhost:11434", model="llama2"):
    """Demonstrate AI reconciliation functionality."""
    print("🤖 Demo: AI Reconciliation")
    print("=" * 50)
    
    # Test Ollama connection
    try:
        import requests
        response = requests.get(f"{ollama_url}/api/tags", timeout=5)
        if response.status_code == 200:
            print("✅ Ollama server is accessible")
        else:
            print("⚠️  Ollama server not accessible. Using fallback matching.")
            print("   To use AI features, ensure Ollama is running.")
            print()
    except Exception as e:
        print(f"⚠️  Cannot connect to Ollama server: {str(e)}")
        print("   To use AI features, ensure Ollama is running.")
        print()
    
    # Create sample data
    invoices, credit_memos = create_sample_data()
    
    print(f"📋 Sample Invoice: {invoices[0]['invoice_number']}")
    print(f"   Amount: {format_currency(invoices[0]['total_amount'], invoices[0]['currency'])}")
    print(f"   Vendor: {invoices[0]['vendor_name']}")
    print()
    
    print(f"📝 Sample Credit Memo: {credit_memos[0]['credit_memo_number']}")
    print(f"   Credit Amount: {format_currency(credit_memos[0]['credit_amount'], credit_memos[0]['currency'])}")
    print(f"   Original Invoice: {credit_memos[0]['original_invoice_number']}")
    print(f"   Reason: {credit_memos[0]['credit_reason']}")
    print()
    
    # Initialize reconciliation agent
    try:
        reconciliation_agent = ReconciliationAgent(ollama_url=ollama_url, model=model)
        print("🤖 AI reconciliation agent initialized")
    except Exception as e:
        print(f"❌ Error initializing AI agent: {str(e)}")
        reconciliation_agent = None
        print("🔧 Using fallback matching (no AI)")
    
    # Perform reconciliation
    if reconciliation_agent:
        try:
            print("🔄 Performing AI reconciliation...")
            results = reconciliation_agent.reconcile_documents(invoices, credit_memos)
            print("✅ AI reconciliation completed!")
        except Exception as e:
            print(f"❌ AI reconciliation failed: {str(e)}")
            print("🔄 Falling back to basic matching...")
            results = demo_fallback_matching(invoices, credit_memos)
    else:
        print("🔄 Performing basic reconciliation...")
        results = demo_fallback_matching(invoices, credit_memos)
    
    # Display results
    display_reconciliation_results(results)
    
    return results

def demo_fallback_matching(invoices, credit_memos):
    """Demonstrate fallback matching without AI."""
    print("🔧 Using fallback matching logic...")
    
    reconciled_items = []
    discrepancies = []
    
    for inv in invoices:
        for cm in credit_memos:
            if inv['invoice_number'] == cm['original_invoice_number']:
                amount_diff = abs(inv['total_amount'] - cm['credit_amount'])
                
                if amount_diff < 0.01:  # Exact match
                    reconciled_items.append({
                        'invoice_number': inv['invoice_number'],
                        'credit_memo_number': cm['credit_memo_number'],
                        'match_confidence': 0.9,
                        'match_reason': 'Exact invoice number and amount match',
                        'amount_difference': amount_diff,
                        'reconciliation_status': 'FULLY_RECONCILED',
                        'invoice_date': inv['invoice_date'],
                        'credit_memo_date': cm['credit_memo_date'],
                        'vendor_name': inv['vendor_name'],
                        'customer_name': inv['customer_name'],
                        'invoice_amount': inv['total_amount'],
                        'credit_amount': cm['credit_amount'],
                        'currency': inv['currency'],
                        'credit_reason': cm['credit_reason'],
                        'credit_type': cm['credit_type'],
                        'processed_at': datetime.now().isoformat()
                    })
                else:
                    discrepancies.append({
                        'invoice_number': inv['invoice_number'],
                        'credit_memo_number': cm['credit_memo_number'],
                        'discrepancy_type': 'AMOUNT_MISMATCH',
                        'discrepancy_description': f'Amount mismatch: Invoice {format_currency(inv["total_amount"], inv["currency"])} vs Credit {format_currency(cm["credit_amount"], cm["currency"])}',
                        'invoice_amount': inv['total_amount'],
                        'credit_amount': cm['credit_amount'],
                        'difference': amount_diff,
                        'invoice_date': inv['invoice_date'],
                        'credit_memo_date': cm['credit_memo_date'],
                        'vendor_name': inv['vendor_name'],
                        'customer_name': inv['customer_name'],
                        'currency': inv['currency'],
                        'credit_reason': cm['credit_reason'],
                        'credit_type': cm['credit_type'],
                        'processed_at': datetime.now().isoformat()
                    })
    
    return {
        'reconciled_items': reconciled_items,
        'discrepancies': discrepancies,
        'unmatched_invoices': [],
        'unmatched_credit_memos': [],
        'summary': {
            'total_reconciled': len(reconciled_items),
            'total_discrepancies': len(discrepancies),
            'unmatched_invoices_count': 0,
            'unmatched_credit_memos_count': 0
        },
        'invoices': invoices,
        'credit_memos': credit_memos,
        'processed_at': datetime.now().isoformat()
    }

def display_reconciliation_results(results):
    """Display reconciliation results in a formatted way."""
    print("📊 Reconciliation Results")
    print("=" * 50)
    
    # Summary metrics
    summary = results.get('summary', {})
    print(f"✅ Reconciled Items: {summary.get('total_reconciled', 0)}")
    print(f"⚠️  Discrepancies: {summary.get('total_discrepancies', 0)}")
    print(f"📋 Unmatched Invoices: {summary.get('unmatched_invoices_count', 0)}")
    print(f"📝 Unmatched Credit Memos: {summary.get('unmatched_credit_memos_count', 0)}")
    print()
    
    # Reconciled items
    reconciled_items = results.get('reconciled_items', [])
    if reconciled_items:
        print("✅ RECONCILED ITEMS:")
        for item in reconciled_items:
            print(f"   Invoice: {item['invoice_number']} → Credit Memo: {item['credit_memo_number']}")
            print(f"   Amount: {format_currency(item['invoice_amount'], item['currency'])}")
            print(f"   Credit: {format_currency(item['credit_amount'], item['currency'])}")
            print(f"   Confidence: {item.get('match_confidence', 0):.1%}")
            print(f"   Status: {item.get('reconciliation_status', 'UNKNOWN')}")
            print()
    
    # Discrepancies
    discrepancies = results.get('discrepancies', [])
    if discrepancies:
        print("⚠️  DISCREPANCIES:")
        for item in discrepancies:
            print(f"   Invoice: {item['invoice_number']} → Credit Memo: {item['credit_memo_number']}")
            print(f"   Type: {item.get('discrepancy_type', 'UNKNOWN')}")
            print(f"   Description: {item.get('discrepancy_description', 'No description')}")
            print(f"   Difference: {format_currency(item.get('difference', 0), item.get('currency', 'USD'))}")
            print()
    
    # Calculate metrics
    metrics = calculate_reconciliation_metrics(results)
    print("📈 METRICS:")
    print(f"   Total Reconciled Amount: {format_currency(metrics['total_reconciled_amount'], 'USD')}")
    print(f"   Total Credit Amount: {format_currency(metrics['total_credit_amount'], 'USD')}")
    print(f"   Reconciliation Rate: {metrics['reconciliation_rate']:.1f}%")
    print(f"   Average Confidence: {metrics['average_match_confidence']:.1f}%")
    print()

def main():
    """Run the demo."""
    print("🚀 AI Invoice Reconciliation Agent - Demo")
    print("=" * 60)
    print()
    
    # Demo basic processing
    demo_basic_processing()
    
    # Demo AI reconciliation
    ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
    model = os.getenv('OLLAMA_MODEL', 'llama2')
    results = demo_ai_reconciliation(ollama_url, model)
    
    print("🎉 Demo completed successfully!")
    print()
    print("To run the full application:")
    print("1. Ensure Ollama is installed and running")
    print("2. Run: streamlit run main.py")
    print("3. Open your browser to http://localhost:8501")
    print()
    print("For more information, see README.md")

if __name__ == "__main__":
    main() 