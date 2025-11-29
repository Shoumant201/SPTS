import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { theme } from '../constants/theme';
import { RootStackParamList } from '../types';
import { getTransitionForScreen } from './animations';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';

// Placeholder screens for future implementation
import RouteMapScreen from '../screens/map/RouteMapScreen';
import IncidentReportScreen from '../screens/incidents/IncidentReportScreen';
import ShiftSummaryScreen from '../screens/summary/ShiftSummaryScreen';
import MessagesScreen from '../screens/messages/MessagesScreen';

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Main app navigator with custom styling and animations
 * Optimized for driver use with large touch targets and high contrast
 */
export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        // Header styling for dark theme
        headerStyle: {
          backgroundColor: theme.colors.background.secondary,
          borderBottomColor: theme.colors.border.primary,
          borderBottomWidth: 1,
          elevation: 0, // Remove shadow on Android
          shadowOpacity: 0, // Remove shadow on iOS
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: theme.typography.fontWeight.bold as any,
          fontSize: theme.typography.fontSize.lg,
          color: theme.colors.text.primary,
        },
        headerBackTitle: '', // Remove back button text
        
        // Card styling for consistent dark theme
        cardStyle: {
          backgroundColor: theme.colors.background.primary,
        },
        
        // Default transition
        ...getTransitionForScreen('default'),
        
        // Gesture configuration for better driver experience
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        gestureResponseDistance: 50, // Larger gesture area for easier use
      }}
    >
      {/* Authentication Screen */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          headerShown: false,
          // No animation when navigating to login (logout scenario)
          ...getTransitionForScreen('Login', 'critical'),
        }}
      />

      {/* Main Dashboard */}
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ 
          title: 'SPTM Driver',
          headerLeft: () => null, // Prevent going back to login
          // No animation for immediate access after login
          ...getTransitionForScreen('Dashboard', 'critical'),
          // Custom header styling for dashboard
          headerStyle: {
            backgroundColor: theme.colors.background.secondary,
            borderBottomColor: theme.colors.border.primary,
            borderBottomWidth: 1,
            elevation: 2,
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
          },
        }}
      />

      {/* Route Map Screen */}
      <Stack.Screen 
        name="RouteMap" 
        component={RouteMapScreen}
        options={{ 
          title: 'Route Map',
          headerShown: true,
          ...getTransitionForScreen('RouteMap', 'main'),
          // Map screen specific styling
          headerStyle: {
            backgroundColor: theme.colors.background.secondary,
            borderBottomWidth: 0, // No border for map screen
          },
        }}
      />

      {/* Incident Report Screen */}
      <Stack.Screen 
        name="IncidentReport" 
        component={IncidentReportScreen}
        options={{ 
          title: 'Report Incident',
          headerShown: true,
          ...getTransitionForScreen('IncidentReport', 'modal'),
          // Modal-like presentation
          presentation: 'modal',
          headerStyle: {
            backgroundColor: theme.colors.background.secondary,
            borderBottomColor: theme.colors.warning[500],
            borderBottomWidth: 2, // Colored border for incident screen
          },
        }}
      />

      {/* Shift Summary Screen */}
      <Stack.Screen 
        name="ShiftSummary" 
        component={ShiftSummaryScreen}
        options={{ 
          title: 'Shift Summary',
          headerShown: true,
          ...getTransitionForScreen('ShiftSummary', 'main'),
        }}
      />

      {/* Messages Screen */}
      <Stack.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{ 
          title: 'Messages',
          headerShown: true,
          ...getTransitionForScreen('Messages', 'modal'),
          // Messages screen styling
          headerStyle: {
            backgroundColor: theme.colors.background.secondary,
            borderBottomColor: theme.colors.primary[500],
            borderBottomWidth: 1,
          },
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;