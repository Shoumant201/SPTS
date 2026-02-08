/**
 * Integration example for Node.js backend
 * Shows how to integrate the ML service with the main backend
 * Supports free alternatives: Mapbox, TomTom, OpenStreetMap
 */

const axios = require('axios');

class MLServiceClient {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
        this.client = axios.create({
            baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Predict ETA for a ride request
     */
    async predictETA(rideRequest) {
        try {
            const payload = {
                origin: {
                    latitude: rideRequest.pickup_latitude,
                    longitude: rideRequest.pickup_longitude
                },
                destination: {
                    latitude: rideRequest.destination_latitude,
                    longitude: rideRequest.destination_longitude
                },
                vehicle_type: rideRequest.vehicle_type || 'car',
                vehicle_capacity: rideRequest.vehicle_capacity || 4,
                current_passengers: rideRequest.current_passengers || 0,
                departure_time: rideRequest.departure_time || new Date().toISOString(),
                driver_experience_months: rideRequest.driver_experience_months || 12
            };

            const response = await this.client.post('/predict-eta', payload);
            return response.data;
        } catch (error) {
            console.error('ETA prediction failed:', error.message);
            // Fallback to simple distance-based calculation
            return this.fallbackETA(rideRequest);
        }
    }

    /**
     * Fallback ETA calculation when ML service is unavailable
     */
    fallbackETA(rideRequest) {
        const distance = this.calculateDistance(
            rideRequest.pickup_latitude,
            rideRequest.pickup_longitude,
            rideRequest.destination_latitude,
            rideRequest.destination_longitude
        );
        
        // Simple calculation: 2 minutes per km + 5 minutes base
        const estimatedMinutes = (distance * 2) + 5;
        const arrivalTime = new Date(Date.now() + estimatedMinutes * 60000);

        return {
            estimated_duration_minutes: estimatedMinutes,
            estimated_arrival_time: arrivalTime.toISOString(),
            confidence_score: 0.6,
            factors_considered: ['distance', 'fallback_calculation'],
            route_distance_km: distance,
            model_version: 'fallback'
        };
    }

    /**
     * Calculate distance using Haversine formula
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Train the model with completed trip data
     */
    async trainModel(tripData) {
        try {
            const trainingData = {
                data_points: tripData.map(trip => ({
                    origin: {
                        latitude: trip.pickup_latitude,
                        longitude: trip.pickup_longitude
                    },
                    destination: {
                        latitude: trip.destination_latitude,
                        longitude: trip.destination_longitude
                    },
                    actual_duration_minutes: trip.actual_duration_minutes,
                    vehicle_type: trip.vehicle_type,
                    vehicle_capacity: trip.vehicle_capacity,
                    current_passengers: trip.passenger_count,
                    departure_time: trip.departure_time,
                    arrival_time: trip.arrival_time,
                    driver_experience_months: trip.driver_experience_months,
                    weather_condition: trip.weather_condition || 'clear',
                    traffic_level: trip.traffic_level || 'moderate',
                    day_of_week: new Date(trip.departure_time).getDay(),
                    distance_km: trip.distance_km
                }))
            };

            const response = await this.client.post('/train-model', trainingData);
            return response.data;
        } catch (error) {
            console.error('Model training failed:', error.message);
            throw error;
        }
    }

    /**
     * Check ML service health
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }

    /**
     * Get model information
     */
    async getModelInfo() {
        try {
            const response = await this.client.get('/model-info');
            return response.data;
        } catch (error) {
            console.error('Failed to get model info:', error.message);
            return null;
        }
    }
}

// Usage example in Express.js route
async function handleRideRequest(req, res) {
    const mlClient = new MLServiceClient();
    
    try {
        // Get ETA prediction
        const etaPrediction = await mlClient.predictETA({
            pickup_latitude: req.body.pickup_latitude,
            pickup_longitude: req.body.pickup_longitude,
            destination_latitude: req.body.destination_latitude,
            destination_longitude: req.body.destination_longitude,
            vehicle_type: req.body.vehicle_type,
            vehicle_capacity: req.body.vehicle_capacity,
            current_passengers: req.body.current_passengers,
            driver_experience_months: req.body.driver_experience_months
        });

        // Store the prediction with the ride request
        const rideRequest = await createRideRequest({
            ...req.body,
            estimated_duration: etaPrediction.estimated_duration_minutes,
            estimated_arrival: etaPrediction.estimated_arrival_time,
            prediction_confidence: etaPrediction.confidence_score
        });

        res.json({
            success: true,
            ride_request: rideRequest,
            eta_prediction: etaPrediction
        });

    } catch (error) {
        console.error('Ride request failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process ride request'
        });
    }
}

// Periodic model training with completed trips
async function trainModelWithRecentTrips() {
    const mlClient = new MLServiceClient();
    
    try {
        // Get completed trips from last 24 hours
        const recentTrips = await getCompletedTrips(24); // hours
        
        if (recentTrips.length > 10) { // Only train if we have enough data
            const result = await mlClient.trainModel(recentTrips);
            console.log('Model training completed:', result);
        }
    } catch (error) {
        console.error('Periodic training failed:', error);
    }
}

// Schedule periodic training (run every 6 hours)
setInterval(trainModelWithRecentTrips, 6 * 60 * 60 * 1000);

module.exports = {
    MLServiceClient,
    handleRideRequest,
    trainModelWithRecentTrips
};