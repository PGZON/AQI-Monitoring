const axios = require('axios');

// Test batch prediction endpoint
async function testBatchPrediction() {
  console.log('🧪 Testing batch prediction endpoint...');
  
  try {
    const response = await axios.post('http://localhost:5000/api/forecast/batch-predict', {
      locations: [
        {
          location: "Mumbai, India",
          lat: 19.0760,
          lng: 72.8777,
          pollution_data: {
            PM25: 65.5,
            PM10: 85.2,
            NO2: 42.3,
            CO: 1.2,
            O3: 78.9,
            SO2: 15.6
          }
        },
        {
          location: "Delhi, India", 
          lat: 28.7041,
          lng: 77.1025,
          pollution_data: {
            PM25: 95.8,
            PM10: 125.4,
            NO2: 58.7,
            CO: 2.1,
            O3: 65.3,
            SO2: 22.1
          }
        }
      ]
    });
    
    console.log('✅ Batch prediction success!');
    console.log('📊 Results:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Batch prediction failed:', error.response?.data || error.message);
    return false;
  }
}

// Test ML service health
async function testMLServiceHealth() {
  console.log('🏥 Testing ML service health...');
  
  try {
    const response = await axios.get('http://localhost:5000/api/forecast/health');
    console.log('✅ ML service health check:', response.data);
    return response.data.status === 'healthy';
  } catch (error) {
    console.error('❌ ML service health check failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting ML endpoint tests...\n');
  
  const healthCheck = await testMLServiceHealth();
  const batchTest = await testBatchPrediction();
  
  console.log('\n📋 Test Results:');
  console.log(`Health Check: ${healthCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Batch Prediction: ${batchTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (healthCheck && batchTest) {
    console.log('\n🎉 All tests passed! Both issues have been resolved.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the backend server and ML service.');
  }
}

// Execute if run directly
if (require.main === module) {
  runTests();
}

module.exports = { testBatchPrediction, testMLServiceHealth };
