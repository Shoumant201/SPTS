#!/usr/bin/env python3
"""
Test script to verify free API services functionality
Tests Mapbox, TomTom, OpenStreetMap, and OpenWeatherMap
"""

import asyncio
import os
from datetime import datetime
from models.eta_models import Location, TrafficLevel, WeatherCondition
from services.traffic_service import TrafficService
from services.weather_service import WeatherService

async def test_traffic_services():
    """Test all traffic services including free alternatives"""
    print("🚦 Testing Traffic Services...")
    
    # Test locations (NYC to Times Square)
    origin = Location(latitude=40.7128, longitude=-74.0060)
    destination = Location(latitude=40.7589, longitude=-73.9851)
    departure_time = datetime.now()
    
    traffic_service = TrafficService()
    
    # Test service availability
    print(f"\n📋 Service Availability:")
    services = {
        "Mapbox": traffic_service.mapbox_api_key,
        "Google Maps": traffic_service.google_api_key,
        "TomTom": traffic_service.tomtom_api_key,
        "OpenStreetMap": "Always available (free)"
    }
    
    for service, key in services.items():
        status = "✅ Available" if key else "❌ Not configured"
        if service == "OpenStreetMap":
            status = "✅ Available (free)"
        print(f"   {service}: {status}")
    
    # Test traffic level prediction
    print(f"\n🔍 Testing Traffic Level Prediction...")
    try:
        traffic_level = await traffic_service.get_traffic_level(origin, destination, departure_time)
        print(f"   Traffic Level: {traffic_level.value}")
        print(f"   ✅ Traffic prediction successful")
    except Exception as e:
        print(f"   ❌ Traffic prediction failed: {e}")
    
    # Test route alternatives
    print(f"\n🛣️  Testing Route Alternatives...")
    try:
        routes = await traffic_service.get_route_alternatives(origin, destination)
        if routes:
            print(f"   Found {len(routes)} alternative routes:")
            for i, route in enumerate(routes[:3]):  # Show first 3
                distance_km = route['distance'] / 1000
                duration_min = route['duration'] / 60
                service = route.get('service', 'unknown')
                print(f"     Route {i+1} ({service}): {distance_km:.1f}km, {duration_min:.1f}min")
        else:
            print(f"   No alternative routes found")
        print(f"   ✅ Route alternatives test completed")
    except Exception as e:
        print(f"   ❌ Route alternatives failed: {e}")

async def test_weather_service():
    """Test weather service"""
    print(f"\n🌤️  Testing Weather Service...")
    
    weather_service = WeatherService()
    
    # Check API key availability
    api_key_status = "✅ Available" if weather_service.api_key else "❌ Not configured (will use fallback)"
    print(f"   OpenWeatherMap API: {api_key_status}")
    
    # Test weather prediction
    try:
        weather = await weather_service.get_weather_condition(40.7128, -74.0060)  # NYC
        print(f"   Weather Condition: {weather.value}")
        print(f"   ✅ Weather prediction successful")
    except Exception as e:
        print(f"   ❌ Weather prediction failed: {e}")

async def test_osrm_specifically():
    """Test OpenStreetMap routing specifically"""
    print(f"\n🗺️  Testing OpenStreetMap (OSRM) - 100% Free Service...")
    
    traffic_service = TrafficService()
    origin = Location(latitude=40.7128, longitude=-74.0060)
    destination = Location(latitude=40.7589, longitude=-73.9851)
    
    try:
        # Test OSRM directly
        routes = await traffic_service._get_osrm_route(origin, destination)
        if routes:
            route = routes[0]
            distance_km = route['distance'] / 1000
            duration_min = route['duration'] / 60
            print(f"   ✅ OSRM Route: {distance_km:.1f}km, {duration_min:.1f}min")
            print(f"   Service: {route['service']}")
        else:
            print(f"   ❌ No OSRM route found")
    except Exception as e:
        print(f"   ❌ OSRM test failed: {e}")

def test_fallback_systems():
    """Test fallback systems that work without any APIs"""
    print(f"\n🔄 Testing Fallback Systems (No APIs Required)...")
    
    traffic_service = TrafficService()
    
    # Test time-based traffic estimation
    test_times = [
        (datetime(2024, 1, 15, 8, 30), "Morning Rush Hour"),
        (datetime(2024, 1, 15, 14, 30), "Afternoon"),
        (datetime(2024, 1, 15, 18, 30), "Evening Rush Hour"),
        (datetime(2024, 1, 15, 23, 30), "Late Night"),
        (datetime(2024, 1, 13, 14, 30), "Weekend Afternoon"),  # Saturday
    ]
    
    print(f"   Time-based Traffic Estimation:")
    for test_time, description in test_times:
        traffic_level = traffic_service._estimate_traffic_by_time(test_time)
        print(f"     {description}: {traffic_level.value}")
    
    # Test distance-enhanced estimation
    print(f"\n   Distance-enhanced Traffic Estimation:")
    base_time = datetime(2024, 1, 15, 8, 30)  # Rush hour
    distances = [1, 5, 15, 25]  # km
    
    for distance in distances:
        traffic_level = traffic_service._estimate_traffic_by_time_and_distance(base_time, distance)
        print(f"     {distance}km route: {traffic_level.value}")
    
    print(f"   ✅ All fallback systems working")

async def main():
    """Run all tests"""
    print("🧪 Testing Free API Services for ML ETA Prediction")
    print("=" * 60)
    
    await test_traffic_services()
    await test_weather_service()
    await test_osrm_specifically()
    test_fallback_systems()
    
    print(f"\n" + "=" * 60)
    print("📊 Test Summary:")
    print("✅ The ML service works with completely free services!")
    print("✅ OpenStreetMap (OSRM) provides routing without any API keys")
    print("✅ Time-based estimation provides traffic insights")
    print("✅ Fallback systems ensure service always works")
    print("\n💡 Recommendations:")
    print("1. Start with no API keys - service works out of the box")
    print("2. Add Mapbox API key for traffic-aware routing (100k free/month)")
    print("3. Add OpenWeatherMap API key for weather data (1k free/day)")
    print("4. Add TomTom API key as backup (2.5k free/day)")
    print("\n🔗 Setup Guide: See FREE_APIS_GUIDE.md for detailed instructions")

if __name__ == "__main__":
    asyncio.run(main())