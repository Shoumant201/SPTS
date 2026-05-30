import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getActiveRide, ActiveRide } from '../../services/api/nfc';

interface ActiveRideScreenProps {
  navigation: any;
}

const ActiveRideScreen: React.FC<ActiveRideScreenProps> = ({ navigation }) => {
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rideDuration, setRideDuration] = useState(0);

  const fetchActiveRide = async () => {
    try {
      const response = await getActiveRide();
      setActiveRide(response.activeRide);
    } catch (error: any) {
      console.error('Error fetching active ride:', error);
      Alert.alert('Error', 'Failed to load active ride information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActiveRide();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchActiveRide, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Update ride duration every second
  useEffect(() => {
    if (!activeRide) return;

    const updateDuration = () => {
      const startTime = new Date(activeRide.tapInAt).getTime();
      const now = Date.now();
      const durationSeconds = Math.floor((now - startTime) / 1000);
      setRideDuration(durationSeconds);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [activeRide]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActiveRide();
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading ride information...</Text>
      </View>
    );
  }

  if (!activeRide) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.emptyContainer}>
          <Ionicons name="bus-outline" size={100} color="#CCC" />
          <Text style={styles.emptyTitle}>No Active Ride</Text>
          <Text style={styles.emptyText}>
            Tap your NFC card on a bus reader to start your ride
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <Ionicons name="checkmark-circle" size={40} color="#34C759" />
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>Ride in Progress</Text>
            <Text style={styles.statusSubtitle}>
              Tap again when exiting to complete your ride
            </Text>
          </View>
        </View>

        {/* Duration Card */}
        <View style={styles.durationCard}>
          <Ionicons name="time" size={30} color="#007AFF" />
          <View style={styles.durationInfo}>
            <Text style={styles.durationLabel}>Ride Duration</Text>
            <Text style={styles.durationValue}>{formatDuration(rideDuration)}</Text>
          </View>
        </View>

        {/* Route Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="map" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>Route Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Route:</Text>
            <Text style={styles.infoValue}>
              {activeRide.route?.name || 'Unknown Route'}
            </Text>
          </View>
          {activeRide.route?.routeNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Route Number:</Text>
              <Text style={styles.infoValue}>{activeRide.route.routeNumber}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>From:</Text>
            <Text style={styles.infoValue}>{activeRide.route?.startPoint}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>To:</Text>
            <Text style={styles.infoValue}>{activeRide.route?.endPoint}</Text>
          </View>
        </View>

        {/* Vehicle Information */}
        {activeRide.vehicle && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="bus" size={24} color="#007AFF" />
              <Text style={styles.cardTitle}>Vehicle Information</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Plate Number:</Text>
              <Text style={styles.infoValue}>{activeRide.vehicle.plateNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>{activeRide.vehicle.type}</Text>
            </View>
          </View>
        )}

        {/* Fare Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cash" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>Fare Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Boarded At:</Text>
            <Text style={styles.infoValue}>{formatTime(activeRide.tapInAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estimated Fare:</Text>
            <Text style={styles.fareValue}>
              NPR {activeRide.estimatedFare.toFixed(2)}
            </Text>
          </View>
          <Text style={styles.fareNote}>
            * Final fare will be calculated when you tap out
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <Text style={styles.instructionsText}>
            When you reach your destination, tap your NFC card on the bus reader again
            to complete your ride. The fare will be automatically deducted from your wallet.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 16,
  },
  statusBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#558B2F',
  },
  durationCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  durationInfo: {
    marginLeft: 16,
    flex: 1,
  },
  durationLabel: {
    fontSize: 14,
    color: '#1565C0',
    marginBottom: 4,
  },
  durationValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0D47A1',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  fareValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  fareNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  instructionsCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  instructionsText: {
    fontSize: 14,
    color: '#E65100',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ActiveRideScreen;
