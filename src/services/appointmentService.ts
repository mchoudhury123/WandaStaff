import { Appointment } from '@/types';

export class AppointmentService {
  static async getTodayAppointments(staffId: string): Promise<Appointment[]> {
    // Mock appointments for testing
    return [
      {
        id: '1',
        businessId: 'test-business',
        staffId: staffId,
        clientId: 'client-1',
        serviceId: 'service-1',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        duration: 60,
        status: 'scheduled',
        clientName: 'Sarah Johnson',
        serviceName: 'Hair Cut & Style',
        notes: 'First time client'
      },
      {
        id: '2',
        businessId: 'test-business',
        staffId: staffId,
        clientId: 'client-2',
        serviceId: 'service-2',
        date: new Date().toISOString().split('T')[0],
        time: '14:30',
        duration: 90,
        status: 'scheduled',
        clientName: 'Emma Wilson',
        serviceName: 'Color & Highlights',
      }
    ];
  }

  static async getWeekAppointments(staffId: string, startDate: Date): Promise<Appointment[]> {
    // Return today's appointments for testing
    return this.getTodayAppointments(staffId);
  }

  static async updateAppointmentStatus(appointmentId: string, status: string): Promise<void> {
    console.log(`Updated appointment ${appointmentId} to ${status}`);
  }
}