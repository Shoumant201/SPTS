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
import { driverProfileApi } from './src/services/api/driverProfile';
import TabNavigator from './src/components/TabNavigator';
import { DriverProfileSetup } from './src/screens/auth/DriverProfileSetup';

type AuthScreen = 'phone' | 'otp' | 'name' | 'profile-setup';

export default function App() {
  const [user, setUser] = useState<PhoneUser | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
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
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);



  const checkAuth = async () => {
    try {
      // First check if we have stored user data locally
      const storedUser = await TokenStorageService.getUser();
      
      if (storedUser && storedUser.phone) {
        // We have local user data, use it directly
        const userData = {
          id: storedUser.id,
          phone: storedUser.phone,
          name: storedUser.name || null,
          role: storedUser.role as 'PASSENGER' | 'DRIVER',
          isPhoneVerified: true,
          organizationId: storedUser.organizationId,
          createdAt: storedUser.createdAt || new Date().toISOString(),
        };
        setUser(userData);
        
        // Check if driver has profile (only for drivers)
        if (userData.role === 'DRIVER') {
          await checkDriverProfile();
        } else {
          setHasProfile(true);
        }
        
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
        
        // Check if driver has profile
        if (profileResponse.user.role === 'DRIVER') {
          await checkDriverProfile();
        } else {
          setHasProfile(true);
        }
      } catch (profileError) {
        console.log('Profile fetch failed, using stored data if available');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await TokenStorageService.clearTokens();
    } finally {
      setInitialLoading(false);
    }
  };

  const checkDriverProfile = async () => {
    try {
      const response = await driverProfileApi.getProfile();
      setHasProfile(!!response.driver?.profile);
    } catch (error) {
      console.log('Driver profile check failed:', error);
      setHasProfile(false);
    }
  };

  const handleProfileSetupComplete = async () => {
    setHasProfile(true);
    // Refresh user data
    await checkAuth();
  };

  const formatPhoneInput = (text: string): string => text.replace(/\D/g, '');

  const handleSendOtp = async () => {
    const cleanedPhone = formatPhoneInput(phone);
    if (cleanedPhone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }
    setLoading(true);
    console.log('Sending OTP to:', cleanedPhone);
    try {
      console.log('Trying LOGIN...');
      await phoneAuthApi.sendOtp({ phone: cleanedPhone, purpose: 'LOGIN' });
      console.log('LOGIN OTP sent successfully');
      setIsNewUser(false);
      setScreen('otp');
      setResendTimer(60);
    } catch (error: any) {
      console.log('LOGIN error:', error.message);
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
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => { if (index + i < 6) newOtp[index + i] = digit; });
      setOtp(newOtp);
      otpInputRefs.current[Math.min(index + digits.length, 5)]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) { Alert.alert('Invalid OTP', 'Please enter the 6-digit code'); return; }
    if (isNewUser && !name.trim()) { setScreen('name'); return; }

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
        
        // For new users, they need to complete profile setup
        // Don't check profile immediately as it will fail (no profile exists yet)
        if (isNewUser && response.user.role === 'DRIVER') {
          setHasProfile(false); // New drivers need to complete profile
          Alert.alert('Success', 'Account created successfully! Please complete your profile.');
        } else if (response.user.role === 'DRIVER') {
          // For existing users, check if profile exists after tokens are stored
          setHasProfile(null); // Set to loading state
          // Small delay to ensure tokens are fully stored and available to axios
          setTimeout(async () => {
            try {
              await checkDriverProfile();
            } catch (error) {
              console.error('Profile check error:', error);
              // If profile check fails, assume no profile
              setHasProfile(false);
            }
          }, 200);
          Alert.alert('Success', 'Welcome back!');
        } else {
          setHasProfile(true);
          Alert.alert('Success', isNewUser ? 'Account created successfully!' : 'Welcome back!');
        }
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
    if (!name.trim()) { Alert.alert('Required', 'Please enter your name'); return; }
    await handleVerifyOtp();
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await phoneAuthApi.sendOtp({ phone: formatPhoneInput(phone), purpose: isNewUser ? 'REGISTRATION' : 'LOGIN' });
      setResendTimer(60);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your phone');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await phoneAuthApi.logout(); } catch (error) { console.error('Logout error:', error); }
    finally { setUser(null); setPhone(''); setOtp(['', '', '', '', '', '']); setName(''); setScreen('phone'); }
  };

  const goBack = () => {
    if (screen === 'name') setScreen('otp');
    else if (screen === 'otp') { setScreen('phone'); setOtp(['', '', '', '', '', '']); }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (user) {
    // Show profile setup if driver doesn't have profile
    if (user.role === 'DRIVER' && hasProfile === false) {
      return (
        <View style={styles.container}>
          <StatusBar style="auto" />
          <DriverProfileSetup onComplete={handleProfileSetupComplete} />
        </View>
      );
    }
    
    // Show loading while checking profile
    if (user.role === 'DRIVER' && hasProfile === null) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      );
    }
    
    return <TabNavigator user={user} onLogout={handleLogout} />;
  }

  if (screen === 'phone') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <StatusBar style="auto" />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>SPTM Driver</Text>
          <Text style={styles.subtitle}>Enter your phone number to continue</Text>
          <View style={styles.form}>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCode}><Text style={styles.countryCodeText}>+977</Text></View>
              <TextInput style={styles.phoneInput} value={phone} onChangeText={(t) => setPhone(formatPhoneInput(t))}
                placeholder="98XXXXXXXX" keyboardType="phone-pad" maxLength={10} autoFocus />
            </View>
            <TouchableOpacity style={[styles.submitButton, loading && styles.disabledButton]} onPress={handleSendOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Continue</Text>}
            </TouchableOpacity>
            <Text style={styles.termsText}>By continuing, you agree to our Terms of Service and Privacy Policy</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (screen === 'name') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <StatusBar style="auto" />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}><Text style={styles.backButtonText}>← Back</Text></TouchableOpacity>
          <Text style={styles.title}>Complete Registration</Text>
          <Text style={styles.subtitle}>Enter your name to create your driver account</Text>
          <View style={styles.form}>
            <Text style={styles.inputLabel}>Your Name</Text>
            <TextInput style={styles.nameInput} value={name} onChangeText={setName} placeholder="Enter your name" autoCapitalize="words" autoFocus />
            <Text style={styles.helperText}>You'll be able to join an organization after completing your profile</Text>
            <TouchableOpacity style={[styles.submitButton, loading && styles.disabledButton]} onPress={handleNameSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Create Account</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // OTP screen
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}><Text style={styles.backButtonText}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to{'\n'}<Text style={styles.phoneHighlight}>+977 {phone}</Text></Text>
        <View style={styles.form}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput key={index} ref={(ref) => { otpInputRefs.current[index] = ref; }}
                style={[styles.otpInput, digit && styles.otpInputFilled]} value={digit}
                onChangeText={(v) => handleOtpChange(v, index)} onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad" maxLength={1} selectTextOnFocus />
            ))}
          </View>
          <TouchableOpacity style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={isNewUser ? () => setScreen('name') : handleVerifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{isNewUser ? 'Continue' : 'Verify & Login'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.resendButton} onPress={handleResendOtp} disabled={resendTimer > 0}>
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
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  backButton: { position: 'absolute', top: 0, left: 0, padding: 8 },
  backButtonText: { fontSize: 16, color: '#FF6B35' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#1a1a1a' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, color: '#666', lineHeight: 24 },
  phoneHighlight: { fontWeight: '600', color: '#FF6B35' },
  form: { backgroundColor: '#fff', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  phoneInputContainer: { flexDirection: 'row', marginBottom: 20 },
  countryCode: { backgroundColor: '#f0f0f0', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, marginRight: 12, justifyContent: 'center' },
  countryCodeText: { fontSize: 16, fontWeight: '600', color: '#333' },
  phoneInput: { flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, letterSpacing: 1 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  nameInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 12 },
  helperText: { fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 18 },
  orgSelector: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  orgText: { fontSize: 16, color: '#333', flex: 1 },
  placeholderText: { color: '#999' },
  dropdownArrow: { fontSize: 12, color: '#666' },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  otpInput: { width: 45, height: 55, borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 12, textAlign: 'center', fontSize: 24, fontWeight: '600' },
  otpInputFilled: { borderColor: '#FF6B35', backgroundColor: '#fff5f0' },
  submitButton: { backgroundColor: '#FF6B35', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  disabledButton: { backgroundColor: '#ccc' },
  submitButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  resendButton: { marginTop: 20, alignItems: 'center' },
  resendText: { fontSize: 15, color: '#FF6B35', fontWeight: '500' },
  resendTextDisabled: { color: '#999' },
  termsText: { marginTop: 20, fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 18 },
  userCard: { backgroundColor: '#fff3e0', padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#ffcc80' },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#e65100', marginBottom: 16 },
  userInfo: { marginBottom: 8 },
  infoLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  infoText: { fontSize: 16, color: '#e65100', fontWeight: '500' },
  homeContent: { alignItems: 'center', marginBottom: 32 },
  homeTitle: { fontSize: 24, fontWeight: '600', color: '#333', marginBottom: 8 },
  homeSubtitle: { fontSize: 16, color: '#666' },
  logoutButton: { backgroundColor: '#f44336', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%', maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalClose: { fontSize: 20, color: '#666', padding: 4 },
  orgItem: { paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  orgItemSelected: { backgroundColor: '#FF6B35' },
  orgItemText: { fontSize: 16, color: '#333' },
  orgItemTextSelected: { color: '#fff', fontWeight: '600' },
});