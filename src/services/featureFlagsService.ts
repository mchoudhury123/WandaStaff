import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from './firebase';
import { FeatureFlags } from '@/providers/FeatureFlagsProvider';

/**
 * Feature Flags Service
 * 
 * This service provides methods to manage feature flags in Firestore.
 * It's primarily used for admin functions and initial setup.
 */
export class FeatureFlagsService {
  
  /**
   * Get the Firestore document reference for business feature flags
   */
  private static getFeatureFlagsRef(businessId: string) {
    return doc(firestore, 'businesses', businessId, 'settings', 'featureFlags');
  }

  /**
   * Load feature flags for a specific business
   * 
   * @param businessId - The business ID to load flags for
   * @returns Promise resolving to feature flags or null if not found
   */
  static async loadFeatureFlags(businessId: string): Promise<FeatureFlags | null> {
    try {
      const docRef = this.getFeatureFlagsRef(businessId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as FeatureFlags;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading feature flags:', error);
      throw new Error(`Failed to load feature flags: ${error}`);
    }
  }

  /**
   * Create initial feature flags document for a business
   * 
   * @param businessId - The business ID to create flags for
   * @param initialFlags - Initial feature flags (optional, uses defaults if not provided)
   */
  static async createFeatureFlags(
    businessId: string, 
    initialFlags?: Partial<FeatureFlags>
  ): Promise<void> {
    try {
      const defaultFlags: FeatureFlags = {
        enforceClockDistance: true,
        enablePayslipPDF: false,
        holidayCarryoverMode: 'manual'
      };

      const flags: FeatureFlags = {
        ...defaultFlags,
        ...initialFlags
      };

      const docRef = this.getFeatureFlagsRef(businessId);
      await setDoc(docRef, flags);
      
      console.log(`Feature flags created for business ${businessId}:`, flags);
    } catch (error) {
      console.error('Error creating feature flags:', error);
      throw new Error(`Failed to create feature flags: ${error}`);
    }
  }

  /**
   * Update specific feature flags for a business
   * 
   * @param businessId - The business ID to update flags for
   * @param updates - Partial feature flags object with updates
   */
  static async updateFeatureFlags(
    businessId: string, 
    updates: Partial<FeatureFlags>
  ): Promise<void> {
    try {
      const docRef = this.getFeatureFlagsRef(businessId);
      await updateDoc(docRef, updates);
      
      console.log(`Feature flags updated for business ${businessId}:`, updates);
    } catch (error) {
      console.error('Error updating feature flags:', error);
      throw new Error(`Failed to update feature flags: ${error}`);
    }
  }

  /**
   * Enable or disable clock distance enforcement
   * 
   * @param businessId - The business ID
   * @param enforce - Whether to enforce clock distance
   */
  static async setClockDistanceEnforcement(businessId: string, enforce: boolean): Promise<void> {
    await this.updateFeatureFlags(businessId, { enforceClockDistance: enforce });
  }

  /**
   * Enable or disable payslip PDF downloads
   * 
   * @param businessId - The business ID
   * @param enabled - Whether to enable PDF downloads
   */
  static async setPayslipPDFEnabled(businessId: string, enabled: boolean): Promise<void> {
    await this.updateFeatureFlags(businessId, { enablePayslipPDF: enabled });
  }

  /**
   * Set holiday carryover mode
   * 
   * @param businessId - The business ID
   * @param mode - The carryover mode ('manual' or 'auto')
   */
  static async setHolidayCarryoverMode(
    businessId: string, 
    mode: 'manual' | 'auto'
  ): Promise<void> {
    await this.updateFeatureFlags(businessId, { holidayCarryoverMode: mode });
  }

  /**
   * Check if feature flags document exists for a business
   * 
   * @param businessId - The business ID to check
   * @returns Promise resolving to true if document exists
   */
  static async featureFlagsExist(businessId: string): Promise<boolean> {
    try {
      const docRef = this.getFeatureFlagsRef(businessId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Error checking if feature flags exist:', error);
      return false;
    }
  }

  /**
   * Initialize feature flags for a business if they don't exist
   * This is useful for automatic setup when a business is first created
   * 
   * @param businessId - The business ID
   * @param initialFlags - Optional initial flags
   */
  static async ensureFeatureFlags(
    businessId: string, 
    initialFlags?: Partial<FeatureFlags>
  ): Promise<void> {
    try {
      const exists = await this.featureFlagsExist(businessId);
      
      if (!exists) {
        console.log(`Creating missing feature flags for business ${businessId}`);
        await this.createFeatureFlags(businessId, initialFlags);
      } else {
        console.log(`Feature flags already exist for business ${businessId}`);
      }
    } catch (error) {
      console.error('Error ensuring feature flags:', error);
      // Don't throw here - this is a convenience method that should be resilient
    }
  }

  /**
   * Get feature flags with fallback to defaults
   * This method always returns valid flags, even if Firestore is unavailable
   * 
   * @param businessId - The business ID
   * @returns Promise resolving to feature flags (never null)
   */
  static async getFeatureFlagsWithFallback(businessId: string): Promise<FeatureFlags> {
    try {
      const flags = await this.loadFeatureFlags(businessId);
      
      if (flags) {
        // Merge with defaults to ensure all flags are present
        return {
          enforceClockDistance: true,
          enablePayslipPDF: false,
          holidayCarryoverMode: 'manual',
          ...flags
        };
      }
      
      // Return defaults if no document found
      return {
        enforceClockDistance: true,
        enablePayslipPDF: false,
        holidayCarryoverMode: 'manual'
      };
      
    } catch (error) {
      console.warn('Failed to load feature flags, using defaults:', error);
      return {
        enforceClockDistance: true,
        enablePayslipPDF: false,
        holidayCarryoverMode: 'manual'
      };
    }
  }

  /**
   * Reset feature flags to defaults for a business
   * 
   * @param businessId - The business ID
   */
  static async resetToDefaults(businessId: string): Promise<void> {
    const defaultFlags: FeatureFlags = {
      enforceClockDistance: true,
      enablePayslipPDF: false,
      holidayCarryoverMode: 'manual'
    };

    await this.updateFeatureFlags(businessId, defaultFlags);
  }
}