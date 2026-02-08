import requests
import os
from typing import Optional
import logging
from models.eta_models import WeatherCondition

logger = logging.getLogger(__name__)

class WeatherService:
    def __init__(self):
        self.api_key = os.getenv("OPENWEATHER_API_KEY")
        self.base_url = "http://api.openweathermap.org/data/2.5/weather"
        
    async def get_weather_condition(self, latitude: float, longitude: float) -> WeatherCondition:
        """
        Get current weather condition for given coordinates
        Falls back to 'clear' if API is unavailable or no API key
        """
        if not self.api_key:
            logger.warning("No OpenWeather API key provided, using default weather condition")
            return WeatherCondition.CLEAR
            
        try:
            params = {
                'lat': latitude,
                'lon': longitude,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            response = requests.get(self.base_url, params=params, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            weather_main = data['weather'][0]['main'].lower()
            
            # Map OpenWeather conditions to our enum
            weather_mapping = {
                'clear': WeatherCondition.CLEAR,
                'clouds': WeatherCondition.CLEAR,  # Treat clouds as clear
                'rain': WeatherCondition.RAIN,
                'drizzle': WeatherCondition.RAIN,
                'thunderstorm': WeatherCondition.STORM,
                'snow': WeatherCondition.SNOW,
                'mist': WeatherCondition.FOG,
                'fog': WeatherCondition.FOG,
                'haze': WeatherCondition.FOG,
                'dust': WeatherCondition.FOG,
                'sand': WeatherCondition.FOG,
                'ash': WeatherCondition.FOG,
                'squall': WeatherCondition.STORM,
                'tornado': WeatherCondition.STORM
            }
            
            return weather_mapping.get(weather_main, WeatherCondition.CLEAR)
            
        except requests.RequestException as e:
            logger.error(f"Weather API request failed: {e}")
            return WeatherCondition.CLEAR
        except Exception as e:
            logger.error(f"Weather service error: {e}")
            return WeatherCondition.CLEAR
    
    def get_weather_impact_factor(self, weather_condition: WeatherCondition) -> float:
        """
        Get weather impact factor for travel time calculation
        Returns multiplier (1.0 = no impact, >1.0 = slower travel)
        """
        impact_factors = {
            WeatherCondition.CLEAR: 1.0,
            WeatherCondition.RAIN: 1.2,
            WeatherCondition.SNOW: 1.4,
            WeatherCondition.FOG: 1.3,
            WeatherCondition.STORM: 1.5
        }
        
        return impact_factors.get(weather_condition, 1.0)