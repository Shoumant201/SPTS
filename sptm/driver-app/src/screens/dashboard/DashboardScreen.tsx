import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DriverButton } from '../../components';
import { authService } from '../../services/authService';
import { theme } from '../../constants/theme';
import { RootStackParamList, Driver } from '../../types';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      const currentDriver = await authService.getCurrentDriver();
      setDriver(currentDriver);
    } catch (error) {
      console.error('Error loading driver data:', error);
      Alert.alert('Error', 'Failed to load driver information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleStartTrip = () => {
    Alert.alert('Start Trip', 'Trip functionality will be implemented in the next task.');
  };

  const handleReportIncident = () => {
    Alert.alert('Report Incident', 'Incident reporting will be implemented in a future task.');
  };

  const handleViewMessages = () => {
    Alert.alert('Messages', 'Messages functionality will be implemented in a future task.');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
          <Text style={styles.employeeId}>ID: {driver?.employeeId || 'N/A'}</Text>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Current Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, styles.statusOnline]} />
            <Text style={styles.statusText}>Online</Text>
          </View>
          <Text style={styles.statusSubtext}>Ready for assignments</Text>
        </View>

        {/* Trip Information */}
        <View style={styles.tripCard}>
          <Text style={styles.cardTitle}>Trip Information</Text>
          <Text style={styles.noTripText}>No active trip</Text>
          <Text style={styles.tripSubtext}>Waiting for trip assignment</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <DriverButton
            title="Start Trip"
            onPress={handleStartTrip}
            variant="primary"
            size="large"
          />
          
          <DriverButton
            title="Report Incident"
            onPress={handleReportIncident}
            variant="warning"
            size="large"
          />
          
          <DriverButton
            title="View Messages"
            onPress={handleViewMessages}
            variant="secondary"
            size="medium"
          />
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <DriverButton
            title="Logout"
            onPress={handleLogout}
            variant="danger"
            size="medium"
          />
        </View>

        {/* Implementation Status */}
        <View style={styles.implementationStatus}>
          <Text style={styles.statusTitle}>Implementation Status</Text>
          <Text style={styles.statusItem}>✅ Authentication System</Text>
          <Text style={styles.statusItem}>✅ Login Screen</Text>
          <Text style={styles.statusItem}>✅ Secure Token Storage</Text>
          <Text style={styles.statusItem}>✅ Form Validation</Text>
          <Text style={styles.statusItem}>⏳ Trip Management (Next Task)</Text>
          <Text style={styles.statusItem}>⏳ Route Map (Future Task)</Text>
          <Text style={styles.statusItem}>⏳ Incident Reporting (Future Task)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  scrollContent: {
    padding: theme.spacing[4],
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },

  header: {
    marginBottom: theme.spacing[6],
  },

  welcomeText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
  },

  driverName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[1],
  },

  employeeId: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[1],
  },

  statusCard: {
    ...theme.components.card,
    marginBottom: theme.spacing[4],
  },

  tripCard: {
    ...theme.components.card,
    marginBottom: theme.spacing[6],
  },

  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },

  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing[2],
  },

  statusOnline: {
    backgroundColor: theme.colors.status.success,
  },

  statusText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },

  statusSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  noTripText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },

  tripSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
  },

  buttonContainer: {
    gap: theme.spacing[4],
    marginBottom: theme.spacing[8],
  },

  logoutContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },

  implementationStatus: {
    ...theme.components.card,
    borderColor: theme.colors.primary[600],
  },

  statusTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[500],
    marginBottom: theme.spacing[3],
  },

  statusItem: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
});

export default DashboardScreen;