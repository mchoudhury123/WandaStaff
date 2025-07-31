import { firestore } from './firebase';
import { doc, setDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';

export interface CRMSyncData {
  userId: string;
  businessId: string;
  action: 'clock-in' | 'clock-out' | 'status-update';
  timestamp: any;
  location?: { lat: number; lng: number };
  distanceFromBusiness?: number;
  userDetails: {
    name: string;
    email: string;
    role: string;
  };
}

export class CRMSyncService {
  /**
   * Sync clock status with CRM system
   * This ensures both app and CRM show the same clock status
   */
  static async syncClockStatus(syncData: CRMSyncData): Promise<void> {
    try {
      // Update user status in CRM-compatible format
      await this.updateCRMUserStatus(syncData);
      
      // Log the sync action for audit trail
      await this.logSyncAction(syncData);
      
      console.log('CRM sync successful:', syncData.action, 'for user:', syncData.userDetails.name);
    } catch (error) {
      console.error('CRM sync failed:', error);
      // Don't throw error to prevent blocking the main clock operation
    }
  }

  /**
   * Update user status in CRM-compatible collection
   */
  private static async updateCRMUserStatus(syncData: CRMSyncData): Promise<void> {
    const userStatusRef = doc(firestore, 'crmUserStatus', syncData.userId);
    
    const statusData = {
      userId: syncData.userId,
      businessId: syncData.businessId,
      status: syncData.action === 'clock-in' ? 'clocked-in' : 'clocked-out',
      lastAction: syncData.action,
      lastUpdated: serverTimestamp(),
      location: syncData.location || null,
      distanceFromBusiness: syncData.distanceFromBusiness || null,
      userDetails: syncData.userDetails,
      // Add metadata for CRM system identification
      syncSource: 'mobile-app',
      appVersion: '1.0.0'
    };

    await setDoc(userStatusRef, statusData, { merge: true });
  }

  /**
   * Log sync action for audit trail and debugging
   */
  private static async logSyncAction(syncData: CRMSyncData): Promise<void> {
    const syncLogRef = collection(firestore, 'crmSyncLogs');
    
    const logData = {
      ...syncData,
      timestamp: serverTimestamp(),
      syncedAt: serverTimestamp(),
      source: 'mobile-app'
    };

    await addDoc(syncLogRef, logData);
  }

  /**
   * Broadcast real-time status update for CRM dashboard
   */
  static async broadcastStatusUpdate(userId: string, status: 'clocked-in' | 'clocked-out', userDetails: any): Promise<void> {
    try {
      const broadcastRef = doc(firestore, 'realTimeUpdates', `user_${userId}`);
      
      await setDoc(broadcastRef, {
        type: 'clock_status_update',
        userId,
        status,
        userDetails,
        timestamp: serverTimestamp(),
        source: 'mobile-app'
      }, { merge: true });
      
    } catch (error) {
      console.error('Failed to broadcast status update:', error);
    }
  }

  /**
   * Check if CRM system is online and responsive
   */
  static async checkCRMConnection(): Promise<boolean> {
    try {
      // Try to read from a CRM health check document
      const healthCheckRef = doc(firestore, 'systemHealth', 'crmStatus');
      
      // Update health check with app status
      await updateDoc(healthCheckRef, {
        mobileAppLastPing: serverTimestamp(),
        mobileAppStatus: 'online'
      });
      
      return true;
    } catch (error) {
      console.error('CRM connection check failed:', error);
      return false;
    }
  }

  /**
   * Sync historical data if needed (for offline scenarios)
   */
  static async syncPendingRecords(pendingRecords: any[]): Promise<void> {
    try {
      for (const record of pendingRecords) {
        await this.syncClockStatus(record);
      }
      console.log('Synced', pendingRecords.length, 'pending records with CRM');
    } catch (error) {
      console.error('Failed to sync pending records:', error);
    }
  }
}