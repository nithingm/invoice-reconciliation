# Test Suite

This directory contains tests for the invoice reconciliation system functionality.

## Model Selection

By default, all tests use **Ollama with llama3.2:3b** model. To use Gemini instead, add the `--gemini` flag.

## Usage

### Run All Tests (Ollama - Default)
```bash
node tests/run-tests.js
```

### Run All Tests (Gemini)
```bash
node tests/run-tests.js --gemini
```

### Run Specific Test (Ollama)
```bash
node tests/run-tests.js --test=purchase
node tests/run-tests.js --test=invoice
node tests/run-tests.js --test=intent
```

### Run Specific Test (Gemini)
```bash
node tests/run-tests.js --test=purchase --gemini
node tests/run-tests.js --test=invoice --gemini
```

### Run Individual Test Files

#### Purchase History Tests
```bash
# Ollama (default)
node tests/test-purchase-history.js

# Gemini
node tests/test-purchase-history.js --gemini
```

#### Invoice Inquiry Tests
```bash
# Ollama (default)
node tests/test-invoice-inquiry.js

# Gemini
node tests/test-invoice-inquiry.js --gemini
```

#### Invoice Intent Detection Tests
```bash
# Ollama (default)
node tests/test-invoice-intent-fix.js

# Gemini
node tests/test-invoice-intent-fix.js --gemini
```

## Available Tests

| Test Name | File | Description |
|-----------|------|-------------|
| `purchase` | `test-purchase-history.js` | Purchase History Functionality |
| `invoice` | `test-invoice-inquiry.js` | Invoice Inquiry Functionality |
| `intent` | `test-invoice-intent-fix.js` | Invoice Intent Detection Fixes |

## Test Features

- **Model Selection**: Choose between Ollama (llama3.2:3b) and Gemini (2.5-flash-lite)
- **Pattern-based Fallback**: Tests work even when LLM extraction fails
- **MongoDB Integration**: Tests use real MongoDB database
- **Comprehensive Coverage**: Tests various phrasings and edge cases
- **Detailed Logging**: Shows intent detection, customer lookup, and execution flow

## Requirements

- **MongoDB**: Running MongoDB instance
- **Ollama**: For default model (llama3.2:3b must be available)
- **Gemini API**: For Gemini tests (requires API key in .env)

## Example Output

```
🤖 Using AI Model: ollama/llama3.2:3b
🧪 Testing Purchase History Functionality...
📊 Connecting to MongoDB...
✅ MongoDB connected successfully

[1/5] Testing: Direct Customer Name
Message: "Show me purchase history for Sarah Johnson"
Expected: purchase_history → success
======================================================================
✅ PASS: Intent and type correct
✅ Collapsible Details: PASS
```

## Troubleshooting

### Ollama Issues
- Ensure Ollama is running: `ollama serve`
- Check model availability: `ollama list`
- Pull model if needed: `ollama pull llama3.2:3b`

### Gemini Issues
- Check API key in `.env` file
- Verify Python microservice is running on port 5001
- Check network connectivity

### MongoDB Issues
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify database has test data
