import { firestore } from './firebase';
import { HolidayRequest } from '@/types';

export class HolidayService {
  static async submitHolidayRequest(request: Omit<HolidayRequest, 'id'>): Promise<void> {
    try {
      await firestore().collection('holidayRequests').add({
        ...request,
        requestedAt: new Date().toISOString(),
        status: 'pending',
      });
    } catch (error) {
      throw new Error('Failed to submit holiday request');
    }
  }

  static async getHolidayRequests(staffId: string): Promise<HolidayRequest[]> {
    try {
      const querySnapshot = await firestore()
        .collection('holidayRequests')
        .where('staffId', '==', staffId)
        .orderBy('requestedAt', 'desc')
        .get();

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as HolidayRequest[];
    } catch (error) {
      console.error('Error getting holiday requests:', error);
      return [];
    }
  }

  static async cancelHolidayRequest(requestId: string): Promise<void> {
    try {
      await firestore()
        .collection('holidayRequests')
        .doc(requestId)
        .update({ status: 'cancelled' });
    } catch (error) {
      throw new Error('Failed to cancel holiday request');
    }
  }

  static async getHolidayAllowance(staffId: string): Promise<{ total: number; used: number; remaining: number }> {
    try {
      // Base allowance is typically 21 days per year
      const baseAllowance = 21;
      const currentYear = new Date().getFullYear();

      // Get approved holidays for current year
      const querySnapshot = await firestore()
        .collection('holidayRequests')
        .where('staffId', '==', staffId)
        .where('status', '==', 'approved')
        .get();

      let usedDays = 0;
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data() as HolidayRequest;
        const requestYear = new Date(data.startDate).getFullYear();
        
        if (requestYear === currentYear) {
          usedDays += data.days;
        }
      });

      // TODO: Add carryover logic from previous year
      const totalAllowance = baseAllowance;
      const remaining = Math.max(0, totalAllowance - usedDays);

      return {
        total: totalAllowance,
        used: usedDays,
        remaining,
      };
    } catch (error) {
      console.error('Error calculating holiday allowance:', error);
      return { total: 21, used: 0, remaining: 21 };
    }
  }

  static calculateDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  }

  static formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  static isValidDateRange(startDate: string, endDate: string): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return start >= today && end >= start;
  }
}