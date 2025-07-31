import { firestore } from './firebase';
import { CommissionStructure, CommissionBracket } from '@/types';

export class CommissionService {
  static async getCommissionStructure(businessId: string): Promise<CommissionStructure | null> {
    try {
      const businessDoc = await firestore()
        .collection('businesses')
        .doc(businessId)
        .get();

      if (!businessDoc.exists) {
        return null;
      }

      const businessData = businessDoc.data();
      return businessData?.commissionStructure || null;
    } catch (error) {
      console.error('Error getting commission structure:', error);
      return null;
    }
  }

  static async getStaffSales(staffId: string, month?: string): Promise<number> {
    try {
      const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      const querySnapshot = await firestore()
        .collection('appointments')
        .where('staffId', '==', staffId)
        .where('status', '==', 'completed')
        .where('date', '>=', targetMonth + '-01')
        .where('date', '<=', targetMonth + '-31')
        .get();

      let totalSales = 0;
      
      for (const doc of querySnapshot.docs) {
        const appointment = doc.data();
        
        // Get service price
        if (appointment.serviceId) {
          try {
            const serviceDoc = await firestore()
              .collection('services')
              .doc(appointment.serviceId)
              .get();
            
            if (serviceDoc.exists) {
              const serviceData = serviceDoc.data();
              totalSales += serviceData?.price || 0;
            }
          } catch (error) {
            console.warn('Error fetching service price:', error);
          }
        }
      }

      return totalSales;
    } catch (error) {
      console.error('Error getting staff sales:', error);
      return 0;
    }
  }

  static calculateCommission(sales: number, brackets: CommissionBracket[]): number {
    let commission = 0;
    let remainingSales = sales;

    for (const bracket of brackets) {
      if (remainingSales <= 0) break;

      const bracketMin = bracket.minQAR;
      const bracketMax = bracket.maxQAR === Number.MAX_SAFE_INTEGER 
        ? Number.MAX_SAFE_INTEGER 
        : bracket.maxQAR;
      
      const bracketRange = bracketMax - bracketMin;
      const salesInBracket = Math.min(remainingSales, bracketRange);
      
      commission += (salesInBracket * bracket.ratePercent) / 100;
      remainingSales -= salesInBracket;
      
      if (remainingSales <= 0 || bracket.maxQAR === Number.MAX_SAFE_INTEGER) {
        break;
      }
    }

    return commission;
  }

  static findCurrentBracket(sales: number, brackets: CommissionBracket[]): CommissionBracket | null {
    return brackets.find(
      bracket => sales >= bracket.minQAR && sales < bracket.maxQAR
    ) || null;
  }

  static findNextBracket(currentSales: number, brackets: CommissionBracket[]): CommissionBracket | null {
    return brackets.find(bracket => currentSales < bracket.minQAR) || null;
  }

  static calculateProgressToNextBracket(
    currentSales: number,
    currentBracket: CommissionBracket,
    nextBracket: CommissionBracket | null
  ): number {
    if (!nextBracket) return 100;
    
    const progress = ((currentSales - currentBracket.minQAR) / 
                     (nextBracket.minQAR - currentBracket.minQAR)) * 100;
    
    return Math.min(Math.max(progress, 0), 100);
  }

  static async getMonthlyCommissionData(staffId: string, businessId: string) {
    try {
      const [commissionStructure, currentSales] = await Promise.all([
        this.getCommissionStructure(businessId),
        this.getStaffSales(staffId),
      ]);

      if (!commissionStructure) {
        throw new Error('Commission structure not found');
      }

      const currentCommission = this.calculateCommission(
        currentSales,
        commissionStructure.commissionBrackets
      );

      const currentBracket = this.findCurrentBracket(
        currentSales,
        commissionStructure.commissionBrackets
      );

      const nextBracket = this.findNextBracket(
        currentSales,
        commissionStructure.commissionBrackets
      );

      const progressToNext = currentBracket ? 
        this.calculateProgressToNextBracket(currentSales, currentBracket, nextBracket) : 0;

      return {
        currentSales,
        currentCommission,
        currentBracket,
        nextBracket,
        progressToNext,
        commissionStructure,
      };
    } catch (error) {
      console.error('Error getting monthly commission data:', error);
      throw error;
    }
  }

  static formatCurrency(amount: number): string {
    return `QAR ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }
}