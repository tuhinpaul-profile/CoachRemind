import { Student, AttendanceRecord, Fee, Notification, EmailConfig } from '@/types';

const STORAGE_KEYS = {
  STUDENTS: 'coaching_students',
  ATTENDANCE: 'coaching_attendance',
  FEES: 'coaching_fees',
  NOTIFICATIONS: 'coaching_notifications',
  EMAIL_CONFIG: 'coaching_email_config',
  SETTINGS: 'coaching_settings',
};

export class StorageService {
  static getStudents(): Student[] {
    const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return data ? JSON.parse(data) : [];
  }

  static setStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  static getAttendance(): AttendanceRecord {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : {};
  }

  static setAttendance(attendance: AttendanceRecord): void {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  }

  static getFees(): Fee[] {
    const data = localStorage.getItem(STORAGE_KEYS.FEES);
    return data ? JSON.parse(data) : [];
  }

  static setFees(fees: Fee[]): void {
    localStorage.setItem(STORAGE_KEYS.FEES, JSON.stringify(fees));
  }

  static getNotifications(): Notification[] {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  }

  static setNotifications(notifications: Notification[]): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }

  static getEmailConfig(): EmailConfig | null {
    const data = localStorage.getItem(STORAGE_KEYS.EMAIL_CONFIG);
    return data ? JSON.parse(data) : null;
  }

  static setEmailConfig(config: EmailConfig): void {
    localStorage.setItem(STORAGE_KEYS.EMAIL_CONFIG, JSON.stringify(config));
  }

  static getSettings(): any {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      centerName: 'Excellence Coaching Center',
      centerEmail: 'admin@excellencecoaching.com',
      centerPhone: '+91-9876543210',
      centerAddress: '123 Education Street, Knowledge City, State - 123456',
      defaultFee: 2500,
      lateFee: 100,
      gracePeriod: 3,
      feeDueDate: 10,
    };
  }

  static setSettings(settings: any): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  static exportAllData(): string {
    return JSON.stringify({
      students: this.getStudents(),
      attendance: this.getAttendance(),
      fees: this.getFees(),
      notifications: this.getNotifications(),
      emailConfig: this.getEmailConfig(),
      settings: this.getSettings(),
      exportDate: new Date().toISOString(),
    }, null, 2);
  }

  static importAllData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.students) this.setStudents(data.students);
      if (data.attendance) this.setAttendance(data.attendance);
      if (data.fees) this.setFees(data.fees);
      if (data.notifications) this.setNotifications(data.notifications);
      if (data.emailConfig) this.setEmailConfig(data.emailConfig);
      if (data.settings) this.setSettings(data.settings);
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  static addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const notifications = this.getNotifications();
    const newNotification: Notification = {
      ...notification,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    notifications.unshift(newNotification);
    // Keep only last 100 notifications
    if (notifications.length > 100) {
      notifications.splice(100);
    }
    this.setNotifications(notifications);
  }
}
