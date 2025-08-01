// Simple test to isolate the startup issue
console.log('🔄 Starting server test...');

try {
  require('dotenv').config();
  console.log('✅ Environment variables loaded');
  
  const express = require('express');
  console.log('✅ Express loaded');
  
  const mongoose = require('mongoose');
  console.log('✅ Mongoose loaded');
  
  console.log('🔧 Testing MongoDB connection...');
  console.log('MONGO_URI:', process.env.MONGO_URI);
  
  // Test MongoDB connection
  mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('✅ MongoDB connected successfully');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Error during startup test:', error.message);
  console.error(error.stack);
  process.exit(1);
}
