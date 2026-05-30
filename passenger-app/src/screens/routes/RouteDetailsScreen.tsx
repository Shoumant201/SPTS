import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { routeApi, Route } from '../../services/api/routes';

interface RouteDetailsScreenProps {
  routeId: string;
  onBack: () => void;
}

const RouteDetailsScreen: React.FC<RouteDetailsScreenProps> = ({ routeId, onBack }) => {
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRouteDetails();
  }, [routeId]);

  const fetchRouteDetails = async () => {
    try {
      setLoading(true);
      const response = await routeApi.getRouteDetails(routeId);
      setRoute(response.route);
    } catch (error: any) {
      console.error('Failed to fetch route details:', error);
      Alert.alert('Error', 'Failed to load route details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading route details...</Text>
      </View>
    );
  }

  if (!route) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Route not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={onBack}>
          <Text style={styles.backIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Route Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.routeNumberBadge}>
            <Text style={styles.routeNumberText}>
              {route.routeNumber || route.name.substring(0, 3).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.routeName}>{route.name}</Text>
          {route.description && (
            <Text style={styles.routeDescription}>{route.description}</Text>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📏</Text>
            <Text style={styles.statValue}>{route.distance} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>Rs. {route.basePrice}</Text>
            <Text style={styles.statLabel}>Base Fare</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🚏</Text>
            <Text style={styles.statValue}>{route.stops.length}</Text>
            <Text style={styles.statLabel}>Stops</Text>
          </View>
          {route.assignments && route.assignments.length > 0 && (
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🚌</Text>
              <Text style={styles.statValue}>{route.assignments.length}</Text>
              <Text style={styles.statLabel}>Active Buses</Text>
            </View>
          )}
        </View>

        {/* Route Path */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Path</Text>
          <View style={styles.pathCard}>
            <View style={styles.pathItem}>
              <View style={[styles.pathDot, styles.pathDotStart]} />
              <View style={styles.pathInfo}>
                <Text style={styles.pathLabel}>Start</Text>
                <Text style={styles.pathLocation}>{route.startPoint}</Text>
              </View>
            </View>
            <View style={styles.pathLine} />
            <View style={styles.pathItem}>
              <View style={[styles.pathDot, styles.pathDotEnd]} />
              <View style={styles.pathInfo}>
                <Text style={styles.pathLabel}>End</Text>
                <Text style={styles.pathLocation}>{route.endPoint}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* All Stops */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Stops ({route.stops.length})</Text>
          <View style={styles.stopsCard}>
            {route.stops.map((stop, index) => (
              <View key={stop.id} style={styles.stopItem}>
                <View style={styles.stopNumber}>
                  <Text style={styles.stopNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stopName}>{stop.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Active Buses */}
        {route.assignments && route.assignments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Buses</Text>
            {route.assignments.map((assignment) => (
              <View key={assignment.id} style={styles.busCard}>
                <View style={styles.busIcon}>
                  <Text style={styles.busIconText}>🚌</Text>
                </View>
                <View style={styles.busInfo}>
                  <Text style={styles.busPlate}>{assignment.vehicle.plateNumber}</Text>
                  <Text style={styles.busDriver}>
                    Driver: {assignment.driver.name || 'Unknown'}
                  </Text>
                  <Text style={styles.busType}>
                    {assignment.vehicle.type} • Capacity: {assignment.vehicle.capacity}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Organization Info */}
        {route.organization && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Operated By</Text>
            <View style={styles.orgCard}>
              <Text style={styles.orgName}>{route.organization.name}</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconText: {
    fontSize: 24,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  routeNumberBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  routeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  routeDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  pathCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  pathItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pathDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  pathDotStart: {
    backgroundColor: '#4CAF50',
  },
  pathDotEnd: {
    backgroundColor: '#f44336',
  },
  pathLine: {
    width: 2,
    height: 24,
    backgroundColor: '#e0e0e0',
    marginLeft: 7,
    marginVertical: 4,
  },
  pathInfo: {
    flex: 1,
  },
  pathLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  pathLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  stopsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  stopName: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  busCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  busIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  busIconText: {
    fontSize: 24,
  },
  busInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  busPlate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  busDriver: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  busType: {
    fontSize: 12,
    color: '#999',
  },
  orgCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  bottomPadding: {
    height: 20,
  },
});

export default RouteDetailsScreen;
