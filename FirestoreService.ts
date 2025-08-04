import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { firestore } from './firebase';
import { Appointment, HolidayRequest } from './types';

export class FirestoreService {
  // Subscribe to staff member's appointments
  static subscribeToAppointments(
    staffId: string,
    callback: (appointments: Appointment[]) => void
  ): Unsubscribe {
    const appointmentsRef = collection(firestore, 'appointments');
    const q = query(
      appointmentsRef,
      where('staffId', '==', staffId),
      orderBy('startTime', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const appointments: Appointment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          staffId: data.staffId,
          clientName: data.clientName,
          service: data.service,
          startTime: data.startTime instanceof Timestamp ? data.startTime.toDate() : new Date(data.startTime),
          endTime: data.endTime instanceof Timestamp ? data.endTime.toDate() : new Date(data.endTime),
          status: data.status,
          notes: data.notes,
        });
      });
      callback(appointments);
    });
  }

  // Subscribe to staff member's holiday requests
  static subscribeToHolidayRequests(
    staffId: string,
    callback: (requests: HolidayRequest[]) => void
  ): Unsubscribe {
    const holidayRequestsRef = collection(firestore, 'holidayRequests');
    const q = query(
      holidayRequestsRef,
      where('staffId', '==', staffId),
      orderBy('requestedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const requests: HolidayRequest[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          staffId: data.staffId,
          startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate),
          endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate),
          reason: data.reason,
          status: data.status,
          requestedAt: data.requestedAt instanceof Timestamp ? data.requestedAt.toDate() : new Date(data.requestedAt),
          reviewedAt: data.reviewedAt ? (data.reviewedAt instanceof Timestamp ? data.reviewedAt.toDate() : new Date(data.reviewedAt)) : undefined,
          reviewedBy: data.reviewedBy,
        });
      });
      callback(requests);
    });
  }

  // Get today's appointments for a staff member
  static subscribeToTodaysAppointments(
    staffId: string,
    callback: (appointments: Appointment[]) => void
  ): Unsubscribe {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const appointmentsRef = collection(firestore, 'appointments');
    const q = query(
      appointmentsRef,
      where('staffId', '==', staffId),
      where('startTime', '>=', Timestamp.fromDate(startOfDay)),
      where('startTime', '<', Timestamp.fromDate(endOfDay)),
      orderBy('startTime', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const appointments: Appointment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          staffId: data.staffId,
          clientName: data.clientName,
          service: data.service,
          startTime: data.startTime instanceof Timestamp ? data.startTime.toDate() : new Date(data.startTime),
          endTime: data.endTime instanceof Timestamp ? data.endTime.toDate() : new Date(data.endTime),
          status: data.status,
          notes: data.notes,
        });
      });
      callback(appointments);
    });
  }

  // Get upcoming appointments (next 7 days)
  static subscribeToUpcomingAppointments(
    staffId: string,
    callback: (appointments: Appointment[]) => void
  ): Unsubscribe {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(now.getDate() + 7);

    const appointmentsRef = collection(firestore, 'appointments');
    const q = query(
      appointmentsRef,
      where('staffId', '==', staffId),
      where('startTime', '>=', Timestamp.fromDate(now)),
      where('startTime', '<=', Timestamp.fromDate(weekFromNow)),
      orderBy('startTime', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const appointments: Appointment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          staffId: data.staffId,
          clientName: data.clientName,
          service: data.service,
          startTime: data.startTime instanceof Timestamp ? data.startTime.toDate() : new Date(data.startTime),
          endTime: data.endTime instanceof Timestamp ? data.endTime.toDate() : new Date(data.endTime),
          status: data.status,
          notes: data.notes,
        });
      });
      callback(appointments);
    });
  }
}