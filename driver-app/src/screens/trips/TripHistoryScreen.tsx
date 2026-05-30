import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tripApi, Trip } from '../../services/api/trips';

export const TripHistoryScreen: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  const loadTrips = useCallback(async () => {
    try {
      const params: any = { limit: 100 };
      if (filter !== 'all') {
        params.status = filter.toUpperCase();
      }
      
      const { trips: fetchedTrips } = await tripApi.getMyTrips(params);
      setTrips(fetchedTrips || []);
    } catch (error) {
      console.error('Load trips error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip History</Text>
        <Text style={styles.subtitle}>{trips.length} trips</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'cancelled' && styles.filterTabActive]}
          onPress={() => setFilter('cancelled')}
        >
          <Text style={[styles.filterText, filter === 'cancelled' && styles.filterTextActive]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadTrips();
            }}
            tintColor="#FF6B35"
          />
        }
      >
        {trips.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚌</Text>
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptySubtitle}>
              Your completed trips will appear here
            </Text>
          </View>
        ) : (
          trips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateText}>{formatDate(trip.startTime)}</Text>
                  <Text style={styles.timeText}>{formatTime(trip.startTime)}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    trip.status === 'COMPLETED' && styles.statusCompleted,
                    trip.status === 'CANCELLED' && styles.statusCancelled,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      trip.status === 'COMPLETED' && styles.statusTextCompleted,
                      trip.status === 'CANCELLED' && styles.statusTextCancelled,
                    ]}
                  >
                    {trip.status}
                  </Text>
                </View>
              </View>

              <View style={styles.routeInfo}>
                <Text style={styles.routeName}>
                  {trip.route.routeNumber ? `#${trip.route.routeNumber} ` : ''}
                  {trip.route.name}
                </Text>
                <View style={styles.routePoints}>
                  <Text style={styles.routePoint}>📍 {trip.route.startPoint}</Text>
                  <Text style={styles.routeArrow}>→</Text>
                  <Text style={styles.routePoint}>🏁 {trip.route.endPoint}</Text>
                </View>
              </View>

              {trip.vehicle && (
                <View style={styles.vehicleRow}>
                  <Text style={styles.vehicleText}>
                    🚌 {trip.vehicle.plateNumber}
                  </Text>
                </View>
              )}

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Duration</Text>
                  <Text style={styles.statValue}>{formatDuration(trip.duration)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Distance</Text>
                  <Text style={styles.statValue}>
                    {trip.distance ? `${trip.distance.toFixed(1)} km` : 'N/A'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Passengers</Text>
                  <Text style={styles.statValue}>{trip.passengerCount}</Text>
                </View>
              </View>

              {trip.status === 'COMPLETED' && trip.driverEarnings && (
                <View style={styles.earningsRow}>
                  <Text style={styles.earningsLabel}>Your Earnings</Text>
                  <Text style={styles.earningsValue}>
                    NPR {trip.driverEarnings.toFixed(2)}
                  </Text>
                </View>
              )}

              {trip.notes && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>{trip.notes}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#FF6B35',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {},
  dateText: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  timeText: { fontSize: 13, color: '#666', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  statusCompleted: { backgroundColor: '#e8f5e9' },
  statusCancelled: { backgroundColor: '#ffebee' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#666' },
  statusTextCompleted: { color: '#2e7d32' },
  statusTextCancelled: { color: '#c62828' },
  routeInfo: { marginBottom: 12 },
  routeName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6 },
  routePoints: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  routePoint: { fontSize: 12, color: '#666' },
  routeArrow: { fontSize: 12, color: '#aaa', marginHorizontal: 4 },
  vehicleRow: { marginBottom: 12 },
  vehicleText: { fontSize: 13, color: '#666' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 12,
  },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
  },
  earningsLabel: { fontSize: 13, fontWeight: '500', color: '#2e7d32' },
  earningsValue: { fontSize: 16, fontWeight: 'bold', color: '#1b5e20' },
  notesBox: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  notesText: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});
