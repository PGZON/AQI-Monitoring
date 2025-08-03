// Test script specifically for Kolhapur Analytics
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const KOLHAPUR_COORDS = {
  latitude: 16.7050,
  longitude: 74.2433,
  city: 'Kolhapur, Maharashtra, India'
};

async function testKolhapurAnalytics() {
  console.log('🏙️  Testing Analytics for Kolhapur City');
  console.log(`📍 Coordinates: ${KOLHAPUR_COORDS.latitude}, ${KOLHAPUR_COORDS.longitude}`);
  console.log('=' .repeat(60));

  const endpoints = [
    {
      name: '🧠 Personal Insights',
      url: `${BASE_URL}/analytics/insights`,
      params: { 
        latitude: KOLHAPUR_COORDS.latitude, 
        longitude: KOLHAPUR_COORDS.longitude 
      }
    },
    {
      name: '📊 Historical Analytics (7 days)',
      url: `${BASE_URL}/analytics/historical`,
      params: { 
        latitude: KOLHAPUR_COORDS.latitude, 
        longitude: KOLHAPUR_COORDS.longitude, 
        days: 7 
      }
    },
    {
      name: '📈 Weekly Comparison',
      url: `${BASE_URL}/analytics/weekly-comparison`,
      params: { 
        latitude: KOLHAPUR_COORDS.latitude, 
        longitude: KOLHAPUR_COORDS.longitude 
      }
    },
    {
      name: '🗺️  Location History',
      url: `${BASE_URL}/analytics/location-history`,
      params: { days: 30 }
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      console.log(`   Params:`, endpoint.params);
      
      const response = await axios.get(endpoint.url, { 
        params: endpoint.params,
        timeout: 10000 
      });
      
      console.log(`✅ Success: ${endpoint.name}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Success: ${response.data.success}`);
      
      if (response.data.data) {
        const data = response.data.data;
        console.log(`   Data Keys:`, Object.keys(data));
        
        // Show specific data for each endpoint
        if (endpoint.name.includes('Personal Insights') && data.stats) {
          console.log(`   📊 Stats: Days=${data.stats.daysTracked}, Locations=${data.stats.locationsVisited}, Checks=${data.stats.checksThisWeek}`);
          console.log(`   💡 Insight: "${data.primary}"`);
        }
        
        if (endpoint.name.includes('Historical') && data.dataPoints) {
          console.log(`   📈 Data Points: ${data.dataPoints.length} entries`);
          console.log(`   📅 Date Range: ${data.summary?.dateRange || 'Not specified'}`);
        }
        
        if (endpoint.name.includes('Weekly') && data.thisWeek) {
          console.log(`   📊 This Week Avg: ${data.thisWeek.average}`);
          console.log(`   📈 Trend: ${data.comparison.trend} (${data.comparison.change})`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Failed: ${endpoint.name}`);
      console.error(`   Error: ${error.message}`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Response:`, error.response.data);
      }
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 Kolhapur Analytics Testing Complete!');
  console.log('\n📝 Next Steps:');
  console.log('1. Check the analytics page with Kolhapur selected');
  console.log('2. Verify data shows in the dashboard');
  console.log('3. Test the location dropdown selector');
}

// Run the Kolhapur tests
testKolhapurAnalytics().catch(console.error);
