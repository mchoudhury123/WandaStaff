import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, firestore } from './firebase';
import { StaffMember } from './types';

interface AuthContextType {
  user: User | null;
  staffMember: StaffMember | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let staffUnsubscribe: Unsubscribe | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Listen to staff member document changes
        const staffDocRef = doc(firestore, 'staff', user.uid);
        
        staffUnsubscribe = onSnapshot(staffDocRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setStaffMember({
              uid: user.uid,
              email: user.email || '',
              name: data.name,
              role: data.role,
              location: data.location,
              staffId: data.staffId,
              isActive: data.isActive,
              createdAt: data.createdAt?.toDate() || new Date(),
            });
          } else {
            console.error('Staff member document not found');
            setStaffMember(null);
          }
          setLoading(false);
        }, (error) => {
          console.error('Error fetching staff member:', error);
          setStaffMember(null);
          setLoading(false);
        });
      } else {
        setStaffMember(null);
        setLoading(false);
        if (staffUnsubscribe) {
          staffUnsubscribe();
          staffUnsubscribe = null;
        }
      }
    });

    return () => {
      unsubscribe();
      if (staffUnsubscribe) {
        staffUnsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
  };

  const value: AuthContextType = {
    user,
    staffMember,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};