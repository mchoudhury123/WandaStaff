import { auth, firestore } from './firebase';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Staff } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AuthService {
  // Test Firebase connection
  static async testFirebaseConnection(): Promise<boolean> {
    try {
      console.log('Testing Firebase connection...');
      console.log('Auth object:', auth);
      console.log('Firestore object:', firestore);
      return true;
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      return false;
    }
  }

  // Find staff document using multiple strategies
  static async findStaffDocument(firebaseUser: any): Promise<Staff | null> {
    console.log('Finding staff document for Firebase user:', firebaseUser.uid, firebaseUser.email);
    
    // Strategy 1: Try to find by Firebase UID as document ID
    try {
      console.log('Strategy 1: Looking for staff document with ID =', firebaseUser.uid);
      const staffDocRef = doc(firestore, 'staff', firebaseUser.uid);
      const staffDoc = await getDoc(staffDocRef);
      
      if (staffDoc.exists()) {
        console.log('Strategy 1 SUCCESS: Found staff document by UID as doc ID');
        return { id: staffDoc.id, ...staffDoc.data() } as Staff;
      }
    } catch (error) {
      console.log('Strategy 1 failed:', error);
    }

    // Strategy 2: Search for document where uid field matches Firebase UID
    try {
      console.log('Strategy 2: Searching for staff document where uid field =', firebaseUser.uid);
      const staffCollection = collection(firestore, 'staff');
      const q = query(staffCollection, where('uid', '==', firebaseUser.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const staffDoc = querySnapshot.docs[0];
        console.log('Strategy 2 SUCCESS: Found staff document by uid field');
        return { id: staffDoc.id, ...staffDoc.data() } as Staff;
      }
    } catch (error) {
      console.log('Strategy 2 failed:', error);
    }

    // Strategy 3: Search for document where email matches Firebase user email
    try {
      console.log('Strategy 3: Searching for staff document where email =', firebaseUser.email);
      const staffCollection = collection(firestore, 'staff');
      const q = query(staffCollection, where('email', '==', firebaseUser.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const staffDoc = querySnapshot.docs[0];
        console.log('Strategy 3 SUCCESS: Found staff document by email');
        
        // Update the document to include the Firebase UID for future lookups
        const staffData = { id: staffDoc.id, ...staffDoc.data() } as Staff;
        console.log('Found staff member:', staffData.firstName, staffData.lastName);
        return staffData;
      }
    } catch (error) {
      console.log('Strategy 3 failed:', error);
    }

    console.log('All strategies failed - no staff document found');
    return null;
  }

  static async signIn(email: string, password: string): Promise<Staff> {
    try {
      console.log('Attempting to sign in user:', email);
      
      // Use Firebase authentication - same as CRM
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user) {
        throw new Error('Authentication failed');
      }

      console.log('Firebase auth successful for user:', user.uid, user.email);

      // Use flexible staff lookup
      const staffData = await this.findStaffDocument(user);
      
      if (!staffData) {
        console.error('Staff document not found for user:', user.uid, user.email);
        throw new Error('Staff record not found. Please contact your administrator.');
      }

      console.log('Staff document found:', staffData.id);
      
      // Store user data locally for offline access
      await AsyncStorage.setItem('staff', JSON.stringify(staffData));
      
      console.log('Login successful for:', staffData.firstName, staffData.lastName);
      return staffData;
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Provide more specific error messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  }

  static async signOut(): Promise<void> {
    try {
      console.log('AuthService - Starting sign out process');
      
      // Clear AsyncStorage first (works for both Firebase and test users)
      await AsyncStorage.removeItem('staff');
      console.log('AuthService - Cleared AsyncStorage');
      
      // Try to sign out from Firebase (may fail for test users, that's ok)
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log('AuthService - Firebase user found, signing out');
          await firebaseSignOut(auth);
          console.log('AuthService - Firebase sign out successful');
        } else {
          console.log('AuthService - No Firebase user to sign out');
        }
      } catch (firebaseError) {
        console.warn('AuthService - Firebase sign out failed (may be test user):', firebaseError);
        // Don't throw error for Firebase signout failures
      }
      
      console.log('AuthService - Sign out completed successfully');
    } catch (error: any) {
      console.error('AuthService - Sign out error:', error);
      // Even if there's an error, try to clear storage
      try {
        await AsyncStorage.removeItem('staff');
      } catch (storageError) {
        console.error('AuthService - Failed to clear storage:', storageError);
      }
      throw new Error(error.message || 'Logout failed');
    }
  }

  static async getCurrentUser(): Promise<Staff | null> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        // Clear cached data if no authenticated user
        await AsyncStorage.removeItem('staff');
        return null;
      }

      // Check if we have cached staff data first
      const cachedStaff = await AsyncStorage.getItem('staff');
      if (cachedStaff) {
        const staffData = JSON.parse(cachedStaff) as Staff;
        // Return cached data if we have it (more flexible than strict UID matching)
        return staffData;
      }

      // Fetch fresh staff data using flexible lookup
      const staffData = await this.findStaffDocument(currentUser);
      
      if (!staffData) {
        console.warn('Staff document not found for Firebase user:', currentUser.uid, currentUser.email);
        console.warn('Make sure this user exists in the staff collection in Firestore');
        await this.signOut();
        return null;
      }

      await AsyncStorage.setItem('staff', JSON.stringify(staffData));
      return staffData;
      
    } catch (error) {
      console.error('Error getting current user:', error);
      // Return cached data as fallback if Firebase is unavailable
      try {
        const cachedStaff = await AsyncStorage.getItem('staff');
        if (cachedStaff) {
          return JSON.parse(cachedStaff) as Staff;
        }
      } catch (cacheError) {
        console.error('Error reading cached user:', cacheError);
      }
      return null;
    }
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed');
    }
  }

  static onAuthStateChanged(callback: (user: Staff | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthService - Firebase auth state changed:', firebaseUser ? firebaseUser.email : 'No user');
      if (firebaseUser) {
        console.log('AuthService - Getting staff data for Firebase user:', firebaseUser.uid, firebaseUser.email);
        
        // Try to get current user (which uses flexible lookup)
        const staff = await this.getCurrentUser();
        console.log('AuthService - Retrieved staff data:', staff ? `${staff.firstName} ${staff.lastName}` : 'None');
        callback(staff);
      } else {
        console.log('AuthService - No Firebase user, calling callback with null');
        callback(null);
      }
    });
  }
}