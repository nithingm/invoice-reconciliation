import base64
import io
import pandas as pd
from typing import Any, Dict, List
import json
from datetime import datetime

def create_download_link(data: Any, filename: str, file_type: str = "csv") -> str:
    """
    Create a download link for data.
    
    Args:
        data: Data to download
        filename: Name of the file
        file_type: Type of file (csv, json, etc.)
        
    Returns:
        HTML download link
    """
    if file_type == "csv":
        if isinstance(data, pd.DataFrame):
            csv = data.to_csv(index=False)
        else:
            csv = pd.DataFrame(data).to_csv(index=False)
        
        b64 = base64.b64encode(csv.encode()).decode()
        href = f'<a href="data:file/csv;base64,{b64}" download="{filename}.csv">Download {filename}.csv</a>'
        return href
    
    elif file_type == "json":
        if isinstance(data, str):
            json_str = data
        else:
            json_str = json.dumps(data, indent=2, default=str)
        
        b64 = base64.b64encode(json_str.encode()).decode()
        href = f'<a href="data:file/json;base64,{b64}" download="{filename}.json">Download {filename}.json</a>'
        return href
    
    return ""

def format_currency(amount: float, currency: str = "USD") -> str:
    """
    Format currency amount.
    
    Args:
        amount: Amount to format
        currency: Currency code
        
    Returns:
        Formatted currency string
    """
    currency_symbols = {
        "USD": "$",
        "EUR": "€",
        "GBP": "£",
        "JPY": "¥"
    }
    
    symbol = currency_symbols.get(currency, "$")
    return f"{symbol}{amount:,.2f}"

def validate_invoice_data(invoice_data: Dict[str, Any]) -> List[str]:
    """
    Validate invoice data for completeness.
    
    Args:
        invoice_data: Invoice data to validate
        
    Returns:
        List of validation errors
    """
    errors = []
    
    required_fields = ['invoice_number', 'invoice_date', 'total_amount']
    
    for field in required_fields:
        if not invoice_data.get(field):
            errors.append(f"Missing required field: {field}")
    
    if invoice_data.get('total_amount') and invoice_data['total_amount'] <= 0:
        errors.append("Total amount must be greater than 0")
    
    return errors

def validate_credit_memo_data(credit_memo_data: Dict[str, Any]) -> List[str]:
    """
    Validate credit memo data for completeness.
    
    Args:
        credit_memo_data: Credit memo data to validate
        
    Returns:
        List of validation errors
    """
    errors = []
    
    required_fields = ['credit_memo_number', 'credit_memo_date', 'credit_amount']
    
    for field in required_fields:
        if not credit_memo_data.get(field):
            errors.append(f"Missing required field: {field}")
    
    if credit_memo_data.get('credit_amount') and credit_memo_data['credit_amount'] <= 0:
        errors.append("Credit amount must be greater than 0")
    
    return errors

def calculate_reconciliation_metrics(reconciliation_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate reconciliation metrics.
    
    Args:
        reconciliation_results: Results from reconciliation
        
    Returns:
        Dictionary of metrics
    """
    reconciled_items = reconciliation_results.get('reconciled_items', [])
    discrepancies = reconciliation_results.get('discrepancies', [])
    
    total_reconciled_amount = sum(item.get('invoice_amount', 0) for item in reconciled_items)
    total_credit_amount = sum(item.get('credit_amount', 0) for item in reconciled_items)
    total_discrepancy_amount = sum(item.get('difference', 0) for item in discrepancies)
    
    metrics = {
        'total_reconciled_items': len(reconciled_items),
        'total_discrepancies': len(discrepancies),
        'total_reconciled_amount': total_reconciled_amount,
        'total_credit_amount': total_credit_amount,
        'total_discrepancy_amount': total_discrepancy_amount,
        'reconciliation_rate': len(reconciled_items) / max(len(reconciled_items) + len(discrepancies), 1) * 100,
        'average_match_confidence': sum(item.get('match_confidence', 0) for item in reconciled_items) / max(len(reconciled_items), 1)
    }
    
    return metrics

def export_reconciliation_report(reconciliation_results: Dict[str, Any], 
                               format_type: str = "csv") -> str:
    """
    Export reconciliation results to a file.
    
    Args:
        reconciliation_results: Results to export
        format_type: Export format (csv, json, excel)
        
    Returns:
        Download link or file path
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if format_type == "csv":
        # Create separate CSV files for different result types
        reconciled_df = pd.DataFrame(reconciliation_results.get('reconciled_items', []))
        discrepancies_df = pd.DataFrame(reconciliation_results.get('discrepancies', []))
        
        # Create download links
        reconciled_csv = reconciled_df.to_csv(index=False)
        discrepancies_csv = discrepancies_df.to_csv(index=False)
        
        return {
            'reconciled_items': reconciled_csv,
            'discrepancies': discrepancies_csv,
            'filename_prefix': f"reconciliation_report_{timestamp}"
        }
    
    elif format_type == "json":
        return {
            'data': json.dumps(reconciliation_results, indent=2, default=str),
            'filename': f"reconciliation_report_{timestamp}.json"
        }
    
    return ""

def parse_date(date_string: str) -> datetime:
    """
    Parse date string to datetime object.
    
    Args:
        date_string: Date string to parse
        
    Returns:
        Datetime object
    """
    date_formats = [
        "%m/%d/%Y",
        "%m/%d/%y",
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d/%m/%y"
    ]
    
    for fmt in date_formats:
        try:
            return datetime.strptime(date_string, fmt)
        except ValueError:
            continue
    
    # If no format matches, return current date
    return datetime.now()

def clean_text(text: str) -> str:
    """
    Clean and normalize text.
    
    Args:
        text: Text to clean
        
    Returns:
        Cleaned text
    """
    if not text:
        return ""
    
    # Remove extra whitespace
    text = " ".join(text.split())
    
    # Remove special characters that might interfere with processing
    text = text.replace('\n', ' ').replace('\r', ' ')
    
    return text.strip()

def extract_amount_from_text(text: str) -> float:
    """
    Extract amount from text.
    
    Args:
        text: Text containing amount
        
    Returns:
        Extracted amount as float
    """
    import re
    
    # Look for currency amounts
    amount_patterns = [
        r'\$([\d,]+\.?\d*)',
        r'€([\d,]+\.?\d*)',
        r'£([\d,]+\.?\d*)',
        r'¥([\d,]+\.?\d*)',
        r'([\d,]+\.?\d*)'
    ]
    
    for pattern in amount_patterns:
        match = re.search(pattern, text)
        if match:
            amount_str = match.group(1).replace(',', '')
            try:
                return float(amount_str)
            except ValueError:
                continue
    
    return 0.0

def calculate_similarity_score(text1: str, text2: str) -> float:
    """
    Calculate similarity score between two texts.
    
    Args:
        text1: First text
        text2: Second text
        
    Returns:
        Similarity score (0-1)
    """
    if not text1 or not text2:
        return 0.0
    
    # Simple similarity based on common words
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    if not words1 or not words2:
        return 0.0
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    return len(intersection) / len(union) if union else 0.0 