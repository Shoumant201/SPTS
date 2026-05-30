import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { usePassengerLocation } from '../../hooks/usePassengerLocation';
import { useNearbyBuses } from '../../hooks/useNearbyBuses';
import { NearbyBus } from '../../services/api/buses';

interface LiveBusMapScreenProps {
  routeId?: string;
  onBack?: () => void;
}

const LiveBusMapScreen: React.FC<LiveBusMapScreenProps> = ({ routeId, onBack }) => {
  const mapRef = useRef<MapView>(null);
  const { location } = usePassengerLocation();
  const { buses, loading, refresh } = useNearbyBuses({
    latitude: location.latitude,
    longitude: location.longitude,
    radius: 10, // Larger radius for map view
    enabled: !location.loading && !location.error,
    refreshInterval: 15000, // Refresh every 15 seconds for map
  });

  const [selectedBus, setSelectedBus] = useState<NearbyBus | null>(null);
  const [showUserLocation, setShowUserLocation] = useState(true);

  // Filter buses by route if routeId is provided
  const displayBuses = routeId
    ? buses.filter((bus) => bus.route.id === routeId)
    : buses;

  useEffect(() => {
    // Fit map to show all buses and user location
    if (mapRef.current && displayBuses.length > 0 && !location.loading) {
      const coordinates = [
        ...displayBuses.map((bus) => ({
          latitude: bus.location.latitude,
          longitude: bus.location.longitude,
        })),
      ];

      if (showUserLocation && location.latitude !== 0) {
        coordinates.push({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      }

      if (coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      }
    }
  }, [displayBuses.length, location.loading]);

  const handleBusPress = (bus: NearbyBus) => {
    setSelectedBus(bus);
    
    // Center map on selected bus
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: bus.location.latitude,
        longitude: bus.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handleMyLocation = () => {
    if (location.latitude !== 0 && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  };

  const getBusColor = (bus: NearbyBus): string => {
    // Color based on ETA
    if (bus.eta <= 5) return '#4CAF50'; // Green - arriving soon
    if (bus.eta <= 15) return '#FF9800'; // Orange - moderate wait
    return '#2196F3'; // Blue - longer wait
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      {location.loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={{
            latitude: location.latitude || 27.7172,
            longitude: location.longitude || 85.324,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={showUserLocation}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
        >
          {/* Bus Markers */}
          {displayBuses.map((bus) => (
            <Marker
              key={bus.id}
              coordinate={{
                latitude: bus.location.latitude,
                longitude: bus.location.longitude,
              }}
              onPress={() => handleBusPress(bus)}
              pinColor={getBusColor(bus)}
            >
              <View style={[styles.busMarker, { backgroundColor: getBusColor(bus) }]}>
                <Text style={styles.busMarkerText}>🚌</Text>
                <Text style={styles.busMarkerNumber}>
                  {bus.route.routeNumber || bus.vehicle.plateNumber.slice(-3)}
                </Text>
              </View>
            </Marker>
          ))}

          {/* Route polylines for selected bus */}
          {selectedBus && selectedBus.route.stops && selectedBus.route.stops.length > 1 && (
            <Polyline
              coordinates={selectedBus.route.stops.map((stop) => ({
                latitude: stop.lat,
                longitude: stop.lng,
              }))}
              strokeColor="#007AFF"
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          )}

          {/* Route stop markers for selected bus */}
          {selectedBus &&
            selectedBus.route.stops?.map((stop, index) => (
              <Marker
                key={stop.id}
                coordinate={{ latitude: stop.lat, longitude: stop.lng }}
                pinColor={index === 0 ? '#4CAF50' : index === selectedBus.route.stops!.length - 1 ? '#f44336' : '#FFC107'}
              >
                <View style={styles.stopMarker}>
                  <Text style={styles.stopMarkerText}>{index + 1}</Text>
                </View>
              </Marker>
            ))}
        </MapView>
      )}

      {/* Top Controls */}
      <View style={styles.topControls}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {routeId ? 'Route Buses' : 'Live Bus Tracking'}
          </Text>
          <Text style={styles.subtitle}>
            {displayBuses.length} {displayBuses.length === 1 ? 'bus' : 'buses'} nearby
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={refresh} disabled={loading}>
          <Text style={styles.refreshButtonText}>{loading ? '⟳' : '↻'}</Text>
        </TouchableOpacity>
      </View>

      {/* My Location Button */}
      <TouchableOpacity style={styles.myLocationButton} onPress={handleMyLocation}>
        <Text style={styles.myLocationIcon}>📍</Text>
      </TouchableOpacity>

      {/* Selected Bus Info Card */}
      {selectedBus && (
        <View style={styles.busInfoCard}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedBus(null)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.busInfoHeader}>
            <View style={[styles.busInfoBadge, { backgroundColor: getBusColor(selectedBus) }]}>
              <Text style={styles.busInfoBadgeText}>
                {selectedBus.route.routeNumber || selectedBus.vehicle.plateNumber.slice(-3)}
              </Text>
            </View>
            <View style={styles.busInfoDetails}>
              <Text style={styles.busInfoRoute}>{selectedBus.route.name}</Text>
              <Text style={styles.busInfoPlate}>{selectedBus.vehicle.plateNumber}</Text>
            </View>
          </View>

          <View style={styles.busInfoStats}>
            <View style={styles.busInfoStat}>
              <Text style={styles.busInfoStatIcon}>⏱️</Text>
              <Text style={styles.busInfoStatValue}>{selectedBus.etaText}</Text>
              <Text style={styles.busInfoStatLabel}>ETA</Text>
            </View>
            <View style={styles.busInfoStat}>
              <Text style={styles.busInfoStatIcon}>📏</Text>
              <Text style={styles.busInfoStatValue}>{selectedBus.distance.toFixed(1)} km</Text>
              <Text style={styles.busInfoStatLabel}>Distance</Text>
            </View>
            <View style={styles.busInfoStat}>
              <Text style={styles.busInfoStatIcon}>💰</Text>
              <Text style={styles.busInfoStatValue}>Rs. {selectedBus.route.basePrice}</Text>
              <Text style={styles.busInfoStatLabel}>Fare</Text>
            </View>
          </View>

          <View style={styles.busInfoRoute}>
            <Text style={styles.busInfoRouteLabel}>Route:</Text>
            <Text style={styles.busInfoRouteText}>
              {selectedBus.route.startPoint} → {selectedBus.route.endPoint}
            </Text>
          </View>
        </View>
      )}

      {/* No Buses Message */}
      {!loading && displayBuses.length === 0 && (
        <View style={styles.noBusesCard}>
          <Text style={styles.noBusesIcon}>🚌</Text>
          <Text style={styles.noBusesText}>No buses nearby</Text>
          <Text style={styles.noBusesSubtext}>
            {routeId ? 'No buses on this route at the moment' : 'Try expanding your search area'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  refreshButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 20,
    color: '#007AFF',
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  myLocationIcon: {
    fontSize: 24,
  },
  busMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  busMarkerText: {
    fontSize: 20,
  },
  busMarkerNumber: {
    position: 'absolute',
    bottom: -16,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#000',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stopMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopMarkerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  busInfoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  busInfoHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  busInfoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  busInfoBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  busInfoDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  busInfoRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  busInfoPlate: {
    fontSize: 13,
    color: '#666',
  },
  busInfoStats: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  busInfoStat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  busInfoStatIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  busInfoStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  busInfoStatLabel: {
    fontSize: 11,
    color: '#666',
  },
  busInfoRouteLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  busInfoRouteText: {
    fontSize: 14,
    color: '#666',
  },
  noBusesCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  noBusesIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  noBusesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  noBusesSubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
});

export default LiveBusMapScreen;
