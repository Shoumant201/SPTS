import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { useProtectedScreen } from '../../hooks/useAuthGuard';

/**
 * Route Map Screen - Placeholder for future implementation
 * Will display live route map with GPS tracking and stop information
 */
const RouteMapScreen: React.FC = () => {
  const { shouldShowContent, isLoading } = useProtectedScreen();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!shouldShowContent) {
    return null; // Auth guard will handle redirection
  }

  return (
    <View style={styles.container}>
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderTitle}>Route Map</Text>
        <Text style={styles.placeholderText}>
          Live route map with GPS tracking will be implemented here.
        </Text>
        <Text style={styles.placeholderText}>
          Features will include:
        </Text>
        <Text style={styles.featureText}>• Current driver location</Text>
        <Text style={styles.featureText}>• Route stops and ETAs</Text>
        <Text style={styles.featureText}>• Real-time navigation</Text>
        <Text style={styles.featureText}>• Dark theme optimized for driving</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  placeholderTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold as any,
    marginBottom: theme.spacing[6],
    textAlign: 'center',
  },
  placeholderText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
  },
  featureText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.base,
    marginBottom: theme.spacing[2],
    paddingLeft: theme.spacing[4],
  },
});

export default RouteMapScreen;