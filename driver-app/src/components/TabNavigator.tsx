import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { PhoneUser } from '../services/api/phoneAuth';
import DriverDashboard from '../screens/dashboard/DriverDashboard';

interface TabNavigatorProps {
  user: PhoneUser;
  onLogout: () => void;
}

type TabType = 'home' | 'map' | 'stats' | 'profile';

const TabNavigator: React.FC<TabNavigatorProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const handleTabPress = (tab: TabType) => {
    if (tab === 'profile') {
      Alert.alert(
        'Profile',
        'What would you like to do?',
        [
          { text: 'View Profile', onPress: () => Alert.alert('Profile', 'Profile screen coming soon') },
          { text: 'Settings', onPress: () => Alert.alert('Settings', 'Settings screen coming soon') },
          { text: 'Logout', onPress: onLogout, style: 'destructive' },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    
    if (tab !== 'home') {
      Alert.alert('Coming Soon', `${tab.charAt(0).toUpperCase() + tab.slice(1)} feature will be available soon`);
      return;
    }
    
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <DriverDashboard user={user} onLogout={onLogout} />;
      default:
        return <DriverDashboard user={user} onLogout={onLogout} />;
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
          onPress={() => handleTabPress('map')}
        >
          <Text style={styles.navIcon}>🗺️</Text>
          <Text style={[styles.navText, activeTab === 'map' && styles.navTextActive]}>
            Map
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => handleTabPress('stats')}
        >
          <Text style={styles.navIcon}>📊</Text>
          <Text style={[styles.navText, activeTab === 'stats' && styles.navTextActive]}>
            Stats
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => handleTabPress('profile')}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={[styles.navText, activeTab === 'profile' && styles.navTextActive]}>
            Profile
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
    color: '#FF6B35',
    fontWeight: '600',
  },
});

export default TabNavigator;