#!/usr/bin/env python3
import json
import subprocess
import sys

# Test data with real mock database structure
test_data = {
    "action": "apply",
    "customer_id": "CUST001",
    "credit_amount": 200,
    "mock_data": {
        "customers": [
            {
                "id": "CUST001",
                "name": "John Smith",
                "email": "john.smith@email.com",
                "credits": [
                    {
                        "id": "CR001",
                        "amount": 500,
                        "earnedDate": "2023-06-15",
                        "expiryDate": "2025-12-31",
                        "status": "active",
                        "description": "Purchase credit from 4L60E transmission ($5000 purchase)"
                    },
                    {
                        "id": "CR003",
                        "amount": 250,
                        "earnedDate": "2024-02-10",
                        "expiryDate": "2026-02-10",
                        "status": "active",
                        "description": "Purchase credit from 4L80E transmission ($2500 purchase)"
                    }
                ]
            }
        ],
        "invoices": [
            {
                "id": "INV001",
                "customerId": "CUST001",
                "originalAmount": 2800,
                "currentAmount": 2800,
                "creditsApplied": 0,
                "status": "pending",
                "date": "2024-08-01",
                "description": "4L60E Remanufactured Transmission - Premium Package"
            }
        ]
    }
}

# Convert to JSON string
json_input = json.dumps(test_data)

print("Testing Python microservice...")
print("Input:", json_input[:100] + "..." if len(json_input) > 100 else json_input)

# Call the Python service
try:
    result = subprocess.run([
        'python', 
        'python_microservice/credit_validator.py', 
        json_input
    ], capture_output=True, text=True, timeout=10)
    
    print(f"Return code: {result.returncode}")
    print(f"STDOUT: {result.stdout}")
    print(f"STDERR: {result.stderr}")
    
    if result.returncode == 0:
        try:
            parsed_result = json.loads(result.stdout)
            print("Parsed result:")
            print(json.dumps(parsed_result, indent=2))
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
    
except subprocess.TimeoutExpired:
    print("Python service timed out")
except Exception as e:
    print(f"Error calling Python service: {e}")
