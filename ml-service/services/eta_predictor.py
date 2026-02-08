import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging

from models.eta_models import ETARequest, ETAResponse, TrainingDataRequest, ModelMetrics
from services.weather_service import WeatherService
from services.traffic_service import TrafficService
from utils.distance_calculator import DistanceCalculator

logger = logging.getLogger(__name__)

class ETAPredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []
        self.model_version = "1.0.0"
        self.model_path = "models/eta_model.joblib"
        self.scaler_path = "models/scaler.joblib"
        self.encoders_path = "models/encoders.joblib"
        
        self.weather_service = WeatherService()
        self.traffic_service = TrafficService()
        self.distance_calculator = DistanceCalculator()
        
        # Ensure models directory exists
        os.makedirs("models", exist_ok=True)

    async def initialize(self):
        """Initialize the predictor with pre-trained model or create new one"""
        try:
            if os.path.exists(self.model_path):
                self.load_model()
                logger.info("Loaded existing ETA prediction model")
            else:
                await self.create_default_model()
                logger.info("Created default ETA prediction model")
        except Exception as e:
            logger.error(f"Failed to initialize ETA predictor: {e}")
            await self.create_default_model()

    def load_model(self):
        """Load pre-trained model and preprocessors"""
        self.model = joblib.load(self.model_path)
        self.scaler = joblib.load(self.scaler_path)
        self.label_encoders = joblib.load(self.encoders_path)

    def save_model(self):
        """Save trained model and preprocessors"""
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)
        joblib.dump(self.label_encoders, self.encoders_path)

    async def create_default_model(self):
        """Create a default model with synthetic training data"""
        # Generate synthetic training data for initial model
        synthetic_data = self._generate_synthetic_data(1000)
        
        # Train initial model
        X, y = self._prepare_features(synthetic_data)
        self.model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        )
        
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.save_model()

    def _generate_synthetic_data(self, n_samples: int) -> pd.DataFrame:
        """Generate synthetic training data for initial model"""
        np.random.seed(42)
        
        data = []
        for _ in range(n_samples):
            # Random coordinates (focusing on urban areas)
            origin_lat = np.random.uniform(40.0, 41.0)
            origin_lon = np.random.uniform(-74.5, -73.5)
            dest_lat = np.random.uniform(40.0, 41.0)
            dest_lon = np.random.uniform(-74.5, -73.5)
            
            # Calculate distance
            distance = self.distance_calculator.haversine_distance(
                origin_lat, origin_lon, dest_lat, dest_lon
            )
            
            # Generate realistic features
            vehicle_type = np.random.choice(['car', 'motorcycle', 'bus', 'truck'])
            weather = np.random.choice(['clear', 'rain', 'snow', 'fog'])
            traffic = np.random.choice(['low', 'moderate', 'high', 'severe'])
            hour = np.random.randint(0, 24)
            day_of_week = np.random.randint(0, 7)
            
            # Calculate base duration based on distance and conditions
            base_duration = distance * 2  # 2 minutes per km base
            
            # Apply modifiers
            if vehicle_type == 'motorcycle':
                base_duration *= 0.8
            elif vehicle_type == 'bus':
                base_duration *= 1.3
            elif vehicle_type == 'truck':
                base_duration *= 1.4
                
            if weather == 'rain':
                base_duration *= 1.2
            elif weather in ['snow', 'fog']:
                base_duration *= 1.4
                
            if traffic == 'moderate':
                base_duration *= 1.3
            elif traffic == 'high':
                base_duration *= 1.6
            elif traffic == 'severe':
                base_duration *= 2.0
                
            # Rush hour impact
            if hour in [7, 8, 9, 17, 18, 19]:
                base_duration *= 1.4
                
            # Add some noise
            base_duration += np.random.normal(0, base_duration * 0.1)
            base_duration = max(1, base_duration)  # Minimum 1 minute
            
            data.append({
                'distance_km': distance,
                'vehicle_type': vehicle_type,
                'weather_condition': weather,
                'traffic_level': traffic,
                'hour': hour,
                'day_of_week': day_of_week,
                'vehicle_capacity': np.random.randint(2, 8),
                'current_passengers': np.random.randint(0, 4),
                'driver_experience_months': np.random.randint(1, 120),
                'is_rush_hour': hour in [7, 8, 9, 17, 18, 19],
                'duration_minutes': base_duration
            })
        
        return pd.DataFrame(data)

    def _prepare_features(self, data: pd.DataFrame) -> tuple:
        """Prepare features for training or prediction"""
        # Define feature columns
        self.feature_columns = [
            'distance_km', 'hour', 'day_of_week', 'vehicle_capacity',
            'current_passengers', 'driver_experience_months', 'is_rush_hour',
            'vehicle_type_encoded', 'weather_condition_encoded', 'traffic_level_encoded'
        ]
        
        # Encode categorical variables
        categorical_cols = ['vehicle_type', 'weather_condition', 'traffic_level']
        for col in categorical_cols:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                data[f'{col}_encoded'] = self.label_encoders[col].fit_transform(data[col])
            else:
                # Handle unseen categories
                unique_values = set(data[col].unique())
                known_values = set(self.label_encoders[col].classes_)
                new_values = unique_values - known_values
                
                if new_values:
                    # Add new categories to encoder
                    all_values = list(known_values) + list(new_values)
                    self.label_encoders[col].classes_ = np.array(all_values)
                
                data[f'{col}_encoded'] = self.label_encoders[col].transform(data[col])
        
        # Convert boolean to int
        data['is_rush_hour'] = data['is_rush_hour'].astype(int)
        
        X = data[self.feature_columns]
        y = data['duration_minutes'] if 'duration_minutes' in data.columns else None
        
        return X, y

    async def predict(self, request: ETARequest) -> ETAResponse:
        """Predict ETA for a given request"""
        try:
            # Calculate distance
            distance = self.distance_calculator.haversine_distance(
                request.origin.latitude, request.origin.longitude,
                request.destination.latitude, request.destination.longitude
            )
            
            # Get current time if not provided
            departure_time = request.departure_time or datetime.now()
            
            # Get weather and traffic data
            weather_condition = request.weather_condition
            if not weather_condition:
                weather_condition = await self.weather_service.get_weather_condition(
                    request.origin.latitude, request.origin.longitude
                )
            
            traffic_level = request.traffic_level
            if not traffic_level:
                traffic_level = await self.traffic_service.get_traffic_level(
                    request.origin, request.destination, departure_time
                )
            
            # Prepare features
            features_data = {
                'distance_km': distance,
                'vehicle_type': request.vehicle_type.value,
                'weather_condition': weather_condition.value if hasattr(weather_condition, 'value') else str(weather_condition),
                'traffic_level': traffic_level.value if hasattr(traffic_level, 'value') else str(traffic_level),
                'hour': departure_time.hour,
                'day_of_week': departure_time.weekday(),
                'vehicle_capacity': request.vehicle_capacity,
                'current_passengers': request.current_passengers,
                'driver_experience_months': request.driver_experience_months or 12,
                'is_rush_hour': departure_time.hour in [7, 8, 9, 17, 18, 19]
            }
            
            df = pd.DataFrame([features_data])
            X, _ = self._prepare_features(df)
            X_scaled = self.scaler.transform(X)
            
            # Make prediction
            predicted_duration = self.model.predict(X_scaled)[0]
            predicted_duration = max(1, predicted_duration)  # Minimum 1 minute
            
            # Calculate arrival time
            estimated_arrival = departure_time + timedelta(minutes=predicted_duration)
            
            # Calculate confidence score (simplified)
            confidence = min(0.95, max(0.6, 1.0 - (predicted_duration * 0.01)))
            
            # Calculate impact factors
            weather_impact = self._calculate_weather_impact(weather_condition, distance)
            traffic_impact = self._calculate_traffic_impact(traffic_level, distance)
            capacity_impact = self._calculate_capacity_impact(
                request.current_passengers, request.vehicle_capacity
            )
            
            factors_considered = [
                "distance", "time_of_day", "day_of_week", "vehicle_type",
                "weather_condition", "traffic_level", "vehicle_capacity",
                "driver_experience"
            ]
            
            return ETAResponse(
                estimated_duration_minutes=round(predicted_duration, 1),
                estimated_arrival_time=estimated_arrival,
                confidence_score=round(confidence, 2),
                factors_considered=factors_considered,
                route_distance_km=round(distance, 2),
                weather_impact_minutes=weather_impact,
                traffic_impact_minutes=traffic_impact,
                capacity_impact_minutes=capacity_impact,
                model_version=self.model_version
            )
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            raise

    def _calculate_weather_impact(self, weather_condition, distance: float) -> float:
        """Calculate weather impact on travel time"""
        impact_multipliers = {
            'clear': 0,
            'rain': 0.2,
            'snow': 0.4,
            'fog': 0.3,
            'storm': 0.5
        }
        
        weather_str = weather_condition.value if hasattr(weather_condition, 'value') else str(weather_condition)
        multiplier = impact_multipliers.get(weather_str, 0)
        base_time = distance * 2  # 2 minutes per km
        return round(base_time * multiplier, 1)

    def _calculate_traffic_impact(self, traffic_level, distance: float) -> float:
        """Calculate traffic impact on travel time"""
        impact_multipliers = {
            'low': 0,
            'moderate': 0.3,
            'high': 0.6,
            'severe': 1.0
        }
        
        traffic_str = traffic_level.value if hasattr(traffic_level, 'value') else str(traffic_level)
        multiplier = impact_multipliers.get(traffic_str, 0)
        base_time = distance * 2
        return round(base_time * multiplier, 1)

    def _calculate_capacity_impact(self, current_passengers: int, vehicle_capacity: int) -> float:
        """Calculate vehicle capacity impact on travel time"""
        if vehicle_capacity == 0:
            return 0
        
        utilization = current_passengers / vehicle_capacity
        # Higher utilization can slow down due to more stops, boarding time, etc.
        impact_minutes = utilization * 2  # Up to 2 minutes impact
        return round(impact_minutes, 1)

    async def train_model(self, data: TrainingDataRequest) -> ModelMetrics:
        """Train the model with new data"""
        try:
            # Convert training data to DataFrame
            training_data = []
            for point in data.data_points:
                training_data.append({
                    'distance_km': self.distance_calculator.haversine_distance(
                        point.origin.latitude, point.origin.longitude,
                        point.destination.latitude, point.destination.longitude
                    ),
                    'vehicle_type': point.vehicle_type.value,
                    'weather_condition': point.weather_condition.value,
                    'traffic_level': point.traffic_level.value,
                    'hour': point.departure_time.hour,
                    'day_of_week': point.day_of_week,
                    'vehicle_capacity': point.vehicle_capacity,
                    'current_passengers': point.current_passengers,
                    'driver_experience_months': point.driver_experience_months,
                    'is_rush_hour': point.departure_time.hour in [7, 8, 9, 17, 18, 19],
                    'duration_minutes': point.actual_duration_minutes
                })
            
            df = pd.DataFrame(training_data)
            X, y = self._prepare_features(df)
            
            # Split data
            X_train, X_val, y_train, y_val = train_test_split(
                X, y, test_size=data.validation_split, random_state=42
            )
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_val_scaled = self.scaler.transform(X_val)
            
            # Train model
            self.model = GradientBoostingRegressor(
                n_estimators=150,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            )
            
            self.model.fit(X_train_scaled, y_train)
            
            # Make predictions
            y_pred = self.model.predict(X_val_scaled)
            
            # Calculate metrics
            mae = mean_absolute_error(y_val, y_pred)
            rmse = np.sqrt(mean_squared_error(y_val, y_pred))
            r2 = r2_score(y_val, y_pred)
            
            # Feature importance
            feature_importance = dict(zip(
                self.feature_columns,
                self.model.feature_importances_
            ))
            
            # Save model
            self.save_model()
            
            return ModelMetrics(
                mae=round(mae, 2),
                rmse=round(rmse, 2),
                r2_score=round(r2, 3),
                training_samples=len(X_train),
                validation_samples=len(X_val),
                feature_importance=feature_importance
            )
            
        except Exception as e:
            logger.error(f"Training error: {e}")
            raise

    async def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model"""
        return {
            "model_version": self.model_version,
            "model_type": type(self.model).__name__ if self.model else "None",
            "feature_columns": self.feature_columns,
            "model_loaded": self.model is not None,
            "last_updated": datetime.now().isoformat()
        }