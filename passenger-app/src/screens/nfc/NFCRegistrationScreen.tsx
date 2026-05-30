import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { registerNFC } from '../../services/api/nfc';

interface NFCRegistrationScreenProps {
  navigation: any;
}

const NFCRegistrationScreen: React.FC<NFCRegistrationScreenProps> = ({ navigation }) => {
  const [nfcId, setNfcId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegisterNFC = async () => {
    if (!nfcId.trim()) {
      Alert.alert('Error', 'Please enter your NFC ID');
      return;
    }

    setLoading(true);
    try {
      const response = await registerNFC(nfcId.trim());
      Alert.alert(
        'Success',
        response.message || 'NFC registered successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('NFC registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || 'Failed to register NFC. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="card-outline" size={80} color="#007AFF" />
          <Text style={styles.title}>Register NFC Card</Text>
          <Text style={styles.subtitle}>
            Link your NFC card or phone to enable tap-to-ride
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to get your NFC ID:</Text>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.instructionText}>
              Tap your NFC card/phone on any bus reader
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.instructionText}>
              The reader will display your NFC ID
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.instructionText}>
              Enter the ID below to register
            </Text>
          </View>
        </View>

        {/* Input Form */}
        <View style={styles.form}>
          <Text style={styles.label}>NFC ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your NFC ID (e.g., 04:A1:B2:C3:D4:E5:F6)"
            value={nfcId}
            onChangeText={setNfcId}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegisterNFC}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="card" size={20} color="#FFFFFF" />
                <Text style={styles.registerButtonText}>Register NFC</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <Text style={styles.infoText}>
            Once registered, you can tap your card/phone on any bus to start your ride.
            Tap again when exiting to automatically calculate and deduct the fare.
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Benefits of NFC Tap-to-Ride:</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="flash" size={18} color="#FF9500" />
            <Text style={styles.benefitText}>Fast boarding - no app needed</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="shield-checkmark" size={18} color="#34C759" />
            <Text style={styles.benefitText}>Automatic fare calculation</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="wallet" size={18} color="#007AFF" />
            <Text style={styles.benefitText}>Direct wallet deduction</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="time" size={18} color="#5856D6" />
            <Text style={styles.benefitText}>Real-time ride tracking</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    marginBottom: 20,
  },
  registerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonDisabled: {
    backgroundColor: '#999',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
  },
});

export default NFCRegistrationScreen;
