import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { PhoneUser } from '../services/api/phoneAuth';
import DriverDashboard from '../screens/dashboard/DriverDashboard';
import JoinRequestsScreen from '../screens/requests/JoinRequestsScreen';
import MyAssignmentScreen from '../screens/assignment/MyAssignmentScreen';
import MyRouteScreen from '../screens/route/MyRouteScreen';
import DriverProfileScreen from '../screens/profile/DriverProfileScreen';
import axiosInstance from '../services/axiosInstance';

interface TabNavigatorProps {
  user: PhoneUser;
  onLogout: () => void;
}

type TabType = 'home' | 'route' | 'assignment' | 'requests' | 'profile';

const TabNavigator: React.FC<TabNavigatorProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  const checkPendingRequests = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/driver-management/driver/requests?status=PENDING');
      setPendingRequestCount(res.data.count || 0);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    checkPendingRequests();
    // Poll every 5 minutes — mobile app doesn't need frequent updates
    // AppState handles foreground/background transitions
    const interval = setInterval(checkPendingRequests, 300000);
    return () => clearInterval(interval);
  }, [checkPendingRequests]);

  // Refresh badge when returning to home from requests
  useEffect(() => {
    if (activeTab === 'home') {
      checkPendingRequests();
    }
  }, [activeTab, checkPendingRequests]);

  const handleProfilePress = () => {
    setActiveTab('profile');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <DriverDashboard user={user} onLogout={onLogout} />;
      case 'route':
        return <MyRouteScreen />;
      case 'assignment':
        return <MyAssignmentScreen />;
      case 'requests':
        return <JoinRequestsScreen />;
      case 'profile':
        return <DriverProfileScreen user={user} onLogout={onLogout} />;
      default:
        return <DriverDashboard user={user} onLogout={onLogout} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderContent()}</View>

      <View style={styles.bottomNav}>
        {/* Home */}
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Home</Text>
        </TouchableOpacity>

        {/* Route */}
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('route')}>
          <Text style={styles.navIcon}>🗺️</Text>
          <Text style={[styles.navText, activeTab === 'route' && styles.navTextActive]}>Route</Text>
        </TouchableOpacity>

        {/* Assignment */}
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('assignment')}>
          <Text style={styles.navIcon}>📋</Text>
          <Text style={[styles.navText, activeTab === 'assignment' && styles.navTextActive]}>Schedule</Text>
        </TouchableOpacity>

        {/* Requests with badge */}
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('requests')}>
          <View style={styles.iconWrapper}>
            <Text style={styles.navIcon}>📨</Text>
            {pendingRequestCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {pendingRequestCount > 9 ? '9+' : pendingRequestCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.navText, activeTab === 'requests' && styles.navTextActive]}>Invites</Text>
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity style={styles.navItem} onPress={handleProfilePress}>
          <View style={[styles.avatarSmall, activeTab === 'profile' && styles.avatarSmallActive]}>
            <Text style={styles.avatarSmallText}>
              {user.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={[styles.navText, activeTab === 'profile' && styles.navTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { flex: 1 },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: 16,
  },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  iconWrapper: { position: 'relative' },
  navIcon: { fontSize: 22, marginBottom: 3 },
  navText: { fontSize: 11, color: '#999' },
  navTextActive: { color: '#FF6B35', fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
  avatarSmallActive: {
    borderWidth: 2,
    borderColor: '#FF6B35',
    backgroundColor: '#fff5f0',
  },
  avatarSmallText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
});

export default TabNavigator;
