// Test script to verify analytics API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAnalyticsEndpoints() {
  console.log('🧪 Testing Analytics API Endpoints...\n');

  const endpoints = [
    {
      name: 'Historical Analytics',
      url: `${BASE_URL}/analytics/historical`,
      params: { latitude: 40.7128, longitude: -74.0060, days: 7 }
    },
    {
      name: 'Weekly Comparison',
      url: `${BASE_URL}/analytics/weekly-comparison`,
      params: { latitude: 40.7128, longitude: -74.0060 }
    },
    {
      name: 'Personal Insights',
      url: `${BASE_URL}/analytics/insights`,
      params: { latitude: 40.7128, longitude: -74.0060 }
    },
    {
      name: 'Location History',
      url: `${BASE_URL}/analytics/location-history`,
      params: { days: 30 }
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      console.log(`   Params:`, endpoint.params);
      
      const response = await axios.get(endpoint.url, { 
        params: endpoint.params,
        timeout: 5000 
      });
      
      console.log(`✅ Success: ${endpoint.name}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Data structure:`, Object.keys(response.data));
      
      if (response.data.data) {
        console.log(`   Response data keys:`, Object.keys(response.data.data));
      }
      
      console.log(`   Sample data:`, JSON.stringify(response.data, null, 2).slice(0, 200) + '...\n');
      
    } catch (error) {
      console.error(`❌ Failed: ${endpoint.name}`);
      console.error(`   Error: ${error.message}`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Response:`, error.response.data);
      }
      console.log('');
    }
  }
}

// Run the tests
testAnalyticsEndpoints().catch(console.error);
