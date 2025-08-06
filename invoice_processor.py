import pdfplumber
import re
from datetime import datetime
from typing import Dict, Any, List
import logging

class InvoiceProcessor:
    """
    A class to process invoice PDFs and extract relevant information.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def process_pdf(self, pdf_file) -> Dict[str, Any]:
        """
        Process a PDF file and extract invoice information.
        
        Args:
            pdf_file: Uploaded PDF file object
            
        Returns:
            Dict containing extracted invoice data
        """
        try:
            # Read PDF content
            pdf_content = self._extract_text_from_pdf(pdf_file)
            
            # Extract invoice data
            invoice_data = self._parse_invoice_content(pdf_content)
            
            # Add metadata
            invoice_data['filename'] = pdf_file.name
            invoice_data['processed_at'] = datetime.now().isoformat()
            
            return invoice_data
            
        except Exception as e:
            self.logger.error(f"Error processing invoice PDF: {str(e)}")
            raise
    
    def _extract_text_from_pdf(self, pdf_file) -> str:
        """
        Extract text content from PDF file.
        
        Args:
            pdf_file: Uploaded PDF file object
            
        Returns:
            String containing extracted text
        """
        text_content = ""
        
        try:
            with pdfplumber.open(pdf_file) as pdf:
                for page in pdf.pages:
                    text_content += page.extract_text() + "\n"
        except Exception as e:
            self.logger.error(f"Error extracting text from PDF: {str(e)}")
            raise
            
        return text_content
    
    def _parse_invoice_content(self, content: str) -> Dict[str, Any]:
        """
        Parse invoice content and extract relevant information.
        
        Args:
            content: Text content from PDF
            
        Returns:
            Dict containing parsed invoice data
        """
        invoice_data = {
            'invoice_number': self._extract_invoice_number(content),
            'invoice_date': self._extract_invoice_date(content),
            'due_date': self._extract_due_date(content),
            'vendor_name': self._extract_vendor_name(content),
            'vendor_address': self._extract_vendor_address(content),
            'customer_name': self._extract_customer_name(content),
            'customer_address': self._extract_customer_address(content),
            'subtotal': self._extract_subtotal(content),
            'tax_amount': self._extract_tax_amount(content),
            'total_amount': self._extract_total_amount(content),
            'currency': self._extract_currency(content),
            'line_items': self._extract_line_items(content),
            'payment_terms': self._extract_payment_terms(content),
            'po_number': self._extract_po_number(content),
            'notes': self._extract_notes(content)
        }
        
        return invoice_data
    
    def _extract_invoice_number(self, content: str) -> str:
        """Extract invoice number from content."""
        patterns = [
            r'Invoice\s*Number\s*:?\s*([A-Z0-9\-]+)',
            r'Invoice\s*#?\s*:?\s*([A-Z0-9\-]+)',
            r'INV\s*:?\s*([A-Z0-9\-]+)',
            r'Invoice\s*([A-Z0-9\-]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_invoice_date(self, content: str) -> str:
        """Extract invoice date from content."""
        patterns = [
            r'Invoice\s*Date\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})',
            r'Date\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})',
            r'(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_due_date(self, content: str) -> str:
        """Extract due date from content."""
        patterns = [
            r'Due\s*Date\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})',
            r'Payment\s*Due\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})',
            r'Net\s*Due\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_vendor_name(self, content: str) -> str:
        """Extract vendor name from content."""
        # Look for company name patterns in the header area
        lines = content.split('\n')
        for line in lines[:10]:  # Check first 10 lines
            if re.search(r'[A-Z][a-z]+', line) and len(line.strip()) > 3:
                # Skip common invoice words
                skip_words = ['invoice', 'bill', 'statement', 'account', 'balance']
                if not any(word in line.lower() for word in skip_words):
                    return line.strip()
        
        return ""
    
    def _extract_vendor_address(self, content: str) -> str:
        """Extract vendor address from content."""
        lines = content.split('\n')
        address_lines = []
        
        for i, line in enumerate(lines[:15]):  # Check first 15 lines
            if re.search(r'\d+\s+[A-Z]', line) or re.search(r'[A-Z][a-z]+,\s*[A-Z]{2}', line):
                address_lines.append(line.strip())
        
        return " ".join(address_lines)
    
    def _extract_customer_name(self, content: str) -> str:
        """Extract customer name from content."""
        patterns = [
            r'Bill\s*To\s*:?\s*([^\n]+)',
            r'Ship\s*To\s*:?\s*([^\n]+)',
            r'Customer\s*:?\s*([^\n]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_customer_address(self, content: str) -> str:
        """Extract customer address from content."""
        # Look for address after "Bill To" or "Ship To"
        lines = content.split('\n')
        address_lines = []
        found_bill_to = False
        
        for line in lines:
            if re.search(r'Bill\s*To|Ship\s*To', line, re.IGNORECASE):
                found_bill_to = True
                continue
            
            if found_bill_to and line.strip():
                if re.search(r'[A-Z]{2}\s*\d{5}', line) or re.search(r'\d+\s+[A-Z]', line):
                    address_lines.append(line.strip())
                elif len(address_lines) > 0:
                    break
        
        return " ".join(address_lines)
    
    def _extract_subtotal(self, content: str) -> float:
        """Extract subtotal amount from content."""
        patterns = [
            r'Subtotal\s*:?\s*\$?([\d,]+\.?\d*)',
            r'Sub\s*Total\s*:?\s*\$?([\d,]+\.?\d*)',
            r'Sub\s*:?\s*\$?([\d,]+\.?\d*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '')
                try:
                    return float(amount_str)
                except ValueError:
                    continue
        
        return 0.0
    
    def _extract_tax_amount(self, content: str) -> float:
        """Extract tax amount from content."""
        patterns = [
            r'Tax\s*:?\s*\$?([\d,]+\.?\d*)',
            r'Taxes\s*:?\s*\$?([\d,]+\.?\d*)',
            r'VAT\s*:?\s*\$?([\d,]+\.?\d*)',
            r'Sales\s*Tax\s*:?\s*\$?([\d,]+\.?\d*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '')
                try:
                    return float(amount_str)
                except ValueError:
                    continue
        
        return 0.0
    
    def _extract_total_amount(self, content: str) -> float:
        """Extract total amount from content."""
        patterns = [
            r'^Total\s*:?\s*\$?([\d,]+\.?\d*)',
            r'\nTotal\s*:?\s*\$?([\d,]+\.?\d*)',
            r'Amount\s*Due\s*:?\s*\$?([\d,]+\.?\d*)',
            r'Grand\s*Total\s*:?\s*\$?([\d,]+\.?\d*)',
            r'Balance\s*Due\s*:?\s*\$?([\d,]+\.?\d*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE | re.MULTILINE)
            if match:
                amount_str = match.group(1).replace(',', '')
                try:
                    return float(amount_str)
                except ValueError:
                    continue
        
        return 0.0
    
    def _extract_currency(self, content: str) -> str:
        """Extract currency from content."""
        currency_patterns = [
            r'\$([\d,]+\.?\d*)',  # USD
            r'€([\d,]+\.?\d*)',   # EUR
            r'£([\d,]+\.?\d*)',   # GBP
            r'¥([\d,]+\.?\d*)'    # JPY
        ]
        
        for pattern in currency_patterns:
            if re.search(pattern, content):
                if pattern.startswith(r'\$'):
                    return "USD"
                elif pattern.startswith(r'€'):
                    return "EUR"
                elif pattern.startswith(r'£'):
                    return "GBP"
                elif pattern.startswith(r'¥'):
                    return "JPY"
        
        return "USD"  # Default to USD
    
    def _extract_line_items(self, content: str) -> List[Dict[str, Any]]:
        """Extract line items from content."""
        line_items = []
        
        # Look for table-like structures
        lines = content.split('\n')
        in_table = False
        
        for line in lines:
            # Check if line contains item-like data
            if re.search(r'\d+\s+[A-Za-z]', line) and re.search(r'\$?[\d,]+\.?\d*', line):
                parts = line.split()
                if len(parts) >= 3:
                    try:
                        item = {
                            'quantity': float(parts[0]),
                            'description': ' '.join(parts[1:-2]),
                            'unit_price': float(parts[-2].replace('$', '').replace(',', '')),
                            'amount': float(parts[-1].replace('$', '').replace(',', ''))
                        }
                        line_items.append(item)
                    except (ValueError, IndexError):
                        continue
        
        return line_items
    
    def _extract_payment_terms(self, content: str) -> str:
        """Extract payment terms from content."""
        patterns = [
            r'Payment\s*Terms\s*:?\s*([^\n]+)',
            r'Terms\s*:?\s*([^\n]+)',
            r'Net\s*(\d+)\s*Days',
            r'(\d+)\s*Days\s*Net'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_po_number(self, content: str) -> str:
        """Extract PO number from content."""
        patterns = [
            r'PO\s*#?\s*:?\s*([A-Z0-9\-]+)',
            r'Purchase\s*Order\s*:?\s*([A-Z0-9\-]+)',
            r'P\.O\.\s*:?\s*([A-Z0-9\-]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_notes(self, content: str) -> str:
        """Extract notes from content."""
        patterns = [
            r'Notes?\s*:?\s*([^\n]+)',
            r'Comments?\s*:?\s*([^\n]+)',
            r'Remarks?\s*:?\s*([^\n]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return "" 