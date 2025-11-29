import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { authApi, organizationApi, User, Organization } from './src/services/api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [selectedOrganizationName, setSelectedOrganizationName] = useState('');
  const [showOrganizationPicker, setShowOrganizationPicker] = useState(false);

  useEffect(() => {
    checkAuth();
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const orgs = await organizationApi.getActiveOrganizations();
      setOrganizations(orgs);
      // Auto-select first organization if available
      if (orgs.length > 0) {
        setSelectedOrganizationId(orgs[0].id);
        setSelectedOrganizationName(orgs[0].name);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  };

  const selectOrganization = (org: Organization) => {
    setSelectedOrganizationId(org.id);
    setSelectedOrganizationName(org.name);
    setShowOrganizationPicker(false);
  };

  const checkAuth = async () => {
    try {
      // Use TokenStorageService instead of direct AsyncStorage
      const { TokenStorageService } = await import('./src/services/tokenStorage');
      const isAuthenticated = await TokenStorageService.isAuthenticated();
      
      if (!isAuthenticated) return;

      const userData = await authApi.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear all tokens on auth failure
      const { TokenStorageService } = await import('./src/services/tokenStorage');
      await TokenStorageService.clearTokens();
    }
  };

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isLogin && !selectedOrganizationId) {
      Alert.alert('Error', 'Please select an organization');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const response = await authApi.login({ email, password });
        
        // Use the safe storage method instead of direct AsyncStorage
        await authApi.storeAuthResponse(response);
        
        setUser(response.user);
        Alert.alert('Success', 'Login successful!');
      } else {
        await authApi.register({ 
          email, 
          password, 
          name, 
          role: 'DRIVER',
          organizationId: selectedOrganizationId
        });
        Alert.alert('Success', 'Registration successful! Please login.');
        setIsLogin(true);
        setName('');
        setPassword('');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Something went wrong';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Use TokenStorageService to clear all tokens
      const { TokenStorageService } = await import('./src/services/tokenStorage');
      await TokenStorageService.clearTokens();
      setUser(null);
      setEmail('');
      setPassword('');
      Alert.alert('Success', 'Logged out successfully');
    }
  };

  if (user) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>SPTM Driver App</Text>

          <View style={styles.userCard}>
            <Text style={styles.welcomeText}>Welcome, {user.email}!</Text>
            <View style={styles.userInfo}>
              <Text style={styles.infoText}>ID: {user.id}</Text>
              <Text style={styles.infoText}>Role: {user.role}</Text>
              {user.organizationId && (
                <Text style={styles.infoText}>Organization: {user.organizationId}</Text>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>SPTM Driver App</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.activeTab]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
              Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.activeTab]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
              Register
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Organization</Text>
                <TouchableOpacity
                  style={styles.organizationSelector}
                  onPress={() => setShowOrganizationPicker(true)}
                >
                  <Text style={[styles.organizationText, !selectedOrganizationName && styles.placeholderText]}>
                    {selectedOrganizationName || 'Select an organization...'}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isLogin ? 'Login' : 'Register'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Organization Picker Modal */}
        <Modal
          visible={showOrganizationPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowOrganizationPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Organization</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowOrganizationPicker(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={organizations}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.organizationItem,
                      selectedOrganizationId === item.id && styles.selectedOrganizationItem
                    ]}
                    onPress={() => selectOrganization(item)}
                  >
                    <Text style={[
                      styles.organizationItemText,
                      selectedOrganizationId === item.id && styles.selectedOrganizationItemText
                    ]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  organizationSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  organizationText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
  },
  organizationItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedOrganizationItem: {
    backgroundColor: '#FF6B35',
  },
  organizationItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOrganizationItemText: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userCard: {
    backgroundColor: '#fff3e0',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffcc80',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 10,
  },
  userInfo: {
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#f57c00',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});