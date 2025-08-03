// Quick test for heatmap API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testHeatmapEndpoint() {
  console.log('🧪 Testing Heatmap API Endpoint...\n');

  const bounds = {
    north: 35.0,
    south: 8.0,
    east: 78.0,
    west: 68.0
  };

  const centerLat = (bounds.north + bounds.south) / 2;
  const centerLng = (bounds.east + bounds.west) / 2;

  try {
    console.log('📍 Testing public heatmap endpoint');
    console.log(`   Bounds: N:${bounds.north}, S:${bounds.south}, E:${bounds.east}, W:${bounds.west}`);
    console.log(`   URL: ${BASE_URL}/history/heatmap`);
    
    const response = await axios.get(`${BASE_URL}/history/heatmap`, {
      params: { 
        minLat: bounds.south,
        maxLat: bounds.north,
        minLon: bounds.west,
        maxLon: bounds.east,
        limit: 50,
        range: '1d'
      },
      timeout: 10000
    });
    
    console.log('✅ Success!');
    console.log(`   Status: ${response.status}`);
    console.log(`   Data type:`, typeof response.data);
    console.log(`   Response keys:`, Object.keys(response.data));
    
    if (response.data.locations) {
      console.log(`   Locations found: ${response.data.locations.length}`);
    } else if (response.data.data) {
      console.log(`   Data entries: ${Array.isArray(response.data.data) ? response.data.data.length : 'Not array'}`);
    } else {
      console.log(`   Raw response:`, JSON.stringify(response.data, null, 2).slice(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Heatmap API test failed:');
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response:`, error.response.data);
    }
    
    console.log('\n🔄 This means the heatmap will use mock data, which should still work.');
  }
}

testHeatmapEndpoint().catch(console.error);
