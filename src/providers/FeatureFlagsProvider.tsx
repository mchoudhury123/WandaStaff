import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { firestore } from '@/services/firebase';
import { useAuth } from '@/components/common/AuthContext';

/**
 * Feature Flags Configuration Interface
 * 
 * This interface defines all available feature flags for the business.
 * Add new feature flags here as the application grows.
 */
export interface FeatureFlags {
  /** Whether to enforce GPS distance checking for clock in/out */
  enforceClockDistance: boolean;
  /** Whether to enable PDF download functionality for payslips */
  enablePayslipPDF: boolean;
  /** How holiday carryover should be handled */
  holidayCarryoverMode: 'manual' | 'auto';
}

/**
 * Default feature flags - used when no settings document exists
 * or when there are connection issues
 */
const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enforceClockDistance: true,    // Default to enforcing distance for security
  enablePayslipPDF: false,       // Default to disabled until PDF service is ready
  holidayCarryoverMode: 'manual' // Default to manual for business control
};

/**
 * Feature Flags Context Interface
 */
interface FeatureFlagsContextType {
  /** Current feature flags state */
  flags: FeatureFlags;
  /** Whether feature flags are currently loading from Firestore */
  loading: boolean;
  /** Any error that occurred while loading feature flags */
  error: string | null;
  /** Last time the flags were updated */
  lastUpdated: Date | null;
  /** Whether we're using fallback/default values */
  usingDefaults: boolean;
  /** Manually refresh feature flags from Firestore */
  refresh: () => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

/**
 * Feature Flags Provider Component
 * 
 * This provider loads business-specific feature flags from Firestore
 * and makes them available throughout the app via the useFeatureFlags hook.
 * 
 * The flags are loaded from: businesses/{businessId}/settings
 * and are automatically updated in real-time when changed in Firestore.
 */
export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [usingDefaults, setUsingDefaults] = useState(true);
  const [unsubscribe, setUnsubscribe] = useState<Unsubscribe | null>(null);

  const refresh = () => {
    if (user?.businessId) {
      setupFeatureFlagsListener(user.businessId);
    }
  };

  const setupFeatureFlagsListener = (businessId: string) => {
    console.log(`🚩 Setting up feature flags listener for business: ${businessId}`);
    
    // Clean up existing listener
    if (unsubscribe) {
      unsubscribe();
    }

    setLoading(true);
    setError(null);

    try {
      const settingsDocRef = doc(firestore, 'businesses', businessId, 'settings', 'featureFlags');
      
      const newUnsubscribe = onSnapshot(
        settingsDocRef,
        (docSnapshot) => {
          console.log(`🚩 Feature flags document snapshot received`);
          
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            console.log(`🚩 Feature flags loaded:`, data);
            
            // Merge with defaults to ensure all flags are present
            const mergedFlags: FeatureFlags = {
              ...DEFAULT_FEATURE_FLAGS,
              ...data
            };
            
            setFlags(mergedFlags);
            setUsingDefaults(false);
            setLastUpdated(new Date());
            setError(null);
            
            // Log significant flag states for debugging
            if (!mergedFlags.enforceClockDistance) {
              console.warn(`🚩 WARNING: Clock distance enforcement is DISABLED`);
            }
            if (mergedFlags.enablePayslipPDF) {
              console.log(`🚩 INFO: Payslip PDF download is ENABLED`);
            }
            console.log(`🚩 INFO: Holiday carryover mode: ${mergedFlags.holidayCarryoverMode}`);
            
          } else {
            console.log(`🚩 No feature flags document found, creating with defaults`);
            setFlags(DEFAULT_FEATURE_FLAGS);
            setUsingDefaults(true);
            setLastUpdated(new Date());
            setError(null);
            
            // TODO: Optionally create the document with default values
            // This could be done here or via an admin interface
          }
          
          setLoading(false);
        },
        (err) => {
          console.error(`🚩 Error loading feature flags:`, err);
          setError(`Failed to load feature flags: ${err.message}`);
          setFlags(DEFAULT_FEATURE_FLAGS);
          setUsingDefaults(true);
          setLoading(false);
          
          // Log specific error types for troubleshooting
          if (err.code === 'permission-denied') {
            console.error(`🚩 Permission denied accessing feature flags. Check Firestore security rules.`);
          } else if (err.code === 'unavailable') {
            console.error(`🚩 Firestore is temporarily unavailable. Using default flags.`);
          }
        }
      );

      setUnsubscribe(() => newUnsubscribe);
      
    } catch (err: any) {
      console.error(`🚩 Error setting up feature flags listener:`, err);
      setError(`Failed to setup feature flags: ${err.message}`);
      setFlags(DEFAULT_FEATURE_FLAGS);
      setUsingDefaults(true);
      setLoading(false);
    }
  };

  // Set up feature flags listener when user changes
  useEffect(() => {
    if (user?.businessId) {
      setupFeatureFlagsListener(user.businessId);
    } else {
      console.log(`🚩 No user or businessId available, using default flags`);
      setFlags(DEFAULT_FEATURE_FLAGS);
      setUsingDefaults(true);
      setLoading(false);
      setError(null);
    }

    // Cleanup function
    return () => {
      if (unsubscribe) {
        console.log(`🚩 Cleaning up feature flags listener`);
        unsubscribe();
      }
    };
  }, [user?.businessId]);

  // Log feature flags changes for debugging
  useEffect(() => {
    if (!loading) {
      console.log(`🚩 Feature flags updated:`, {
        enforceClockDistance: flags.enforceClockDistance,
        enablePayslipPDF: flags.enablePayslipPDF,
        holidayCarryoverMode: flags.holidayCarryoverMode,
        usingDefaults,
        lastUpdated: lastUpdated?.toISOString()
      });
    }
  }, [flags, loading, usingDefaults, lastUpdated]);

  const contextValue: FeatureFlagsContextType = {
    flags,
    loading,
    error,
    lastUpdated,
    usingDefaults,
    refresh
  };

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

/**
 * Hook to access feature flags throughout the app
 * 
 * @example
 * ```tsx
 * const { flags, loading, error } = useFeatureFlags();
 * 
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage />;
 * 
 * return (
 *   <View>
 *     {flags.enablePayslipPDF && (
 *       <Button title="Download PDF" onPress={downloadPDF} />
 *     )}
 *   </View>
 * );
 * ```
 */
export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = useContext(FeatureFlagsContext);
  
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  
  return context;
};

/**
 * Hook to check a specific feature flag
 * 
 * @param flagName - The name of the feature flag to check
 * @returns boolean indicating if the feature is enabled
 * 
 * @example
 * ```tsx
 * const isPDFEnabled = useFeatureFlag('enablePayslipPDF');
 * ```
 */
export const useFeatureFlag = (flagName: keyof FeatureFlags): boolean => {
  const { flags } = useFeatureFlags();
  return flags[flagName] as boolean;
};

export default FeatureFlagsProvider;