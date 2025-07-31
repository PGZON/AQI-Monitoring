import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.linear_model import LinearRegression
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
import joblib
import json
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class AQIPreprocessor:
    """Handles data preprocessing for AQI forecasting models"""
    
    def __init__(self):
        self.scaler = MinMaxScaler()
        self.feature_cols = ['aqi', 'pm2_5', 'pm10', 'co', 'no2', 'o3', 'so2', 'temperature', 'humidity', 'pressure', 'windSpeed']
        
    def prepare_data(self, data):
        """
        Convert raw data to DataFrame and prepare features
        """
        if isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            df = data.copy()
            
        # Convert timestamp to datetime
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp')
            
        # Extract pollutant and weather features
        features = []
        for _, row in df.iterrows():
            feature_row = {
                'timestamp': row['timestamp'],
                'aqi': row.get('aqi', 0)
            }
            
            # Extract pollutants
            if 'pollutants' in row and isinstance(row['pollutants'], dict):
                for pollutant in ['pm2_5', 'pm10', 'co', 'no2', 'o3', 'so2']:
                    feature_row[pollutant] = row['pollutants'].get(pollutant, 0)
            
            # Extract weather data
            if 'weather' in row and isinstance(row['weather'], dict):
                for weather_param in ['temperature', 'humidity', 'pressure', 'windSpeed']:
                    feature_row[weather_param] = row['weather'].get(weather_param, 0)
                    
            features.append(feature_row)
            
        feature_df = pd.DataFrame(features)
        
        # Fill missing values
        for col in self.feature_cols:
            if col not in feature_df.columns:
                feature_df[col] = 0
            feature_df[col] = feature_df[col].fillna(feature_df[col].mean())
            
        return feature_df
    
    def create_sequences(self, data, sequence_length=7, forecast_horizon=1):
        """
        Create sequences for time series forecasting
        """
        feature_df = self.prepare_data(data)
        
        # Sort by timestamp
        feature_df = feature_df.sort_values('timestamp')
        
        # Select only numeric features for modeling
        numeric_cols = [col for col in self.feature_cols if col in feature_df.columns]
        values = feature_df[numeric_cols].values
        
        # Scale the data
        scaled_values = self.scaler.fit_transform(values)
        
        X, y = [], []
        for i in range(len(scaled_values) - sequence_length - forecast_horizon + 1):
            # Input sequence
            X.append(scaled_values[i:(i + sequence_length)])
            # Target (AQI for next forecast_horizon steps)
            y.append(scaled_values[i + sequence_length:i + sequence_length + forecast_horizon, 0])  # AQI is first column
            
        return np.array(X), np.array(y), feature_df['timestamp'].iloc[sequence_length:].values

class SimpleLinearModel:
    """Simple linear regression model for AQI forecasting"""
    
    def __init__(self):
        self.model = LinearRegression()
        self.preprocessor = AQIPreprocessor()
        self.is_trained = False
        
    def train(self, data, sequence_length=7, forecast_horizon=3):
        """Train the linear model"""
        try:
            X, y, timestamps = self.preprocessor.create_sequences(
                data, sequence_length, forecast_horizon
            )
            
            if len(X) == 0:
                raise ValueError("Not enough data for training")
                
            # Flatten X for linear regression
            X_flat = X.reshape(X.shape[0], -1)
            y_flat = y.mean(axis=1)  # Average forecast horizon for simplicity
            
            self.model.fit(X_flat, y_flat)
            self.sequence_length = sequence_length
            self.forecast_horizon = forecast_horizon
            self.is_trained = True
            
            # Calculate training metrics
            predictions = self.model.predict(X_flat)
            mse = mean_squared_error(y_flat, predictions)
            mae = mean_absolute_error(y_flat, predictions)
            
            return {
                'success': True,
                'model_type': 'LinearRegression',
                'training_samples': len(X),
                'mse': float(mse),
                'mae': float(mae),
                'sequence_length': sequence_length,
                'forecast_horizon': forecast_horizon
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def predict(self, recent_data, days=3):
        """Make predictions using the trained model"""
        if not self.is_trained:
            raise ValueError("Model not trained yet")
            
        try:
            # Prepare recent data
            feature_df = self.preprocessor.prepare_data(recent_data)
            
            if len(feature_df) < self.sequence_length:
                raise ValueError(f"Need at least {self.sequence_length} data points for prediction")
                
            # Take the most recent sequence
            numeric_cols = [col for col in self.preprocessor.feature_cols if col in feature_df.columns]
            recent_values = feature_df[numeric_cols].tail(self.sequence_length).values
            
            # Scale the input
            scaled_input = self.preprocessor.scaler.transform(recent_values)
            X_pred = scaled_input.reshape(1, -1)
            
            # Make prediction
            prediction_scaled = self.model.predict(X_pred)[0]
            
            # Create forecast for requested days
            last_timestamp = pd.to_datetime(feature_df['timestamp'].iloc[-1])
            forecasts = []
            
            for i in range(days):
                forecast_date = last_timestamp + timedelta(days=i+1)
                # For simplicity, assume prediction stays relatively stable with small variation
                variation = np.random.normal(0, prediction_scaled * 0.1)  # 10% variation
                predicted_aqi = max(0, min(500, prediction_scaled + variation))  # Clamp between 0-500
                
                forecasts.append({
                    'date': forecast_date.strftime('%Y-%m-%d'),
                    'aqi': round(float(predicted_aqi), 1),
                    'confidence': 'medium' if i < 2 else 'low'
                })
                
            return forecasts
            
        except Exception as e:
            raise ValueError(f"Prediction failed: {str(e)}")

class LSTMModel:
    """LSTM neural network model for AQI forecasting"""
    
    def __init__(self):
        self.model = None
        self.preprocessor = AQIPreprocessor()
        self.is_trained = False
        
    def build_model(self, input_shape, forecast_horizon):
        """Build LSTM architecture"""
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(50, return_sequences=False),
            Dropout(0.2),
            Dense(25),
            Dense(forecast_horizon)
        ])
        
        model.compile(optimizer='adam', loss='mse', metrics=['mae'])
        return model
    
    def train(self, data, sequence_length=14, forecast_horizon=3, epochs=50):
        """Train the LSTM model"""
        try:
            X, y, timestamps = self.preprocessor.create_sequences(
                data, sequence_length, forecast_horizon
            )
            
            if len(X) < 10:  # Need minimum samples for LSTM
                raise ValueError("Not enough data for LSTM training (minimum 10 sequences)")
                
            # Build model
            self.model = self.build_model(
                (sequence_length, X.shape[2]), 
                forecast_horizon
            )
            
            # Train model
            history = self.model.fit(
                X, y,
                batch_size=32,
                epochs=epochs,
                validation_split=0.2,
                verbose=0
            )
            
            self.sequence_length = sequence_length
            self.forecast_horizon = forecast_horizon
            self.is_trained = True
            
            # Calculate final metrics
            final_loss = history.history['loss'][-1]
            final_mae = history.history['mae'][-1]
            
            return {
                'success': True,
                'model_type': 'LSTM',
                'training_samples': len(X),
                'final_loss': float(final_loss),
                'final_mae': float(final_mae),
                'sequence_length': sequence_length,
                'forecast_horizon': forecast_horizon,
                'epochs': epochs
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def predict(self, recent_data, days=3):
        """Make predictions using the trained LSTM model"""
        if not self.is_trained:
            raise ValueError("Model not trained yet")
            
        try:
            # Prepare recent data
            feature_df = self.preprocessor.prepare_data(recent_data)
            
            if len(feature_df) < self.sequence_length:
                raise ValueError(f"Need at least {self.sequence_length} data points for prediction")
                
            # Take the most recent sequence
            numeric_cols = [col for col in self.preprocessor.feature_cols if col in feature_df.columns]
            recent_values = feature_df[numeric_cols].tail(self.sequence_length).values
            
            # Scale the input
            scaled_input = self.preprocessor.scaler.transform(recent_values)
            X_pred = scaled_input.reshape(1, self.sequence_length, -1)
            
            # Make prediction
            predictions_scaled = self.model.predict(X_pred, verbose=0)[0]
            
            # Create forecast for requested days
            last_timestamp = pd.to_datetime(feature_df['timestamp'].iloc[-1])
            forecasts = []
            
            for i in range(min(days, len(predictions_scaled))):
                forecast_date = last_timestamp + timedelta(days=i+1)
                predicted_aqi = max(0, min(500, float(predictions_scaled[i])))
                
                # Confidence decreases with forecast distance
                confidence = 'high' if i == 0 else 'medium' if i < 3 else 'low'
                
                forecasts.append({
                    'date': forecast_date.strftime('%Y-%m-%d'),
                    'aqi': round(predicted_aqi, 1),
                    'confidence': confidence
                })
                
            return forecasts
            
        except Exception as e:
            raise ValueError(f"Prediction failed: {str(e)}")

class ModelManager:
    """Manages multiple ML models and model selection"""
    
    def __init__(self):
        self.models = {
            'linear': SimpleLinearModel(),
            'lstm': LSTMModel()
        }
        self.active_model = 'linear'  # Default to simpler model
        
    def train_models(self, data):
        """Train all available models and select the best one"""
        results = {}
        
        # Train linear model (always works with small data)
        linear_result = self.models['linear'].train(data)
        results['linear'] = linear_result
        
        # Train LSTM if we have enough data
        if len(data) >= 20:  # Minimum for LSTM
            lstm_result = self.models['lstm'].train(data, epochs=20)  # Fewer epochs for speed
            results['lstm'] = lstm_result
            
            # Select best model based on performance
            if lstm_result['success'] and linear_result['success']:
                # Choose LSTM if it has lower MAE
                if lstm_result['final_mae'] < linear_result['mae']:
                    self.active_model = 'lstm'
                else:
                    self.active_model = 'linear'
            elif lstm_result['success']:
                self.active_model = 'lstm'
            else:
                self.active_model = 'linear'
        else:
            self.active_model = 'linear'
            
        return {
            'training_results': results,
            'selected_model': self.active_model,
            'model_count': len([r for r in results.values() if r['success']])
        }
    
    def predict(self, recent_data, days=3):
        """Make prediction using the active model"""
        if self.active_model not in self.models:
            raise ValueError(f"Active model '{self.active_model}' not available")
            
        model = self.models[self.active_model]
        if not model.is_trained:
            raise ValueError(f"Active model '{self.active_model}' is not trained")
            
        predictions = model.predict(recent_data, days)
        
        return {
            'model_used': self.active_model,
            'forecast': predictions,
            'generated_at': datetime.now().isoformat(),
            'forecast_days': len(predictions)
        }
    
    def save_models(self, filepath_prefix='models/aqi_model'):
        """Save trained models to disk"""
        saved_models = {}
        
        for model_name, model in self.models.items():
            if model.is_trained:
                try:
                    if model_name == 'linear':
                        # Save sklearn model
                        joblib.dump(model, f"{filepath_prefix}_{model_name}.pkl")
                    elif model_name == 'lstm':
                        # Save Keras model
                        model.model.save(f"{filepath_prefix}_{model_name}.h5")
                        # Save preprocessor separately
                        joblib.dump(model.preprocessor, f"{filepath_prefix}_{model_name}_preprocessor.pkl")
                    
                    saved_models[model_name] = f"{filepath_prefix}_{model_name}"
                except Exception as e:
                    print(f"Error saving {model_name} model: {e}")
                    
        return saved_models
    
    def load_models(self, filepath_prefix='models/aqi_model'):
        """Load trained models from disk"""
        loaded_models = {}
        
        try:
            # Try to load linear model
            linear_model = joblib.load(f"{filepath_prefix}_linear.pkl")
            self.models['linear'] = linear_model
            loaded_models['linear'] = True
        except:
            loaded_models['linear'] = False
            
        try:
            # Try to load LSTM model
            lstm_model = LSTMModel()
            lstm_model.model = tf.keras.models.load_model(f"{filepath_prefix}_lstm.h5")
            lstm_model.preprocessor = joblib.load(f"{filepath_prefix}_lstm_preprocessor.pkl")
            lstm_model.is_trained = True
            self.models['lstm'] = lstm_model
            loaded_models['lstm'] = True
        except:
            loaded_models['lstm'] = False
            
        return loaded_models
