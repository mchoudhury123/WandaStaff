import { firestore } from './firebase';
import { Payslip } from '@/types';

export class PayrollService {
  static async getPayslips(staffId: string): Promise<Payslip[]> {
    try {
      const querySnapshot = await firestore()
        .collection('payslips')
        .where('staffId', '==', staffId)
        .orderBy('month', 'desc')
        .limit(12) // Last 12 months
        .get();

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Payslip[];
    } catch (error) {
      console.error('Error getting payslips:', error);
      return [];
    }
  }

  static async getPayslip(staffId: string, month: string): Promise<Payslip | null> {
    try {
      const querySnapshot = await firestore()
        .collection('payslips')
        .where('staffId', '==', staffId)
        .where('month', '==', month)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Payslip;
    } catch (error) {
      console.error('Error getting payslip:', error);
      return null;
    }
  }

  static async downloadPayslipPDF(payslipId: string): Promise<string | null> {
    try {
      // TODO: Implement PDF download logic
      // This would typically involve calling a cloud function
      // that generates and returns a PDF download URL
      
      const payslipDoc = await firestore()
        .collection('payslips')
        .doc(payslipId)
        .get();

      if (!payslipDoc.exists) {
        throw new Error('Payslip not found');
      }

      const payslipData = payslipDoc.data();
      return payslipData?.pdfUrl || null;
    } catch (error) {
      console.error('Error downloading payslip PDF:', error);
      return null;
    }
  }

  static formatCurrency(amount: number): string {
    return `QAR ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  static formatMonth(monthStr: string): string {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  }
}