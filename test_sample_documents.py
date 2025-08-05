#!/usr/bin/env python3
"""
Test Script for Sample Documents

This script tests the AI Invoice Reconciliation Agent with the generated
sample invoice and credit memo PDF files.
"""

import os
import sys
from pathlib import Path

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from invoice_processor import InvoiceProcessor
from credit_memo_processor import CreditMemoProcessor
from reconciliation_agent import ReconciliationAgent
from utils import format_currency, calculate_reconciliation_metrics

def test_sample_documents():
    """Test the AI agent with sample PDF documents."""
    print("🧪 Testing AI Invoice Reconciliation Agent with Sample Documents")
    print("=" * 70)
    
    # Initialize processors
    invoice_processor = InvoiceProcessor()
    credit_memo_processor = CreditMemoProcessor()
    
    # Initialize reconciliation agent (will use fallback if no API key)
    try:
        reconciliation_agent = ReconciliationAgent()
    except Exception as e:
        print(f"⚠️  Warning: Could not initialize AI agent: {str(e)}")
        print("   Will use fallback matching method instead.")
        reconciliation_agent = None
    
    # Sample documents directory
    samples_dir = "sample_documents"
    
    if not os.path.exists(samples_dir):
        print(f"❌ Error: Sample documents directory '{samples_dir}' not found!")
        print("Please run 'python create_sample_documents.py' first.")
        return
    
    # Get all PDF files
    pdf_files = list(Path(samples_dir).glob("*.pdf"))
    
    if not pdf_files:
        print(f"❌ Error: No PDF files found in '{samples_dir}' directory!")
        return
    
    print(f"📁 Found {len(pdf_files)} PDF files in '{samples_dir}' directory")
    
    # Separate invoice and credit memo files
    invoice_files = [f for f in pdf_files if "invoice" in f.name.lower()]
    credit_memo_files = [f for f in pdf_files if "credit_memo" in f.name.lower()]
    
    print(f"📄 Invoice files: {len(invoice_files)}")
    print(f"📄 Credit memo files: {len(credit_memo_files)}")
    print()
    
    # Process invoices
    invoices = []
    print("🔍 Processing invoice files...")
    for invoice_file in invoice_files:
        try:
            print(f"  Processing: {invoice_file.name}")
            # Open the file and pass the file object
            with open(invoice_file, 'rb') as f:
                # Create a mock file object with name attribute
                class MockFile:
                    def __init__(self, file_obj, filename):
                        self.file = file_obj
                        self.name = filename
                    def read(self):
                        return self.file.read()
                    def seek(self, pos, whence=0):
                        return self.file.seek(pos, whence)
                    def tell(self):
                        return self.file.tell()
                
                mock_file = MockFile(f, invoice_file.name)
                invoice_data = invoice_processor.process_pdf(mock_file)
                if invoice_data:
                    invoices.append(invoice_data)
                    print(f"  ✅ Successfully extracted invoice: {invoice_data.get('invoice_number', 'Unknown')}")
                else:
                    print(f"  ❌ Failed to extract data from: {invoice_file.name}")
        except Exception as e:
            print(f"  ❌ Error processing {invoice_file.name}: {str(e)}")
    
    print()
    
    # Process credit memos
    credit_memos = []
    print("🔍 Processing credit memo files...")
    for credit_memo_file in credit_memo_files:
        try:
            print(f"  Processing: {credit_memo_file.name}")
            # Open the file and pass the file object
            with open(credit_memo_file, 'rb') as f:
                # Create a mock file object with name attribute
                class MockFile:
                    def __init__(self, file_obj, filename):
                        self.file = file_obj
                        self.name = filename
                    def read(self):
                        return self.file.read()
                    def seek(self, pos, whence=0):
                        return self.file.seek(pos, whence)
                    def tell(self):
                        return self.file.tell()
                
                mock_file = MockFile(f, credit_memo_file.name)
                credit_memo_data = credit_memo_processor.process_pdf(mock_file)
                if credit_memo_data:
                    credit_memos.append(credit_memo_data)
                    print(f"  ✅ Successfully extracted credit memo: {credit_memo_data.get('credit_memo_number', 'Unknown')}")
                else:
                    print(f"  ❌ Failed to extract data from: {credit_memo_file.name}")
        except Exception as e:
            print(f"  ❌ Error processing {credit_memo_file.name}: {str(e)}")
    
    print()
    
    # Display extracted data
    print("📊 Extracted Data Summary:")
    print("-" * 40)
    
    print(f"Invoices processed: {len(invoices)}")
    for invoice in invoices:
        print(f"  - {invoice.get('invoice_number', 'Unknown')}: {format_currency(invoice.get('total', 0))}")
    
    print(f"\nCredit memos processed: {len(credit_memos)}")
    for credit_memo in credit_memos:
        print(f"  - {credit_memo.get('credit_memo_number', 'Unknown')}: {format_currency(credit_memo.get('total_credit', 0))}")
    
    print()
    
    # Perform reconciliation if we have both invoices and credit memos
    if invoices and credit_memos:
        if reconciliation_agent:
            print("🤖 Performing AI-powered reconciliation...")
        else:
            print("🤖 Performing fallback reconciliation (no AI agent available)...")
        try:
            if reconciliation_agent:
                reconciliation_result = reconciliation_agent.reconcile_documents(invoices, credit_memos)
            else:
                # Use fallback matching
                from reconciliation_agent import fallback_match_documents
                reconciliation_result = fallback_match_documents(invoices, credit_memos)
            
            print("✅ Reconciliation completed successfully!")
            print()
            
            # Display reconciliation results
            print("📈 Reconciliation Results:")
            print("-" * 40)
            
            matched_pairs = reconciliation_result.get('matched_pairs', [])
            unmatched_invoices = reconciliation_result.get('unmatched_invoices', [])
            unmatched_credit_memos = reconciliation_result.get('unmatched_credit_memos', [])
            discrepancies = reconciliation_result.get('discrepancies', [])
            
            print(f"✅ Matched pairs: {len(matched_pairs)}")
            print(f"❌ Unmatched invoices: {len(unmatched_invoices)}")
            print(f"❌ Unmatched credit memos: {len(unmatched_credit_memos)}")
            print(f"⚠️  Discrepancies found: {len(discrepancies)}")
            
            if matched_pairs:
                print("\n🔗 Matched Invoice-Credit Memo Pairs:")
                for pair in matched_pairs:
                    invoice = pair.get('invoice', {})
                    credit_memo = pair.get('credit_memo', {})
                    print(f"  📄 {invoice.get('invoice_number', 'Unknown')} ↔️ {credit_memo.get('credit_memo_number', 'Unknown')}")
            
            if discrepancies:
                print("\n⚠️  Discrepancies Found:")
                for discrepancy in discrepancies:
                    print(f"  - {discrepancy.get('description', 'Unknown issue')}")
            
            # Calculate metrics
            metrics = calculate_reconciliation_metrics(reconciliation_result)
            print(f"\n📊 Reconciliation Metrics:")
            print(f"  - Match Rate: {metrics.get('match_rate', 0):.1f}%")
            print(f"  - Accuracy: {metrics.get('accuracy', 0):.1f}%")
            print(f"  - Total Amount Reconciled: {format_currency(metrics.get('total_reconciled', 0))}")
            
        except Exception as e:
            print(f"❌ Error during reconciliation: {str(e)}")
    else:
        print("⚠️  Cannot perform reconciliation - need both invoices and credit memos")
        if not invoices:
            print("  - No invoices were successfully processed")
        if not credit_memos:
            print("  - No credit memos were successfully processed")
    
    print("\n" + "=" * 70)
    print("🎉 Sample document testing completed!")
    print("\nNext steps:")
    print("1. Run 'streamlit run main.py' to launch the web interface")
    print("2. Upload the sample PDF files through the web interface")
    print("3. Or run 'python demo.py' to see the demo with sample data")

if __name__ == "__main__":
    test_sample_documents() 