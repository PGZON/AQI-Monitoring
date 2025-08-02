"""
OpenAQ API Data Collector
Fetches historical AQI and pollutant data based on geographic coordinates
"""
import requests
import pandas as pd
import numpy as np
import time
import json
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
import logging
from config import *
import os

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class OpenAQDataCollector:
    """Collects AQI data from OpenAQ API v3 based on coordinates"""
    
    def __init__(self):
        self.base_url = OPENAQ_BASE_URL
        self.headers = HEADERS
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
        # Create data directory if it doesn't exist
        os.makedirs(DATA_DIR, exist_ok=True)
        
        logger.info(f"🚀 OpenAQ Data Collector initialized")
        logger.info(f"📍 Target locations: {len(TARGET_LOCATIONS)}")
        logger.info(f"🧪 Parameters to collect: {POLLUTANT_PARAMETERS}")
    
    def _make_request(self, endpoint: str, params: Dict) -> Optional[Dict]:
        """Make API request with retry logic"""
        
        url = f"{self.base_url}{endpoint}"
        
        for attempt in range(MAX_RETRIES):
            try:
                logger.debug(f"📡 Request: {url} | Params: {params}")
                
                response = self.session.get(url, params=params, timeout=TIMEOUT)
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 429:  # Rate limited
                    wait_time = 60  # Wait 1 minute
                    logger.warning(f"⏳ Rate limited. Waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    logger.error(f"❌ HTTP {response.status_code}: {response.text}")
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"🔌 Request failed (attempt {attempt + 1}): {str(e)}")
                
            if attempt < MAX_RETRIES - 1:
                time.sleep(REQUEST_DELAY * (attempt + 1))
        
        return None
    
    def get_locations_near_coordinates(self, lat: float, lon: float) -> List[Dict]:
        """Get all monitoring locations near given coordinates"""
        
        params = {
            'coordinates': f"{lat},{lon}",
            'radius': SEARCH_RADIUS,
            'limit': 100  # Get more locations
        }
        
        data = self._make_request('/locations', params)
        
        if data and 'results' in data:
            locations = data['results']
            logger.info(f"📍 Found {len(locations)} locations near ({lat:.4f}, {lon:.4f})")
            return locations
        
        return []
    
    def get_sensor_parameter_mapping(self, location_data: Dict) -> Dict[int, Dict]:
        """Create a mapping from sensor ID to parameter information"""
        
        sensor_mapping = {}
        sensors = location_data.get('sensors', [])
        
        for sensor in sensors:
            sensor_id = sensor.get('id')
            parameter_info = sensor.get('parameter', {})
            
            if sensor_id and parameter_info:
                sensor_mapping[sensor_id] = {
                    'name': parameter_info.get('name'),
                    'display_name': parameter_info.get('displayName'),
                    'units': parameter_info.get('units'),
                    'parameter_id': parameter_info.get('id'),
                    'sensor_name': sensor.get('name')
                }
        
        return sensor_mapping
    
    def get_latest_measurements_for_location(self, location_data: Dict) -> List[Dict]:
        """Get latest measurements for a specific location with proper parameter mapping"""
        
        location_id = location_data.get('id')
        location_name = location_data.get('name', f'Location_{location_id}')
        
        all_measurements = []
        
        try:
            # Create sensor to parameter mapping
            sensor_mapping = self.get_sensor_parameter_mapping(location_data)
            
            logger.info(f"📊 Sensor mapping for {location_name}: {len(sensor_mapping)} sensors")
            
            # Get latest measurements for this location
            data = self._make_request(f'/locations/{location_id}/latest', {})
            
            if not data or 'results' not in data:
                logger.warning(f"⚠️ No data for location {location_name} (ID: {location_id})")
                return []
                
            measurements = data['results']
            logger.info(f"📊 {location_name} (ID: {location_id}): {len(measurements)} latest measurements")
            
            # Process measurements with parameter mapping
            for measurement in measurements:
                sensor_id = measurement.get('sensorsId')
                
                # Get parameter info from sensor mapping
                parameter_info = sensor_mapping.get(sensor_id, {})
                parameter_name = parameter_info.get('name', f'unknown_sensor_{sensor_id}')
                parameter_units = parameter_info.get('units')
                parameter_display = parameter_info.get('display_name')
                
                # Extract datetime info
                datetime_info = measurement.get('datetime', {})
                if isinstance(datetime_info, dict):
                    datetime_str = datetime_info.get('utc', datetime_info.get('local'))
                else:
                    datetime_str = datetime_info
                
                # Extract coordinates
                coords = measurement.get('coordinates', {})
                
                processed = {
                    'datetime': datetime_str,
                    'parameter': parameter_name,
                    'parameter_display': parameter_display,
                    'value': measurement.get('value'),
                    'unit': parameter_units,
                    'latitude': coords.get('latitude'),
                    'longitude': coords.get('longitude'),
                    'location_id': measurement.get('locationsId', location_id),
                    'sensor_id': sensor_id,
                    'location_name': location_name,
                    'country': location_data.get('country', {}).get('name') if isinstance(location_data.get('country'), dict) else location_data.get('country'),
                    'city': location_data.get('locality'),
                    'provider': location_data.get('provider', {}).get('name') if isinstance(location_data.get('provider'), dict) else None
                }
                all_measurements.append(processed)
            
            time.sleep(REQUEST_DELAY)  # Rate limiting
            
        except Exception as e:
            logger.error(f"❌ Error getting measurements for location {location_name}: {str(e)}")
        
        return all_measurements
    
    def collect_data_for_all_locations(self) -> pd.DataFrame:
        """Collect latest measurements for all target locations"""
        
        all_data = []
        total_target_locations = len(TARGET_LOCATIONS)
        
        logger.info(f"🎯 Starting data collection for {total_target_locations} target areas")
        
        for i, (lat, lon, area_name) in enumerate(TARGET_LOCATIONS):
            logger.info(f"📍 Target area {i+1}/{total_target_locations}: {area_name} ({lat:.4f}, {lon:.4f})")
            
            # Get all monitoring locations near this coordinate
            monitoring_locations = self.get_locations_near_coordinates(lat, lon)
            
            if not monitoring_locations:
                logger.warning(f"⚠️ No monitoring stations found near {area_name}")
                continue
            
            area_data = []
            
            # Collect data from each monitoring location
            for j, location in enumerate(monitoring_locations):
                location_id = location.get('id')
                location_name = location.get('name', f'Location_{location_id}')
                
                if location_id:
                    logger.info(f"  📡 Station {j+1}/{len(monitoring_locations)}: {location_name}")
                    
                    # Pass the full location data (not just ID and name)
                    measurements = self.get_latest_measurements_for_location(location)
                    
                    # Add target area metadata to each measurement
                    for measurement in measurements:
                        measurement['target_lat'] = lat
                        measurement['target_lon'] = lon
                        measurement['target_area'] = area_name
                    
                    area_data.extend(measurements)
            
            all_data.extend(area_data)
            
            logger.info(f"📊 {area_name}: Collected {len(area_data)} measurements from {len(monitoring_locations)} stations")
            
            # Progress update
            progress = ((i + 1) / total_target_locations) * 100
            logger.info(f"📈 Progress: {progress:.1f}%")
            
            # Save intermediate results
            if all_data and (i + 1) % 3 == 0:  # Save every 3 areas
                temp_df = pd.DataFrame(all_data)
                temp_file = f"{DATA_DIR}/temp_data_{i+1}_areas.csv"
                temp_df.to_csv(temp_file, index=False)
                logger.info(f"💾 Intermediate save: {temp_file}")
        
        # Convert to DataFrame
        df = pd.DataFrame(all_data)
        
        if not df.empty:
            # Save raw data
            df.to_csv(RAW_DATA_FILE, index=False)
            logger.info(f"💾 Raw data saved: {RAW_DATA_FILE} ({len(df)} records)")
            
            # Show summary
            logger.info(f"📊 Data collection summary:")
            logger.info(f"   Total records: {len(df)}")
            logger.info(f"   Unique locations: {df['location_name'].nunique()}")
            logger.info(f"   Parameters collected: {df['parameter'].nunique()}")
            if 'parameter' in df.columns:
                param_counts = df['parameter'].value_counts()
                logger.info(f"   Parameter breakdown: {dict(param_counts.head())}")
        
        return df
    
    def get_location_info(self, lat: float, lon: float) -> Dict:
        """Get information about monitoring locations near coordinates"""
        
        params = {
            'coordinates': f"{lat},{lon}",
            'radius': SEARCH_RADIUS,
            'limit': 100
        }
        
        data = self._make_request('/locations', params)
        
        if data and 'results' in data:
            locations = data['results']
            logger.info(f"📍 Found {len(locations)} monitoring stations near ({lat:.4f}, {lon:.4f})")
            
            # Collect all available parameters from all locations
            all_parameters = set()
            for loc in locations:
                location_params = loc.get('parameters', [])
                if isinstance(location_params, list):
                    for param in location_params:
                        if isinstance(param, dict):
                            param_name = param.get('name')
                            if param_name:
                                all_parameters.add(param_name)
                        else:
                            all_parameters.add(str(param))
            
            return {
                'total_locations': len(locations),
                'locations': locations[:5],  # First 5 locations for preview
                'parameters_available': list(all_parameters),
                'sample_location_names': [loc.get('name', 'Unknown') for loc in locations[:5]]
            }
        
        return {
            'total_locations': 0, 
            'locations': [], 
            'parameters_available': [],
            'sample_location_names': []
        }

def main():
    """Main execution function"""
    
    collector = OpenAQDataCollector()
    
    # Test API connection
    logger.info("🔌 Testing API connection...")
    test_location = TARGET_LOCATIONS[0]
    location_info = collector.get_location_info(test_location[0], test_location[1])
    
    if location_info['total_locations'] > 0:
        logger.info(f"✅ API connection successful!")
        logger.info(f"📊 Available parameters: {location_info['parameters_available']}")
    else:
        logger.error("❌ API connection failed or no data available")
        return
    
    # Start data collection
    logger.info("🚀 Starting full data collection...")
    start_time = time.time()
    
    df = collector.collect_data_for_all_locations()
    
    end_time = time.time()
    duration = end_time - start_time
    
    if not df.empty:
        logger.info(f"🎉 Data collection completed!")
        logger.info(f"⏱️  Duration: {duration/60:.1f} minutes")
        logger.info(f"📊 Total records: {len(df)}")
        logger.info(f"📍 Unique locations: {df['location_name'].nunique()}")
        logger.info(f"🧪 Parameters collected: {df['parameter'].nunique()}")
        logger.info(f"📅 Date range: {df['datetime'].min()} to {df['datetime'].max()}")
        
        # Show data summary
        logger.info("\n📈 Data Summary by Parameter:")
        summary = df.groupby('parameter').agg({
            'value': ['count', 'mean', 'std', 'min', 'max']
        }).round(2)
        print(summary)
        
    else:
        logger.error("❌ No data collected!")

if __name__ == "__main__":
    main()
