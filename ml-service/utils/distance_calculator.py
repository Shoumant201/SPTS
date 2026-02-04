import math
from typing import Tuple

class DistanceCalculator:
    """
    Utility class for calculating distances between coordinates
    """
    
    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the great circle distance between two points 
        on the earth (specified in decimal degrees)
        Returns distance in kilometers
        """
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        
        return c * r
    
    @staticmethod
    def manhattan_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate Manhattan distance (city block distance) between two points
        Useful for urban areas with grid-like street patterns
        Returns approximate distance in kilometers
        """
        # Approximate conversion: 1 degree ≈ 111 km
        lat_diff = abs(lat2 - lat1) * 111
        lon_diff = abs(lon2 - lon1) * 111 * math.cos(math.radians((lat1 + lat2) / 2))
        
        return lat_diff + lon_diff
    
    @staticmethod
    def euclidean_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate Euclidean distance between two points
        Returns approximate distance in kilometers
        """
        # Approximate conversion: 1 degree ≈ 111 km
        lat_diff = (lat2 - lat1) * 111
        lon_diff = (lon2 - lon1) * 111 * math.cos(math.radians((lat1 + lat2) / 2))
        
        return math.sqrt(lat_diff**2 + lon_diff**2)
    
    @staticmethod
    def bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the bearing (direction) from point 1 to point 2
        Returns bearing in degrees (0-360)
        """
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        dlon = lon2 - lon1
        
        y = math.sin(dlon) * math.cos(lat2)
        x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
        
        bearing = math.atan2(y, x)
        bearing = math.degrees(bearing)
        bearing = (bearing + 360) % 360
        
        return bearing
    
    @staticmethod
    def is_within_radius(center_lat: float, center_lon: float, 
                        point_lat: float, point_lon: float, radius_km: float) -> bool:
        """
        Check if a point is within a certain radius of a center point
        """
        distance = DistanceCalculator.haversine_distance(
            center_lat, center_lon, point_lat, point_lon
        )
        return distance <= radius_km
    
    @staticmethod
    def get_midpoint(lat1: float, lon1: float, lat2: float, lon2: float) -> Tuple[float, float]:
        """
        Calculate the midpoint between two coordinates
        Returns (latitude, longitude) of midpoint
        """
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        dlon = lon2 - lon1
        
        bx = math.cos(lat2) * math.cos(dlon)
        by = math.cos(lat2) * math.sin(dlon)
        
        lat3 = math.atan2(
            math.sin(lat1) + math.sin(lat2),
            math.sqrt((math.cos(lat1) + bx) * (math.cos(lat1) + bx) + by * by)
        )
        lon3 = lon1 + math.atan2(by, math.cos(lat1) + bx)
        
        return math.degrees(lat3), math.degrees(lon3)