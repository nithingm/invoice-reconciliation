#!/usr/bin/env python3
"""
Sample Document Generator for AI Invoice Reconciliation Agent

This script creates sample invoice and credit memo PDF files for testing
the PDF processing capabilities of the AI agent.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from datetime import datetime, timedelta
import random

def create_sample_invoice_pdf(filename, invoice_data):
    """Create a sample invoice PDF file."""
    doc = SimpleDocTemplate(filename, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1  # Center alignment
    )
    story.append(Paragraph("INVOICE", title_style))
    story.append(Spacer(1, 20))
    
    # Company Information
    company_info = [
        ["ABC Corporation", ""],
        ["123 Business Street", ""],
        ["New York, NY 10001", ""],
        ["Phone: (555) 123-4567", ""],
        ["Email: billing@abccorp.com", ""]
    ]
    
    company_table = Table(company_info, colWidths=[4*inch, 2*inch])
    company_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(company_table)
    story.append(Spacer(1, 20))
    
    # Invoice Details
    invoice_details = [
        ["Invoice Number:", invoice_data['invoice_number']],
        ["Invoice Date:", invoice_data['invoice_date']],
        ["Due Date:", invoice_data['due_date']],
        ["Customer:", invoice_data['customer_name']],
        ["Customer Address:", invoice_data['customer_address']]
    ]
    
    invoice_table = Table(invoice_details, colWidths=[2*inch, 4*inch])
    invoice_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(invoice_table)
    story.append(Spacer(1, 20))
    
    # Items Table
    items_data = [['Description', 'Quantity', 'Unit Price', 'Amount']]
    for item in invoice_data['items']:
        items_data.append([
            item['description'],
            str(item['quantity']),
            f"${item['unit_price']:.2f}",
            f"${item['amount']:.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1*inch, 1*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 20))
    
    # Totals
    totals_data = [
        ["Subtotal:", f"${invoice_data['subtotal']:.2f}"],
        ["Tax (8.5%):", f"${invoice_data['tax']:.2f}"],
        ["Total:", f"${invoice_data['total']:.2f}"]
    ]
    
    totals_table = Table(totals_data, colWidths=[1*inch, 1*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(totals_table)
    
    doc.build(story)

def create_sample_credit_memo_pdf(filename, credit_memo_data):
    """Create a sample credit memo PDF file."""
    doc = SimpleDocTemplate(filename, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1  # Center alignment
    )
    story.append(Paragraph("CREDIT MEMO", title_style))
    story.append(Spacer(1, 20))
    
    # Company Information
    company_info = [
        ["ABC Corporation", ""],
        ["123 Business Street", ""],
        ["New York, NY 10001", ""],
        ["Phone: (555) 123-4567", ""],
        ["Email: billing@abccorp.com", ""]
    ]
    
    company_table = Table(company_info, colWidths=[4*inch, 2*inch])
    company_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(company_table)
    story.append(Spacer(1, 20))
    
    # Credit Memo Details
    memo_details = [
        ["Credit Memo Number:", credit_memo_data['credit_memo_number']],
        ["Credit Memo Date:", credit_memo_data['credit_memo_date']],
        ["Original Invoice Number:", credit_memo_data['original_invoice_number']],
        ["Original Invoice Date:", credit_memo_data['original_invoice_date']],
        ["Customer:", credit_memo_data['customer_name']],
        ["Customer Address:", credit_memo_data['customer_address']],
        ["Reason for Credit:", credit_memo_data['reason']]
    ]
    
    memo_table = Table(memo_details, colWidths=[2*inch, 4*inch])
    memo_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(memo_table)
    story.append(Spacer(1, 20))
    
    # Credit Items Table
    items_data = [['Description', 'Quantity', 'Unit Price', 'Credit Amount']]
    for item in credit_memo_data['items']:
        items_data.append([
            item['description'],
            str(item['quantity']),
            f"${item['unit_price']:.2f}",
            f"${item['credit_amount']:.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1*inch, 1*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 20))
    
    # Totals
    totals_data = [
        ["Subtotal Credit:", f"${credit_memo_data['subtotal_credit']:.2f}"],
        ["Tax Credit (8.5%):", f"${credit_memo_data['tax_credit']:.2f}"],
        ["Total Credit:", f"${credit_memo_data['total_credit']:.2f}"]
    ]
    
    totals_table = Table(totals_data, colWidths=[1*inch, 1*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(totals_table)
    
    doc.build(story)

def generate_sample_data():
    """Generate sample invoice and credit memo data."""
    
    # Sample Invoice Data
    invoices = [
        {
            'invoice_number': 'INV-2024-001',
            'invoice_date': '2024-01-15',
            'due_date': '2024-02-15',
            'customer_name': 'Tech Solutions Inc.',
            'customer_address': '456 Innovation Drive, San Francisco, CA 94105',
            'items': [
                {'description': 'Web Development Services', 'quantity': 40, 'unit_price': 150.00, 'amount': 6000.00},
                {'description': 'Database Design', 'quantity': 20, 'unit_price': 125.00, 'amount': 2500.00},
                {'description': 'UI/UX Design', 'quantity': 15, 'unit_price': 100.00, 'amount': 1500.00}
            ],
            'subtotal': 10000.00,
            'tax': 850.00,
            'total': 10850.00
        },
        {
            'invoice_number': 'INV-2024-002',
            'invoice_date': '2024-01-20',
            'due_date': '2024-02-20',
            'customer_name': 'Global Manufacturing Co.',
            'customer_address': '789 Industrial Blvd, Chicago, IL 60601',
            'items': [
                {'description': 'Consulting Services', 'quantity': 25, 'unit_price': 200.00, 'amount': 5000.00},
                {'description': 'Process Optimization', 'quantity': 30, 'unit_price': 175.00, 'amount': 5250.00}
            ],
            'subtotal': 10250.00,
            'tax': 871.25,
            'total': 11121.25
        },
        {
            'invoice_number': 'INV-2024-003',
            'invoice_date': '2024-01-25',
            'due_date': '2024-02-25',
            'customer_name': 'Retail Partners LLC',
            'customer_address': '321 Commerce Street, Miami, FL 33101',
            'items': [
                {'description': 'E-commerce Platform', 'quantity': 1, 'unit_price': 5000.00, 'amount': 5000.00},
                {'description': 'Payment Integration', 'quantity': 1, 'unit_price': 2500.00, 'amount': 2500.00},
                {'description': 'Training Sessions', 'quantity': 8, 'unit_price': 150.00, 'amount': 1200.00}
            ],
            'subtotal': 8700.00,
            'tax': 739.50,
            'total': 9439.50
        }
    ]
    
    # Sample Credit Memo Data
    credit_memos = [
        {
            'credit_memo_number': 'CM-2024-001',
            'credit_memo_date': '2024-02-01',
            'original_invoice_number': 'INV-2024-001',
            'original_invoice_date': '2024-01-15',
            'customer_name': 'Tech Solutions Inc.',
            'customer_address': '456 Innovation Drive, San Francisco, CA 94105',
            'reason': 'Partial refund for cancelled UI/UX Design services',
            'items': [
                {'description': 'UI/UX Design', 'quantity': 5, 'unit_price': 100.00, 'credit_amount': 500.00}
            ],
            'subtotal_credit': 500.00,
            'tax_credit': 42.50,
            'total_credit': 542.50
        },
        {
            'credit_memo_number': 'CM-2024-002',
            'credit_memo_date': '2024-02-05',
            'original_invoice_number': 'INV-2024-002',
            'original_invoice_date': '2024-01-20',
            'customer_name': 'Global Manufacturing Co.',
            'customer_address': '789 Industrial Blvd, Chicago, IL 60601',
            'reason': 'Discount for early payment',
            'items': [
                {'description': 'Consulting Services', 'quantity': 25, 'unit_price': 200.00, 'credit_amount': 500.00}
            ],
            'subtotal_credit': 500.00,
            'tax_credit': 42.50,
            'total_credit': 542.50
        },
        {
            'credit_memo_number': 'CM-2024-003',
            'credit_memo_date': '2024-02-10',
            'original_invoice_number': 'INV-2024-003',
            'original_invoice_date': '2024-01-25',
            'customer_name': 'Retail Partners LLC',
            'customer_address': '321 Commerce Street, Miami, FL 33101',
            'reason': 'Service quality issue - partial refund',
            'items': [
                {'description': 'Training Sessions', 'quantity': 2, 'unit_price': 150.00, 'credit_amount': 300.00}
            ],
            'subtotal_credit': 300.00,
            'tax_credit': 25.50,
            'total_credit': 325.50
        }
    ]
    
    return invoices, credit_memos

def main():
    """Main function to create sample documents."""
    print("Creating sample invoice and credit memo PDF files...")
    
    # Create samples directory if it doesn't exist
    samples_dir = "sample_documents"
    if not os.path.exists(samples_dir):
        os.makedirs(samples_dir)
        print(f"Created directory: {samples_dir}")
    
    # Generate sample data
    invoices, credit_memos = generate_sample_data()
    
    # Create sample invoice PDFs
    print("\nCreating sample invoice PDFs...")
    for i, invoice in enumerate(invoices, 1):
        filename = os.path.join(samples_dir, f"sample_invoice_{i}.pdf")
        create_sample_invoice_pdf(filename, invoice)
        print(f"✅ Created: {filename}")
    
    # Create sample credit memo PDFs
    print("\nCreating sample credit memo PDFs...")
    for i, credit_memo in enumerate(credit_memos, 1):
        filename = os.path.join(samples_dir, f"sample_credit_memo_{i}.pdf")
        create_sample_credit_memo_pdf(filename, credit_memo)
        print(f"✅ Created: {filename}")
    
    print(f"\n🎉 Successfully created {len(invoices)} sample invoices and {len(credit_memos)} sample credit memos!")
    print(f"📁 Files are located in the '{samples_dir}' directory")
    print("\nYou can now use these PDF files to test the AI Invoice Reconciliation Agent.")
    print("Upload them through the Streamlit interface or use them in the demo script.")

if __name__ == "__main__":
    main() 