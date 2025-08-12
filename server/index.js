/**
 * TRANSMISSION PORTAL - INVOICE RECONCILIATION CHATBOT
 * =====================================================
 * 
 * Main server entry point - Clean and modular architecture
 * 
 * ARCHITECTURE:
 * - Frontend: React app on port 3000
 * - Backend: Node.js/Express server on port 5000
 * - AI: Ollama LLM service on port 11434
 * - Business Logic: Python microservice for credit calculations
 * 
 * FEATURES:
 * - Real-time chat communication via Socket.IO
 * - AI-powered intent recognition using Ollama LLM
 * - Modular business logic handlers
 * - Conversation context management
 * - Credit applications, discrepancy reports, partial payments
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');

// Import modular services and configuration
const { configureSocketHandlers } = require('./config/socketConfig');
const database = require('./data/database');

require('dotenv').config();

// ============================================================================
// SERVER SETUP & CONFIGURATION
// ============================================================================

const app = express();
const server = http.createServer(app);

// Configure Socket.IO for real-time chat communication
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",  // Allow React frontend
    methods: ["GET", "POST"]
  }
});

// Middleware setup
app.use(cors());                                    // Enable cross-origin requests
app.use(bodyParser.json());                         // Parse JSON request bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Set up database in app.locals for API routes
app.locals.database = database;

// Import and setup API routes
const chatRoutes = require('./routes/chat');
const customerRoutes = require('./routes/customers');

// Register API routes
app.use('/api/chat', chatRoutes);        // Chat-related endpoints
app.use('/api/customers', customerRoutes); // Customer-related endpoints

// ============================================================================
// SOCKET.IO CONFIGURATION
// ============================================================================

// Configure Socket.IO handlers using modular approach
configureSocketHandlers(io);

// ============================================================================
// BASIC API ROUTES
// ============================================================================

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Transmission Portal API is running!',
    version: '2.0.0',
    architecture: 'Modular',
    features: [
      'Real-time chat via Socket.IO',
      'AI-powered intent recognition',
      'Modular business logic handlers',
      'Conversation context management'
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      express: 'running',
      socketio: 'connected',
      ollama: 'http://localhost:11434',
      python: 'microservice ready'
    }
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(' ============================================');
  console.log(' TRANSMISSION PORTAL - CHATBOT SERVER');
  console.log(' ============================================');
  console.log(` Server running on port ${PORT}`);
  console.log(` Frontend: http://localhost:3000`);
  console.log(` Backend: http://localhost:${PORT}`);
  console.log(` Ollama: http://localhost:11434`);
  console.log(` Python microservice: Ready`);
  console.log(` Socket.IO: Connected`);
  console.log(' ============================================');
  console.log(' Architecture: Modular & Clean');
  console.log(' Ready to process chat messages!');
  console.log(' ============================================');
});
