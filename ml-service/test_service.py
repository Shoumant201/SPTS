#!/usr/bin/env python3
"""
Test script to verify ML service functionality
"""

import asyncio
import json
from datetime import datetime
from models.eta_models import ETARequest, Location, VehicleType, WeatherCondition, TrafficLevel
from services.eta_predictor import ETAPredictor

async def test_eta_prediction():
    """Test ETA prediction functionality"""
    print("Testing ETA Prediction Service...")
    
    # Initialize predictor
    predictor = ETAPredictor()
    await predictor.initialize()
    print("✓ ETA Predictor initialized")
    
    # Create test request
    request = ETARequest(
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
    
    # Make prediction
    response = await predictor.predict(request)
    print("✓ ETA prediction completed")
    
    # Display results
    print(f"\n📍 Route: NYC to Times Square")
    print(f"🚗 Vehicle: {request.vehicle_type.value} (capacity: {request.vehicle_capacity}, passengers: {request.current_passengers})")
    print(f"🌤️  Weather: {request.weather_condition.value}")
    print(f"🚦 Traffic: {request.traffic_level.value}")
    print(f"⏰ Departure: {request.departure_time}")
    print(f"\n📊 PREDICTION RESULTS:")
    print(f"   Duration: {response.estimated_duration_minutes:.1f} minutes")
    print(f"   Arrival: {response.estimated_arrival_time}")
    print(f"   Distance: {response.route_distance_km:.2f} km")
    print(f"   Confidence: {response.confidence_score:.2f}")
    print(f"   Model Version: {response.model_version}")
    
    if response.weather_impact_minutes:
        print(f"   Weather Impact: +{response.weather_impact_minutes:.1f} minutes")
    if response.traffic_impact_minutes:
        print(f"   Traffic Impact: +{response.traffic_impact_minutes:.1f} minutes")
    if response.capacity_impact_minutes:
        print(f"   Capacity Impact: +{response.capacity_impact_minutes:.1f} minutes")
    
    print(f"\n🔍 Factors Considered: {', '.join(response.factors_considered)}")
    
    # Test different scenarios
    print(f"\n🧪 Testing Different Scenarios...")
    
    scenarios = [
        ("Rainy Weather", {"weather_condition": WeatherCondition.RAIN}),
        ("Heavy Traffic", {"traffic_level": TrafficLevel.HIGH}),
        ("Full Vehicle", {"current_passengers": 4}),
        ("Motorcycle", {"vehicle_type": VehicleType.MOTORCYCLE, "vehicle_capacity": 2, "current_passengers": 1}),
        ("Rush Hour", {"departure_time": datetime(2024, 1, 15, 8, 30)}),
    ]
    
    for scenario_name, changes in scenarios:
        # Create modified request
        request_dict = request.model_dump()
        request_dict.update(changes)
        modified_request = ETARequest(**request_dict)
        
        # Make prediction
        scenario_response = await predictor.predict(modified_request)
        
        print(f"   {scenario_name}: {scenario_response.estimated_duration_minutes:.1f} min "
              f"(confidence: {scenario_response.confidence_score:.2f})")
    
    print(f"\n✅ All tests completed successfully!")

async def test_model_info():
    """Test model information retrieval"""
    print(f"\n📋 Model Information:")
    predictor = ETAPredictor()
    await predictor.initialize()
    
    info = await predictor.get_model_info()
    for key, value in info.items():
        print(f"   {key}: {value}")

if __name__ == "__main__":
    asyncio.run(test_eta_prediction())
    asyncio.run(test_model_info())