import { Timestamp } from 'firebase/firestore';

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'stylist' | 'receptionist' | 'manager';
  businessId: string;
  phone: string;
  specialties?: string[];
  salary?: {
    basicSalary: number;
    allowance: number;
    transportation: number;
    housing: number;
    totalGross: number;
  };
}

export interface Business {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
}

export interface ClockRecord {
  userId: string;
  businessId: string;
  type: 'clock-in' | 'clock-out';
  timestamp: Timestamp;
  location: { lat: number; lng: number };
  address: string;
  distanceFromBusiness: number;
  userDetails: { name: string; email: string; role: string };
  businessDetails: { name: string; location: { lat: number; lng: number } };
}

export interface HolidayRequest {
  id?: string;
  staffId: string;
  staffName: string;
  startDate: string; // 'yyyy-MM-dd'
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedAt: string;
}

export interface Appointment {
  id: string;
  businessId: string;
  staffId: string;
  clientId: string;
  serviceId: string;
  date: string; // 'yyyy-MM-dd'
  time: string;
  duration: number;
  status: string;
  notes?: string;
  clientName?: string;
  serviceName?: string;
}

export interface Rota {
  id?: string;
  staffId: string;
  businessId: string;
  week: number;
  year: number;
  schedules: ScheduleDay[];
}

export interface ScheduleDay {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isWorking: boolean;
  startTime: string; // 'HH:MM'
  endTime: string;
}

export interface CommissionBracket {
  minQAR: number;
  maxQAR: number;
  ratePercent: number;
}

export interface CommissionStructure {
  commissionBrackets: CommissionBracket[];
  bonusStructure: {
    salesPercent: number;
    salaryPercent: number;
  };
}

export interface Payslip {
  id: string;
  staffId: string;
  month: string; // 'yyyy-MM'
  basicSalary: number;
  allowances: number;
  commission: number;
  bonus: number;
  deductions: number;
  totalGross: number;
  totalNet: number;
  pdfUrl?: string;
}

export interface AuthContextType {
  user: Staff | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface LocationPermissionStatus {
  granted: boolean;
  message?: string;
}

export interface NavigationProps<T = any> {
  navigation?: {
    navigate: (screen: string, params?: T) => void;
    goBack: () => void;
    replace: (screen: string, params?: T) => void;
  };
  route?: {
    params?: T;
  };
}

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  MainTabs: undefined;
  Dashboard: undefined;
  ClockInOut: undefined;
  Schedule: undefined;
  AnnualLeave: undefined;
  RequestLeave: { 
    remainingDays: number; 
    allowance: number; 
    used: number; 
  };
  Payslips: undefined;
  Commission: undefined;
  Profile: undefined;
};

export type BottomTabParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  Appointments: undefined;
  Profile: undefined;
};