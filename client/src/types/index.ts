export interface Student {
  id: number;
  name: string;
  grade: string;
  rollNumber: string;
  email: string;
  phone: string;
  parentEmail: string;
  parentPhone: string;
  monthlyFee: number;
  status: 'active' | 'inactive';
  enrollmentDate: string;
}

export interface AttendanceRecord {
  [date: string]: {
    [studentId: number]: 'present' | 'absent';
  };
}

export interface Fee {
  id: number;
  studentId: number;
  amount: number;
  dueDate: string;
  description: string;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  paidAmount?: number;
}

export interface Notification {
  id: number;
  type: 'attendance' | 'fee' | 'custom' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
  studentId?: number;
}

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

export interface DashboardStats {
  totalStudents: number;
  todayAttendance: number;
  attendancePercentage: number;
  pendingFees: number;
  monthlyRevenue: number;
  presentCount: number;
  absentCount: number;
  pendingCount: number;
  overdueCount: number;
  dueSoonCount: number;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  pending: number;
}

export interface FeeStats {
  totalOutstanding: number;
  monthlyCollection: number;
  collectionRate: number;
  paid: number;
  pending: number;
  overdue: number;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface ReportData {
  students: Student[];
  attendance: AttendanceRecord;
  fees: Fee[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}
