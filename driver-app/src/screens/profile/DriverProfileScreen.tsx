import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PhoneUser } from '../../services/api/phoneAuth';
import { driverProfileApi, DriverProfile } from '../../services/api/driverProfile';

interface DriverProfileScreenProps {
  user: PhoneUser;
  onLogout: () => void;
}

interface EditableFields {
  experience: string;
  address: string;
  emergencyContact: string;
  bloodGroup: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const InfoRow: React.FC<{ label: string; value?: string | number | null; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, mono && styles.infoValueMono]}>
      {value != null && value !== '' ? String(value) : '—'}
    </Text>
  </View>
);

const DriverProfileScreen: React.FC<DriverProfileScreenProps> = ({ user, onLogout }) => {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<EditableFields>({
    experience: '',
    address: '',
    emergencyContact: '',
    bloodGroup: '',
  });

  const loadProfile = useCallback(async () => {
    try {
      const res = await driverProfileApi.getProfile();
      const p: DriverProfile = res.driver?.profile;
      setProfile(p ?? null);
      if (p) {
        setFields({
          experience: p.experience != null ? String(p.experience) : '',
          address: p.address ?? '',
          emergencyContact: p.emergencyContact ?? '',
          bloodGroup: p.bloodGroup ?? '',
        });
      }
    } catch {
      // profile may not exist yet — that's fine
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await driverProfileApi.createOrUpdateProfile({
        licenseNumber: profile.licenseNumber,
        licenseExpiryDate: profile.licenseExpiryDate,
        licenseType: profile.licenseType,
        experience: fields.experience ? parseInt(fields.experience, 10) : undefined,
        address: fields.address || undefined,
        emergencyContact: fields.emergencyContact || undefined,
        bloodGroup: fields.bloodGroup || undefined,
      });
      setProfile(res.profile);
      setEditing(false);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFields({
        experience: profile.experience != null ? String(profile.experience) : '',
        address: profile.address ?? '',
        emergencyContact: profile.emergencyContact ?? '',
        bloodGroup: profile.bloodGroup ?? '',
      });
    }
    setEditing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: onLogout },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </SafeAreaView>
    );
  }

  const expiryDate = profile?.licenseExpiryDate
    ? new Date(profile.licenseExpiryDate).toLocaleDateString()
    : null;
  const isExpiringSoon = profile?.licenseExpiryDate
    ? new Date(profile.licenseExpiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : false;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.name}>{user.name || 'Driver'}</Text>
            <Text style={styles.phone}>{user.phone}</Text>
          </View>

          {/* License card */}
          {profile ? (
            <>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>🪪 License</Text>
                  {isExpiringSoon && (
                    <View style={styles.warningBadge}>
                      <Text style={styles.warningText}>Expiring soon</Text>
                    </View>
                  )}
                </View>
                <InfoRow label="License No." value={profile.licenseNumber} mono />
                <InfoRow label="Type" value={profile.licenseType} />
                <InfoRow label="Expiry" value={expiryDate} />
                <InfoRow label="Total Trips" value={profile.totalTrips} />
                {profile.rating != null && profile.rating > 0 && (
                  <InfoRow label="Rating" value={`${profile.rating.toFixed(1)} ⭐`} />
                )}
              </View>

              {/* Editable details */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>👤 Details</Text>
                  {!editing && (
                    <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {editing ? (
                  <>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Experience (years)</Text>
                      <TextInput
                        style={styles.input}
                        value={fields.experience}
                        onChangeText={v => setFields(f => ({ ...f, experience: v.replace(/[^0-9]/g, '') }))}
                        keyboardType="numeric"
                        placeholder="e.g. 5"
                        placeholderTextColor="#bbb"
                        maxLength={2}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Blood Group</Text>
                      <View style={styles.bloodGroupRow}>
                        {BLOOD_GROUPS.map(bg => (
                          <TouchableOpacity
                            key={bg}
                            style={[
                              styles.bloodGroupChip,
                              fields.bloodGroup === bg && styles.bloodGroupChipActive,
                            ]}
                            onPress={() => setFields(f => ({ ...f, bloodGroup: bg }))}
                          >
                            <Text
                              style={[
                                styles.bloodGroupChipText,
                                fields.bloodGroup === bg && styles.bloodGroupChipTextActive,
                              ]}
                            >
                              {bg}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Address</Text>
                      <TextInput
                        style={[styles.input, styles.inputMultiline]}
                        value={fields.address}
                        onChangeText={v => setFields(f => ({ ...f, address: v }))}
                        placeholder="Your address"
                        placeholderTextColor="#bbb"
                        multiline
                        numberOfLines={2}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Emergency Contact</Text>
                      <TextInput
                        style={styles.input}
                        value={fields.emergencyContact}
                        onChangeText={v => setFields(f => ({ ...f, emergencyContact: v }))}
                        placeholder="Phone number"
                        placeholderTextColor="#bbb"
                        keyboardType="phone-pad"
                      />
                    </View>

                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={handleCancelEdit}
                        disabled={saving}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={saving}
                      >
                        {saving
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={styles.saveBtnText}>Save</Text>
                        }
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <InfoRow label="Experience" value={profile.experience != null ? `${profile.experience} yrs` : null} />
                    <InfoRow label="Blood Group" value={profile.bloodGroup} />
                    <InfoRow label="Address" value={profile.address} />
                    <InfoRow label="Emergency Contact" value={profile.emergencyContact} mono />
                  </>
                )}
              </View>
            </>
          ) : (
            <View style={[styles.card, styles.noProfileCard]}>
              <Text style={styles.noProfileIcon}>📋</Text>
              <Text style={styles.noProfileText}>No driver profile set up yet</Text>
              <Text style={styles.noProfileSub}>Complete your profile setup to get started</Text>
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  header: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  phone: { fontSize: 15, color: '#666' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },

  warningBadge: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  warningText: { fontSize: 11, color: '#e65100', fontWeight: '600' },

  editBtn: {
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  editBtnText: { fontSize: 13, color: '#2563eb', fontWeight: '600' },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabel: { fontSize: 13, color: '#888', flex: 1 },
  infoValue: { fontSize: 14, color: '#1a1a1a', fontWeight: '500', flex: 2, textAlign: 'right' },
  infoValueMono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: '#666', marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  inputMultiline: { minHeight: 64, textAlignVertical: 'top' },

  bloodGroupRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bloodGroupChip: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#fafafa',
  },
  bloodGroupChipActive: { borderColor: '#FF6B35', backgroundColor: '#fff5f0' },
  bloodGroupChipText: { fontSize: 13, color: '#666' },
  bloodGroupChipTextActive: { color: '#FF6B35', fontWeight: '600' },

  editActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, color: '#666', fontWeight: '600' },
  saveBtn: {
    flex: 2,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },

  noProfileCard: { alignItems: 'center', paddingVertical: 32 },
  noProfileIcon: { fontSize: 40, marginBottom: 12 },
  noProfileText: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6 },
  noProfileSub: { fontSize: 13, color: '#999', textAlign: 'center' },

  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff5f5',
  },
  logoutText: { fontSize: 15, color: '#e53935', fontWeight: '600' },
});

export default DriverProfileScreen;
