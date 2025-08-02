const axios = require('axios');

async function testForecastEndpoint() {
  console.log('🧪 Testing /forecast/predict endpoint after async/await fix...');
  
  try {
    const response = await axios.post('http://localhost:5000/api/forecast/predict', {
      lat: 19.0760,
      lng: 72.8777,
      forecast_days: 1
    });
    
    console.log('✅ Success! Status:', response.status);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    
    // Check if response structure is correct
    if (response.data.forecast && response.data.forecast.predictions) {
      console.log('✅ Response structure is correct');
    } else {
      console.log('⚠️ Response structure may be missing forecast.predictions');
    }
    
  } catch (error) {
    console.log('❌ Error testing endpoint:');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('🔍 500 error still occurring - need to investigate further');
    }
  }
}

// Only run if backend is running
testForecastEndpoint().catch(console.error);
