"""
Location-Aware LSTM Model for AQI Forecasting
Trains and evaluates LSTM model using geographic coordinates
"""
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tensorflow.keras.optimizers import Adam
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import matplotlib.pyplot as plt
import joblib
from typing import Tuple, List
import os
import json
from datetime import datetime
import logging
from config import *

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Set random seeds for reproducibility
np.random.seed(42)
tf.random.set_seed(42)

class LocationAwareLSTMModel:
    """Location-aware LSTM model for AQI forecasting"""
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_columns = []
        self.sequence_length = SEQUENCE_LENGTH
        self.history = None
        
        # Create model directory
        os.makedirs(MODEL_DIR, exist_ok=True)
        
        logger.info("🧠 Location-Aware LSTM Model initialized")
    
    def load_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """Load preprocessed sequences data"""
        
        logger.info("📊 Loading preprocessed data...")
        
        if not os.path.exists(SEQUENCES_FILE):
            logger.error(f"❌ Sequences file not found: {SEQUENCES_FILE}")
            logger.info("💡 Please run data_preprocessor.py first")
            return np.array([]), np.array([])
        
        try:
            # Load sequences
            data = np.load(SEQUENCES_FILE)
            X = data['X']
            y = data['y']
            self.feature_columns = data['feature_columns'].tolist()
            
            logger.info(f"✅ Data loaded successfully:")
            logger.info(f"   X shape: {X.shape}")
            logger.info(f"   y shape: {y.shape}")
            logger.info(f"   Features: {self.feature_columns}")
            
            return X, y
            
        except Exception as e:
            logger.error(f"❌ Error loading data: {str(e)}")
            return np.array([]), np.array([])
    
    def create_model(self, input_shape: tuple) -> Sequential:
        """Create LSTM model architecture"""
        
        logger.info(f"🏗️  Creating LSTM model with input shape: {input_shape}")
        
        model = Sequential([
            # First LSTM layer
            LSTM(128, return_sequences=True, input_shape=input_shape),
            BatchNormalization(),
            Dropout(0.3),
            
            # Second LSTM layer
            LSTM(96, return_sequences=True),
            BatchNormalization(),
            Dropout(0.3),
            
            # Third LSTM layer
            LSTM(64, return_sequences=False),
            BatchNormalization(),
            Dropout(0.2),
            
            # Dense layers
            Dense(32, activation='relu'),
            Dropout(0.2),
            Dense(16, activation='relu'),
            Dense(1, activation='linear')  # AQI output
        ])
        
        # Compile model
        optimizer = Adam(learning_rate=0.001)
        model.compile(
            optimizer=optimizer,
            loss='mse',
            metrics=['mae']  # Remove 'mse' from metrics to avoid duplication
        )
        
        logger.info("✅ Model architecture created")
        model.summary()
        
        return model
    
    def prepare_callbacks(self) -> list:
        """Prepare training callbacks"""
        
        callbacks = [
            # Early stopping
            EarlyStopping(
                monitor='val_loss',
                patience=15,
                restore_best_weights=True,
                verbose=1
            ),
            
            # Model checkpoint
            ModelCheckpoint(
                filepath=f"{MODEL_DIR}/best_lstm_model.keras",
                monitor='val_loss',
                save_best_only=True,
                verbose=1
            ),
            
            # Learning rate reduction
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=8,
                min_lr=1e-7,
                verbose=1
            )
        ]
        
        return callbacks
    
    def train_model(self, X: np.ndarray, y: np.ndarray, 
                   validation_split: float = 0.2,
                   epochs: int = 100,
                   batch_size: int = 32) -> dict:
        """Train the LSTM model"""
        
        logger.info("🚀 Starting model training...")
        start_time = datetime.now()
        
        # Split data
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=validation_split, random_state=42, shuffle=False
        )
        
        logger.info(f"📊 Data split:")
        logger.info(f"   Training: {X_train.shape[0]} samples")
        logger.info(f"   Validation: {X_val.shape[0]} samples")
        
        # Create model
        input_shape = (X.shape[1], X.shape[2])  # (sequence_length, features)
        self.model = self.create_model(input_shape)
        
        # Prepare callbacks
        callbacks = self.prepare_callbacks()
        
        # Train model
        logger.info("🏃‍♂️ Training in progress...")
        
        self.history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=1
        )
        
        end_time = datetime.now()
        training_duration = (end_time - start_time).total_seconds()
        
        # Load best model
        if os.path.exists(f"{MODEL_DIR}/best_lstm_model.keras"):
            self.model = load_model(f"{MODEL_DIR}/best_lstm_model.keras")
            logger.info("✅ Best model loaded from .keras format")
        elif os.path.exists(f"{MODEL_DIR}/best_lstm_model.h5"):
            # Fallback to H5 format with custom objects
            try:
                self.model = load_model(f"{MODEL_DIR}/best_lstm_model.h5", compile=False)
                # Recompile the model with the same configuration
                optimizer = Adam(learning_rate=0.001)
                self.model.compile(
                    optimizer=optimizer,
                    loss='mse',
                    metrics=['mae']
                )
                logger.info("✅ Best model loaded from .h5 format (recompiled)")
            except Exception as e:
                logger.warning(f"⚠️ Could not load saved model: {e}")
                logger.info("💡 Using current model state instead")
        else:
            logger.info("💡 No saved model found, using current model state")
        
        # Evaluate model
        train_loss = self.model.evaluate(X_train, y_train, verbose=0)
        val_loss = self.model.evaluate(X_val, y_val, verbose=0)
        
        # Make predictions for metrics
        y_train_pred = self.model.predict(X_train, verbose=0).flatten()
        y_val_pred = self.model.predict(X_val, verbose=0).flatten()
        
        # Calculate metrics (convert back from scaled values)
        train_mae = mean_absolute_error(y_train * 500, y_train_pred * 500)
        val_mae = mean_absolute_error(y_val * 500, y_val_pred * 500)
        train_r2 = r2_score(y_train, y_train_pred)
        val_r2 = r2_score(y_val, y_val_pred)
        
        training_results = {
            'training_duration': training_duration,
            'train_loss': train_loss[0],
            'val_loss': val_loss[0],
            'train_mae': train_mae,
            'val_mae': val_mae,
            'train_r2': train_r2,
            'val_r2': val_r2,
            'epochs_trained': len(self.history.history['loss'])
        }
        
        logger.info(f"🎉 Training completed!")
        logger.info(f"⏱️  Duration: {training_duration/60:.1f} minutes")
        logger.info(f"📊 Final metrics:")
        logger.info(f"   Training MAE: {train_mae:.2f} AQI units")
        logger.info(f"   Validation MAE: {val_mae:.2f} AQI units")
        logger.info(f"   Training R²: {train_r2:.4f}")
        logger.info(f"   Validation R²: {val_r2:.4f}")
        
        return training_results
    
    def plot_training_history(self):
        """Plot training history"""
        
        if self.history is None:
            logger.warning("⚠️ No training history available")
            return
        
        logger.info("📈 Plotting training history...")
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))
        
        # Loss plot
        ax1.plot(self.history.history['loss'], label='Training Loss')
        ax1.plot(self.history.history['val_loss'], label='Validation Loss')
        ax1.set_title('Model Loss')
        ax1.set_xlabel('Epoch')
        ax1.set_ylabel('Loss')
        ax1.legend()
        ax1.grid(True)
        
        # MAE plot
        ax2.plot(self.history.history['mae'], label='Training MAE')
        ax2.plot(self.history.history['val_mae'], label='Validation MAE')
        ax2.set_title('Model MAE')
        ax2.set_xlabel('Epoch')
        ax2.set_ylabel('MAE')
        ax2.legend()
        ax2.grid(True)
        
        plt.tight_layout()
        plot_path = f"{MODEL_DIR}/training_history.png"
        plt.savefig(plot_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"📊 Training history plot saved: {plot_path}")
    
    def evaluate_model(self, X_test: np.ndarray, y_test: np.ndarray) -> dict:
        """Evaluate model performance"""
        
        logger.info("📊 Evaluating model performance...")
        
        # Make predictions
        y_pred = self.model.predict(X_test, verbose=0).flatten()
        
        # Convert back from scaled values
        y_test_actual = y_test * 500
        y_pred_actual = y_pred * 500
        
        # Calculate metrics
        mae = mean_absolute_error(y_test_actual, y_pred_actual)
        mse = mean_squared_error(y_test_actual, y_pred_actual)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test_actual, y_pred_actual)
        
        # Calculate accuracy within ranges
        errors = np.abs(y_test_actual - y_pred_actual)
        accuracy_10 = np.mean(errors <= 10) * 100  # Within 10 AQI units
        accuracy_20 = np.mean(errors <= 20) * 100  # Within 20 AQI units
        accuracy_30 = np.mean(errors <= 30) * 100  # Within 30 AQI units
        
        evaluation_results = {
            'mae': mae,
            'mse': mse,
            'rmse': rmse,
            'r2_score': r2,
            'accuracy_10': accuracy_10,
            'accuracy_20': accuracy_20,
            'accuracy_30': accuracy_30,
            'mean_actual_aqi': np.mean(y_test_actual),
            'mean_predicted_aqi': np.mean(y_pred_actual)
        }
        
        logger.info(f"📊 Model evaluation results:")
        logger.info(f"   MAE: {mae:.2f} AQI units")
        logger.info(f"   RMSE: {rmse:.2f} AQI units")
        logger.info(f"   R² Score: {r2:.4f}")
        logger.info(f"   Accuracy (±10 AQI): {accuracy_10:.1f}%")
        logger.info(f"   Accuracy (±20 AQI): {accuracy_20:.1f}%")
        logger.info(f"   Accuracy (±30 AQI): {accuracy_30:.1f}%")
        
        return evaluation_results
    
    def predict_aqi(self, input_sequence: np.ndarray) -> float:
        """Predict AQI for a given input sequence"""
        
        if self.model is None:
            logger.error("❌ Model not trained or loaded")
            return None
        
        # Ensure input shape is correct
        if len(input_sequence.shape) == 2:
            input_sequence = input_sequence.reshape(1, input_sequence.shape[0], input_sequence.shape[1])
        
        # Make prediction
        prediction = self.model.predict(input_sequence, verbose=0)
        
        # Convert back from scaled value
        aqi_prediction = prediction[0][0] * 500
        
        return float(aqi_prediction)
    
    def predict_future_aqi(self, location_data: pd.DataFrame, 
                          lat: float, lon: float, 
                          steps_ahead: int = 24) -> List[float]:
        """Predict future AQI values for a specific location"""
        
        logger.info(f"🔮 Predicting {steps_ahead} steps ahead for location ({lat:.4f}, {lon:.4f})")
        
        if self.model is None:
            logger.error("❌ Model not trained or loaded")
            return []
        
        # Prepare initial sequence from location data
        location_data = location_data.sort_values('datetime').tail(self.sequence_length)
        
        if len(location_data) < self.sequence_length:
            logger.error(f"❌ Insufficient data: {len(location_data)} < {self.sequence_length}")
            return []
        
        # Extract features
        features = location_data[self.feature_columns].values
        
        # Scale features (assuming scaler is available)
        if os.path.exists(f"{MODEL_DIR}/feature_scaler.joblib"):
            scaler = joblib.load(f"{MODEL_DIR}/feature_scaler.joblib")
            features = scaler.transform(features)
        
        predictions = []
        current_sequence = features.copy()
        
        for step in range(steps_ahead):
            # Reshape for prediction
            input_seq = current_sequence.reshape(1, self.sequence_length, -1)
            
            # Predict next value
            next_aqi = self.predict_aqi(input_seq)
            predictions.append(next_aqi)
            
            # Update sequence for next prediction
            # (This is simplified - in practice, you'd need to update other features too)
            # For now, we'll just shift the sequence and repeat the last features
            current_sequence = np.roll(current_sequence, -1, axis=0)
            # Keep other features the same, only AQI would be predicted
        
        return predictions
    
    def save_model(self, model_name: str = "location_aware_lstm_model"):
        """Save trained model and metadata"""
        
        if self.model is None:
            logger.error("❌ No model to save")
            return
        
        logger.info("💾 Saving model...")
        
        # Save model
        model_path = f"{MODEL_DIR}/{model_name}.h5"
        self.model.save(model_path)
        
        # Save metadata
        metadata = {
            'model_type': 'LocationAwareLSTM',
            'sequence_length': self.sequence_length,
            'feature_columns': self.feature_columns,
            'model_path': model_path,
            'created_at': datetime.now().isoformat(),
            'tensorflow_version': tf.__version__
        }
        
        metadata_path = f"{MODEL_DIR}/{model_name}_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"✅ Model saved:")
        logger.info(f"   Model: {model_path}")
        logger.info(f"   Metadata: {metadata_path}")
    
    def load_model(self, model_name: str = "location_aware_lstm_model"):
        """Load trained model and metadata"""
        
        logger.info(f"📥 Loading model: {model_name}")
        
        model_path = f"{MODEL_DIR}/{model_name}.h5"
        metadata_path = f"{MODEL_DIR}/{model_name}_metadata.json"
        
        if not os.path.exists(model_path):
            logger.error(f"❌ Model file not found: {model_path}")
            return False
        
        try:
            # Load model
            self.model = load_model(model_path)
            
            # Load metadata
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                
                self.sequence_length = metadata.get('sequence_length', SEQUENCE_LENGTH)
                self.feature_columns = metadata.get('feature_columns', [])
            
            logger.info("✅ Model loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error loading model: {str(e)}")
            return False

def main():
    """Main training pipeline"""
    
    logger.info("🚀 Starting Location-Aware LSTM Training Pipeline")
    
    # Initialize model
    lstm_model = LocationAwareLSTMModel()
    
    # Load data
    X, y = lstm_model.load_data()
    
    if len(X) == 0:
        logger.error("❌ No data available for training")
        return
    
    # Split into train and test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=False
    )
    
    logger.info(f"📊 Final data split:")
    logger.info(f"   Training: {X_train.shape[0]} sequences")
    logger.info(f"   Testing: {X_test.shape[0]} sequences")
    
    # Train model
    training_results = lstm_model.train_model(X_train, y_train)
    
    # Plot training history
    lstm_model.plot_training_history()
    
    # Evaluate on test set
    evaluation_results = lstm_model.evaluate_model(X_test, y_test)
    
    # Save model
    lstm_model.save_model()
    
    # Save results
    results = {
        'training_results': training_results,
        'evaluation_results': evaluation_results,
        'data_info': {
            'total_sequences': len(X),
            'training_sequences': len(X_train),
            'test_sequences': len(X_test),
            'sequence_length': lstm_model.sequence_length,
            'feature_columns': lstm_model.feature_columns
        }
    }
    
    results_path = f"{MODEL_DIR}/training_results.json"
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    logger.info(f"💾 Results saved: {results_path}")
    logger.info("🎉 LSTM training pipeline completed successfully!")

if __name__ == "__main__":
    main()
