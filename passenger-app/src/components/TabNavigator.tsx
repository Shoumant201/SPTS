import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { PhoneUser } from '../services/api/phoneAuth';
import HomeScreen from '../screens/HomeScreen';
import RoutesScreen from '../screens/routes/RoutesScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import DiscountsScreen from '../screens/discounts/DiscountsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import TripHistoryScreen from '../screens/trips/TripHistoryScreen';

// Conditionally import LiveBusMapScreen only on native platforms
let LiveBusMapScreen: any = null;
if (Platform.OS !== 'web') {
  LiveBusMapScreen = require('../screens/tracking/LiveBusMapScreen').default;
}

interface TabNavigatorProps {
  user: PhoneUser;
  onLogout: () => void;
}

type TabType = 'home' | 'routes' | 'map' | 'wallet' | 'discounts' | 'profile' | 'trips' | 'account';

const TabNavigator: React.FC<TabNavigatorProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const handleTabPress = (tab: TabType) => {
    if (tab === 'account') {
      Alert.alert(
        'Account',
        'What would you like to do?',
        [
          { text: 'Profile & Settings', onPress: () => setActiveTab('profile') },
          { text: 'Trip History', onPress: () => setActiveTab('trips') },
          { text: 'Discounts', onPress: () => setActiveTab('discounts') },
          { text: 'Logout', onPress: onLogout, style: 'destructive' },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen user={user} onLogout={onLogout} onNavigate={setActiveTab} />;
      case 'routes':
        return <RoutesScreen />;
      case 'map':
        if (Platform.OS === 'web') {
          return (
            <View style={styles.webNotSupported}>
              <Text style={styles.webNotSupportedText}>🗺️</Text>
              <Text style={styles.webNotSupportedTitle}>Live Map</Text>
              <Text style={styles.webNotSupportedMessage}>
                Live bus tracking is only available on mobile devices.
              </Text>
              <Text style={styles.webNotSupportedMessage}>
                Please use the mobile app to view live bus locations.
              </Text>
            </View>
          );
        }
        return LiveBusMapScreen ? <LiveBusMapScreen /> : null;
      case 'wallet':
        return <WalletScreen />;
      case 'discounts':
        return <DiscountsScreen />;
      case 'profile':
        return <ProfileScreen user={user} onLogout={onLogout} onBack={() => setActiveTab('home')} />;
      case 'trips':
        return <TripHistoryScreen />;
      default:
        return <HomeScreen user={user} onLogout={onLogout} onNavigate={setActiveTab} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderContent()}
      </View>
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => handleTabPress('home')}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>
            Home
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => handleTabPress('routes')}
        >
          <Text style={styles.navIcon}>🚌</Text>
          <Text style={[styles.navText, activeTab === 'routes' && styles.navTextActive]}>
            Routes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => handleTabPress('map')}
        >
          <Text style={styles.navIcon}>🗺️</Text>
          <Text style={[styles.navText, activeTab === 'map' && styles.navTextActive]}>
            Live Map
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => handleTabPress('wallet')}
        >
          <Text style={styles.navIcon}>💳</Text>
          <Text style={[styles.navText, activeTab === 'wallet' && styles.navTextActive]}>
            Wallet
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => handleTabPress('account')}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={[styles.navText, activeTab === 'account' && styles.navTextActive]}>
            Account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    color: '#666',
  },
  navTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  webNotSupported: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  webNotSupportedText: {
    fontSize: 64,
    marginBottom: 20,
  },
  webNotSupportedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  webNotSupportedMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
});

export default TabNavigator;