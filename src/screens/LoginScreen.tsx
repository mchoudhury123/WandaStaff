import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, StatusBar, Image } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const findStaffByEmail = async (userEmail: string) => {
    console.log('Looking for staff with email:', userEmail);
    
    const staffCollection = collection(firestore, 'staff');
    const q = query(staffCollection, where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const staffDoc = querySnapshot.docs[0];
      const staffData = { id: staffDoc.id, ...staffDoc.data() };
      console.log('Found staff:', staffData);
      return staffData;
    }
    
    console.log('No staff found with email:', userEmail);
    return null;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    console.log('Starting login for:', email);

    try {
      // Test Firebase connection first
      console.log('Testing Firebase connection...');
      console.log('Auth object:', typeof auth);
      console.log('Firestore object:', typeof firestore);
      
      if (!auth || !firestore) {
        throw new Error('Firebase not properly initialized');
      }

      // Firebase Auth
      console.log('Attempting Firebase auth...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase auth successful:', userCredential.user.uid);

      // Find staff record
      console.log('Looking for staff record...');
      const staff = await findStaffByEmail(email);
      
      if (!staff) {
        throw new Error('Staff record not found');
      }

      // Save to storage
      await AsyncStorage.setItem('staff', JSON.stringify(staff));
      console.log('Login complete - staff saved to storage');
      
      // Force reload to trigger navigation
      window.location.reload();
      
    } catch (error: any) {
      console.error('Login failed:', error);
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B4B" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>WandaStaff</Text>
        <Text style={styles.subtitle}>Staff Management Portal</Text>
      </View>
      
      {/* Login Form */}
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Icon name="email" size={20} color="#8B5CF6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="#8B5CF6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Icon 
              name={showPassword ? "eye-off" : "eye"} 
              size={20} 
              color="#64748B" 
            />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Icon name="loading" size={20} color="#FFFFFF" style={styles.loadingIcon} />
              <Text style={styles.buttonText}>Signing In...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Icon name="login" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Sign In</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure Staff Portal</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23', // Dark navy background
  },
  
  // Header Section
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8B5CF6',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Form Section
  formContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B4B', // Dark purple input background
    borderRadius: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#312E81',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: '#FFFFFF',
  },
  eyeIcon: {
    padding: 8,
  },
  
  // Button Section
  loginButton: {
    backgroundColor: '#8B5CF6', // Purple button
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 32,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  loadingIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Footer Section
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen;