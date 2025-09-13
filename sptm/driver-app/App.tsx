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
        <Text style={styles.title}>SPTM Driver</Text>
        <Text style={styles.subtitle}>Driver Dashboard</Text>
        <Text style={styles.description}>
          Welcome to the driver app. Here you can:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.feature}>• View assigned routes</Text>
          <Text style={styles.feature}>• Update vehicle status</Text>
          <Text style={styles.feature}>• Report incidents</Text>
          <Text style={styles.feature}>• Track passenger count</Text>
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
            backgroundColor: '#059669',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'SPTM Driver' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
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
    color: '#14532d',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#16a34a',
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