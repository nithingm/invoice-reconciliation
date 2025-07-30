import pandas as pd

# Recreate test data since execution state was reset
invoice_data = [
    {"invoice_id": "INV-001", "customer_id": "CUST-001", "invoice_amount": 1000, "paid_amount": 500, "date_issued": "2023-01-15", "part_number": "PN-001"},
    {"invoice_id": "INV-002", "customer_id": "CUST-002", "invoice_amount": 1500, "paid_amount": 700, "date_issued": "2023-02-20", "part_number": "PN-002"},
    {"invoice_id": "INV-003", "customer_id": "CUST-003", "invoice_amount": 800, "paid_amount": 0, "date_issued": "2023-03-10", "part_number": "PN-003"},
    {"invoice_id": "INV-004", "customer_id": "CUST-004", "invoice_amount": 600, "paid_amount": 200, "date_issued": "2023-01-25", "part_number": "PN-004"},
    {"invoice_id": "INV-005", "customer_id": "CUST-005", "invoice_amount": 1200, "paid_amount": 1000, "date_issued": "2023-04-01", "part_number": "PN-005"},
    {"invoice_id": "INV-006", "customer_id": "CUST-006", "invoice_amount": 2000, "paid_amount": 1000, "date_issued": "2023-05-10", "part_number": "PN-006"},
    {"invoice_id": "INV-007", "customer_id": "CUST-007", "invoice_amount": 900, "paid_amount": 900, "date_issued": "2023-06-01", "part_number": "PN-007"},
    {"invoice_id": "INV-008", "customer_id": "CUST-008", "invoice_amount": 500, "paid_amount": None, "date_issued": "2023-06-15", "part_number": "PN-008"},
    {"invoice_id": "INV-009", "customer_id": "CUST-009", "invoice_amount": 1000, "paid_amount": 600, "date_issued": "2023-07-01", "part_number": "PN-XYZ"},
    {"invoice_id": "INV-010", "customer_id": "CUST-010", "invoice_amount": 1500, "paid_amount": 800, "date_issued": "2023-08-01", "part_number": "PN-010"},
    {"invoice_id": "INV-001", "customer_id": "CUST-011", "invoice_amount": 1000, "paid_amount": 400, "date_issued": "2023-08-10", "part_number": "PN-011"},
    {"invoice_id": "INV-012", "customer_id": "CUST-012", "invoice_amount": 1200, "paid_amount": 200, "date_issued": "2023-09-01", "part_number": "PN-012"},
]

credit_memo_data = [
    {"credit_memo_id": "CM-001", "customer_id": "CUST-001", "credit_amount": 500, "date_issued": "2022-12-01", "reason": "Return", "related_invoice_id": "", "status": "Active", "part_number": "PN-001"},
    {"credit_memo_id": "CM-002", "customer_id": "CUST-002", "credit_amount": 500, "date_issued": "2022-12-10", "reason": "Warranty", "related_invoice_id": "", "status": "Active", "part_number": "PN-002"},
    {"credit_memo_id": "CM-003", "customer_id": "CUST-002", "credit_amount": 400, "date_issued": "2023-01-10", "reason": "Adjustment", "related_invoice_id": "", "status": "Active", "part_number": "PN-002"},
    {"credit_memo_id": "CM-004", "customer_id": "CUST-004", "credit_amount": 400, "date_issued": "2023-04-01", "reason": "Expired", "related_invoice_id": "", "status": "Expired", "part_number": "PN-004"},
    {"credit_memo_id": "CM-005", "customer_id": "CUST-005", "credit_amount": 200, "date_issued": "2023-02-01", "reason": "Redeemed", "related_invoice_id": "", "status": "Redeemed", "part_number": "PN-005"},
    {"credit_memo_id": "CM-006", "customer_id": "CUST-006", "credit_amount": 300, "date_issued": "2023-01-15", "reason": "Partial", "related_invoice_id": "", "status": "Active", "part_number": "PN-006"},
    {"credit_memo_id": "CM-007", "customer_id": "CUST-006", "credit_amount": 200, "date_issued": "2023-02-15", "reason": "Partial2", "related_invoice_id": "", "status": "Active", "part_number": "PN-006"},
    {"credit_memo_id": "CM-008", "customer_id": "CUST-009", "credit_amount": 500, "date_issued": "2023-03-15", "reason": "Mismatch", "related_invoice_id": "", "status": "Active", "part_number": "PN-009"},
    {"credit_memo_id": "CM-009", "customer_id": "CUST-010", "credit_amount": 700, "date_issued": "2023-01-20", "reason": "Used", "related_invoice_id": "", "status": "Active", "part_number": "PN-010"},
    {"credit_memo_id": "CM-010", "customer_id": "CUST-012", "credit_amount": 600, "date_issued": "2023-01-01", "reason": "Ambiguous", "related_invoice_id": "", "status": "Active", "part_number": "PN-012"},
    {"credit_memo_id": "CM-011", "customer_id": "CUST-012", "credit_amount": 600, "date_issued": "2023-01-01", "reason": "Ambiguous", "related_invoice_id": "", "status": "Active", "part_number": "PN-012"},
]

credit_usage_data = [
    {"usage_id": "U-001", "credit_memo_id": "CM-009", "invoice_id": "INV-000", "amount_used": 300, "date_used": "2023-06-01", "verified": True},
    {"usage_id": "U-002", "credit_memo_id": "CM-005", "invoice_id": "INV-000", "amount_used": 200, "date_used": "2023-02-15", "verified": True},
    # For INV-000 (already had 2 usages)
    {"usage_id": "U-003", "credit_memo_id": "CM-001", "invoice_id": "INV-000", "amount_used": 300, "date_used": "2023-01-20", "verified": True},

    # For INV-001 - Fully settled using a single credit memo
    {"usage_id": "U-004", "credit_memo_id": "CM-002", "invoice_id": "INV-001", "amount_used": 500, "date_used": "2023-03-01", "verified": True},

    # For INV-002 - Settled using multiple memos (partial usage from each)
    {"usage_id": "U-005", "credit_memo_id": "CM-003", "invoice_id": "INV-002", "amount_used": 250, "date_used": "2023-03-10", "verified": True},
    {"usage_id": "U-006", "credit_memo_id": "CM-004", "invoice_id": "INV-002", "amount_used": 250, "date_used": "2023-03-12", "verified": True},

    # For INV-003 - Uses an expired memo
    {"usage_id": "U-007", "credit_memo_id": "CM-006", "invoice_id": "INV-003", "amount_used": 100, "date_used": "2023-04-01", "verified": True},

    # For INV-004 - Unverified usage
    {"usage_id": "U-008", "credit_memo_id": "CM-007", "invoice_id": "INV-004", "amount_used": 150, "date_used": "2023-04-05", "verified": False},

    # For INV-005 - Uses part-specific memo
    {"usage_id": "U-009", "credit_memo_id": "CM-008", "invoice_id": "INV-005", "amount_used": 200, "date_used": "2023-04-10", "verified": True},

    # For INV-006 - Usage with same customer but different part number
    {"usage_id": "U-010", "credit_memo_id": "CM-009", "invoice_id": "INV-006", "amount_used": 100, "date_used": "2023-04-15", "verified": True},
]

# Convert to DataFrames
invoice_df = pd.DataFrame(invoice_data)
credit_memo_df = pd.DataFrame(credit_memo_data)
credit_usage_df = pd.DataFrame(credit_usage_data)

# Save to CSV
invoice_path = "invoice_table.csv"
credit_memo_path = "credit_memo_table.csv"
credit_usage_path = "credit_usage_table.csv"

invoice_df.to_csv(invoice_path, index=False)
credit_memo_df.to_csv(credit_memo_path, index=False)
credit_usage_df.to_csv(credit_usage_path, index=False)

invoice_path, credit_memo_path, credit_usage_path
