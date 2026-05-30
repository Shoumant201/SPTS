import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { incidentApi, ReportIncidentData } from '../../services/api/incidents';
import axiosInstance from '../../services/axiosInstance';

interface Assignment {
  id: string;
  vehicle: { id: string; plateNumber: string };
  route: { id: string; name: string };
}

const INCIDENT_TYPES = [
  { value: 'BREAKDOWN', label: 'Vehicle Breakdown', icon: '🔧', severity: 'HIGH' },
  { value: 'ACCIDENT', label: 'Accident', icon: '🚨', severity: 'CRITICAL' },
  { value: 'DELAY', label: 'Delay', icon: '⏰', severity: 'MEDIUM' },
  { value: 'TRAFFIC', label: 'Traffic Jam', icon: '🚦', severity: 'LOW' },
  { value: 'WEATHER', label: 'Weather Issue', icon: '🌧️', severity: 'MEDIUM' },
  { value: 'MEDICAL', label: 'Medical Emergency', icon: '🏥', severity: 'CRITICAL' },
  { value: 'OTHER', label: 'Other', icon: '📝', severity: 'MEDIUM' },
];

interface ReportIncidentScreenProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReportIncidentScreen: React.FC<ReportIncidentScreenProps> = ({
  onClose,
  onSuccess,
}) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedDelay, setEstimatedDelay] = useState('');
  const [affectedPassengers, setAffectedPassengers] = useState('');
  const [requiresAssistance, setRequiresAssistance] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    loadCurrentLocation();
    loadCurrentAssignment();
  }, []);

  const loadCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const loadCurrentAssignment = async () => {
    try {
      const res = await axiosInstance.get('/api/assignments/my');
      const assignments = res.data.assignments || [];
      const today = assignments.find((a: any) => a.runsToday);
      setAssignment(today || assignments[0] || null);
    } catch (error) {
      console.error('Load assignment error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select an incident type');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    try {
      setLoading(true);

      const selectedIncident = INCIDENT_TYPES.find((t) => t.value === selectedType);
      
      const data: ReportIncidentData = {
        type: selectedType as any,
        severity: selectedIncident?.severity as any,
        title: title.trim(),
        description: description.trim(),
        latitude: location?.coords.latitude,
        longitude: location?.coords.longitude,
        vehicleId: assignment?.vehicle.id,
        routeId: assignment?.route.id,
        assignmentId: assignment?.id,
        estimatedDelay: estimatedDelay ? parseInt(estimatedDelay) : undefined,
        affectedPassengers: affectedPassengers ? parseInt(affectedPassengers) : undefined,
        requiresAssistance,
        isEmergency,
      };

      await incidentApi.reportIncident(data);

      Alert.alert(
        'Incident Reported',
        'Your incident report has been submitted successfully. The organization will be notified.',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess?.();
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Report incident error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to report incident. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Report Issue</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Incident Type Selection */}
        <Text style={styles.sectionTitle}>What happened?</Text>
        <View style={styles.typeGrid}>
          {INCIDENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeCard,
                selectedType === type.value && styles.typeCardSelected,
              ]}
              onPress={() => {
                setSelectedType(type.value);
                if (!title) {
                  setTitle(type.label);
                }
                setIsEmergency(type.severity === 'CRITICAL');
              }}
            >
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text style={styles.typeLabel}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Brief summary of the issue"
          maxLength={100}
        />

        {/* Description */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Provide details about what happened..."
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        {/* Current Assignment Info */}
        {assignment && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Current Assignment</Text>
            <Text style={styles.infoText}>
              🚌 {assignment.vehicle.plateNumber}
            </Text>
            <Text style={styles.infoText}>
              🗺️ {assignment.route.name}
            </Text>
          </View>
        )}

        {/* Additional Details */}
        <Text style={styles.sectionTitle}>Additional Details</Text>

        <Text style={styles.label}>Estimated Delay (minutes)</Text>
        <TextInput
          style={styles.input}
          value={estimatedDelay}
          onChangeText={setEstimatedDelay}
          placeholder="e.g., 30"
          keyboardType="number-pad"
          maxLength={4}
        />

        <Text style={styles.label}>Affected Passengers</Text>
        <TextInput
          style={styles.input}
          value={affectedPassengers}
          onChangeText={setAffectedPassengers}
          placeholder="Approximate number"
          keyboardType="number-pad"
          maxLength={3}
        />

        {/* Toggles */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Requires Assistance</Text>
            <Switch
              value={requiresAssistance}
              onValueChange={setRequiresAssistance}
              trackColor={{ false: '#ccc', true: '#FF6B35' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Emergency</Text>
            <Switch
              value={isEmergency}
              onValueChange={setIsEmergency}
              trackColor={{ false: '#ccc', true: '#ef4444' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {isEmergency && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ Emergency reports will be prioritized and the organization will be notified immediately.
            </Text>
          </View>
        )}

        {/* Location Info */}
        {location && (
          <View style={styles.locationBox}>
            <Text style={styles.locationText}>
              📍 Location: {location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)}
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: { fontSize: 24, color: '#666' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  typeCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  typeCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#fff5f0',
  },
  typeIcon: { fontSize: 32, marginBottom: 8 },
  typeLabel: { fontSize: 12, textAlign: 'center', color: '#333' },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  infoBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 6,
  },
  infoText: { fontSize: 13, color: '#1b5e20', marginBottom: 2 },
  toggleRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  toggleItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  toggleLabel: { fontSize: 14, color: '#333', fontWeight: '500' },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  warningText: { fontSize: 13, color: '#92400e' },
  locationBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  locationText: { fontSize: 12, color: '#0c4a6e' },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: { backgroundColor: '#ccc' },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
});
