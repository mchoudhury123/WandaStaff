import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// WANDA CRM Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgFCCTja8jE8FgUJuPCm9jDV5z93pq55k",
  authDomain: "nail-salon-crm.firebaseapp.com",
  projectId: "nail-salon-crm",
  storageBucket: "nail-salon-crm.firebasestorage.app",
  messagingSenderId: "1084934404328",
  appId: "1:1084934404328:web:17b0800ae64bc69ca3b15d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
export const firestore = getFirestore(app);

export default app;