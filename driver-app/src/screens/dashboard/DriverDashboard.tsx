import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PhoneUser } from '../../services/api/phoneAuth';

interface DriverDashboardProps {
  user: PhoneUser;
  onLogout: () => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ user, onLogout }) => {
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState({
    busNumber: '402',
    route: 'Line 5 - North Shore',
    status: 'ACTIVE'
  });

  const handleStartShift = () => {
    setIsShiftActive(true);
    Alert.alert('Shift Started', 'You are now online and ready to receive assignments');
  };

  const handleEndShift = () => {
    Alert.alert(
      'End Shift',
      'Are you sure you want to end your shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Shift',
          style: 'destructive',
          onPress: () => {
            setIsShiftActive(false);
            Alert.alert('Shift Ended', 'You are now offline');
          }
        }
      ]
    );
  };

  const handleReportIssue = () => {
    Alert.alert('Report Issue', 'Issue reporting functionality will be implemented');
  };

  const handleViewEarnings = () => {
    Alert.alert('View Earnings', 'Earnings tracking functionality will be implemented');
  };

  const handleSchedule = () => {
    Alert.alert('Schedule', 'Schedule management functionality will be implemented');
  };

  const handleDispatch = () => {
    Alert.alert('Dispatch', 'Dispatch communication functionality will be implemented');
  };

  const QuickActionButton = ({ title, icon, onPress, variant = 'default' }: {
    title: string;
    icon: string;
    onPress: () => void;
    variant?: 'default' | 'danger' | 'info';
  }) => {
    const getButtonStyle = () => {
      switch (variant) {
        case 'danger':
          return { backgroundColor: '#ffebee' };
        case 'info':
          return { backgroundColor: '#e3f2fd' };
        default:
          return { backgroundColor: '#f5f5f5' };
      }
    };

    const getIconStyle = () => {
      switch (variant) {
        case 'danger':
          return { color: '#f44336' };
        case 'info':
          return { color: '#2196f3' };
        default:
          return { color: '#666' };
      }
    };

    return (
      <TouchableOpacity
        style={[styles.quickActionButton, getButtonStyle()]}
        onPress={onPress}
      >
        <Text style={[styles.actionIcon, getIconStyle()]}>{icon}</Text>
        <Text style={[styles.actionTitle, getIconStyle()]}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.driverInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name?.charAt(0).toUpperCase() || 'M'}
              </Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{user.name || 'Marcus Rivera'}</Text>
              <Text style={styles.driverId}>ID: DR-9921</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>ACTIVE</Text>
          </View>
        </View>

        {/* Live Route Map */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>🗺️ Live Route Map</Text>
          </View>
          <TouchableOpacity style={styles.liveRouteButton}>
            <Text style={styles.liveRouteText}>LIVE ROUTE</Text>
          </TouchableOpacity>
        </View>

        {/* Current Assignment */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CURRENT ASSIGNMENT</Text>
          <View style={styles.assignmentCard}>
            <Text style={styles.busNumber}>Bus #{currentAssignment.busNumber}</Text>
            <View style={styles.routeInfo}>
              <Text style={styles.routeIcon}>🚌</Text>
              <Text style={styles.routeText}>{currentAssignment.route}</Text>
            </View>
          </View>
        </View>

        {/* Shift Controls */}
        <View style={styles.shiftControls}>
          {!isShiftActive ? (
            <TouchableOpacity style={styles.startShiftButton} onPress={handleStartShift}>
              <Text style={styles.startShiftIcon}>▶️</Text>
              <Text style={styles.startShiftText}>Start Shift</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.endShiftButton} onPress={handleEndShift}>
              <Text style={styles.endShiftIcon}>⏹️</Text>
              <Text style={styles.endShiftText}>End Shift</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickActionButton
              title="Report Issue"
              icon="⚠️"
              onPress={handleReportIssue}
              variant="danger"
            />
            <QuickActionButton
              title="View Earnings"
              icon="💰"
              onPress={handleViewEarnings}
              variant="info"
            />
            <QuickActionButton
              title="Schedule"
              icon="🕐"
              onPress={handleSchedule}
            />
            <QuickActionButton
              title="Dispatch"
              icon="💬"
              onPress={handleDispatch}
            />
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
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  driverId: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  mapContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    position: 'relative',
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 18,
    color: '#1976d2',
    fontWeight: '500',
  },
  liveRouteButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  liveRouteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  assignmentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  busNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  routeText: {
    fontSize: 16,
    color: '#666',
  },
  shiftControls: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  startShiftButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startShiftIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  startShiftText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  endShiftButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  endShiftIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  endShiftText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default DriverDashboard;