import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { PhoneUser } from '../../services/api/phoneAuth';

interface ProfileScreenProps {
  user: PhoneUser;
  onLogout: () => void;
  onBack: () => void;
}

interface ProfileData {
  name: string;
  phone: string;
  email: string;
  profilePicture?: string;
}

interface NotificationSettings {
  busArrival: boolean;
  tripReminders: boolean;
  discountUpdates: boolean;
  promotions: boolean;
  systemAlerts: boolean;
}

interface PrivacySettings {
  shareLocation: boolean;
  showOnlineStatus: boolean;
  allowAnalytics: boolean;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout, onBack }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: user.name || '',
    phone: user.phone || '',
    email: '',
    profilePicture: undefined,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    busArrival: true,
    tripReminders: true,
    discountUpdates: true,
    promotions: false,
    systemAlerts: true,
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    shareLocation: true,
    showOnlineStatus: false,
    allowAnalytics: true,
  });

  const handleSaveProfile = async () => {
    if (!profileData.name.trim()) {
      Alert.alert('Name Required', 'Please enter your name');
      return;
    }

    try {
      setLoading(true);
      // TODO: API call to update profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePhone = () => {
    Alert.alert(
      'Change Phone Number',
      'You will be logged out and need to verify your new phone number',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            Alert.alert('Coming Soon', 'Phone number change will be available soon');
          },
        },
      ]
    );
  };

  const handleUploadPicture = () => {
    Alert.alert(
      'Upload Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => Alert.alert('Coming Soon', 'Camera feature coming soon') },
        { text: 'Choose from Gallery', onPress: () => Alert.alert('Coming Soon', 'Gallery feature coming soon') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSaveNotifications = async () => {
    try {
      setLoading(true);
      // TODO: API call to save notification settings
      await new Promise(resolve => setTimeout(resolve, 500));
      Alert.alert('Success', 'Notification preferences saved');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    try {
      setLoading(true);
      // TODO: API call to save privacy settings
      await new Promise(resolve => setTimeout(resolve, 500));
      Alert.alert('Success', 'Privacy settings saved');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Profile Picture */}
      <View style={styles.pictureSection}>
        <View style={styles.pictureContainer}>
          {profileData.profilePicture ? (
            <Image source={{ uri: profileData.profilePicture }} style={styles.profilePicture} />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Text style={styles.profilePicturePlaceholderText}>
                {profileData.name?.charAt(0).toUpperCase() || 'A'}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPicture}>
          <Text style={styles.uploadButtonText}>📷 Change Picture</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Form */}
      <View style={styles.formSection}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={profileData.name}
            onChangeText={(text) => setProfileData({ ...profileData, name: text })}
            editable={isEditing}
            placeholder="Enter your name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneRow}>
            <TextInput
              style={[styles.input, styles.inputDisabled, { flex: 1 }]}
              value={profileData.phone}
              editable={false}
            />
            <TouchableOpacity style={styles.changePhoneButton} onPress={handleChangePhone}>
              <Text style={styles.changePhoneText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email (Optional)</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={profileData.email}
            onChangeText={(text) => setProfileData({ ...profileData, email: text })}
            editable={isEditing}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Action Buttons */}
        {isEditing ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => {
                setIsEditing(false);
                setProfileData({
                  name: user.name || '',
                  phone: user.phone || '',
                  email: '',
                });
              }}
            >
              <Text style={styles.buttonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSaveProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonPrimaryText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, { width: '100%' }]}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.buttonPrimaryText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerZone}>
        <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={onLogout}>
          <Text style={styles.dangerButtonText}>🚪 Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={() => {
            Alert.alert(
              'Delete Account',
              'Are you sure? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => Alert.alert('Coming Soon', 'Account deletion will be available soon'),
                },
              ]
            );
          }}
        >
          <Text style={styles.dangerButtonText}>🗑️ Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderNotificationsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Push Notifications</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Bus Arrival Alerts</Text>
            <Text style={styles.settingDescription}>Get notified when your bus is arriving</Text>
          </View>
          <Switch
            value={notificationSettings.busArrival}
            onValueChange={(value) =>
              setNotificationSettings({ ...notificationSettings, busArrival: value })
            }
            trackColor={{ false: '#ccc', true: '#007AFF' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Trip Reminders</Text>
            <Text style={styles.settingDescription}>Reminders for upcoming trips</Text>
          </View>
          <Switch
            value={notificationSettings.tripReminders}
            onValueChange={(value) =>
              setNotificationSettings({ ...notificationSettings, tripReminders: value })
            }
            trackColor={{ false: '#ccc', true: '#007AFF' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Discount Updates</Text>
            <Text style={styles.settingDescription}>Updates on your discount applications</Text>
          </View>
          <Switch
            value={notificationSettings.discountUpdates}
            onValueChange={(value) =>
              setNotificationSettings({ ...notificationSettings, discountUpdates: value })
            }
            trackColor={{ false: '#ccc', true: '#007AFF' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Promotions & Offers</Text>
            <Text style={styles.settingDescription}>Special deals and promotions</Text>
          </View>
          <Switch
            value={notificationSettings.promotions}
            onValueChange={(value) =>
              setNotificationSettings({ ...notificationSettings, promotions: value })
            }
            trackColor={{ false: '#ccc', true: '#007AFF' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>System Alerts</Text>
            <Text style={styles.settingDescription}>Important system notifications</Text>
          </View>
          <Switch
            value={notificationSettings.systemAlerts}
            onValueChange={(value) =>
              setNotificationSettings({ ...notificationSettings, systemAlerts: value })
            }
            trackColor={{ false: '#ccc', true: '#007AFF' }}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, { marginTop: 20 }]}
          onPress={handleSaveNotifications}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonPrimaryText}>Save Preferences</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderPrivacyTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Privacy Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Share Location</Text>
            <Text style={styles.settingDescription}>Allow app to access your location</Text>
          </View>
          <Switch
            value={privacySettings.shareLocation}
            onValueChange={(value) =>
              setPrivacySettings({ ...privacySettings, shareLocation: value })
            }
            trackColor={{ false: '#ccc', true: '#007AFF' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Show Online Status</Text>
            <Text style={styles.settingDescription}>Let others see when you're active</Text>
          </View>
          <Switch
            value={privacySettings.showOnlineStatus}
            onValueChange={(value) =>
              setPrivacySettings({ ...privacySettings, showOnlineStatus: value })
            }
            trackColor={{ false: '#ccc', true: '#007AFF' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Usage Analytics</Text>
            <Text style={styles.settingDescription}>Help improve the app with usage data</Text>
          </View>
          <Switch
            value={privacySettings.allowAnalytics}
            onValueChange={(value) =>
              setPrivacySettings({ ...privacySettings, allowAnalytics: value })
            }
            trackColor={{ false: '#ccc', true: '#007AFF' }}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, { marginTop: 20 }]}
          onPress={handleSavePrivacy}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonPrimaryText}>Save Settings</Text>
          )}
        </TouchableOpacity>

        <View style={styles.privacyInfo}>
          <Text style={styles.privacyInfoTitle}>📋 Privacy Policy</Text>
          <Text style={styles.privacyInfoText}>
            We respect your privacy. Your data is encrypted and never shared with third parties without your consent.
          </Text>
          <TouchableOpacity onPress={() => Alert.alert('Privacy Policy', 'Full privacy policy coming soon')}>
            <Text style={styles.privacyInfoLink}>Read Full Privacy Policy →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={styles.backButton} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
            👤 Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notifications' && styles.tabActive]}
          onPress={() => setActiveTab('notifications')}
        >
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
            🔔 Notifications
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.tabActive]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
            🔒 Privacy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'notifications' && renderNotificationsTab()}
      {activeTab === 'privacy' && renderPrivacyTab()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  pictureSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  pictureContainer: {
    marginBottom: 16,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicturePlaceholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  uploadButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f0f7ff',
    borderRadius: 20,
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputDisabled: {
    backgroundColor: '#f8f9fa',
    color: '#666',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 12,
  },
  changePhoneButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    justifyContent: 'center',
  },
  changePhoneText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonSecondary: {
    backgroundColor: '#f0f0f0',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  dangerZone: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 32,
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
    marginBottom: 16,
  },
  dangerButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ffcdd2',
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButtonText: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: '500',
  },
  settingsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
  privacyInfo: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  privacyInfoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  privacyInfoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  privacyInfoLink: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default ProfileScreen;
