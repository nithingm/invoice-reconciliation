require('dotenv').config({ path: '../.env' });
const { connectToMongoDB, disconnectFromMongoDB } = require('../server/config/mongodb');
const { ClarifyingRAGAgent } = require('../server/services/agentService');

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const useGemini = args.includes('--gemini');
  const model = useGemini ? 'gemini-2.5-flash-lite' : 'ollama/llama3.2:3b';

  console.log(`🤖 Using AI Model: ${model}`);
  return { model, useGemini };
}

/**
 * Debug the clarification issue - why is it showing generic confirmation instead of clarification?
 */
async function debugClarificationIssue() {
  const { model } = parseArgs();
  console.log('🔍 Debugging Clarification Issue...');
  
  try {
    // Connect to MongoDB first
    console.log('📊 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    console.log('\n🐛 DEBUGGING: "Use $50 credit for John"');
    console.log('Expected: Clarification message asking which John');
    console.log('Actual: Generic confirmation message');
    console.log('='.repeat(60));
    
    const agent = new ClarifyingRAGAgent('debug-clarification');
    
    // Enable more detailed logging
    console.log('\n📝 Testing with detailed logging...');
    
    const result = await agent.processRequest("Use $50 credit for John", model);
    
    console.log('\n🔍 DETAILED ANALYSIS:');
    console.log('='.repeat(40));
    console.log('Result Type:', result.type);
    console.log('Agent State:', result.agentState);
    console.log('Message Preview:', result.message ? result.message.substring(0, 200) + '...' : 'No message');
    
    // Check if the message contains the problematic text
    if (result.message && result.message.includes('general')) {
      console.log('🚨 ISSUE FOUND: Message contains "general" - intent detection failed');
    }
    
    if (result.message && result.message.includes("I'm ready to process your request")) {
      console.log('🚨 ISSUE FOUND: Generic confirmation message detected');
    }
    
    if (result.type === 'confirmation_needed' && !result.message.includes('John Smith')) {
      console.log('🚨 ISSUE FOUND: Confirmation without proper customer identification');
    }
    
    // Check agent context
    console.log('\n🔍 AGENT CONTEXT ANALYSIS:');
    console.log('='.repeat(40));
    console.log('Agent State:', agent.state);
    console.log('Context Keys:', Object.keys(agent.context));
    console.log('Original Extracted Info:', agent.context.originalExtractedInfo);
    console.log('Confirmed Data:', agent.context.confirmedData);
    console.log('Retrieval Results:', agent.context.retrievalResults);
    
    // Test a working case for comparison
    console.log('\n🔍 COMPARISON TEST: Credit balance inquiry');
    console.log('='.repeat(40));
    
    const agent2 = new ClarifyingRAGAgent('debug-comparison');
    const result2 = await agent2.processRequest("What's the balance for John?", model);
    
    console.log('Credit Balance Result Type:', result2.type);
    console.log('Credit Balance Agent State:', result2.agentState);
    console.log('Credit Balance Message Preview:', result2.message ? result2.message.substring(0, 200) + '...' : 'No message');
    
    if (result2.type === 'clarification_needed') {
      console.log('✅ Credit balance inquiry works correctly - asks for clarification');
    } else {
      console.log('❌ Credit balance inquiry also broken');
    }
    
    // Test with specific customer name
    console.log('\n🔍 CONTROL TEST: Specific customer name');
    console.log('='.repeat(40));
    
    const agent3 = new ClarifyingRAGAgent('debug-control');
    const result3 = await agent3.processRequest("Use $50 credit for John Smith", model);
    
    console.log('Specific Name Result Type:', result3.type);
    console.log('Specific Name Agent State:', result3.agentState);
    console.log('Specific Name Message Preview:', result3.message ? result3.message.substring(0, 200) + '...' : 'No message');
    
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('='.repeat(50));
    
    if (result.type === 'confirmation_needed' && result.message.includes('general')) {
      console.log('🚨 ROOT CAUSE: Intent detection is failing');
      console.log('   - System thinks intent is "general" instead of "credit_application"');
      console.log('   - This causes it to skip customer lookup and ambiguity detection');
      console.log('   - Falls back to generic confirmation');
    }
    
    if (result2.type === 'clarification_needed' && result.type !== 'clarification_needed') {
      console.log('🚨 INCONSISTENCY: Credit balance works but credit application doesn\'t');
      console.log('   - Different code paths for read-only vs write operations');
      console.log('   - Need to check why credit_application intent is not being detected');
    }
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Check intent detection for "Use $50 credit for John"');
    console.log('2. Verify that credit_application intent triggers customer lookup');
    console.log('3. Ensure ambiguity detection works for write operations');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    // Disconnect from MongoDB
    console.log('\n📊 Disconnecting from MongoDB...');
    await disconnectFromMongoDB();
  }
}

// Run the debug
debugClarificationIssue();
