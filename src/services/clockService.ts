import { firestore } from './firebase';
import { doc, getDoc, collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp, updateDoc, setDoc } from 'firebase/firestore';
import { ClockRecord, Staff, Business } from '@/types';
import { Platform } from 'react-native';
import { CRMSyncService } from './crmSyncService';

// Only import Location on mobile platforms
let Location: any = null;
if (Platform.OS !== 'web') {
  try {
    Location = require('expo-location');
  } catch (e) {
    console.log('Location services not available');
  }
}

export class ClockService {
  static async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true; // Always granted on web for testing
    }
    
    try {
      if (!Location) return false;
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  static async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    if (Platform.OS === 'web') {
      // Return mock location for web testing
      return { lat: 25.276987, lng: 55.296249 }; // Dubai location
    }
    
    try {
      if (!Location) throw new Error('Location services not available');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch (error) {
      throw new Error('Unable to get current location');
    }
  }

  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (Platform.OS === 'web') {
      return 'Dubai, UAE (Web Test Location)';
    }
    
    try {
      if (!Location) return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
      const addresses = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        return `${address.street || ''} ${address.city || ''} ${address.region || ''}`.trim();
      }

      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  static async getBusinessLocation(businessId: string): Promise<Business> {
    try {
      const businessDoc = await getDoc(doc(firestore, 'businesses', businessId));
      
      if (businessDoc.exists()) {
        const businessData = businessDoc.data();
        return {
          id: businessId,
          name: businessData.name,
          location: businessData.location,
          address: businessData.address
        };
      } else {
        // Fallback for testing
        return {
          id: businessId,
          name: 'Wanda Salon',
          location: { lat: 25.276987, lng: 55.296249 }, // Dubai location
          address: 'Dubai, UAE'
        };
      }
    } catch (error) {
      console.error('Error getting business location:', error);
      throw new Error('Unable to get business location');
    }
  }

  static async clockIn(staff: Staff): Promise<void> {
    try {
      // FOR TESTING: Skip database validation checks
      // TODO: Re-enable these checks for production
      // const lastRecord = await this.getLastClockRecord(staff.id);
      // if (lastRecord && lastRecord.type === 'clock-in') {
      //   const today = new Date().toDateString();
      //   const recordDate = lastRecord.timestamp.toDate().toDateString();
      //   if (recordDate === today) {
      //     throw new Error('You are already clocked in today');
      //   }
      // }
      console.log('Testing mode: Skipping database validation checks for clock in');

      // Get current location
      const currentLocation = await this.getCurrentLocation();
      
      // Get business location
      const business = await this.getBusinessLocation(staff.businessId);
      
      // Calculate distance
      const distance = this.calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        business.location.lat,
        business.location.lng
      );

      // For testing: always allow clock in regardless of distance
      // TODO: Re-enable distance check for production
      // if (distance > 500) {
      //   throw new Error(`You are ${Math.round(distance)}m away from the business. You must be within 500m to clock in.`);
      // }
      console.log(`Testing mode: Distance is ${Math.round(distance)}m - allowing clock in anyway`);

      // Get address
      const address = await this.reverseGeocode(currentLocation.lat, currentLocation.lng);

      // Create clock record
      const clockRecord: Omit<ClockRecord, 'id'> = {
        userId: staff.id,
        businessId: staff.businessId,
        type: 'clock-in',
        timestamp: Timestamp.now(),
        location: currentLocation,
        address,
        distanceFromBusiness: Math.round(distance),
        userDetails: {
          name: `${staff.firstName} ${staff.lastName}`,
          email: staff.email,
          role: staff.role
        },
        businessDetails: {
          name: business.name,
          location: business.location
        }
      };

      // Save to Firestore
      await addDoc(collection(firestore, 'clockRecords'), clockRecord);

      // Update user's current status
      await this.updateUserClockStatus(staff.id, 'clocked-in', Timestamp.now());

      // Sync with CRM system
      await CRMSyncService.syncClockStatus({
        userId: staff.id,
        businessId: staff.businessId,
        action: 'clock-in',
        timestamp: Timestamp.now(),
        location: currentLocation,
        distanceFromBusiness: Math.round(distance),
        userDetails: {
          name: `${staff.firstName} ${staff.lastName}`,
          email: staff.email,
          role: staff.role
        }
      });

      // Broadcast real-time update
      await CRMSyncService.broadcastStatusUpdate(staff.id, 'clocked-in', {
        name: `${staff.firstName} ${staff.lastName}`,
        email: staff.email,
        role: staff.role
      });
      
    } catch (error: any) {
      throw new Error(error.message || 'Clock in failed');
    }
  }

  static async clockOut(staff: Staff): Promise<void> {
    try {
      // FOR TESTING: Skip database validation checks
      // TODO: Re-enable these checks for production
      // const lastRecord = await this.getLastClockRecord(staff.id);
      // if (!lastRecord || lastRecord.type === 'clock-out') {
      //   throw new Error('You are not currently clocked in');
      // }
      // const today = new Date().toDateString();
      // const recordDate = lastRecord.timestamp.toDate().toDateString();
      // if (recordDate !== today) {
      //   throw new Error('No clock-in record found for today');
      // }
      console.log('Testing mode: Skipping database validation checks for clock out');

      // Get current location
      const currentLocation = await this.getCurrentLocation();
      
      // Get business location
      const business = await this.getBusinessLocation(staff.businessId);
      
      // Calculate distance
      const distance = this.calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        business.location.lat,
        business.location.lng
      );

      // For testing: always allow clock out regardless of distance
      // TODO: Re-enable distance check for production
      // if (distance > 500) {
      //   throw new Error(`You are ${Math.round(distance)}m away from the business. You must be within 500m to clock out.`);
      // }
      console.log(`Testing mode: Distance is ${Math.round(distance)}m - allowing clock out anyway`);

      // Get address
      const address = await this.reverseGeocode(currentLocation.lat, currentLocation.lng);

      // Create clock record
      const clockRecord: Omit<ClockRecord, 'id'> = {
        userId: staff.id,
        businessId: staff.businessId,
        type: 'clock-out',
        timestamp: Timestamp.now(),
        location: currentLocation,
        address,
        distanceFromBusiness: Math.round(distance),
        userDetails: {
          name: `${staff.firstName} ${staff.lastName}`,
          email: staff.email,
          role: staff.role
        },
        businessDetails: {
          name: business.name,
          location: business.location
        }
      };

      // Save to Firestore
      await addDoc(collection(firestore, 'clockRecords'), clockRecord);

      // Update user's current status
      await this.updateUserClockStatus(staff.id, 'clocked-out', Timestamp.now());

      // Sync with CRM system
      await CRMSyncService.syncClockStatus({
        userId: staff.id,
        businessId: staff.businessId,
        action: 'clock-out',
        timestamp: Timestamp.now(),
        location: currentLocation,
        distanceFromBusiness: Math.round(distance),
        userDetails: {
          name: `${staff.firstName} ${staff.lastName}`,
          email: staff.email,
          role: staff.role
        }
      });

      // Broadcast real-time update
      await CRMSyncService.broadcastStatusUpdate(staff.id, 'clocked-out', {
        name: `${staff.firstName} ${staff.lastName}`,
        email: staff.email,
        role: staff.role
      });
      
    } catch (error: any) {
      throw new Error(error.message || 'Clock out failed');
    }
  }

  static async getLastClockRecord(staffId: string): Promise<ClockRecord | null> {
    try {
      const q = query(
        collection(firestore, 'clockRecords'),
        where('userId', '==', staffId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as ClockRecord;
    } catch (error) {
      console.error('Error getting last clock record:', error);
      return null;
    }
  }

  static async getTodayClockRecords(staffId: string): Promise<ClockRecord[]> {
    try {
      // Get start of today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = Timestamp.fromDate(today);

      // Get end of today
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      const endOfDayTimestamp = Timestamp.fromDate(endOfDay);

      const q = query(
        collection(firestore, 'clockRecords'),
        where('userId', '==', staffId),
        where('timestamp', '>=', startOfDay),
        where('timestamp', '<=', endOfDayTimestamp),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClockRecord[];
    } catch (error) {
      console.error('Error getting today\'s clock records:', error);
      return [];
    }
  }

  static async getWeeklyClockRecords(staffId: string): Promise<ClockRecord[]> {
    try {
      // Get start of current week (Sunday)
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Get end of current week (Saturday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const q = query(
        collection(firestore, 'clockRecords'),
        where('userId', '==', staffId),
        where('timestamp', '>=', Timestamp.fromDate(startOfWeek)),
        where('timestamp', '<=', Timestamp.fromDate(endOfWeek)),
        orderBy('timestamp', 'asc')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClockRecord[];
    } catch (error) {
      console.error('Error getting weekly clock records:', error);
      return [];
    }
  }

  static async updateUserClockStatus(userId: string, status: 'clocked-in' | 'clocked-out', timestamp: Timestamp): Promise<void> {
    try {
      const userStatusRef = doc(firestore, 'userClockStatus', userId);
      await setDoc(userStatusRef, {
        userId,
        status,
        lastUpdated: timestamp,
        lastClockAction: timestamp
      }, { merge: true });
    } catch (error) {
      console.error('Error updating user clock status:', error);
    }
  }

  static async getUserClockStatus(userId: string): Promise<{ status: 'clocked-in' | 'clocked-out' | 'unknown', lastUpdated?: Timestamp }> {
    try {
      const statusDoc = await getDoc(doc(firestore, 'userClockStatus', userId));
      
      if (statusDoc.exists()) {
        const data = statusDoc.data();
        return {
          status: data.status,
          lastUpdated: data.lastUpdated
        };
      }

      // Fallback: check last clock record
      const lastRecord = await this.getLastClockRecord(userId);
      if (lastRecord) {
        const today = new Date().toDateString();
        const recordDate = lastRecord.timestamp.toDate().toDateString();
        
        if (recordDate === today) {
          return {
            status: lastRecord.type === 'clock-in' ? 'clocked-in' : 'clocked-out',
            lastUpdated: lastRecord.timestamp
          };
        }
      }

      return { status: 'clocked-out' };
    } catch (error) {
      console.error('Error getting user clock status:', error);
      return { status: 'unknown' };
    }
  }

  static calculateWeeklyHours(clockRecords: ClockRecord[]): number {
    let totalMinutes = 0;
    let clockInTime: Date | null = null;

    // Group records by day and calculate hours
    const dayGroups: { [key: string]: ClockRecord[] } = {};
    
    clockRecords.forEach(record => {
      const day = record.timestamp.toDate().toDateString();
      if (!dayGroups[day]) {
        dayGroups[day] = [];
      }
      dayGroups[day].push(record);
    });

    // Calculate hours for each day
    Object.values(dayGroups).forEach(dayRecords => {
      dayRecords.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
      
      let dayClockInTime: Date | null = null;
      
      dayRecords.forEach(record => {
        if (record.type === 'clock-in') {
          dayClockInTime = record.timestamp.toDate();
        } else if (record.type === 'clock-out' && dayClockInTime) {
          const clockOutTime = record.timestamp.toDate();
          const diffMs = clockOutTime.getTime() - dayClockInTime.getTime();
          totalMinutes += diffMs / (1000 * 60); // Convert to minutes
          dayClockInTime = null;
        }
      });
    });

    return totalMinutes / 60; // Convert to hours
  }

  static async checkLocationForClockStatus(userId: string, businessId: string): Promise<{ canShowClockedIn: boolean, distance?: number }> {
    try {
      // Get current location
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        return { canShowClockedIn: false };
      }

      const currentLocation = await this.getCurrentLocation();
      const business = await this.getBusinessLocation(businessId);
      
      const distance = this.calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        business.location.lat,
        business.location.lng
      );

      // For testing: always show as within radius
      // TODO: Re-enable distance check for production
      return {
        canShowClockedIn: true, // Always true for testing
        distance: Math.round(distance)
      };
    } catch (error) {
      console.error('Error checking location for clock status:', error);
      return { canShowClockedIn: false };
    }
  }
}