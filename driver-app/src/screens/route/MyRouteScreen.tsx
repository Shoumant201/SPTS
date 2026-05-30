import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import axiosInstance from '../../services/axiosInstance';

const { width } = Dimensions.get('window');

interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
}

interface Assignment {
  id: string;
  departureTime: string;
  days: string[];
  status: string;
  vehicle: {
    plateNumber: string;
    type: string;
  };
  route: {
    id: string;
    name: string;
    routeNumber: string | null;
    startPoint: string;
    endPoint: string;
    distance: number;
    stops: RouteStop[];
  };
}

const MyRouteScreen: React.FC = () => {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);

  useEffect(() => {
    loadAssignment();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (locationPermission) {
      startLocationTracking();
    }
  }, [locationPermission]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location permission is required to show your position on the map.'
        );
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);

      // Update location every 10 seconds
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation(newLocation);
        }
      );
    } catch (error) {
      console.error('Location tracking error:', error);
    }
  };

  const loadAssignment = async () => {
    try {
      const res = await axiosInstance.get('/api/assignments/my');
      const assignments = res.data.assignments || [];
      
      // Get today's assignment or the first active one
      const todayAssignment = assignments.find((a: Assignment) => 
        a.status === 'ACTIVE' && a.days.includes(getTodayDay())
      );
      
      setAssignment(todayAssignment || assignments[0] || null);
    } catch (error) {
      console.error('Load assignment error:', error);
      Alert.alert('Error', 'Failed to load route assignment');
    } finally {
      setLoading(false);
    }
  };

  const getTodayDay = (): string => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[new Date().getDay()];
  };

  const getMapRegion = () => {
    if (!assignment?.route.stops.length) {
      // Default to Kathmandu if no stops
      return {
        latitude: 27.7172,
        longitude: 85.3240,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }

    const stops = assignment.route.stops;
    const lats = stops.map(s => s.lat);
    const lngs = stops.map(s => s.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = (maxLat - minLat) * 1.5 || 0.05;
    const lngDelta = (maxLng - minLng) * 1.5 || 0.05;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.05),
      longitudeDelta: Math.max(lngDelta, 0.05),
    };
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!assignment) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My Route</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyTitle}>No Route Assigned</Text>
          <Text style={styles.emptySubtitle}>
            You don't have an active route assignment yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const stops = assignment.route.stops.sort((a, b) => a.order - b.order);
  const routeCoordinates = stops.map(stop => ({
    latitude: stop.lat,
    longitude: stop.lng,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Route</Text>
          <Text style={styles.subtitle}>
            {assignment.route.routeNumber ? `#${assignment.route.routeNumber} ` : ''}
            {assignment.route.name}
          </Text>
        </View>
        <View style={styles.vehicleBadge}>
          <Text style={styles.vehicleText}>🚌 {assignment.vehicle.plateNumber}</Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={getMapRegion()}
          showsUserLocation={locationPermission}
          showsMyLocationButton={locationPermission}
          showsCompass
          showsScale
        >
          {/* Route polyline */}
          {routeCoordinates.length > 1 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#3b82f6"
              strokeWidth={4}
              lineDashPattern={[1]}
            />
          )}

          {/* Stop markers */}
          {stops.map((stop, index) => (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.lat, longitude: stop.lng }}
              onPress={() => setSelectedStop(stop)}
              pinColor={
                index === 0
                  ? '#22c55e' // Green for start
                  : index === stops.length - 1
                  ? '#ef4444' // Red for end
                  : '#3b82f6' // Blue for intermediate
              }
            >
              <View style={styles.markerContainer}>
                <View style={[
                  styles.marker,
                  index === 0 && styles.markerStart,
                  index === stops.length - 1 && styles.markerEnd,
                ]}>
                  <Text style={styles.markerText}>{stop.order}</Text>
                </View>
              </View>
            </Marker>
          ))}

          {/* Driver's current location marker (if available) */}
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Your Location"
              description="Current position"
            >
              <View style={styles.driverMarker}>
                <Text style={styles.driverMarkerText}>🚌</Text>
              </View>
            </Marker>
          )}
        </MapView>

        {/* Location status indicator */}
        {!locationPermission && (
          <View style={styles.locationWarning}>
            <Text style={styles.locationWarningText}>
              📍 Enable location to see your position
            </Text>
          </View>
        )}
      </View>

      {/* Route info panel */}
      <View style={styles.infoPanel}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{assignment.route.distance} km</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Stops</Text>
            <Text style={styles.infoValue}>{stops.length}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Departure</Text>
            <Text style={styles.infoValue}>{assignment.departureTime}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, styles.statusActive]}>
              {assignment.status}
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Stops list */}
      <ScrollView style={styles.stopsList} contentContainerStyle={styles.stopsListContent}>
        <Text style={styles.stopsTitle}>Route Stops ({stops.length})</Text>
        {stops.map((stop, index) => (
          <TouchableOpacity
            key={stop.id}
            style={[
              styles.stopItem,
              selectedStop?.id === stop.id && styles.stopItemSelected,
            ]}
            onPress={() => setSelectedStop(stop)}
          >
            <View style={styles.stopIndicator}>
              <View style={[
                styles.stopDot,
                index === 0 && styles.stopDotStart,
                index === stops.length - 1 && styles.stopDotEnd,
              ]}>
                <Text style={styles.stopNumber}>{stop.order}</Text>
              </View>
              {index < stops.length - 1 && <View style={styles.stopLine} />}
            </View>
            <View style={styles.stopContent}>
              <Text style={styles.stopName}>{stop.name}</Text>
              <Text style={styles.stopCoords}>
                {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  vehicleBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  vehicleText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  mapContainer: { height: 300, position: 'relative' },
  map: { flex: 1 },
  markerContainer: { alignItems: 'center' },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerStart: { backgroundColor: '#22c55e' },
  markerEnd: { backgroundColor: '#ef4444' },
  markerText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  driverMarkerText: { fontSize: 20 },
  locationWarning: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationWarningText: { fontSize: 12, color: '#92400e', textAlign: 'center' },
  infoPanel: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoCard: {
    marginRight: 16,
    alignItems: 'center',
    minWidth: 80,
  },
  infoLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  statusActive: { color: '#22c55e' },
  stopsList: { flex: 1, backgroundColor: '#fff' },
  stopsListContent: { padding: 16 },
  stopsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  stopItem: {
    flexDirection: 'row',
    marginBottom: 4,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  stopItemSelected: { backgroundColor: '#f0f9ff' },
  stopIndicator: { width: 32, alignItems: 'center', marginRight: 12 },
  stopDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  stopDotStart: { backgroundColor: '#22c55e' },
  stopDotEnd: { backgroundColor: '#ef4444' },
  stopNumber: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  stopLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb',
    marginTop: 4,
  },
  stopContent: { flex: 1, justifyContent: 'center' },
  stopName: { fontSize: 14, fontWeight: '500', color: '#1a1a1a', marginBottom: 2 },
  stopCoords: { fontSize: 11, color: '#999' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MyRouteScreen;
