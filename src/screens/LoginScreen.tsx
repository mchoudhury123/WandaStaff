import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '@/services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      <Text style={styles.title}>WandaStaff Login</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Signing In...' : 'Sign In'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;