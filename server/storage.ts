import { db } from "./db";
import { 
  type User, type InsertUser, 
  type Student, type InsertStudent,
  type Attendance, type InsertAttendance,
  type Fee, type InsertFee,
  type Notification, type InsertNotification,
  type Setting, type InsertSetting,
  type EmailConfig, type InsertEmailConfig,
  users, students, attendance, fees, notifications, settings, emailConfig
} from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Student methods
  getStudents(): Promise<Student[]>;
  getAllStudents(): Promise<Student[]>; // Include inactive students
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;

  // Attendance methods
  getAttendance(date?: string): Promise<Attendance[]>;
  getStudentAttendance(studentId: string, startDate?: string, endDate?: string): Promise<Attendance[]>;
  markAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, status: string): Promise<Attendance | undefined>;

  // Fee methods
  getFees(): Promise<Fee[]>;
  getStudentFees(studentId: string): Promise<Fee[]>;
  createFee(fee: InsertFee): Promise<Fee>;
  updateFee(id: string, fee: Partial<InsertFee>): Promise<Fee | undefined>;
  deleteFee(id: string): Promise<boolean>;

  // Notification methods
  getNotifications(): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<boolean>;

  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(setting: InsertSetting): Promise<Setting>;

  // Email config methods
  getEmailConfig(): Promise<EmailConfig | undefined>;
  setEmailConfig(config: InsertEmailConfig): Promise<EmailConfig>;
}

export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Student methods
  async getStudents(): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.isActive, true)).orderBy(students.name);
  }

  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(students.name);
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
    return result[0];
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const result = await db.insert(students).values(student).returning();
    return result[0];
  }

  async updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const result = await db.update(students)
      .set({ ...student, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return result[0];
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = await db.update(students)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return result.length > 0;
  }

  // Attendance methods
  async getAttendance(date?: string): Promise<Attendance[]> {
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      
      return await db.select().from(attendance)
        .where(
          and(
            gte(attendance.date, startOfDay),
            lte(attendance.date, endOfDay)
          )
        )
        .orderBy(desc(attendance.date));
    }
    
    return await db.select().from(attendance).orderBy(desc(attendance.date));
  }

  async getStudentAttendance(studentId: string, startDate?: string, endDate?: string): Promise<Attendance[]> {
    if (startDate && endDate) {
      return await db.select().from(attendance)
        .where(
          and(
            eq(attendance.studentId, studentId),
            gte(attendance.date, new Date(startDate)),
            lte(attendance.date, new Date(endDate))
          )
        )
        .orderBy(desc(attendance.date));
    }
    
    return await db.select().from(attendance)
      .where(eq(attendance.studentId, studentId))
      .orderBy(desc(attendance.date));
  }

  async markAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const result = await db.insert(attendance).values(attendanceData).returning();
    return result[0];
  }

  async updateAttendance(id: string, status: string): Promise<Attendance | undefined> {
    const result = await db.update(attendance)
      .set({ status })
      .where(eq(attendance.id, id))
      .returning();
    return result[0];
  }

  // Fee methods
  async getFees(): Promise<Fee[]> {
    return await db.select().from(fees).orderBy(desc(fees.dueDate));
  }

  async getStudentFees(studentId: string): Promise<Fee[]> {
    return await db.select().from(fees)
      .where(eq(fees.studentId, studentId))
      .orderBy(desc(fees.dueDate));
  }

  async createFee(fee: InsertFee): Promise<Fee> {
    const result = await db.insert(fees).values(fee).returning();
    return result[0];
  }

  async updateFee(id: string, fee: Partial<InsertFee>): Promise<Fee | undefined> {
    const result = await db.update(fees)
      .set({ ...fee, updatedAt: new Date() })
      .where(eq(fees.id, id))
      .returning();
    return result[0];
  }

  async deleteFee(id: string): Promise<boolean> {
    const result = await db.delete(fees).where(eq(fees.id, id)).returning();
    return result.length > 0;
  }

  // Notification methods
  async getNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(100);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result.length > 0;
  }

  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return result[0];
  }

  async setSetting(setting: InsertSetting): Promise<Setting> {
    const existing = await this.getSetting(setting.key);
    
    if (existing) {
      const result = await db.update(settings)
        .set({ value: setting.value, updatedAt: new Date() })
        .where(eq(settings.key, setting.key))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(settings).values(setting).returning();
      return result[0];
    }
  }

  // Email config methods
  async getEmailConfig(): Promise<EmailConfig | undefined> {
    const result = await db.select().from(emailConfig)
      .where(eq(emailConfig.isActive, true))
      .limit(1);
    return result[0];
  }

  async setEmailConfig(config: InsertEmailConfig): Promise<EmailConfig> {
    // Deactivate existing configs
    await db.update(emailConfig).set({ isActive: false });
    
    // Insert new config
    const result = await db.insert(emailConfig).values({
      ...config,
      isActive: true
    }).returning();
    return result[0];
  }
}

export const storage = new DbStorage();
