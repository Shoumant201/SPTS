import pytest
import asyncio
from datetime import datetime
from models.eta_models import ETARequest, Location, VehicleType, WeatherCondition, TrafficLevel
from services.eta_predictor import ETAPredictor

@pytest.fixture
def eta_predictor():
    return ETAPredictor()

@pytest.fixture
def sample_request():
    return ETARequest(
        origin=Location(latitude=40.7128, longitude=-74.0060),  # NYC
        destination=Location(latitude=40.7589, longitude=-73.9851),  # Times Square
        vehicle_type=VehicleType.CAR,
        vehicle_capacity=4,
        current_passengers=2,
        departure_time=datetime(2024, 1, 15, 14, 30),
        driver_experience_months=24,
        weather_condition=WeatherCondition.CLEAR,
        traffic_level=TrafficLevel.MODERATE
    )

@pytest.mark.asyncio
async def test_eta_predictor_initialization(eta_predictor):
    """Test ETA predictor initialization"""
    await eta_predictor.initialize()
    assert eta_predictor.model is not None
    assert eta_predictor.scaler is not None

@pytest.mark.asyncio
async def test_eta_prediction(eta_predictor, sample_request):
    """Test ETA prediction functionality"""
    await eta_predictor.initialize()
    
    response = await eta_predictor.predict(sample_request)
    
    assert response.estimated_duration_minutes > 0
    assert response.confidence_score >= 0.6
    assert response.confidence_score <= 1.0
    assert response.route_distance_km > 0
    assert len(response.factors_considered) > 0
    assert response.model_version == eta_predictor.model_version

@pytest.mark.asyncio
async def test_weather_impact_calculation(eta_predictor):
    """Test weather impact calculation"""
    await eta_predictor.initialize()
    
    # Test different weather conditions
    clear_impact = eta_predictor._calculate_weather_impact(WeatherCondition.CLEAR, 10)
    rain_impact = eta_predictor._calculate_weather_impact(WeatherCondition.RAIN, 10)
    snow_impact = eta_predictor._calculate_weather_impact(WeatherCondition.SNOW, 10)
    
    assert clear_impact == 0
    assert rain_impact > clear_impact
    assert snow_impact > rain_impact

@pytest.mark.asyncio
async def test_traffic_impact_calculation(eta_predictor):
    """Test traffic impact calculation"""
    await eta_predictor.initialize()
    
    # Test different traffic levels
    low_impact = eta_predictor._calculate_traffic_impact(TrafficLevel.LOW, 10)
    moderate_impact = eta_predictor._calculate_traffic_impact(TrafficLevel.MODERATE, 10)
    high_impact = eta_predictor._calculate_traffic_impact(TrafficLevel.HIGH, 10)
    severe_impact = eta_predictor._calculate_traffic_impact(TrafficLevel.SEVERE, 10)
    
    assert low_impact == 0
    assert moderate_impact > low_impact
    assert high_impact > moderate_impact
    assert severe_impact > high_impact

@pytest.mark.asyncio
async def test_capacity_impact_calculation(eta_predictor):
    """Test vehicle capacity impact calculation"""
    await eta_predictor.initialize()
    
    # Test different capacity utilizations
    empty_impact = eta_predictor._calculate_capacity_impact(0, 4)
    half_impact = eta_predictor._calculate_capacity_impact(2, 4)
    full_impact = eta_predictor._calculate_capacity_impact(4, 4)
    
    assert empty_impact == 0
    assert half_impact > empty_impact
    assert full_impact > half_impact

def test_synthetic_data_generation(eta_predictor):
    """Test synthetic data generation"""
    data = eta_predictor._generate_synthetic_data(100)
    
    assert len(data) == 100
    assert 'distance_km' in data.columns
    assert 'duration_minutes' in data.columns
    assert 'vehicle_type' in data.columns
    assert data['duration_minutes'].min() >= 1  # Minimum 1 minute

@pytest.mark.asyncio
async def test_model_info(eta_predictor):
    """Test model info retrieval"""
    await eta_predictor.initialize()
    
    info = await eta_predictor.get_model_info()
    
    assert 'model_version' in info
    assert 'model_type' in info
    assert 'feature_columns' in info
    assert 'model_loaded' in info
    assert info['model_loaded'] is True