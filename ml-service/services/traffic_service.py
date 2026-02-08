import requests
import os
from datetime import datetime
from typing import Optional, Dict, Any
import logging
from models.eta_models import TrafficLevel, Location

logger = logging.getLogger(__name__)

class TrafficService:
    def __init__(self):
        # API keys for different services
        self.google_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        self.mapbox_api_key = os.getenv("MAPBOX_API_KEY")
        self.tomtom_api_key = os.getenv("TOMTOM_API_KEY")
        
        # API endpoints
        self.google_url = "https://maps.googleapis.com/maps/api/directions/json"
        self.mapbox_url = "https://api.mapbox.com/directions/v5/mapbox/driving-traffic"
        self.tomtom_url = "https://api.tomtom.com/routing/1/calculateRoute"
        
        # OpenStreetMap routing (free but no real-time traffic)
        self.osrm_url = "http://router.project-osrm.org/route/v1/driving"
        
    async def get_traffic_level(self, origin: Location, destination: Location, 
                              departure_time: datetime) -> TrafficLevel:
        """
        Get traffic level for a route at a specific time
        Tries multiple services in order of preference
        """
        # Try services in order of preference
        services = [
            ("mapbox", self._get_traffic_from_mapbox),
            ("google", self._get_traffic_from_google),
            ("tomtom", self._get_traffic_from_tomtom),
            ("osrm", self._get_traffic_from_osrm)
        ]
        
        for service_name, service_func in services:
            try:
                if self._is_service_available(service_name):
                    traffic_level = await service_func(origin, destination, departure_time)
                    logger.info(f"Traffic data obtained from {service_name}")
                    return traffic_level
            except Exception as e:
                logger.warning(f"{service_name} traffic service failed: {e}")
                continue
        
        # Fallback to time-based estimation
        logger.info("Using time-based traffic estimation")
        return self._estimate_traffic_by_time(departure_time)
    
    def _is_service_available(self, service_name: str) -> bool:
        """Check if a service is available based on API keys"""
        service_keys = {
            "google": self.google_api_key,
            "mapbox": self.mapbox_api_key,
            "tomtom": self.tomtom_api_key,
            "osrm": True  # OSRM is always available (free)
        }
        return bool(service_keys.get(service_name))
    
    async def _get_traffic_from_mapbox(self, origin: Location, destination: Location, 
                                     departure_time: datetime) -> TrafficLevel:
        """Get traffic data from Mapbox Directions API (FREE tier available)"""
        coordinates = f"{origin.longitude},{origin.latitude};{destination.longitude},{destination.latitude}"
        url = f"{self.mapbox_url}/{coordinates}"
        
        params = {
            'access_token': self.mapbox_api_key,
            'geometries': 'geojson',
            'annotations': 'duration,distance',
            'overview': 'simplified'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data['code'] != 'Ok' or not data['routes']:
            raise Exception(f"Mapbox API returned code: {data['code']}")
        
        route = data['routes'][0]
        duration = route['duration']  # seconds
        distance = route['distance']  # meters
        
        # Calculate expected duration without traffic (rough estimate)
        # Assume average speed of 50 km/h in urban areas
        expected_duration = (distance / 1000) * 72  # seconds (50 km/h = 72 seconds per km)
        
        # Calculate traffic ratio
        traffic_ratio = duration / expected_duration if expected_duration > 0 else 1.0
        
        return self._ratio_to_traffic_level(traffic_ratio)
    
    async def _get_traffic_from_google(self, origin: Location, destination: Location, 
                                     departure_time: datetime) -> TrafficLevel:
        """Get traffic data from Google Maps API"""
        params = {
            'origin': f"{origin.latitude},{origin.longitude}",
            'destination': f"{destination.latitude},{destination.longitude}",
            'departure_time': int(departure_time.timestamp()),
            'traffic_model': 'best_guess',
            'key': self.google_api_key
        }
        
        response = requests.get(self.google_url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data['status'] != 'OK' or not data['routes']:
            raise Exception(f"Google API returned status: {data['status']}")
        
        route = data['routes'][0]
        leg = route['legs'][0]
        
        # Get duration in traffic vs normal duration
        duration_in_traffic = leg.get('duration_in_traffic', {}).get('value', 0)
        normal_duration = leg.get('duration', {}).get('value', 0)
        
        if duration_in_traffic == 0 or normal_duration == 0:
            return self._estimate_traffic_by_time(departure_time)
        
        # Calculate traffic ratio
        traffic_ratio = duration_in_traffic / normal_duration
        
        return self._ratio_to_traffic_level(traffic_ratio)
    
    async def _get_traffic_from_tomtom(self, origin: Location, destination: Location, 
                                     departure_time: datetime) -> TrafficLevel:
        """Get traffic data from TomTom API (has free tier)"""
        route_points = f"{origin.latitude},{origin.longitude}:{destination.latitude},{destination.longitude}"
        
        params = {
            'key': self.tomtom_api_key,
            'traffic': 'true',
            'departAt': departure_time.strftime('%Y-%m-%dT%H:%M:%S'),
            'routeType': 'fastest'
        }
        
        url = f"{self.tomtom_url}/{route_points}/json"
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if 'routes' not in data or not data['routes']:
            raise Exception("TomTom API returned no routes")
        
        route = data['routes'][0]
        summary = route['summary']
        
        # TomTom provides traffic delay in seconds
        traffic_delay_sec = summary.get('trafficDelayInSeconds', 0)
        travel_time_sec = summary.get('travelTimeInSeconds', 1)
        
        # Calculate traffic ratio
        traffic_ratio = (travel_time_sec + traffic_delay_sec) / travel_time_sec
        
        return self._ratio_to_traffic_level(traffic_ratio)
    
    async def _get_traffic_from_osrm(self, origin: Location, destination: Location, 
                                   departure_time: datetime) -> TrafficLevel:
        """
        Get route data from OpenStreetMap Routing Machine (FREE)
        Note: OSRM doesn't provide real-time traffic, so we estimate based on time
        """
        coordinates = f"{origin.longitude},{origin.latitude};{destination.longitude},{destination.latitude}"
        url = f"{self.osrm_url}/{coordinates}"
        
        params = {
            'overview': 'false',
            'steps': 'false'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data['code'] != 'Ok' or not data['routes']:
            raise Exception(f"OSRM API returned code: {data['code']}")
        
        # OSRM doesn't provide traffic data, so we use time-based estimation
        # but we can use the route distance for better estimation
        route = data['routes'][0]
        distance_meters = route['distance']
        duration_seconds = route['duration']
        
        # Enhance time-based estimation with actual route distance
        return self._estimate_traffic_by_time_and_distance(departure_time, distance_meters / 1000)
    
    def _ratio_to_traffic_level(self, traffic_ratio: float) -> TrafficLevel:
        """Convert traffic ratio to traffic level"""
        if traffic_ratio <= 1.1:
            return TrafficLevel.LOW
        elif traffic_ratio <= 1.3:
            return TrafficLevel.MODERATE
        elif traffic_ratio <= 1.6:
            return TrafficLevel.HIGH
        else:
            return TrafficLevel.SEVERE
    
    def _estimate_traffic_by_time(self, departure_time: datetime) -> TrafficLevel:
        """
        Estimate traffic level based on time of day and day of week
        """
        hour = departure_time.hour
        day_of_week = departure_time.weekday()  # 0=Monday, 6=Sunday
        
        # Weekend traffic patterns
        if day_of_week >= 5:  # Saturday or Sunday
            if 10 <= hour <= 14:  # Weekend afternoon
                return TrafficLevel.MODERATE
            elif 18 <= hour <= 20:  # Weekend evening
                return TrafficLevel.MODERATE
            else:
                return TrafficLevel.LOW
        
        # Weekday traffic patterns
        if 7 <= hour <= 9:  # Morning rush hour
            return TrafficLevel.HIGH
        elif 17 <= hour <= 19:  # Evening rush hour
            return TrafficLevel.HIGH
        elif 6 <= hour <= 7 or 9 <= hour <= 11:  # Pre/post morning rush
            return TrafficLevel.MODERATE
        elif 15 <= hour <= 17 or 19 <= hour <= 21:  # Pre/post evening rush
            return TrafficLevel.MODERATE
        elif 22 <= hour <= 23 or 0 <= hour <= 5:  # Late night/early morning
            return TrafficLevel.LOW
        else:  # Mid-day
            return TrafficLevel.MODERATE
    
    def _estimate_traffic_by_time_and_distance(self, departure_time: datetime, distance_km: float) -> TrafficLevel:
        """
        Enhanced traffic estimation using time and distance
        """
        base_traffic = self._estimate_traffic_by_time(departure_time)
        
        # Adjust based on distance (longer routes more likely to encounter traffic)
        if distance_km > 20:  # Long distance routes
            if base_traffic == TrafficLevel.LOW:
                return TrafficLevel.MODERATE
            elif base_traffic == TrafficLevel.MODERATE:
                return TrafficLevel.HIGH
        elif distance_km < 2:  # Very short routes
            if base_traffic == TrafficLevel.HIGH:
                return TrafficLevel.MODERATE
            elif base_traffic == TrafficLevel.SEVERE:
                return TrafficLevel.HIGH
        
        return base_traffic
    
    def get_traffic_impact_factor(self, traffic_level: TrafficLevel) -> float:
        """
        Get traffic impact factor for travel time calculation
        Returns multiplier (1.0 = no impact, >1.0 = slower travel)
        """
        impact_factors = {
            TrafficLevel.LOW: 1.0,
            TrafficLevel.MODERATE: 1.3,
            TrafficLevel.HIGH: 1.6,
            TrafficLevel.SEVERE: 2.0
        }
        
        return impact_factors.get(traffic_level, 1.0)
    
    async def get_route_alternatives(self, origin: Location, destination: Location) -> list:
        """
        Get alternative routes from available services
        """
        # Try services in order of preference for route alternatives
        if self.mapbox_api_key:
            try:
                return await self._get_mapbox_alternatives(origin, destination)
            except Exception as e:
                logger.warning(f"Mapbox alternatives failed: {e}")
        
        if self.google_api_key:
            try:
                return await self._get_google_alternatives(origin, destination)
            except Exception as e:
                logger.warning(f"Google alternatives failed: {e}")
        
        # OSRM fallback (single route only)
        try:
            return await self._get_osrm_route(origin, destination)
        except Exception as e:
            logger.error(f"OSRM route request failed: {e}")
            return []
    
    async def _get_mapbox_alternatives(self, origin: Location, destination: Location) -> list:
        """Get alternative routes from Mapbox"""
        coordinates = f"{origin.longitude},{origin.latitude};{destination.longitude},{destination.latitude}"
        url = f"{self.mapbox_url}/{coordinates}"
        
        params = {
            'access_token': self.mapbox_api_key,
            'alternatives': 'true',
            'geometries': 'geojson',
            'overview': 'simplified'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data['code'] != 'Ok':
            return []
        
        routes = []
        for i, route in enumerate(data['routes']):
            routes.append({
                'distance': route['distance'],  # meters
                'duration': route['duration'],  # seconds
                'summary': f'Mapbox Route {i+1}',
                'service': 'mapbox'
            })
        
        return routes
    
    async def _get_google_alternatives(self, origin: Location, destination: Location) -> list:
        """Get alternative routes from Google Maps"""
        params = {
            'origin': f"{origin.latitude},{origin.longitude}",
            'destination': f"{destination.latitude},{destination.longitude}",
            'alternatives': 'true',
            'key': self.google_api_key
        }
        
        response = requests.get(self.google_url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data['status'] != 'OK':
            return []
        
        routes = []
        for route in data['routes']:
            leg = route['legs'][0]
            routes.append({
                'distance': leg['distance']['value'],  # meters
                'duration': leg['duration']['value'],  # seconds
                'summary': route.get('summary', 'Google Route'),
                'service': 'google'
            })
        
        return routes
    
    async def _get_osrm_route(self, origin: Location, destination: Location) -> list:
        """Get single route from OSRM"""
        coordinates = f"{origin.longitude},{origin.latitude};{destination.longitude},{destination.latitude}"
        url = f"{self.osrm_url}/{coordinates}"
        
        params = {
            'overview': 'false',
            'steps': 'false'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data['code'] != 'Ok' or not data['routes']:
            return []
        
        route = data['routes'][0]
        return [{
            'distance': route['distance'],  # meters
            'duration': route['duration'],  # seconds
            'summary': 'OpenStreetMap Route',
            'service': 'osrm'
        }]