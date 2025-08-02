"""
Data Preprocessing Pipeline for AQI ML Models
Cleans, processes, and prepares data for LSTM model training
"""
import pandas as pd
import numpy as np
from datetime import datetime
import logging
from typing import Tuple, Dict, List
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.impute import SimpleImputer
import joblib
import os
from config import *

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AQIDataPreprocessor:
    """Preprocesses OpenAQ data for LSTM model training"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.imputer = SimpleImputer(strategy='median')
        self.feature_columns = []
        self.location_encoders = {}
        
        logger.info("🔧 AQI Data Preprocessor initialized")
    
    def load_raw_data(self, file_path: str) -> pd.DataFrame:
        """Load raw data from CSV file with column debugging"""
        
        if not os.path.exists(file_path):
            logger.error(f"❌ File not found: {file_path}")
            return pd.DataFrame()
        
        try:
            df = pd.read_csv(file_path)
            logger.info(f"📊 Loaded raw data: {len(df)} records")
            
            # Debug: Show available columns
            logger.info(f"📋 Available columns: {list(df.columns)}")
            
            # Debug: Show data types and sample values
            logger.info("🔍 Column analysis:")
            for col in df.columns:
                non_null_count = df[col].notna().sum()
                logger.info(f"   {col}: {non_null_count}/{len(df)} non-null values")
            
            return df
        except Exception as e:
            logger.error(f"❌ Error loading data: {str(e)}")
            return pd.DataFrame()
        
        # Create directories
        os.makedirs(DATA_DIR, exist_ok=True)
        os.makedirs(MODEL_DIR, exist_ok=True)
        
        logger.info("🔧 AQI Data Preprocessor initialized")
    
    def load_raw_data(self, file_path: str = RAW_DATA_FILE) -> pd.DataFrame:
        """Load raw data from CSV file"""
        
        if not os.path.exists(file_path):
            logger.error(f"❌ Raw data file not found: {file_path}")
            return pd.DataFrame()
        
        try:
            df = pd.read_csv(file_path)
            logger.info(f"📊 Loaded raw data: {len(df)} records")
            return df
        except Exception as e:
            logger.error(f"❌ Error loading data: {str(e)}")
            return pd.DataFrame()
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate the raw data"""
        
        logger.info("🧹 Starting data cleaning...")
        initial_count = len(df)
        
        # Handle different datetime column names
        datetime_col = None
        for col in ['datetime', 'datetimeUtc', 'datetimeLocal', 'timestamp']:
            if col in df.columns:
                datetime_col = col
                break
        
        if datetime_col is None:
            raise ValueError("No datetime column found. Available columns: " + str(list(df.columns)))
        
        # Rename to standardized 'datetime' column
        if datetime_col != 'datetime':
            df = df.rename(columns={datetime_col: 'datetime'})
            logger.info(f"📅 Renamed '{datetime_col}' to 'datetime'")
        
        # Convert datetime
        df['datetime'] = pd.to_datetime(df['datetime'])
        
        # Remove invalid values
        df = df.dropna(subset=['datetime', 'value', 'latitude', 'longitude'])
        
        # Remove outliers based on thresholds
        df = df[
            (df['value'] >= 0) & 
            (df['value'] <= 10000)  # Reasonable upper limit for pollutants
        ]
        
        # Remove duplicate measurements
        df = df.drop_duplicates(subset=['datetime', 'parameter', 'latitude', 'longitude'])
        
        # Sort by datetime
        df = df.sort_values(['location_name', 'parameter', 'datetime'])
        
        final_count = len(df)
        removed_count = initial_count - final_count
        removal_rate = (removed_count / initial_count) * 100
        
        logger.info(f"✅ Data cleaning completed:")
        logger.info(f"   Initial records: {initial_count}")
        logger.info(f"   Final records: {final_count}")
        logger.info(f"   Removed: {removed_count} ({removal_rate:.1f}%)")
        
        return df
    
    def pivot_parameters(self, df: pd.DataFrame) -> pd.DataFrame:
        """Pivot parameters to create feature columns"""
        
        logger.info("🔄 Pivoting parameters to feature columns...")
        
        # Add missing columns with default values
        if 'city' not in df.columns:
            df['city'] = ''
        if 'country' not in df.columns:
            df['country'] = 'Unknown'
        if 'target_lat' not in df.columns:
            df['target_lat'] = df['latitude']
        if 'target_lon' not in df.columns:
            df['target_lon'] = df['longitude']
        
        # Fill NaN values to avoid pivot issues
        df['city'] = df['city'].fillna('')
        df['country'] = df['country'].fillna('Unknown')
        
        # Determine available index columns
        available_index_cols = ['datetime', 'location_name', 'latitude', 'longitude']
        optional_index_cols = ['target_lat', 'target_lon', 'country', 'city']
        
        # Add optional columns if they exist and have valid data
        for col in optional_index_cols:
            if col in df.columns and not df[col].isna().all():
                available_index_cols.append(col)
        
        logger.info(f"📊 Using index columns: {available_index_cols}")
        
        # Create pivot table
        pivot_df = df.pivot_table(
            index=available_index_cols,
            columns='parameter',
            values='value',
            aggfunc='mean'  # Average multiple measurements at same time
        ).reset_index()
        
        # Flatten column names
        pivot_df.columns.name = None
        
        logger.info(f"📊 Pivoted data shape: {pivot_df.shape}")
        logger.info(f"🧪 Available parameters: {[col for col in pivot_df.columns if col not in ['datetime', 'location_name', 'target_lat', 'target_lon', 'latitude', 'longitude', 'country', 'city']]}")
        
        return pivot_df
    
    def calculate_aqi(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate AQI from pollutant concentrations"""
        
        logger.info("🧮 Calculating AQI from pollutant concentrations...")
        
        # AQI calculation function (simplified US EPA formula)
        def calculate_aqi_value(pm25, pm10, co, no2, o3, so2):
            """Calculate AQI based on pollutant concentrations"""
            
            # Handle missing values
            pollutants = [pm25, pm10, co, no2, o3, so2]
            valid_pollutants = [p for p in pollutants if pd.notna(p)]
            
            if len(valid_pollutants) == 0:
                return np.nan
            
            # Simplified AQI calculation (adjust breakpoints as needed)
            aqi_values = []
            
            # PM2.5 AQI
            if pd.notna(pm25):
                if pm25 <= 12.0:
                    aqi_pm25 = (50 / 12.0) * pm25
                elif pm25 <= 35.4:
                    aqi_pm25 = 50 + ((100 - 50) / (35.4 - 12.1)) * (pm25 - 12.1)
                elif pm25 <= 55.4:
                    aqi_pm25 = 100 + ((150 - 100) / (55.4 - 35.5)) * (pm25 - 35.5)
                else:
                    aqi_pm25 = min(500, 150 + ((500 - 150) / 150) * (pm25 - 55.5))
                aqi_values.append(aqi_pm25)
            
            # PM10 AQI
            if pd.notna(pm10):
                if pm10 <= 54:
                    aqi_pm10 = (50 / 54) * pm10
                elif pm10 <= 154:
                    aqi_pm10 = 50 + ((100 - 50) / (154 - 55)) * (pm10 - 55)
                else:
                    aqi_pm10 = min(500, 100 + ((500 - 100) / 200) * (pm10 - 155))
                aqi_values.append(aqi_pm10)
            
            # Use maximum AQI (worst pollutant determines overall AQI)
            return max(aqi_values) if aqi_values else np.nan
        
        # Apply AQI calculation
        df['aqi'] = df.apply(lambda row: calculate_aqi_value(
            row.get('pm25'), row.get('pm10'), row.get('co'),
            row.get('no2'), row.get('o3'), row.get('so2')
        ), axis=1)
        
        # Remove rows without AQI
        initial_count = len(df)
        df = df.dropna(subset=['aqi'])
        final_count = len(df)
        
        logger.info(f"✅ AQI calculation completed:")
        logger.info(f"   Valid AQI records: {final_count}/{initial_count}")
        logger.info(f"   AQI range: {df['aqi'].min():.1f} - {df['aqi'].max():.1f}")
        
        return df
    
    def add_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add temporal features from datetime"""
        
        logger.info("⏰ Adding temporal features...")
        
        df['hour'] = df['datetime'].dt.hour
        df['day_of_week'] = df['datetime'].dt.dayofweek
        df['month'] = df['datetime'].dt.month
        df['day_of_year'] = df['datetime'].dt.dayofyear
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        
        # Cyclical encoding for temporal features
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        df['day_sin'] = np.sin(2 * np.pi * df['day_of_year'] / 365)
        df['day_cos'] = np.cos(2 * np.pi * df['day_of_year'] / 365)
        
        logger.info("✅ Temporal features added")
        return df
    
    def handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in the dataset"""
        
        logger.info("🔧 Handling missing values...")
        
        # Check missing values
        missing_stats = df.isnull().sum()
        total_rows = len(df)
        
        logger.info("📊 Missing values by column:")
        for col, missing_count in missing_stats.items():
            if missing_count > 0:
                missing_ratio = (missing_count / total_rows) * 100
                logger.info(f"   {col}: {missing_count} ({missing_ratio:.1f}%)")
        
        # Forward fill and backward fill for time series data
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_columns:
            if col in ['pm25', 'pm10', 'co', 'no2', 'o3', 'so2', 'aqi']:
                # For pollutants, use interpolation within location groups
                df[col] = df.groupby('location_name')[col].transform(
                    lambda x: x.interpolate(method='linear')
                )
        
        # Fill remaining missing values with median
        for col in numeric_columns:
            if df[col].isnull().sum() > 0:
                median_value = df[col].median()
                df[col] = df[col].fillna(median_value)
        
        logger.info("✅ Missing values handled")
        return df
    
    def create_feature_matrix(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create final feature matrix for ML model"""
        
        logger.info("🎯 Creating feature matrix...")
        
        # Define feature columns
        pollutant_features = [col for col in CORE_PARAMETERS if col in df.columns]
        temporal_features = ['hour_sin', 'hour_cos', 'month_sin', 'month_cos', 
                           'day_sin', 'day_cos', 'is_weekend']
        
        # Location features - use what's available
        location_features = []
        if 'target_lat' in df.columns:
            location_features.append('target_lat')
        elif 'latitude' in df.columns:
            df['target_lat'] = df['latitude']
            location_features.append('target_lat')
            
        if 'target_lon' in df.columns:
            location_features.append('target_lon')
        elif 'longitude' in df.columns:
            df['target_lon'] = df['longitude']
            location_features.append('target_lon')
        
        self.feature_columns = pollutant_features + temporal_features + location_features
        
        logger.info(f"🧪 Feature categories:")
        logger.info(f"   Pollutants: {pollutant_features}")
        logger.info(f"   Temporal: {temporal_features}")
        logger.info(f"   Location: {location_features}")
        
        # Select features and target
        required_columns = ['datetime', 'location_name'] + self.feature_columns + ['aqi']
        available_columns = [col for col in required_columns if col in df.columns]
        
        if 'aqi' not in df.columns:
            logger.error("❌ AQI column missing - cannot create feature matrix")
            return pd.DataFrame()
        
        feature_df = df[available_columns].copy()
        
        # Remove rows with missing features
        feature_df = feature_df.dropna(subset=self.feature_columns + ['aqi'])
        
        logger.info(f"✅ Feature matrix created:")
        logger.info(f"   Shape: {feature_df.shape}")
        logger.info(f"   Features: {self.feature_columns}")
        
        return feature_df
    
    def create_lstm_sequences(self, df: pd.DataFrame, 
                            sequence_length: int = SEQUENCE_LENGTH) -> Tuple[np.ndarray, np.ndarray]:
        """Create sequences for LSTM training"""
        
        logger.info(f"📊 Creating LSTM sequences (length: {sequence_length})...")
        
        if len(df) < sequence_length + 1:
            logger.warning(f"⚠️ Insufficient data for LSTM sequences!")
            logger.warning(f"   Available records: {len(df)}")
            logger.warning(f"   Required: {sequence_length + 1}")
            logger.warning(f"   Returning empty arrays - need more historical data")
            return np.array([]), np.array([])
        
        X_sequences = []
        y_sequences = []
        
        # Group by location to maintain temporal continuity
        for location in df['location_name'].unique():
            location_df = df[df['location_name'] == location].sort_values('datetime')
            
            if len(location_df) < sequence_length + 1:
                logger.warning(f"⚠️ Insufficient data for location {location}: {len(location_df)} records")
                continue
            
            # Extract features and target
            features = location_df[self.feature_columns].values
            targets = location_df['aqi'].values
            
            # Create sequences
            for i in range(len(features) - sequence_length):
                X_sequences.append(features[i:i + sequence_length])
                y_sequences.append(targets[i + sequence_length])
        
        if not X_sequences:
            logger.warning("⚠️ No valid sequences created - need more data per location")
            return np.array([]), np.array([])
        
        X = np.array(X_sequences)
        y = np.array(y_sequences)
        y = np.array(y_sequences)
        
        logger.info(f"✅ LSTM sequences created:")
        logger.info(f"   X shape: {X.shape}")
        logger.info(f"   y shape: {y.shape}")
        logger.info(f"   Total sequences: {len(X)}")
        
        return X, y
    
    def scale_features(self, X: np.ndarray, y: np.ndarray, 
                      fit_scaler: bool = True) -> Tuple[np.ndarray, np.ndarray]:
        """Scale features and target variables"""
        
        logger.info("📏 Scaling features...")
        
        # Check for empty arrays
        if X.size == 0 or y.size == 0:
            logger.warning("⚠️ Empty arrays provided for scaling, returning as-is")
            return X, y
        
        # Reshape for scaling
        original_shape = X.shape
        X_reshaped = X.reshape(-1, X.shape[-1])
        
        if fit_scaler:
            X_scaled = self.scaler.fit_transform(X_reshaped)
            # Save scaler
            scaler_path = f"{MODEL_DIR}/feature_scaler.joblib"
            joblib.dump(self.scaler, scaler_path)
            logger.info(f"💾 Scaler saved: {scaler_path}")
        else:
            X_scaled = self.scaler.transform(X_reshaped)
        
        # Reshape back
        X_scaled = X_scaled.reshape(original_shape)
        
        # Scale target (AQI) separately
        y_scaled = y / 500.0  # Normalize AQI to 0-1 range
        
        logger.info("✅ Feature scaling completed")
        return X_scaled, y_scaled
    
    def save_processed_data(self, df: pd.DataFrame, X: np.ndarray, y: np.ndarray):
        """Save processed data to files"""
        
        logger.info("💾 Saving processed data...")
        
        # Save processed DataFrame
        df.to_csv(PROCESSED_DATA_FILE, index=False)
        logger.info(f"✅ Processed data saved: {PROCESSED_DATA_FILE}")
        
        # Save sequences
        np.savez_compressed(SEQUENCES_FILE, X=X, y=y, feature_columns=self.feature_columns)
        logger.info(f"✅ LSTM sequences saved: {SEQUENCES_FILE}")
        
        # Save feature columns
        feature_info = {
            'feature_columns': self.feature_columns,
            'sequence_length': SEQUENCE_LENGTH,
            'total_sequences': len(X),
            'feature_shape': X.shape,
            'target_shape': y.shape
        }
        
        import json
        with open(f"{DATA_DIR}/feature_info.json", 'w') as f:
            json.dump(feature_info, f, indent=2)
        
        logger.info("💾 All processed data saved successfully")
    
    def process_pipeline(self, raw_data_file: str = RAW_DATA_FILE) -> Tuple[np.ndarray, np.ndarray]:
        """Complete preprocessing pipeline"""
        
        logger.info("🚀 Starting complete preprocessing pipeline...")
        start_time = datetime.now()
        
        # Load raw data
        df = self.load_raw_data(raw_data_file)
        if df.empty:
            logger.error("❌ No data to process")
            return np.array([]), np.array([])
        
        # Clean data
        df = self.clean_data(df)
        
        # Pivot parameters
        df = self.pivot_parameters(df)
        
        # Calculate AQI
        df = self.calculate_aqi(df)
        
        # Add temporal features
        df = self.add_temporal_features(df)
        
        # Handle missing values
        df = self.handle_missing_values(df)
        
        # Create feature matrix
        df = self.create_feature_matrix(df)
        
        # Create LSTM sequences
        X, y = self.create_lstm_sequences(df)
        
        # Scale features
        X_scaled, y_scaled = self.scale_features(X, y)
        
        # Save processed data
        self.save_processed_data(df, X_scaled, y_scaled)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        logger.info(f"🎉 Preprocessing pipeline completed!")
        logger.info(f"⏱️  Duration: {duration:.1f} seconds")
        logger.info(f"📊 Final dataset: {len(df)} records")
        logger.info(f"🔢 LSTM sequences: {len(X_scaled)}")
        
        return X_scaled, y_scaled

def main():
    """Main execution function"""
    
    preprocessor = AQIDataPreprocessor()
    
    # Check if raw data exists
    if not os.path.exists(RAW_DATA_FILE):
        logger.error(f"❌ Raw data file not found: {RAW_DATA_FILE}")
        logger.info("💡 Please run data_collector.py first to collect data")
        return
    
    # Run preprocessing pipeline
    X, y = preprocessor.process_pipeline()
    
    if len(X) > 0:
        logger.info("✅ Data preprocessing successful!")
        logger.info("🚀 Ready for LSTM model training!")
    else:
        logger.error("❌ Data preprocessing failed!")

if __name__ == "__main__":
    main()
