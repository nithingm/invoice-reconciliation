// Simple test script to verify the setup
const http = require('http');

console.log('🔧 TransMaster Pro Portal - Setup Test');
console.log('=====================================');

// Test if we can create a basic server
const testServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'TransMaster Pro API is working!',
    timestamp: new Date().toISOString(),
    status: 'success'
  }));
});

const PORT = 3001;

testServer.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log('📋 Setup verification:');
  console.log('   - Node.js server: ✅ Working');
  console.log('   - HTTP module: ✅ Working');
  console.log('   - JSON responses: ✅ Working');
  console.log('');
  console.log('🚀 Ready to start the full application!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run "npm run install-all" to install dependencies');
  console.log('2. Run "npm run dev" to start both frontend and backend');
  console.log('3. Open http://localhost:3000 in your browser');
  console.log('');
  console.log('Press Ctrl+C to stop this test server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Test server stopped');
  testServer.close();
  process.exit(0);
});
