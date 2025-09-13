import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView, Text, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const Stack = createStackNavigator();

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>SPTM Passenger</Text>
        <Text style={styles.subtitle}>Smart Public Transport Management</Text>
        <Text style={styles.description}>
          Welcome to the passenger app. Here you can:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.feature}>• Find nearby bus stops</Text>
          <Text style={styles.feature}>• Track real-time arrivals</Text>
          <Text style={styles.feature}>• Plan your journey</Text>
          <Text style={styles.feature}>• Purchase tickets</Text>
        </View>
      </View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'SPTM Passenger' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  description: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureList: {
    alignItems: 'flex-start',
  },
  feature: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 8,
    paddingLeft: 10,
  },
});

export default App;