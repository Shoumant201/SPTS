import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import DriverButton from './DriverButton';
import { theme } from '../../constants/theme';

/**
 * Example usage of the DriverButton component
 * This demonstrates all variants, sizes, and states
 */
const DriverButtonExample: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const handlePress = (variant: string) => {
    console.log(`${variant} button pressed`);
  };

  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>DriverButton Component Examples</Text>
      
      {/* Primary Variants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Primary Buttons</Text>
        <DriverButton
          title="Start Trip"
          onPress={() => handlePress('Start Trip')}
          variant="primary"
          size="large"
        />
        <DriverButton
          title="Continue"
          onPress={() => handlePress('Continue')}
          variant="primary"
          size="medium"
        />
      </View>

      {/* Danger Variants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Buttons</Text>
        <DriverButton
          title="End Trip"
          onPress={() => handlePress('End Trip')}
          variant="danger"
          size="large"
        />
        <DriverButton
          title="Emergency Stop"
          onPress={() => handlePress('Emergency')}
          variant="danger"
          size="medium"
        />
      </View>

      {/* Warning Variants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Warning Buttons</Text>
        <DriverButton
          title="Report Incident"
          onPress={() => handlePress('Report Incident')}
          variant="warning"
          size="large"
        />
        <DriverButton
          title="Traffic Delay"
          onPress={() => handlePress('Traffic Delay')}
          variant="warning"
          size="medium"
        />
      </View>

      {/* Secondary Variants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Secondary Buttons</Text>
        <DriverButton
          title="View Messages"
          onPress={() => handlePress('View Messages')}
          variant="secondary"
          size="large"
        />
        <DriverButton
          title="Settings"
          onPress={() => handlePress('Settings')}
          variant="secondary"
          size="medium"
        />
      </View>

      {/* State Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Button States</Text>
        <DriverButton
          title="Disabled Button"
          onPress={() => handlePress('Disabled')}
          variant="primary"
          size="large"
          disabled={true}
        />
        <DriverButton
          title={loading ? "Loading..." : "Test Loading"}
          onPress={handleLoadingTest}
          variant="primary"
          size="large"
          loading={loading}
        />
      </View>

      {/* Accessibility Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accessibility Features</Text>
        <Text style={styles.description}>
          All buttons include:
          {'\n'}• Minimum 48px touch targets (60px for large)
          {'\n'}• High contrast colors (4.5:1 ratio)
          {'\n'}• Screen reader support
          {'\n'}• Clear focus indicators
          {'\n'}• Descriptive accessibility hints
        </Text>
        <DriverButton
          title="Accessible Button Example"
          onPress={() => handlePress('Accessible')}
          variant="primary"
          size="large"
        />
      </View>

      {/* Long Text Example */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Long Text Handling</Text>
        <DriverButton
          title="This is a very long button title that demonstrates text adjustment"
          onPress={() => handlePress('Long Text')}
          variant="primary"
          size="large"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  section: {
    marginBottom: theme.spacing[6],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },
  description: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[4],
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
  },
});

export default DriverButtonExample;