export interface StaffMember {
  uid: string;
  email: string;
  name: string;
  role: string;
  location: string;
  staffId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  staffId: string;
  clientName: string;
  service: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

export interface HolidayRequest {
  id: string;
  staffId: string;
  staffName: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}