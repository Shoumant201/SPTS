import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PhoneUser } from '../services/api/phoneAuth';
import { usePassengerLocation } from '../hooks/usePassengerLocation';
import { useNearbyBuses } from '../hooks/useNearbyBuses';

interface HomeScreenProps {
  user: PhoneUser;
  onLogout: () => void;
  onNavigate?: (tab: 'home' | 'routes' | 'map' | 'wallet' | 'discounts' | 'profile' | 'trips' | 'account') => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ user, onLogout, onNavigate }) => {
  const [destination, setDestination] = useState('');
  const { location, updateLocation } = usePassengerLocation();
  
  // Fetch nearby buses based on user location
  const { nearestBus, buses, loading: busesLoading, refresh: refreshBuses } = useNearbyBuses({
    latitude: location.latitude,
    longitude: location.longitude,
    radius: 5,
    enabled: !location.loading && !location.error,
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  const handleSearch = () => {
    if (!destination.trim()) {
      Alert.alert('Enter Destination', 'Please enter where you want to go');
      return;
    }
    Alert.alert('Search', `Searching routes to ${destination}`);
  };

  const handleTapInOut = () => {
    if (onNavigate) {
      onNavigate('wallet');
    } else {
      Alert.alert('Tap In/Out', 'NFC tap functionality will be implemented');
    }
  };

  const handleLiveMap = () => {
    if (onNavigate) {
      onNavigate('map');
    } else {
      Alert.alert('Live Map', 'Opening live bus tracking map');
    }
  };

  const handleWallet = () => {
    if (onNavigate) {
      onNavigate('wallet');
    } else {
      Alert.alert('Wallet', 'Digital wallet functionality');
    }
  };

  const handleHistory = () => {
    if (onNavigate) {
      onNavigate('trips');
    } else {
      Alert.alert('History', 'Trip history and receipts');
    }
  };

  const handleDiscounts = () => {
    if (onNavigate) {
      onNavigate('discounts');
    } else {
      Alert.alert('Discounts', 'Apply for student, elderly, or disabled discounts');
    }
  };

  const handleTrackLive = () => {
    if (nearestBus) {
      Alert.alert('Track Live', `Tracking Bus ${nearestBus.route.routeNumber || nearestBus.vehicle.plateNumber} live location`);
    } else {
      Alert.alert('No Bus', 'No buses nearby at the moment');
    }
  };

  const QuickActionButton = ({ title, icon, onPress, isPrimary = false }: {
    title: string;
    icon: string;
    onPress: () => void;
    isPrimary?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.quickActionButton, isPrimary && styles.primaryAction]}
      onPress={onPress}
    >
      <View style={[styles.actionIcon, isPrimary && styles.primaryIcon]}>
        <Text style={[styles.iconText, isPrimary && styles.primaryIconText]}>{icon}</Text>
      </View>
      <Text style={[styles.actionTitle, isPrimary && styles.primaryActionTitle]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => onNavigate && onNavigate('profile')}
            >
              <Text style={styles.avatarText}>
                {user.name?.charAt(0).toUpperCase() || 'A'}
              </Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.greeting}>Good morning, {user.name || 'Alex'}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.location}
            onPress={updateLocation}
            disabled={location.loading}
          >
            <Text style={styles.locationDot}>📍</Text>
            {location.loading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={[
                styles.locationText,
                location.error && styles.locationError
              ]}>
                {location.city || 'Unknown'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter destination"
              value={destination}
              onChangeText={setDestination}
              onSubmitEditing={handleSearch}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickActionButton
              title="Tap In / Out"
              icon="🚌"
              onPress={handleTapInOut}
              isPrimary={true}
            />
            <QuickActionButton
              title="Live Map"
              icon="🗺️"
              onPress={handleLiveMap}
            />
            <QuickActionButton
              title="Wallet"
              icon="💳"
              onPress={handleWallet}
            />
            <QuickActionButton
              title="Trip History"
              icon="📜"
              onPress={handleHistory}
            />
          </View>
        </View>

        {/* Nearest Bus */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearest Bus</Text>
            {buses.length > 0 && (
              <TouchableOpacity onPress={refreshBuses} disabled={busesLoading}>
                <Text style={styles.refreshText}>
                  {busesLoading ? '⟳' : '↻'} Refresh
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {busesLoading && buses.length === 0 ? (
            <View style={styles.busCard}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Finding nearby buses...</Text>
            </View>
          ) : nearestBus ? (
            <View style={styles.busCard}>
              <View style={styles.busInfo}>
                <View style={styles.busHeader}>
                  <View style={styles.arrivalIndicator}>
                    <View style={styles.arrivalDot} />
                    <Text style={styles.arrivalText}>
                      Arriving in {nearestBus.etaText}
                    </Text>
                  </View>
                </View>
                <View style={styles.busDetails}>
                  <Text style={styles.busNumber}>
                    Bus {nearestBus.route.routeNumber || nearestBus.vehicle.plateNumber}
                  </Text>
                  <Text style={styles.busStatus}>
                    {nearestBus.vehicle.type}
                  </Text>
                </View>
                <Text style={styles.busRoute}>
                  {nearestBus.route.name}
                </Text>
                <Text style={styles.busDistance}>
                  {nearestBus.distance.toFixed(1)} km away
                </Text>
                <TouchableOpacity style={styles.trackButton} onPress={handleTrackLive}>
                  <Text style={styles.trackIcon}>📍</Text>
                  <Text style={styles.trackText}>Track Live</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.busMap}>
                <View style={styles.mapPlaceholder}>
                  <Text style={styles.mapText}>🗺️</Text>
                  <Text style={styles.mapSubtext}>{buses.length}</Text>
                  <Text style={styles.mapLabel}>nearby</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.busCard}>
              <View style={styles.noBusContainer}>
                <Text style={styles.noBusIcon}>🚌</Text>
                <Text style={styles.noBusText}>No buses nearby</Text>
                <Text style={styles.noBusSubtext}>
                  Try expanding your search radius or check back later
                </Text>
                <TouchableOpacity 
                  style={styles.retryButton} 
                  onPress={refreshBuses}
                  disabled={busesLoading}
                >
                  <Text style={styles.retryButtonText}>
                    {busesLoading ? 'Searching...' : 'Search Again'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    fontSize: 16,
    marginRight: 4,
  },
  locationText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  locationError: {
    color: '#f44336',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  refreshText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryAction: {
    backgroundColor: '#007AFF',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  iconText: {
    fontSize: 20,
  },
  primaryIconText: {
    fontSize: 20,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  primaryActionTitle: {
    color: '#fff',
  },
  busCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  busInfo: {
    flex: 1,
    paddingRight: 16,
  },
  busHeader: {
    marginBottom: 12,
  },
  arrivalIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrivalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  arrivalText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  busDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  busNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginRight: 12,
  },
  busStatus: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  busRoute: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  busDistance: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  trackIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  trackText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  busMap: {
    width: 80,
    height: 80,
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 24,
  },
  mapSubtext: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginTop: 4,
  },
  mapLabel: {
    fontSize: 10,
    color: '#666',
  },
  noBusContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noBusIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  noBusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  noBusSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;