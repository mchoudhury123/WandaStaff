import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, Staff } from '@/types';
import { AuthService } from '@/services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('AuthContext - Initializing auth');
        
        // Check for cached user first
        const cachedStaff = await AsyncStorage.getItem('staff');
        if (cachedStaff) {
          console.log('AuthContext - Found cached user');
          const userData = JSON.parse(cachedStaff);
          setUser(userData);
          setLoading(false);
          return;
        }
        
        console.log('AuthContext - No cached user, setting up Firebase listener');
        
        // Set up Firebase auth state listener
        const unsubscribe = AuthService.onAuthStateChanged(async (staff) => {
          console.log('AuthContext - Auth state changed:', staff ? `${staff.firstName} ${staff.lastName}` : 'No user');
          setUser(staff);
          setLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setLoading(false);
        return () => {}; // Return empty cleanup function
      }
    };

    let unsubscribe: (() => void) | undefined;
    
    initializeAuth().then((cleanup) => {
      unsubscribe = cleanup;
    });

    return () => unsubscribe?.();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext - Starting sign in process for:', email);
      setLoading(true);
      
      console.log('AuthContext - Calling AuthService.signIn...');
      const staff = await AuthService.signIn(email, password);
      console.log('AuthContext - AuthService.signIn successful, got staff:', staff);
      console.log('AuthContext - Staff details:', {
        id: staff.id,
        name: `${staff.firstName} ${staff.lastName}`,
        email: staff.email,
        role: staff.role
      });
      
      // Immediately set the user state - don't wait for Firebase auth listener
      console.log('AuthContext - Setting user state...');
      setUser(staff);
      console.log('AuthContext - User state updated successfully');
      
      // Small delay to ensure state update is processed
      setTimeout(() => {
        setLoading(false);
        console.log('AuthContext - Loading set to false, login should be complete');
      }, 100);
      
    } catch (error) {
      console.error('AuthContext - Sign in error:', error);
      console.error('AuthContext - Error type:', typeof error);
      console.error('AuthContext - Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthContext - Starting sign out');
      setLoading(true);
      
      // Force clear user state immediately
      setUser(null);
      console.log('AuthContext - User state cleared');
      
      // Clear storage
      await AsyncStorage.removeItem('staff');
      console.log('AuthContext - AsyncStorage cleared');
      
      // Try AuthService signOut (may fail, that's ok)
      try {
        await AuthService.signOut();
        console.log('AuthContext - AuthService signOut completed');
      } catch (serviceError) {
        console.warn('AuthContext - AuthService signOut failed (ignoring):', serviceError);
        // Don't throw error - user state is already cleared
      }
      
      console.log('AuthContext - Sign out completed successfully');
    } catch (error) {
      console.error('AuthContext - Sign out error:', error);
      // Force clear user even if there's an error
      setUser(null);
      try {
        await AsyncStorage.removeItem('staff');
      } catch (storageError) {
        console.error('Failed to clear storage:', storageError);
      }
      // Don't throw error - we want to sign out regardless
    } finally {
      setLoading(false);
      console.log('AuthContext - Loading set to false');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};