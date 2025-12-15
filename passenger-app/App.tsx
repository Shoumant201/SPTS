import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { phoneAuthApi, PhoneUser } from './src/services/api/phoneAuth';
import { TokenStorageService } from './src/services/tokenStorage';
import TabNavigator from './src/components/TabNavigator';

type AuthScreen = 'phone' | 'otp' | 'name';

export default function App() {
  const [user, setUser] = useState<PhoneUser | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [screen, setScreen] = useState<AuthScreen>('phone');
  const [isNewUser, setIsNewUser] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const checkAuth = async () => {
    try {
      // First check if we have stored user data locally
      const storedUser = await TokenStorageService.getUser();
      
      if (storedUser && storedUser.phone) {
        // We have local user data, use it directly
        setUser({
          id: storedUser.id,
          phone: storedUser.phone,
          name: storedUser.name || null,
          role: storedUser.role as 'PASSENGER' | 'DRIVER',
          isPhoneVerified: true,
          organizationId: storedUser.organizationId,
          createdAt: storedUser.createdAt || new Date().toISOString(),
        });
        setInitialLoading(false);
        return;
      }

      // No local user, check if authenticated
      const isAuthenticated = await TokenStorageService.isAuthenticated();
      
      if (!isAuthenticated) {
        setInitialLoading(false);
        return;
      }

      // Try to get profile from server
      try {
        const profileResponse = await phoneAuthApi.getProfile();
        setUser(profileResponse.user);
      } catch (profileError) {
        console.log('Profile fetch failed, using stored data if available');
        // If profile fetch fails but we have tokens, don't log out
        // Just show login screen
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await TokenStorageService.clearTokens();
    } finally {
      setInitialLoading(false);
    }
  };

  const formatPhoneInput = (text: string): string => {
    // Remove non-digits
    const cleaned = text.replace(/\D/g, '');
    return cleaned;
  };

  const handleSendOtp = async () => {
    const cleanedPhone = formatPhoneInput(phone);
    
    if (cleanedPhone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    console.log('Sending OTP to:', cleanedPhone);

    try {
      // First try login
      console.log('Trying LOGIN...');
      await phoneAuthApi.sendOtp({ phone: cleanedPhone, purpose: 'LOGIN' });
      console.log('LOGIN OTP sent successfully');
      setIsNewUser(false);
      setScreen('otp');
      setResendTimer(60);
    } catch (error: any) {
      console.log('LOGIN error:', error.message);
      // If not registered, try registration
      if (error.message.includes('not registered') || error.message.includes('not found')) {
        try {
          console.log('Trying REGISTRATION...');
          await phoneAuthApi.sendOtp({ phone: cleanedPhone, purpose: 'REGISTRATION' });
          console.log('REGISTRATION OTP sent successfully');
          setIsNewUser(true);
          setScreen('otp');
          setResendTimer(60);
        } catch (regError: any) {
          console.log('REGISTRATION error:', regError.message);
          Alert.alert('Error', regError.message || 'Failed to send OTP');
        }
      } else {
        Alert.alert('Error', error.message || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code');
      return;
    }

    if (isNewUser && !name.trim()) {
      setScreen('name');
      return;
    }

    setLoading(true);

    try {
      const cleanedPhone = formatPhoneInput(phone);
      console.log('Verifying OTP:', { phone: cleanedPhone, code: otpCode, purpose: isNewUser ? 'REGISTRATION' : 'LOGIN' });
      
      const response = await phoneAuthApi.verifyOtp({
        phone: cleanedPhone,
        code: otpCode,
        purpose: isNewUser ? 'REGISTRATION' : 'LOGIN',
        name: isNewUser ? name : undefined,
      });

      console.log('OTP verification response:', response);

      if (response.success && response.user) {
        setUser(response.user);
        Alert.alert('Success', isNewUser ? 'Account created successfully!' : 'Welcome back!');
      } else {
        Alert.alert('Error', response.message || 'Verification failed');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      const errorMessage = error.message || 'Failed to verify OTP';
      
      // Handle specific error cases
      if (errorMessage.includes('Invalid') || errorMessage.includes('incorrect')) {
        Alert.alert('Invalid OTP', 'The code you entered is incorrect. Please try again.');
      } else if (errorMessage.includes('expired')) {
        Alert.alert('OTP Expired', 'Your code has expired. Please request a new one.');
      } else {
        Alert.alert('Verification Failed', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    
    setScreen('otp');
    await handleVerifyOtp();
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    try {
      const cleanedPhone = formatPhoneInput(phone);
      await phoneAuthApi.sendOtp({
        phone: cleanedPhone,
        purpose: isNewUser ? 'REGISTRATION' : 'LOGIN',
      });
      setResendTimer(60);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your phone');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await phoneAuthApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setPhone('');
      setOtp(['', '', '', '', '', '']);
      setName('');
      setScreen('phone');
    }
  };

  const goBack = () => {
    if (screen === 'name') {
      setScreen('otp');
    } else if (screen === 'otp') {
      setScreen('phone');
      setOtp(['', '', '', '', '', '']);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Logged in view
  if (user) {
    return <TabNavigator user={user} onLogout={handleLogout} />;
  }

  // Phone input screen
  if (screen === 'phone') {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="auto" />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>SPTM Passenger</Text>
          <Text style={styles.subtitle}>Enter your phone number to continue</Text>

          <View style={styles.form}>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+977</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={(text) => setPhone(formatPhoneInput(text))}
                placeholder="98XXXXXXXX"
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Continue</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Name input screen (for new users)
  if (screen === 'name') {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="auto" />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>What's your name?</Text>
          <Text style={styles.subtitle}>This helps drivers identify you</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              autoCapitalize="words"
              autoFocus
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleNameSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // OTP verification screen
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.phoneHighlight}>+977 {phone}</Text>
        </Text>

        <View style={styles.form}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { otpInputRefs.current[index] = ref; }}
                style={[styles.otpInput, digit && styles.otpInputFilled]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={isNewUser ? () => setScreen('name') : handleVerifyOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isNewUser ? 'Continue' : 'Verify & Login'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendOtp}
            disabled={resendTimer > 0}
          >
            <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
    lineHeight: 24,
  },
  phoneHighlight: {
    fontWeight: '600',
    color: '#007AFF',
  },
  form: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  countryCode: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 12,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    letterSpacing: 1,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
  },
  otpInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  resendTextDisabled: {
    color: '#999',
  },
  termsText: {
    marginTop: 20,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  userCard: {
    backgroundColor: '#e8f5e8',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 16,
  },
  userInfo: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '500',
  },
  homeContent: {
    alignItems: 'center',
    marginBottom: 32,
  },
  homeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  homeSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
