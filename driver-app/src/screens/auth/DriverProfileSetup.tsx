import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { driverProfileApi, CreateProfileData } from '../../services/api/driverProfile';

interface DriverProfileSetupProps {
  onComplete: () => void;
}

export const DriverProfileSetup: React.FC<DriverProfileSetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'license' | 'details'>('license');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  // License validation step
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseData, setLicenseData] = useState<any>(null);

  // Profile details step
  const [experience, setExperience] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [customAddress, setCustomAddress] = useState('');

  const formatLicenseNumber = (text: string) => {
    // Remove all non-alphanumeric characters
    const cleaned = text.replace(/[^0-9]/g, '');
    
    // Format as XX-XX-XXXX-XXXXX
    let formatted = '';
    if (cleaned.length > 0) {
      formatted = cleaned.substring(0, 2);
      if (cleaned.length > 2) {
        formatted += '-' + cleaned.substring(2, 4);
      }
      if (cleaned.length > 4) {
        formatted += '-' + cleaned.substring(4, 8);
      }
      if (cleaned.length > 8) {
        formatted += '-' + cleaned.substring(8, 13);
      }
    }
    return formatted;
  };

  const handleLicenseInput = (text: string) => {
    const formatted = formatLicenseNumber(text);
    setLicenseNumber(formatted);
  };

  const validateLicense = async () => {
    if (!licenseNumber || licenseNumber.length < 17) {
      Alert.alert('Error', 'Please enter a valid license number (XX-XX-XXXX-XXXXX)');
      return;
    }

    try {
      setValidating(true);
      const response = await driverProfileApi.validateLicense(licenseNumber);

      if (response.isValid && response.licenseData) {
        setLicenseData(response.licenseData);
        setCustomAddress(response.licenseData.address);
        setStep('details');
        Alert.alert('Success', 'License validated successfully!');
      } else {
        Alert.alert('Invalid License', response.error || 'License not found in government database');
      }
    } catch (error: any) {
      Alert.alert(
        'Validation Failed',
        error.response?.data?.error || 'Failed to validate license. Please try again.'
      );
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!emergencyContact) {
      Alert.alert('Error', 'Please enter an emergency contact number');
      return;
    }

    if (emergencyContact.length < 10) {
      Alert.alert('Error', 'Please enter a valid emergency contact number');
      return;
    }

    try {
      setLoading(true);

      const profileData: CreateProfileData = {
        licenseNumber: licenseData.licenseNumber,
        licenseExpiryDate: licenseData.expiryDate,
        licenseType: licenseData.licenseType,
        experience: experience ? parseInt(experience) : undefined,
        address: customAddress || licenseData.address,
        emergencyContact,
        bloodGroup: licenseData.bloodGroup
      };

      await driverProfileApi.createOrUpdateProfile(profileData);
      
      Alert.alert(
        'Profile Created',
        'Your driver profile has been created successfully!',
        [{ text: 'Continue', onPress: onComplete }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to create profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === 'license') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Driver License Verification</Text>
          <Text style={styles.subtitle}>
            Enter your Nepali driving license number to verify your credentials
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>License Number</Text>
          <Text style={styles.hint}>Format: XX-XX-XXXX-XXXXX</Text>
          <TextInput
            style={styles.input}
            value={licenseNumber}
            onChangeText={handleLicenseInput}
            placeholder="01-01-2020-00001"
            keyboardType="number-pad"
            maxLength={17}
            autoCapitalize="characters"
          />

          <View style={styles.exampleBox}>
            <Text style={styles.exampleTitle}>Test License Numbers:</Text>
            <TouchableOpacity onPress={() => setLicenseNumber('01-01-2020-00001')}>
              <Text style={styles.exampleText}>• 01-01-2020-00001</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLicenseNumber('02-05-2021-12345')}>
              <Text style={styles.exampleText}>• 02-05-2021-12345</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLicenseNumber('03-10-2019-99999')}>
              <Text style={styles.exampleText}>• 03-10-2019-99999</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, validating && styles.buttonDisabled]}
            onPress={validateLicense}
            disabled={validating}
          >
            {validating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Validate License</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          Add additional information to complete your driver profile
        </Text>
      </View>

      {licenseData && (
        <View style={styles.licenseInfo}>
          <Text style={styles.licenseInfoTitle}>Verified License Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{licenseData.fullName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>License No:</Text>
            <Text style={styles.infoValue}>{licenseData.licenseNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{licenseData.licenseType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Blood Group:</Text>
            <Text style={styles.infoValue}>{licenseData.bloodGroup || 'N/A'}</Text>
          </View>
        </View>
      )}

      <View style={styles.form}>
        <Text style={styles.label}>Driving Experience (Years)</Text>
        <TextInput
          style={styles.input}
          value={experience}
          onChangeText={setExperience}
          placeholder="e.g., 5"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Emergency Contact Number *</Text>
        <TextInput
          style={styles.input}
          value={emergencyContact}
          onChangeText={setEmergencyContact}
          placeholder="9800000000"
          keyboardType="phone-pad"
          maxLength={10}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={customAddress}
          onChangeText={setCustomAddress}
          placeholder="Enter your address"
          multiline
          numberOfLines={3}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setStep('license')}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Complete Setup</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  contentContainer: {
    padding: 20
  },
  header: {
    marginBottom: 30
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8
      },
      android: {
        elevation: 4
      }
    })
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16
  },
  hint: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  exampleBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 8
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  exampleText: {
    fontSize: 14,
    color: '#007AFF',
    marginVertical: 4
  },
  licenseInfo: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  licenseInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
    fontWeight: '500'
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24
  },
  buttonDisabled: {
    backgroundColor: '#ccc'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24
  },
  primaryButton: {
    flex: 1
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF'
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600'
  }
});
