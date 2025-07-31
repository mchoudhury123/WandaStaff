import { firestore } from './firebase';
import { Rota, ScheduleDay } from '@/types';

export class RotaService {
  static async getCurrentWeekRota(staffId: string): Promise<Rota | null> {
    try {
      const today = new Date();
      const currentWeek = this.getWeekNumber(today);
      const currentYear = today.getFullYear();

      const querySnapshot = await firestore()
        .collection('rotas')
        .where('staffId', '==', staffId)
        .where('week', '==', currentWeek)
        .where('year', '==', currentYear)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Rota;
    } catch (error) {
      console.error('Error getting current week rota:', error);
      return null;
    }
  }

  static async getWeekRota(staffId: string, week: number, year: number): Promise<Rota | null> {
    try {
      const querySnapshot = await firestore()
        .collection('rotas')
        .where('staffId', '==', staffId)
        .where('week', '==', week)
        .where('year', '==', year)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Rota;
    } catch (error) {
      console.error('Error getting week rota:', error);
      return null;
    }
  }

  static async updateRotaSchedule(rotaId: string, schedules: ScheduleDay[]): Promise<void> {
    try {
      await firestore()
        .collection('rotas')
        .doc(rotaId)
        .update({ schedules });
    } catch (error) {
      throw new Error('Failed to update rota schedule');
    }
  }

  static getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  static getWeekDates(week: number, year: number): { start: Date; end: Date } {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (week - 1) * 7 - firstDayOfYear.getDay();
    
    const start = new Date(year, 0, 1 + daysToAdd);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return { start, end };
  }

  static getTodaySchedule(rota: Rota): ScheduleDay | null {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today.getDay()] as ScheduleDay['day'];

    return rota.schedules.find(schedule => schedule.day === todayName) || null;
  }
}