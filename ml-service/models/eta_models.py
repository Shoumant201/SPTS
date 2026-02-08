from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class VehicleType(str, Enum):
    CAR = "car"
    MOTORCYCLE = "motorcycle"
    BUS = "bus"
    TRUCK = "truck"

class WeatherCondition(str, Enum):
    CLEAR = "clear"
    RAIN = "rain"
    SNOW = "snow"
    FOG = "fog"
    STORM = "storm"

class TrafficLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    SEVERE = "severe"

class Location(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None

class ETARequest(BaseModel):
    origin: Location
    destination: Location
    vehicle_type: VehicleType = VehicleType.CAR
    vehicle_capacity: int = Field(default=4, ge=1, le=50)
    current_passengers: int = Field(default=0, ge=0)
    departure_time: Optional[datetime] = None
    driver_experience_months: Optional[int] = Field(default=12, ge=0)
    weather_condition: Optional[WeatherCondition] = None
    traffic_level: Optional[TrafficLevel] = None
    is_rush_hour: Optional[bool] = None
    day_of_week: Optional[int] = Field(None, ge=0, le=6)  # 0=Monday, 6=Sunday
    route_preferences: Optional[Dict[str, Any]] = None

class ETAResponse(BaseModel):
    estimated_duration_minutes: float
    estimated_arrival_time: datetime
    confidence_score: float = Field(..., ge=0, le=1)
    factors_considered: List[str]
    route_distance_km: float
    weather_impact_minutes: Optional[float] = None
    traffic_impact_minutes: Optional[float] = None
    capacity_impact_minutes: Optional[float] = None
    model_version: str

class TrainingDataPoint(BaseModel):
    origin: Location
    destination: Location
    actual_duration_minutes: float
    vehicle_type: VehicleType
    vehicle_capacity: int
    current_passengers: int
    departure_time: datetime
    arrival_time: datetime
    driver_experience_months: int
    weather_condition: WeatherCondition
    traffic_level: TrafficLevel
    day_of_week: int
    distance_km: float
    route_taken: Optional[str] = None
    delays_encountered: Optional[List[str]] = None

class TrainingDataRequest(BaseModel):
    data_points: List[TrainingDataPoint]
    model_name: Optional[str] = "eta_predictor_v1"
    validation_split: float = Field(default=0.2, ge=0.1, le=0.4)

class ModelMetrics(BaseModel):
    mae: float  # Mean Absolute Error
    rmse: float  # Root Mean Square Error
    r2_score: float  # R-squared
    training_samples: int
    validation_samples: int
    feature_importance: Dict[str, float]