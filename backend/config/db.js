const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, 
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10, 
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    // Provide more detailed error information
    if (error.name === 'MongoServerSelectionError') {
      logger.error(`Could not connect to any MongoDB servers: ${error.message}`);
      logger.error(`Please check your MongoDB URI and network connectivity`);
    }
    
    throw error;
  }
};

// Add a connection event listener for when disconnected
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

// Add a connection event listener for errors
mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

module.exports = connectDB;