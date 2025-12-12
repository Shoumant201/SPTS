import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { phoneAuthApi, PhoneUser } from '../services/api/phoneAuth';

interface HomeScreenProps {
  user: PhoneUser;
  onLogout: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ user, onLogout }) => {
  const [destination, setDestination] = useState('');
  const [nearestBus, setNearestBus] = useState({
    number: '402',
    route: 'To Northgate Station',
    arrivalTime: '4 mins',
    status: 'RAPID'
  });

  const handleSearch = () => {
    if (!destination.trim()) {
      Alert.alert('Enter Destination', 'Please enter where you want to go');
      return;
    }
    Alert.alert('Search', `Searching routes to ${destination}`);
  };

  const handleTapInOut = () => {
    Alert.alert('Tap In/Out', 'NFC tap functionality will be implemented');
  };

  const handleLiveMap = () => {
    Alert.alert('Live Map', 'Opening live bus tracking map');
  };

  const handleWallet = () => {
    Alert.alert('Wallet', 'Digital wallet functionality');
  };

  const handleHistory = () => {
    Alert.alert('History', 'Trip history and receipts');
  };

  const handleTrackLive = () => {
    Alert.alert('Track Live', `Tracking Bus ${nearestBus.number} live location`);
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
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name?.charAt(0).toUpperCase() || 'A'}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>Good morning, {user.name || 'Alex'}</Text>
            </View>
          </View>
          <View style={styles.location}>
            <Text style={styles.locationDot}>📍</Text>
            <Text style={styles.locationText}>Seattle</Text>
          </View>
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
              title="History"
              icon="🕐"
              onPress={handleHistory}
            />
          </View>
        </View>

        {/* Nearest Bus */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearest Bus</Text>
          <View style={styles.busCard}>
            <View style={styles.busInfo}>
              <View style={styles.busHeader}>
                <View style={styles.arrivalIndicator}>
                  <View style={styles.arrivalDot} />
                  <Text style={styles.arrivalText}>Arriving in {nearestBus.arrivalTime}</Text>
                </View>
              </View>
              <View style={styles.busDetails}>
                <Text style={styles.busNumber}>Bus {nearestBus.number}</Text>
                <Text style={styles.busStatus}>{nearestBus.status}</Text>
              </View>
              <Text style={styles.busRoute}>{nearestBus.route}</Text>
              <TouchableOpacity style={styles.trackButton} onPress={handleTrackLive}>
                <Text style={styles.trackIcon}>📍</Text>
                <Text style={styles.trackText}>Track Live</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.busMap}>
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mapText}>🗺️</Text>
              </View>
            </View>
          </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
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
});

export default HomeScreen;