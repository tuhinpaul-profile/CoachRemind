import { Student, AttendanceRecord, Fee, Notification, EmailConfig, PendingApproval, AttendanceSubmission, AttendanceBatch } from '@/types';

const STORAGE_KEYS = {
  STUDENTS: 'coaching_students',
  ATTENDANCE: 'coaching_attendance',
  FEES: 'coaching_fees',
  NOTIFICATIONS: 'coaching_notifications',
  EMAIL_CONFIG: 'coaching_email_config',
  SETTINGS: 'coaching_settings',
  PENDING_APPROVALS: 'coaching_pending_approvals',
  CURRENT_USER: 'coaching-user',
  ATTENDANCE_SUBMISSIONS: 'coaching_attendance_submissions',
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

  // Approval System Methods
  static getPendingApprovals(): PendingApproval[] {
    const data = localStorage.getItem(STORAGE_KEYS.PENDING_APPROVALS);
    return data ? JSON.parse(data) : [];
  }

  static setPendingApprovals(approvals: PendingApproval[]): void {
    localStorage.setItem(STORAGE_KEYS.PENDING_APPROVALS, JSON.stringify(approvals));
  }

  static addPendingApproval(approval: Omit<PendingApproval, 'id' | 'timestamp' | 'status'>): PendingApproval {
    const approvals = this.getPendingApprovals();
    const newApproval: PendingApproval = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      status: 'pending',
      ...approval
    };
    approvals.push(newApproval);
    this.setPendingApprovals(approvals);
    
    // Add notification for admin
    this.addNotification({
      type: 'info',
      message: `New approval request from ${approval.teacherName}: ${approval.description}`,
      read: false
    });
    
    return newApproval;
  }

  static approveRequest(approvalId: number): boolean {
    const approvals = this.getPendingApprovals();
    const approval = approvals.find(a => a.id === approvalId);
    
    if (!approval) return false;
    
    approval.status = 'approved';
    
    // Apply the approved changes based on type
    switch (approval.type) {
      case 'attendance':
        const currentAttendance = this.getAttendance();
        Object.assign(currentAttendance, approval.data);
        this.setAttendance(currentAttendance);
        break;
      case 'student_add':
        const students = this.getStudents();
        students.push(approval.data);
        this.setStudents(students);
        break;
      case 'student_edit':
        const allStudents = this.getStudents();
        const studentIndex = allStudents.findIndex(s => s.id === approval.data.id);
        if (studentIndex !== -1) {
          allStudents[studentIndex] = approval.data;
          this.setStudents(allStudents);
        }
        break;
      case 'student_delete':
        const remainingStudents = this.getStudents().filter(s => s.id !== approval.data.studentId);
        this.setStudents(remainingStudents);
        break;
    }
    
    this.setPendingApprovals(approvals);
    return true;
  }

  static rejectRequest(approvalId: number): boolean {
    const approvals = this.getPendingApprovals();
    const approval = approvals.find(a => a.id === approvalId);
    
    if (!approval) return false;
    
    approval.status = 'rejected';
    this.setPendingApprovals(approvals);
    return true;
  }

  // Attendance Submission Methods
  static getAttendanceSubmissions(): AttendanceSubmission[] {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_SUBMISSIONS);
    return data ? JSON.parse(data) : [];
  }

  static setAttendanceSubmissions(submissions: AttendanceSubmission[]): void {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_SUBMISSIONS, JSON.stringify(submissions));
  }

  static submitAttendanceForApproval(
    date: string,
    attendanceData: { [studentId: number]: 'present' | 'absent' | 'late' },
    teacherId: string,
    teacherName: string,
    students: Student[]
  ): AttendanceSubmission[] {
    const submissions = this.getAttendanceSubmissions();
    const newSubmissions: AttendanceSubmission[] = [];

    Object.entries(attendanceData).forEach(([studentId, status]) => {
      const student = students.find(s => s.id === parseInt(studentId));
      if (student) {
        const submission: AttendanceSubmission = {
          id: `${date}-${studentId}-${Date.now()}`,
          date,
          studentId: parseInt(studentId),
          studentName: student.name,
          grade: student.grade,
          status,
          teacherId,
          teacherName,
          submittedAt: new Date().toISOString(),
          approvalStatus: 'pending'
        };
        newSubmissions.push(submission);
        submissions.push(submission);
      }
    });

    this.setAttendanceSubmissions(submissions);
    
    // Add notification for admin
    this.addNotification({
      type: 'info',
      message: `${teacherName} submitted attendance for ${date} (${newSubmissions.length} students)`,
      read: false
    });

    return newSubmissions;
  }

  static approveAttendanceSubmissions(submissionIds: string[], adminId: string): boolean {
    const submissions = this.getAttendanceSubmissions();
    const attendance = this.getAttendance();

    let approved = 0;
    submissionIds.forEach(id => {
      const submission = submissions.find(s => s.id === id);
      if (submission && submission.approvalStatus === 'pending') {
        submission.approvalStatus = 'approved';
        submission.approvedAt = new Date().toISOString();
        submission.approvedBy = adminId;

        // Add to approved attendance record
        if (!attendance[submission.date]) {
          attendance[submission.date] = {};
        }
        attendance[submission.date][submission.studentId] = submission.status as 'present' | 'absent' | 'late';
        approved++;
      }
    });

    this.setAttendanceSubmissions(submissions);
    this.setAttendance(attendance);
    return approved > 0;
  }

  static rejectAttendanceSubmissions(submissionIds: string[], adminId: string): boolean {
    const submissions = this.getAttendanceSubmissions();

    let rejected = 0;
    submissionIds.forEach(id => {
      const submission = submissions.find(s => s.id === id);
      if (submission && submission.approvalStatus === 'pending') {
        submission.approvalStatus = 'rejected';
        submission.approvedAt = new Date().toISOString();
        submission.approvedBy = adminId;
        rejected++;
      }
    });

    this.setAttendanceSubmissions(submissions);
    return rejected > 0;
  }

  static getPendingAttendanceBatches(): AttendanceBatch[] {
    const submissions = this.getAttendanceSubmissions();
    const pendingSubmissions = submissions.filter(s => s.approvalStatus === 'pending');
    
    // Group by date, grade, and teacher
    const batches: { [key: string]: AttendanceBatch } = {};
    
    pendingSubmissions.forEach(submission => {
      const key = `${submission.date}-${submission.grade}-${submission.teacherId}`;
      
      if (!batches[key]) {
        batches[key] = {
          id: key,
          date: submission.date,
          grade: submission.grade,
          teacherId: submission.teacherId,
          teacherName: submission.teacherName,
          submittedAt: submission.submittedAt,
          totalStudents: 0,
          pendingCount: 0,
          submissions: []
        };
      }
      
      batches[key].submissions.push(submission);
      batches[key].totalStudents++;
      batches[key].pendingCount++;
    });

    return Object.values(batches).sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  // User Management Methods
  static getCurrentUser(): any {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  static updateUser(user: any): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }
}
