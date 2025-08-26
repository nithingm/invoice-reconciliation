#!/usr/bin/env node

/**
 * Test Runner - Run all tests with model selection
 * 
 * Usage:
 *   node tests/run-tests.js                    # Uses Ollama llama3.2:3b (default)
 *   node tests/run-tests.js --gemini           # Uses Gemini 2.5 Flash Lite
 *   node tests/run-tests.js --test=purchase    # Run only purchase history tests
 *   node tests/run-tests.js --test=invoice     # Run only invoice inquiry tests
 */

const { spawn } = require('child_process');
const path = require('path');

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const useGemini = args.includes('--gemini');
  const testFilter = args.find(arg => arg.startsWith('--test='))?.split('=')[1];
  
  const model = useGemini ? 'gemini-2.5-flash-lite' : 'ollama/llama3.2:3b';
  
  console.log(`🤖 Using AI Model: ${model}`);
  if (testFilter) {
    console.log(`🎯 Running filtered tests: ${testFilter}`);
  }
  
  return { useGemini, testFilter, model };
}

/**
 * Run a test file
 */
function runTest(testFile, useGemini = false) {
  return new Promise((resolve, reject) => {
    const args = useGemini ? ['--gemini'] : [];
    const testProcess = spawn('node', [testFile, ...args], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test ${testFile} failed with exit code ${code}`));
      }
    });

    testProcess.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Main test runner
 */
async function runTests() {
  const { useGemini, testFilter } = parseArgs();
  
  console.log('🧪 Starting Test Suite...');
  console.log('='.repeat(50));
  
  // Define available tests
  const tests = [
    {
      name: 'purchase',
      file: 'tests/test-purchase-history.js',
      description: 'Purchase History Functionality'
    },
    {
      name: 'invoice',
      file: 'tests/test-invoice-inquiry.js',
      description: 'Invoice Inquiry Functionality'
    },
    {
      name: 'intent',
      file: 'tests/test-invoice-intent-fix.js',
      description: 'Invoice Intent Detection Fixes'
    }
  ];
  
  // Filter tests if specified
  const testsToRun = testFilter 
    ? tests.filter(test => test.name === testFilter)
    : tests;
  
  if (testsToRun.length === 0) {
    console.error(`❌ No tests found matching filter: ${testFilter}`);
    console.log('Available tests:', tests.map(t => t.name).join(', '));
    process.exit(1);
  }
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testsToRun) {
    try {
      console.log(`\n🔍 Running: ${test.description}`);
      console.log(`📁 File: ${test.file}`);
      console.log('-'.repeat(40));
      
      await runTest(test.file, useGemini);
      
      console.log(`✅ PASSED: ${test.description}`);
      passed++;
      
    } catch (error) {
      console.error(`❌ FAILED: ${test.description}`);
      console.error(`   Error: ${error.message}`);
      failed++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed. Check the output above for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

/**
 * Show usage information
 */
function showUsage() {
  console.log(`
🧪 Test Runner Usage:

Default (Ollama):
  node tests/run-tests.js

With Gemini:
  node tests/run-tests.js --gemini

Run specific test:
  node tests/run-tests.js --test=purchase
  node tests/run-tests.js --test=invoice
  node tests/run-tests.js --test=intent

Combined:
  node tests/run-tests.js --test=purchase --gemini

Available Tests:
  - purchase: Purchase History Functionality
  - invoice:  Invoice Inquiry Functionality  
  - intent:   Invoice Intent Detection Fixes
`);
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
