"""
Historical Data Collector for OpenAQ API
Collects time-series data over specified date ranges
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

class HistoricalDataCollector:
    """Collects historical AQI data from OpenAQ API v3"""
    
    def __init__(self):
        self.base_url = OPENAQ_BASE_URL
        self.headers = HEADERS
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
        # Create data directory if it doesn't exist
        os.makedirs(DATA_DIR, exist_ok=True)
        
        logger.info(f"🚀 Historical Data Collector initialized")
        logger.info(f"📅 Date range: {DATE_FROM.strftime('%Y-%m-%d')} to {DATE_TO.strftime('%Y-%m-%d')}")
    
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
            'limit': 100
        }
        
        data = self._make_request('/locations', params)
        
        if data and 'results' in data:
            locations = data['results']
            logger.info(f"📍 Found {len(locations)} locations near ({lat:.4f}, {lon:.4f})")
            return locations
        
        return []
    
    def get_sensor_measurements(self, sensor_id: int, parameter_name: str, 
                              date_from: datetime, date_to: datetime) -> List[Dict]:
        """Get historical measurements for a specific sensor"""
        
        all_measurements = []
        page = 1
        
        # Convert dates to the format expected by the API
        date_from_str = date_from.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        date_to_str = date_to.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        
        while True:
            params = {
                'sensors_id': sensor_id,
                'date_from': date_from_str,
                'date_to': date_to_str,
                'limit': 1000,  # Max per page
                'page': page,
                'order_by': 'datetime'
            }
            
            data = self._make_request(f'/sensors/{sensor_id}/measurements', params)
            
            if not data or 'results' not in data:
                # Try alternative endpoint
                data = self._make_request('/measurements', {
                    'sensors_id': sensor_id,
                    'date_from': date_from_str,
                    'date_to': date_to_str,
                    'limit': 1000,
                    'page': page,
                    'order_by': 'datetime'
                })
                
            if not data or 'results' not in data:
                break
                
            measurements = data['results']
            
            if not measurements:
                break
                
            logger.info(f"📊 Sensor {sensor_id} ({parameter_name}) - Page {page}: {len(measurements)} measurements")
            
            # Process measurements
            for measurement in measurements:
                processed = {
                    'datetime': measurement.get('datetime'),
                    'parameter': parameter_name,
                    'value': measurement.get('value'),
                    'unit': measurement.get('unit'),
                    'sensor_id': sensor_id,
                    'coordinates': measurement.get('coordinates', {}),
                    'location_id': measurement.get('locationsId'),
                }
                all_measurements.append(processed)
            
            # Check if there are more pages
            if len(measurements) < 1000:
                break
                
            page += 1
            time.sleep(REQUEST_DELAY)  # Rate limiting
        
        logger.info(f"✅ Total measurements for sensor {sensor_id}: {len(all_measurements)}")
        return all_measurements
    
    def collect_historical_data_for_location(self, location_data: Dict, 
                                           date_from: datetime, 
                                           date_to: datetime) -> List[Dict]:
        """Collect historical data for a specific location"""
        
        location_id = location_data.get('id')
        location_name = location_data.get('name', f'Location_{location_id}')
        sensors = location_data.get('sensors', [])
        
        logger.info(f"📍 Collecting historical data for: {location_name}")
        logger.info(f"🔧 Found {len(sensors)} sensors")
        
        all_measurements = []
        
        # Filter sensors to only collect desired parameters
        target_sensors = []
        for sensor in sensors:
            parameter_info = sensor.get('parameter', {})
            parameter_name = parameter_info.get('name')
            
            if parameter_name in CORE_PARAMETERS:  # Only collect core pollutants
                target_sensors.append({
                    'sensor_id': sensor.get('id'),
                    'parameter_name': parameter_name,
                    'parameter_display': parameter_info.get('displayName'),
                    'units': parameter_info.get('units')
                })
        
        logger.info(f"🎯 Target sensors: {len(target_sensors)} for parameters: {[s['parameter_name'] for s in target_sensors]}")
        
        # Collect data from each target sensor
        for i, sensor_info in enumerate(target_sensors):
            sensor_id = sensor_info['sensor_id']
            parameter_name = sensor_info['parameter_name']
            
            logger.info(f"  📡 Sensor {i+1}/{len(target_sensors)}: {parameter_name} (ID: {sensor_id})")
            
            try:
                measurements = self.get_sensor_measurements(
                    sensor_id, parameter_name, date_from, date_to
                )
                
                # Add location metadata
                for measurement in measurements:
                    measurement['location_id'] = location_id
                    measurement['location_name'] = location_name
                    measurement['parameter_display'] = sensor_info['parameter_display']
                    measurement['unit'] = sensor_info['units']
                
                all_measurements.extend(measurements)
                
            except Exception as e:
                logger.error(f"❌ Error collecting from sensor {sensor_id}: {str(e)}")
                continue
        
        logger.info(f"📊 {location_name}: Collected {len(all_measurements)} total measurements")
        return all_measurements
    
    def collect_historical_data_for_all_locations(self, 
                                                date_from: datetime = None, 
                                                date_to: datetime = None) -> pd.DataFrame:
        """Collect historical data for all target locations"""
        
        if date_from is None:
            date_from = DATE_FROM
        if date_to is None:
            date_to = DATE_TO
        
        logger.info(f"🎯 Starting historical data collection")
        logger.info(f"📅 Date range: {date_from.strftime('%Y-%m-%d')} to {date_to.strftime('%Y-%m-%d')}")
        logger.info(f"📍 Target locations: {len(TARGET_LOCATIONS)}")
        
        all_data = []
        
        for i, (lat, lon, area_name) in enumerate(TARGET_LOCATIONS):
            logger.info(f"🌍 Area {i+1}/{len(TARGET_LOCATIONS)}: {area_name} ({lat:.4f}, {lon:.4f})")
            
            # Get monitoring locations near this coordinate
            monitoring_locations = self.get_locations_near_coordinates(lat, lon)
            
            if not monitoring_locations:
                logger.warning(f"⚠️ No monitoring stations found near {area_name}")
                continue
            
            area_data = []
            
            # Collect historical data from each monitoring location
            for j, location in enumerate(monitoring_locations[:3]):  # Limit to 3 locations per area to avoid too much data
                location_id = location.get('id')
                location_name = location.get('name', f'Location_{location_id}')
                
                logger.info(f"  🏢 Station {j+1}/3: {location_name}")
                
                location_measurements = self.collect_historical_data_for_location(
                    location, date_from, date_to
                )
                
                # Add target area metadata
                for measurement in location_measurements:
                    measurement['target_lat'] = lat
                    measurement['target_lon'] = lon
                    measurement['target_area'] = area_name
                
                area_data.extend(location_measurements)
            
            all_data.extend(area_data)
            
            logger.info(f"📊 {area_name}: Total {len(area_data)} measurements from {min(len(monitoring_locations), 3)} stations")
            
            # Progress update
            progress = ((i + 1) / len(TARGET_LOCATIONS)) * 100
            logger.info(f"📈 Progress: {progress:.1f}%")
            
            # Save intermediate results every 2 areas
            if all_data and (i + 1) % 2 == 0:
                temp_df = pd.DataFrame(all_data)
                temp_file = f"{DATA_DIR}/temp_historical_data_{i+1}_areas.csv"
                temp_df.to_csv(temp_file, index=False)
                logger.info(f"💾 Intermediate save: {temp_file}")
        
        # Convert to DataFrame
        df = pd.DataFrame(all_data)
        
        if not df.empty:
            # Save raw historical data
            historical_data_file = f"{DATA_DIR}/historical_openaq_data.csv"
            df.to_csv(historical_data_file, index=False)
            logger.info(f"💾 Historical data saved: {historical_data_file} ({len(df)} records)")
            
            # Show summary
            logger.info(f"📊 Historical data collection summary:")
            logger.info(f"   Total records: {len(df)}")
            logger.info(f"   Unique locations: {df['location_name'].nunique()}")
            logger.info(f"   Parameters collected: {df['parameter'].nunique()}")
            logger.info(f"   Date range: {df['datetime'].min()} to {df['datetime'].max()}")
            
            if 'parameter' in df.columns:
                param_counts = df['parameter'].value_counts()
                logger.info(f"   Parameter breakdown:")
                for param, count in param_counts.head().items():
                    logger.info(f"     {param}: {count} measurements")
        
        return df

def main():
    """Main execution function for historical data collection"""
    
    collector = HistoricalDataCollector()
    
    print("🎯 HISTORICAL AQI DATA COLLECTION")
    print("=" * 50)
    
    # Ask user for date range
    print(f"📅 Default date range: {DATE_FROM.strftime('%Y-%m-%d')} to {DATE_TO.strftime('%Y-%m-%d')}")
    
    use_custom = input("Use custom date range? (y/N): ").lower().strip()
    
    if use_custom == 'y':
        try:
            days_back = int(input("Enter number of days back to collect (default 30): ") or "30")
            date_from = datetime.now() - timedelta(days=days_back)
            date_to = datetime.now()
            print(f"📅 Custom range: {date_from.strftime('%Y-%m-%d')} to {date_to.strftime('%Y-%m-%d')}")
        except ValueError:
            print("❌ Invalid input, using default range")
            date_from, date_to = DATE_FROM, DATE_TO
    else:
        date_from, date_to = DATE_FROM, DATE_TO
    
    # Estimate data collection
    total_locations = len(TARGET_LOCATIONS)
    estimated_time = (total_locations * 3 * 5 * REQUEST_DELAY) / 60  # Rough estimate
    
    print(f"\n📊 Collection plan:")
    print(f"   Target areas: {total_locations}")
    print(f"   Date range: {(date_to - date_from).days} days")
    print(f"   Estimated time: {estimated_time:.1f} minutes")
    
    proceed = input("\n🚀 Start historical data collection? (Y/n): ").lower().strip()
    if proceed == 'n':
        print("⏹️ Collection cancelled")
        return
    
    # Start collection
    start_time = time.time()
    df = collector.collect_historical_data_for_all_locations(date_from, date_to)
    end_time = time.time()
    
    duration = (end_time - start_time) / 60
    
    if not df.empty:
        print(f"\n🎉 Historical data collection completed!")
        print(f"⏱️ Duration: {duration:.1f} minutes")
        print(f"📊 Total records: {len(df)}")
        print(f"📅 Date range: {df['datetime'].min()} to {df['datetime'].max()}")
        print(f"🧪 Parameters: {df['parameter'].unique()}")
    else:
        print("❌ No historical data collected!")

if __name__ == "__main__":
    main()
