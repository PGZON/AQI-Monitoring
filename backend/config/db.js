const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Import logger here to avoid circular dependencies
    const { dbLogger } = require('../middleware/logger-simple');
    
    dbLogger.connection('Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGO_URI);

    dbLogger.connection(`MongoDB Connected: ${conn.connection.host}`, {
      database: conn.connection.name,
      host: conn.connection.host,
      port: conn.connection.port
    });
    
    // Log connection state changes
    mongoose.connection.on('connected', () => {
      dbLogger.connection('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      dbLogger.error('Mongoose connection error', err);
    });

    mongoose.connection.on('disconnected', () => {
      dbLogger.connection('Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        dbLogger.connection('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        dbLogger.error('Error during MongoDB disconnection', error);
        process.exit(1);
      }
    });

  } catch (error) {
    // Fallback to console if logger not available yet
    console.error('❌ Error connecting to MongoDB:', error.message);
    
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
