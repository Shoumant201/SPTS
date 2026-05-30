import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Share,
} from 'react-native';
import { tripHistoryApi, TripHistoryItem, TripStatistics } from '../../services/api/tripHistory';
import { walletApi, TapSession } from '../../services/api/wallet';

const TripHistoryScreen: React.FC = () => {
  const [trips, setTrips] = useState<TapSession[]>([]);
  const [statistics, setStatistics] = useState<TripStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<TapSession | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    fetchData();
  }, [filterPeriod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await walletApi.getTapHistory();
      
      // Filter by period
      let filteredTrips = response.sessions.filter(s => s.status === 'COMPLETED');
      
      const now = new Date();
      if (filterPeriod !== 'all') {
        filteredTrips = filteredTrips.filter(trip => {
          const tripDate = new Date(trip.tapInAt);
          const daysDiff = Math.floor((now.getTime() - tripDate.getTime()) / (1000 * 60 * 60 * 24));
          
          switch (filterPeriod) {
            case 'week':
              return daysDiff <= 7;
            case 'month':
              return daysDiff <= 30;
            case 'year':
              return daysDiff <= 365;
            default:
              return true;
          }
        });
      }
      
      setTrips(filteredTrips);
      calculateStatistics(filteredTrips);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load trip history');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (tripList: TapSession[]) => {
    const stats: TripStatistics = {
      totalTrips: tripList.length,
      totalSpent: tripList.reduce((sum, t) => sum + (t.actualFare || 0), 0),
      totalSaved: tripList.reduce((sum, t) => sum + (t.estimatedFare - (t.actualFare || 0)), 0),
      averageFare: 0,
      totalDistance: tripList.reduce((sum, t) => sum + ((t as any).distance || 0), 0),
      totalDuration: tripList.reduce((sum, t) => sum + (t.duration || 0), 0),
      mostUsedRoute: null,
    };

    if (stats.totalTrips > 0) {
      stats.averageFare = stats.totalSpent / stats.totalTrips;
      
      // Find most used route
      const routeCounts: Record<string, number> = {};
      tripList.forEach(trip => {
        const routeName = trip.route.name;
        routeCounts[routeName] = (routeCounts[routeName] || 0) + 1;
      });
      
      const mostUsed = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0];
      stats.mostUsedRoute = mostUsed ? mostUsed[0] : null;
    }

    setStatistics(stats);
  };

  const handleViewReceipt = (trip: TapSession) => {
    setSelectedTrip(trip);
    setShowReceiptModal(true);
  };

  const handleShareReceipt = async () => {
    if (!selectedTrip) return;

    const receiptText = `
🧾 Trip Receipt

Route: ${selectedTrip.route.name}
From: ${selectedTrip.tapInLocation || 'N/A'}
To: ${selectedTrip.tapOutLocation || 'N/A'}
Date: ${new Date(selectedTrip.tapInAt).toLocaleDateString()}
Time: ${new Date(selectedTrip.tapInAt).toLocaleTimeString()}
Duration: ${selectedTrip.duration || 0} mins
Distance: ${((selectedTrip as any).distance as number | undefined)?.toFixed(1) || 0} km
Fare: Rs. ${selectedTrip.actualFare?.toFixed(2) || 0}

Thank you for using SPTM! 🚌
    `.trim();

    try {
      await Share.share({
        message: receiptText,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDownloadReceipt = () => {
    Alert.alert('Coming Soon', 'Receipt download will be available soon');
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading trip history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Statistics Card */}
        {statistics && statistics.totalTrips > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Trip Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{statistics.totalTrips}</Text>
                <Text style={styles.statLabel}>Total Trips</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>Rs. {statistics.totalSpent.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>Rs. {statistics.averageFare.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Avg Fare</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{statistics.totalDistance.toFixed(0)} km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
            </View>
            {statistics.mostUsedRoute && (
              <View style={styles.mostUsedRoute}>
                <Text style={styles.mostUsedLabel}>Most Used Route:</Text>
                <Text style={styles.mostUsedValue}>{statistics.mostUsedRoute}</Text>
              </View>
            )}
          </View>
        )}

        {/* Filter Buttons */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Filter by:</Text>
          <View style={styles.filterButtons}>
            {(['week', 'month', 'year', 'all'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[styles.filterButton, filterPeriod === period && styles.filterButtonActive]}
                onPress={() => setFilterPeriod(period)}
              >
                <Text style={[styles.filterButtonText, filterPeriod === period && styles.filterButtonTextActive]}>
                  {period === 'week' ? 'Week' : period === 'month' ? 'Month' : period === 'year' ? 'Year' : 'All'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trip List */}
        <View style={styles.tripList}>
          <Text style={styles.tripListTitle}>
            {trips.length} {trips.length === 1 ? 'Trip' : 'Trips'}
          </Text>
          
          {trips.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🚌</Text>
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptyText}>
                Your completed trips will appear here
              </Text>
            </View>
          ) : (
            trips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={styles.tripCard}
                onPress={() => handleViewReceipt(trip)}
              >
                <View style={styles.tripHeader}>
                  <View style={styles.tripRoute}>
                    <Text style={styles.tripRouteName}>{trip.route.name}</Text>
                    {trip.route.routeNumber && (
                      <Text style={styles.tripRouteNumber}>#{trip.route.routeNumber}</Text>
                    )}
                  </View>
                  <Text style={styles.tripFare}>Rs. {trip.actualFare?.toFixed(2) || '0.00'}</Text>
                </View>

                <View style={styles.tripLocations}>
                  <View style={styles.locationRow}>
                    <Text style={styles.locationIcon}>🟢</Text>
                    <Text style={styles.locationText}>{trip.tapInLocation || 'Unknown'}</Text>
                  </View>
                  <View style={styles.locationDivider} />
                  <View style={styles.locationRow}>
                    <Text style={styles.locationIcon}>🔴</Text>
                    <Text style={styles.locationText}>{trip.tapOutLocation || 'Unknown'}</Text>
                  </View>
                </View>

                <View style={styles.tripFooter}>
                  <Text style={styles.tripDate}>{formatDate(trip.tapInAt)}</Text>
                  <View style={styles.tripDetails}>
                    {trip.duration && (
                      <Text style={styles.tripDetail}>⏱️ {formatDuration(trip.duration)}</Text>
                    )}
                    {(trip as any).distance && (
                      <Text style={styles.tripDetail}>📍 {((trip as any).distance as number).toFixed(1)} km</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Receipt Modal */}
      <Modal visible={showReceiptModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTrip && (
              <>
                <View style={styles.receiptHeader}>
                  <Text style={styles.receiptTitle}>🧾 Trip Receipt</Text>
                  <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.receiptBody}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Route</Text>
                    <Text style={styles.receiptValue}>{selectedTrip.route.name}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>From</Text>
                    <Text style={styles.receiptValue}>{selectedTrip.tapInLocation || 'N/A'}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>To</Text>
                    <Text style={styles.receiptValue}>{selectedTrip.tapOutLocation || 'N/A'}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Date</Text>
                    <Text style={styles.receiptValue}>
                      {new Date(selectedTrip.tapInAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Time</Text>
                    <Text style={styles.receiptValue}>
                      {new Date(selectedTrip.tapInAt).toLocaleTimeString()}
                    </Text>
                  </View>

                  {selectedTrip.duration && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Duration</Text>
                      <Text style={styles.receiptValue}>{formatDuration(selectedTrip.duration)}</Text>
                    </View>
                  )}

                  {(selectedTrip as any).distance && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Distance</Text>
                      <Text style={styles.receiptValue}>{((selectedTrip as any).distance as number).toFixed(1)} km</Text>
                    </View>
                  )}

                  <View style={styles.receiptDivider} />

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Base Fare</Text>
                    <Text style={styles.receiptValue}>Rs. {selectedTrip.estimatedFare.toFixed(2)}</Text>
                  </View>

                  {selectedTrip.estimatedFare !== selectedTrip.actualFare && (
                    <View style={styles.receiptRow}>
                      <Text style={[styles.receiptLabel, styles.discountText]}>Discount</Text>
                      <Text style={[styles.receiptValue, styles.discountText]}>
                        -Rs. {(selectedTrip.estimatedFare - (selectedTrip.actualFare || 0)).toFixed(2)}
                      </Text>
                    </View>
                  )}

                  <View style={[styles.receiptRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Paid</Text>
                    <Text style={styles.totalValue}>Rs. {selectedTrip.actualFare?.toFixed(2) || '0.00'}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Payment Method</Text>
                    <Text style={styles.receiptValue}>Digital Wallet</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Transaction ID</Text>
                    <Text style={[styles.receiptValue, styles.transactionId]}>{selectedTrip.id.slice(0, 12)}...</Text>
                  </View>
                </View>

                <View style={styles.receiptActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={handleShareReceipt}>
                    <Text style={styles.actionButtonText}>📤 Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={handleDownloadReceipt}>
                    <Text style={styles.actionButtonText}>⬇️ Download</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  scrollView: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statItem: {
    width: '50%',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  mostUsedRoute: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  mostUsedLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  mostUsedValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  tripList: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  tripListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  tripCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripRoute: {
    flex: 1,
  },
  tripRouteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  tripRouteNumber: {
    fontSize: 12,
    color: '#666',
  },
  tripFare: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  tripLocations: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  locationDivider: {
    width: 2,
    height: 16,
    backgroundColor: '#e0e0e0',
    marginLeft: 5,
    marginVertical: 4,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tripDate: {
    fontSize: 12,
    color: '#999',
  },
  tripDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  tripDetail: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  receiptBody: {
    padding: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  receiptLabel: {
    fontSize: 14,
    color: '#666',
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  discountText: {
    color: '#4CAF50',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  transactionId: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  receiptActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default TripHistoryScreen;
