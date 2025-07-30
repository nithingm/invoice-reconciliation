# Invoice Reconciliation System

Automatically verify if claimed credits on invoices can be matched against active, valid credit memos using deterministic logic and human-verifiable audit trails.

## Features

- CSV-based data ingestion and normalization
- Deterministic credit verification logic
- FIFO allocation strategy for credit memos
- Comprehensive logging and audit trails
- Automated output generation (verified results + manual review cases)

## Usage

```bash
python main.py --invoices test_data/sample_invoices.csv \
               --credit_memos test_data/sample_credit_memos.csv \
               --credit_usage test_data/sample_credit_usage.csv \
               --output_dir output
```

## Data Format

### Invoice Table
- `invoice_id`: Unique ID per invoice
- `customer_id`: Who was billed
- `invoice_amount`: Total amount charged
- `date_issued`: When invoice was created
- `part_number`: For item-level matching
- `paid_amount`: Amount actually paid
- `claimed_credit`: Computed as invoice_amount - paid_amount

### Credit Memo Table
- `credit_memo_id`: Unique ID per credit memo
- `customer_id`: Same as invoice customer
- `credit_amount`: Total credit issued
- `date_issued`: When credit was granted
- `reason`: E.g., Warranty, Return
- `related_invoice_id`: If tied to specific invoice
- `status`: Active/Expired/Redeemed
- `part_number`: If part specific
- `remaining_credit`: Available credit balance

### Credit Usage Table
- `usage_id`: Unique ID
- `credit_memo_id`: FK to credit memo
- `invoice_id`: FK to invoice
- `amount_used`: Amount of credit applied
- `date_used`: When credit was applied
- `verified`: Boolean approval status

## Output Files

- `results.csv`: Verified invoice-credit matches
- `manual_review.csv`: Cases requiring human review
- `complete_results.json`: Full results with allocation plans
- `audit_trail.json`: Complete audit log