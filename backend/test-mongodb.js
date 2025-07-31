require('dotenv').config();
console.log('🔄 Testing MongoDB connection...');
console.log('MONGO_URI:', process.env.MONGO_URI);

const mongoose = require('mongoose');

// Add connection event listeners first
mongoose.connection.on('connecting', () => {
  console.log('📡 Connecting to MongoDB...');
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('📴 MongoDB disconnected');
});

// Attempt connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Mongoose connection successful');
    setTimeout(() => {
      console.log('✅ Test completed - closing connection');
      mongoose.connection.close();
    }, 2000);
  })
  .catch((error) => {
    console.error('❌ Mongoose connection failed:', error.message);
    process.exit(1);
  });
