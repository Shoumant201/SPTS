import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DriverButton } from '../../components';
import DriverInput from '../../components/forms/DriverInput';
import { authService, LoginCredentials } from '../../services/authService';
import { theme } from '../../constants/theme';
import { RootStackParamList } from '../../types';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

interface FormData {
  username: string;
  password: string;
}

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already authenticated on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        navigation.replace('Dashboard');
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error when user makes changes
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const credentials: LoginCredentials = {
        username: formData.username.trim(),
        password: formData.password,
      };

      const authResponse = await authService.login(credentials);
      
      // Login successful - navigate to dashboard
      navigation.replace('Dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      
      setErrors({
        general: errorMessage,
      });

      // Show alert for better user feedback
      Alert.alert(
        'Login Failed',
        errorMessage,
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setFormData({
      username: 'driver123',
      password: 'password123',
    });
    setErrors({});
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Company Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>SPTM</Text>
              <Text style={styles.logoSubtext}>Driver Portal</Text>
            </View>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            {/* General Error Message */}
            {errors.general && (
              <View style={styles.errorContainer}>
                <Text style={styles.generalError}>{errors.general}</Text>
              </View>
            )}

            {/* Username Input */}
            <DriverInput
              label="Username"
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              error={errors.username}
              required
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              placeholder="Enter your username"
              editable={!isLoading}
            />

            {/* Password Input */}
            <DriverInput
              label="Password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              error={errors.password}
              required
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              placeholder="Enter your password"
              editable={!isLoading}
              onSubmitEditing={handleLogin}
            />

            {/* Login Button */}
            <DriverButton
              title={isLoading ? 'Signing In...' : 'Sign In'}
              onPress={handleLogin}
              variant="primary"
              size="large"
              disabled={isLoading}
              loading={isLoading}
            />

            {/* Demo Credentials Helper */}
            <View style={styles.demoContainer}>
              <Text style={styles.demoText}>Demo Credentials:</Text>
              <DriverButton
                title="Use Demo Login"
                onPress={handleDemoLogin}
                variant="secondary"
                size="medium"
                disabled={isLoading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  keyboardAvoidingView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing[6],
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing[10],
  },

  logoPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  logoText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    letterSpacing: 2,
  },

  logoSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.inverse,
    marginTop: theme.spacing[1],
  },

  formContainer: {
    width: '100%',
  },

  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },

  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[8],
  },

  errorContainer: {
    backgroundColor: theme.colors.danger[900],
    borderColor: theme.colors.danger[500],
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing[3],
    marginBottom: theme.spacing[4],
  },

  generalError: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.danger[500],
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
  },

  demoContainer: {
    marginTop: theme.spacing[8],
    padding: theme.spacing[4],
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },

  demoText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
});

export default LoginScreen;