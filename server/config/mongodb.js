/**
 * MongoDB Configuration and Connection
 * ===================================
 * 
 * Handles MongoDB connection using Mongoose
 * Provides connection management and error handling
 */

const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Connect to MongoDB
 */
async function connectToMongoDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/transmission-portal';
    
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectFromMongoDB() {
  try {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
}

/**
 * Get connection status
 */
function getConnectionStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    status: states[mongoose.connection.readyState],
    database: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port
  };
}

module.exports = {
  connectToMongoDB,
  disconnectFromMongoDB,
  getConnectionStatus,
  mongoose
};
