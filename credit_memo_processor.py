import pdfplumber
import re
from datetime import datetime
from typing import Dict, Any, List
import logging

class CreditMemoProcessor:
    """
    A class to process credit memo PDFs and extract relevant information.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def process_pdf(self, pdf_file) -> Dict[str, Any]:
        """
        Process a PDF file and extract credit memo information.
        
        Args:
            pdf_file: Uploaded PDF file object
            
        Returns:
            Dict containing extracted credit memo data
        """
        try:
            # Read PDF content
            pdf_content = self._extract_text_from_pdf(pdf_file)
            
            # Extract credit memo data
            credit_memo_data = self._parse_credit_memo_content(pdf_content)
            
            # Add metadata
            credit_memo_data['filename'] = pdf_file.name
            credit_memo_data['processed_at'] = datetime.now().isoformat()
            
            return credit_memo_data
            
        except Exception as e:
            self.logger.error(f"Error processing credit memo PDF: {str(e)}")
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
    
    def _parse_credit_memo_content(self, content: str) -> Dict[str, Any]:
        """
        Parse credit memo content and extract relevant information.
        
        Args:
            content: Text content from PDF
            
        Returns:
            Dict containing parsed credit memo data
        """
        credit_memo_data = {
            'credit_memo_number': self._extract_credit_memo_number(content),
            'credit_memo_date': self._extract_credit_memo_date(content),
            'original_invoice_number': self._extract_original_invoice_number(content),
            'original_invoice_date': self._extract_original_invoice_date(content),
            'vendor_name': self._extract_vendor_name(content),
            'vendor_address': self._extract_vendor_address(content),
            'customer_name': self._extract_customer_name(content),
            'customer_address': self._extract_customer_address(content),
            'credit_amount': self._extract_credit_amount(content),
            'currency': self._extract_currency(content),
            'credit_reason': self._extract_credit_reason(content),
            'line_items': self._extract_line_items(content),
            'notes': self._extract_notes(content),
            'credit_type': self._extract_credit_type(content)
        }
        
        return credit_memo_data
    
    def _extract_credit_memo_number(self, content: str) -> str:
        """Extract credit memo number from content."""
        patterns = [
            r'Credit\s*Memo\s*Number\s*:?\s*([A-Z0-9\-]+)',
            r'Credit\s*Memo\s*#?\s*:?\s*([A-Z0-9\-]+)',
            r'CM\s*:?\s*([A-Z0-9\-]+)',
            r'Credit\s*Memo\s*([A-Z0-9\-]+)',
            r'Memo\s*#?\s*:?\s*([A-Z0-9\-]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_credit_memo_date(self, content: str) -> str:
        """Extract credit memo date from content."""
        patterns = [
            r'Credit\s*Memo\s*Date\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})',
            r'Memo\s*Date\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})',
            r'Date\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_original_invoice_number(self, content: str) -> str:
        """Extract original invoice number from content."""
        patterns = [
            r'Original\s*Invoice\s*Number\s*:?\s*([A-Z0-9\-]+)',
            r'Original\s*Invoice\s*#?\s*:?\s*([A-Z0-9\-]+)',
            r'Invoice\s*#?\s*:?\s*([A-Z0-9\-]+)',
            r'Against\s*Invoice\s*:?\s*([A-Z0-9\-]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_original_invoice_date(self, content: str) -> str:
        """Extract original invoice date from content."""
        patterns = [
            r'Original\s*Invoice\s*Date\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})',
            r'Invoice\s*Date\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})'
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
                # Skip common credit memo words
                skip_words = ['credit', 'memo', 'statement', 'account', 'balance']
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
            r'Customer\s*:?\s*([^\n]+)',
            r'Client\s*:?\s*([^\n]+)'
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
    
    def _extract_credit_amount(self, content: str) -> float:
        """Extract credit amount from content."""
        patterns = [
            r'Total\s*Credit\s*:?\s*\$?([\d,]+\.?\d*)',
            r'Credit\s*Amount\s*:?\s*\$?([\d,]+\.?\d*)',
            r'Credit\s*:?\s*\$?([\d,]+\.?\d*)',
            r'Amount\s*:?\s*\$?([\d,]+\.?\d*)'
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
    
    def _extract_credit_reason(self, content: str) -> str:
        """Extract credit reason from content."""
        patterns = [
            r'Reason\s*:?\s*([^\n]+)',
            r'Credit\s*Reason\s*:?\s*([^\n]+)',
            r'Description\s*:?\s*([^\n]+)',
            r'Comments?\s*:?\s*([^\n]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_line_items(self, content: str) -> List[Dict[str, Any]]:
        """Extract line items from content."""
        line_items = []
        
        # Look for table-like structures
        lines = content.split('\n')
        
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
    
    def _extract_notes(self, content: str) -> str:
        """Extract notes from content."""
        patterns = [
            r'Notes?\s*:?\s*([^\n]+)',
            r'Comments?\s*:?\s*([^\n]+)',
            r'Remarks?\s*:?\s*([^\n]+)',
            r'Additional\s*Info\s*:?\s*([^\n]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_credit_type(self, content: str) -> str:
        """Extract credit type from content."""
        credit_types = [
            'return', 'refund', 'adjustment', 'discount', 'rebate', 
            'overcharge', 'duplicate', 'cancellation', 'correction'
        ]
        
        content_lower = content.lower()
        for credit_type in credit_types:
            if credit_type in content_lower:
                return credit_type.title()
        
        return "General" 