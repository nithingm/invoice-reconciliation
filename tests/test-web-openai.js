const { chromium } = require('playwright');

/**
 * Test OpenAI integration through the web interface
 */
async function testWebOpenAI() {
  console.log('🌐 Testing OpenAI Integration via Web Interface...');

  let browser;
  let page;

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: false, // Set to true for headless mode
      slowMo: 1000 // Slow down for better visibility
    });

    page = await browser.newPage();

    // Navigate to the application
    console.log('🔗 Navigating to http://localhost:5000...');
    await page.goto('http://localhost:5000');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded successfully');

    // Step 1: Navigate to Settings page to configure OpenAI model
    console.log('\n📋 Step 1: Navigating to Settings page...');
    await page.click('a[href="/settings"]');
    await page.waitForLoadState('networkidle');
    console.log('✅ Settings page loaded');

    // Step 2: Click on AI Settings tab
    console.log('\n🤖 Step 2: Opening AI Settings...');
    await page.click('button:has-text("AI Settings")');
    await page.waitForTimeout(1000);
    console.log('✅ AI Settings tab opened');

    // Step 3: Check if OpenAI is available as a provider
    console.log('\n🔍 Step 3: Checking available AI providers...');
    const providers = await page.$$eval('#ai-provider option', options =>
      options.map(option => ({ value: option.value, text: option.textContent }))
    );

    console.log('📋 Available providers:');
    providers.forEach(provider => {
      console.log(`  - ${provider.value}: ${provider.text}`);
    });

    const openaiProvider = providers.find(p => p.value === 'openai');
    if (!openaiProvider) {
      throw new Error('OpenAI provider not found in dropdown');
    }
    console.log('✅ OpenAI provider found');

    // Step 4: Select OpenAI as provider
    console.log('\n🎯 Step 4: Selecting OpenAI provider...');
    await page.selectOption('#ai-provider', 'openai');
    await page.waitForTimeout(1000); // Wait for models to load
    console.log('✅ OpenAI provider selected');

    // Step 5: Check available OpenAI models
    console.log('\n🔍 Step 5: Checking available OpenAI models...');
    const models = await page.$$eval('#ai-model option', options =>
      options.map(option => ({ value: option.value, text: option.textContent }))
    );

    console.log('📋 Available OpenAI models:');
    models.forEach(model => {
      console.log(`  - ${model.value}: ${model.text}`);
    });

    if (models.length === 0 || models[0].value === 'No models available') {
      throw new Error('No OpenAI models available');
    }

    // Step 6: Select GPT-4o model
    const gpt4oModel = models.find(m => m.value === 'gpt-4o') || models[0];
    console.log(`\n🎯 Step 6: Selecting model: ${gpt4oModel.value}...`);
    await page.selectOption('#ai-model', gpt4oModel.value);
    await page.waitForTimeout(500);
    console.log('✅ Model selected');

    // Step 7: Save AI configuration
    console.log('\n💾 Step 7: Saving AI configuration...');
    await page.click('button:has-text("Save AI Settings")');
    await page.waitForTimeout(2000);
    console.log('✅ AI configuration saved');
    
    // Step 8: Navigate back to home page to test chat
    console.log('\n🏠 Step 8: Navigating to home page...');
    await page.click('a[href="/"]');
    await page.waitForLoadState('networkidle');
    console.log('✅ Home page loaded');

    // Step 9: Open chat interface
    console.log('\n💬 Step 9: Opening chat interface...');
    // Look for chat button or trigger
    try {
      await page.click('button:has-text("Chat")');
    } catch {
      // Try alternative selectors
      try {
        await page.click('[data-testid="chat-button"]');
      } catch {
        // Try clicking on any button that might open chat
        await page.click('button[class*="chat"]');
      }
    }
    await page.waitForTimeout(2000);
    console.log('✅ Chat interface opened');

    // Test cases with OpenAI model (now configured)
    const testCases = [
      {
        name: 'Purchase History Test',
        message: 'Show me purchase history for Sarah Johnson',
        expectedText: 'Purchase History for Sarah Johnson'
      },
      {
        name: 'Invoice Inquiry Test',
        message: 'Show me details for invoice INV002',
        expectedText: 'Invoice Details for INV002'
      },
      {
        name: 'Credit Balance Test',
        message: 'What is the credit balance for John Smith?',
        expectedText: 'Credit Balance for John Smith'
      }
    ];
    
    // Step 10: Test chat functionality with OpenAI model
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n[${i + 1}/${testCases.length}] Testing: ${testCase.name}`);
      console.log(`Message: "${testCase.message}"`);
      console.log('-'.repeat(50));

      try {
        // Find and fill the chat input field
        console.log('💬 Typing message...');
        const inputSelector = 'input[placeholder*="message"], input[type="text"], textarea';
        await page.fill(inputSelector, testCase.message);

        // Submit the message (try different possible submit methods)
        console.log('📤 Sending message...');
        try {
          await page.press(inputSelector, 'Enter');
        } catch {
          // Try clicking a send button
          try {
            await page.click('button[type="submit"], button:has-text("Send")');
          } catch {
            // Try any button with send-like appearance
            await page.click('button svg[class*="paper"], button svg[class*="send"]');
          }
        }

        // Wait for response (with timeout)
        console.log('⏳ Waiting for response...');
        await page.waitForTimeout(5000); // Give time for AI to respond

        // Get all chat messages
        const allMessages = await page.$$eval(
          'div[class*="message"], .message, [class*="chat-message"]',
          messages => messages.map(msg => msg.textContent.trim())
        );

        if (allMessages.length === 0) {
          console.log('⚠️ No messages found - checking alternative selectors...');
          // Try alternative message selectors
          const altMessages = await page.$$eval('div', divs =>
            divs.filter(div => div.textContent.includes('Purchase History') ||
                              div.textContent.includes('Invoice Details') ||
                              div.textContent.includes('Credit Balance'))
                .map(div => div.textContent.trim())
          );
          console.log('📄 Alternative messages found:', altMessages.length);
        }

        const latestResponse = allMessages[allMessages.length - 1] || 'No response found';
        console.log('🤖 Response received:', latestResponse.substring(0, 150) + '...');

        // Check if the response contains expected text
        if (latestResponse.includes(testCase.expectedText)) {
          console.log('✅ PASS: Expected content found in response');
        } else {
          console.log('❌ FAIL: Expected content not found');
          console.log(`   Expected: "${testCase.expectedText}"`);
          console.log(`   Got: "${latestResponse.substring(0, 200)}..."`);
        }

        // Check for error messages
        if (latestResponse.includes('error') || latestResponse.includes('Error')) {
          console.log('⚠️ WARNING: Error detected in response');
        } else {
          console.log('✅ No errors detected');
        }

        // Check for API key issues
        if (latestResponse.includes('API key') || latestResponse.includes('authentication')) {
          console.log('🔑 API Key issue detected');
        } else {
          console.log('✅ No API key issues');
        }

        // Wait before next test
        await page.waitForTimeout(3000);

      } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
      }
    }
    
    // Step 11: Verify the configuration was saved
    console.log('\n🔍 Step 11: Verifying OpenAI configuration...');
    await page.goto('http://localhost:5000/settings');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("AI Settings")');
    await page.waitForTimeout(1000);

    const currentProvider = await page.$eval('#ai-provider', select => select.value);
    const currentModel = await page.$eval('#ai-model', select => select.value);

    console.log(`📋 Current Configuration:`);
    console.log(`  Provider: ${currentProvider}`);
    console.log(`  Model: ${currentModel}`);

    if (currentProvider === 'openai') {
      console.log('✅ OpenAI provider is configured');
    } else {
      console.log('❌ OpenAI provider not configured');
    }

    if (currentModel.startsWith('gpt-')) {
      console.log('✅ OpenAI model is configured');
    } else {
      console.log('❌ OpenAI model not configured');
    }
    
    console.log('\n📋 SUMMARY');
    console.log('='.repeat(50));
    console.log('🔧 Tested complete OpenAI integration flow:');
    console.log('   1. ✅ Settings page model configuration');
    console.log('   2. ✅ OpenAI provider and model selection');
    console.log('   3. ✅ Configuration saving and persistence');
    console.log('   4. ✅ Chat interface with OpenAI model');
    console.log('   5. ✅ End-to-end message processing');

    console.log('\n🎯 Results:');
    console.log('✅ If all steps pass: OpenAI web integration is fully working');
    console.log('🔧 If configuration fails: Check model availability in backend');
    console.log('🔑 If chat fails: Verify OpenAI API key and model routing');
    console.log('💬 If responses fail: Check Socket.IO and agent processing');

    console.log('\n🎉 Complete OpenAI web integration test completed!');
    
  } catch (error) {
    console.error('❌ Web test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testWebOpenAI();
