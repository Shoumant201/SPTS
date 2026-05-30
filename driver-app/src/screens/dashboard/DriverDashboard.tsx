import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PhoneUser } from '../../services/api/phoneAuth';
import axiosInstance from '../../services/axiosInstance';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { ReportIncidentScreen } from '../incident/ReportIncidentScreen';

interface DriverDashboardProps {
  user: PhoneUser;
  onLogout: () => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ user, onLogout }) => {
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(true); // true while restoring state on mount
  const [shiftActionLoading, setShiftActionLoading] = useState(false);
  const [todayAssignment, setTodayAssignment] = useState<any>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  useLocationTracking(isShiftActive);

  // Restore shift state on mount
  useEffect(() => {
    axiosInstance.get('/api/location/shift/status')
      .then(res => setIsShiftActive(res.data.isOnShift === true))
      .catch(() => {}) // non-fatal — default to inactive
      .finally(() => setShiftLoading(false));
  }, []);

  const loadTodayAssignment = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/assignments/my');
      const today = (res.data.assignments || []).find((a: any) => a.runsToday);
      setTodayAssignment(today || null);
    } catch {
      setTodayAssignment(null);
    } finally {
      setLoadingAssignment(false);
    }
  }, []);

  useEffect(() => { loadTodayAssignment(); }, [loadTodayAssignment]);

  const handleStartShift = async () => {
    setShiftActionLoading(true);
    try {
      await axiosInstance.post('/api/location/shift/start');
      setIsShiftActive(true);
      Alert.alert('Shift Started', 'You are now online. Location sharing is active.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not start shift. Try again.');
    } finally {
      setShiftActionLoading(false);
    }
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
          onPress: async () => {
            setShiftActionLoading(true);
            try {
              await axiosInstance.post('/api/location/shift/end');
              setIsShiftActive(false);
              Alert.alert('Shift Ended', 'You are now offline. Location sharing stopped.');
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Could not end shift. Try again.');
            } finally {
              setShiftActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReportIssue = () => {
    setShowReportModal(true);
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
          <View style={[styles.statusBadge, isShiftActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
            <View style={[styles.statusDot, isShiftActive ? styles.statusDotActive : styles.statusDotInactive]} />
            <Text style={[styles.statusText, isShiftActive ? styles.statusTextActive : styles.statusTextInactive]}>
              {shiftLoading ? '...' : isShiftActive ? 'ON SHIFT' : 'OFFLINE'}
            </Text>
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
          <Text style={styles.sectionLabel}>TODAY'S ASSIGNMENT</Text>
          {loadingAssignment ? (
            <View style={[styles.assignmentCard, { alignItems: 'center', paddingVertical: 24 }]}>
              <ActivityIndicator color="#FF6B35" />
            </View>
          ) : todayAssignment ? (
            <View style={styles.assignmentCard}>
              <View style={styles.assignmentHeader}>
                <Text style={styles.busNumber}>{todayAssignment.vehicle.plateNumber}</Text>
                <View style={styles.departureBadge}>
                  <Text style={styles.departureText}>🕐 {todayAssignment.departureTime}</Text>
                </View>
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeIcon}>🛣️</Text>
                <Text style={styles.routeText}>
                  {todayAssignment.route.routeNumber ? `#${todayAssignment.route.routeNumber} ` : ''}
                  {todayAssignment.route.name}
                </Text>
              </View>
              <View style={styles.routeEndpoints}>
                <Text style={styles.endpointText}>📍 {todayAssignment.route.startPoint}</Text>
                <Text style={styles.endpointArrow}>→</Text>
                <Text style={styles.endpointText}>🏁 {todayAssignment.route.endPoint}</Text>
              </View>
              <Text style={styles.orgText}>🏢 {todayAssignment.organization.name}</Text>
            </View>
          ) : (
            <View style={[styles.assignmentCard, { alignItems: 'center', paddingVertical: 24 }]}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
              <Text style={{ color: '#666', fontSize: 14 }}>No assignment today</Text>
              <Text style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>Check the Assignment tab for your schedule</Text>
            </View>
          )}
        </View>

        {/* Shift Controls */}
        <View style={styles.shiftControls}>
          {shiftLoading ? (
            <View style={[styles.startShiftButton, { opacity: 0.6 }]}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : !isShiftActive ? (
            <TouchableOpacity
              style={[styles.startShiftButton, shiftActionLoading && { opacity: 0.7 }]}
              onPress={handleStartShift}
              disabled={shiftActionLoading}
            >
              {shiftActionLoading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Text style={styles.startShiftIcon}>▶️</Text>
                    <Text style={styles.startShiftText}>Start Shift</Text>
                  </>
              }
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.endShiftButton, shiftActionLoading && { opacity: 0.7 }]}
              onPress={handleEndShift}
              disabled={shiftActionLoading}
            >
              {shiftActionLoading
                ? <ActivityIndicator color="#666" />
                : <>
                    <Text style={styles.endShiftIcon}>⏹️</Text>
                    <Text style={styles.endShiftText}>End Shift</Text>
                  </>
              }
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

      {/* Report Incident Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReportModal(false)}
      >
        <ReportIncidentScreen
          onClose={() => setShowReportModal(false)}
          onSuccess={() => {
            Alert.alert('Success', 'Incident reported successfully');
          }}
        />
      </Modal>
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeActive: {
    backgroundColor: '#e8f5e8',
  },
  statusBadgeInactive: {
    backgroundColor: '#f5f5f5',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: '#4CAF50',
  },
  statusDotInactive: {
    backgroundColor: '#9e9e9e',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#4CAF50',
  },
  statusTextInactive: {
    color: '#9e9e9e',
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
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  busNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  departureBadge: {
    backgroundColor: '#fff5f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  departureText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B35',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  routeText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  routeEndpoints: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 4,
  },
  endpointText: {
    fontSize: 12,
    color: '#666',
  },
  endpointArrow: {
    fontSize: 12,
    color: '#aaa',
    marginHorizontal: 4,
  },
  orgText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
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