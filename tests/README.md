# Test Files

This directory contains test files for various AI integrations. These files are kept for reference and debugging purposes.

## Available Tests

### `test-gemini.js`
Tests Gemini models using Node.js LiteLLM (may not work with newer models).

**Usage:**
```bash
cd tests
node test-gemini.js
```

### `test-gemini-litellm.js`
Tests Gemini models using updated LiteLLM configuration.

**Usage:**
```bash
cd tests
node test-gemini-litellm.js
```

### `test-gemini-google.js`
Tests Gemini models using Google AI SDK (requires reinstalling @google/generative-ai).

**Usage:**
```bash
npm install @google/generative-ai
cd tests
node test-gemini-google.js
```

## Notes

- These test files are **not required** for the main application to work
- The main application uses Python LiteLLM for all Gemini models
- These tests are useful for debugging and comparing different integration approaches
- Make sure your `.env` file contains `GEMINI_API_KEY` before running tests
