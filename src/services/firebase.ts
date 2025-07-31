import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration for Nail-salon-crm project
const firebaseConfig = {
  apiKey: "AIzaSyAgFCCTja8jE8FgUJuPCm9jDV5z93pq55k",
  authDomain: "nail-salon-crm.firebaseapp.com",
  projectId: "nail-salon-crm",
  storageBucket: "nail-salon-crm.appspot.com",
  messagingSenderId: "1084934404328",
  appId: "1:1084934404328:web:17b0800ae64bc69ca3b15d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with proper web configuration
let auth;
try {
  if (typeof window !== 'undefined') {
    // Web environment - use regular getAuth
    auth = getAuth(app);
    console.log('Firebase Auth initialized for web environment');
  } else {
    // React Native environment - use initializeAuth with persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('Firebase Auth initialized for React Native environment');
  }
} catch (error) {
  console.error('Firebase Auth initialization failed:', error);
  // Fallback to basic auth
  auth = getAuth(app);
}

// Initialize Firestore
const firestore = getFirestore(app);

// Test Firebase connection
console.log('Firebase initialized with:');
console.log('- Project ID:', firebaseConfig.projectId);
console.log('- Auth Domain:', firebaseConfig.authDomain);
console.log('- App ID:', firebaseConfig.appId);

// Export Firebase services
export { auth, firestore };
export default app;