import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConstants, validateConfig, logConfig } from '../config/Constants';

// Validate configuration before initializing Firebase
const configValidation = validateConfig();
if (!configValidation.isValid) {
  console.error('❌ Firebase configuration validation failed:');
  configValidation.errors.forEach(error => console.error(`   - ${error}`));
  throw new Error('Invalid Firebase configuration. Please check your environment variables.');
}

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: AppConstants.firebase.apiKey,
  authDomain: AppConstants.firebase.authDomain,
  projectId: AppConstants.firebase.projectId,
  storageBucket: AppConstants.firebase.storageBucket,
  messagingSenderId: AppConstants.firebase.messagingSenderId,
  appId: AppConstants.firebase.appId,
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

// Log configuration in development
logConfig();

// Test Firebase connection
console.log('Firebase initialized with:');
console.log('- Project ID:', firebaseConfig.projectId);
console.log('- Auth Domain:', firebaseConfig.authDomain);
console.log('- App ID:', firebaseConfig.appId);
console.log('- Environment:', AppConstants.app.environment);

// Export Firebase services
export { auth, firestore };
export default app;