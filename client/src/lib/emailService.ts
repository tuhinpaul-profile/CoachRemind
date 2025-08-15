import emailjs from '@emailjs/browser';
import { Student, EmailConfig } from '@/types';
import { StorageService } from './storage';

export class EmailService {
  private static config: EmailConfig | null = null;

  static initialize(): boolean {
    this.config = StorageService.getEmailConfig();
    if (this.config?.publicKey) {
      emailjs.init(this.config.publicKey);
      return true;
    }
    return false;
  }

  static setConfig(config: EmailConfig): void {
    this.config = config;
    StorageService.setEmailConfig(config);
    if (config.publicKey) {
      emailjs.init(config.publicKey);
    }
  }

  static async testConnection(): Promise<boolean> {
    if (!this.config || !this.config.serviceId || !this.config.templateId) {
      throw new Error('Email configuration is incomplete');
    }

    try {
      const templateParams = {
        to_email: 'test@example.com',
        subject: 'Test Email from Excellence Coaching Center',
        message: 'This is a test email to verify the email configuration.',
        from_name: 'Excellence Coaching Center'
      };

      await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        templateParams
      );

      return true;
    } catch (error) {
      console.error('Email test failed:', error);
      throw error;
    }
  }

  static async sendAbsenceNotification(student: Student, date: string): Promise<void> {
    if (!this.config || !this.config.serviceId || !this.config.templateId) {
      throw new Error('Email configuration not set');
    }

    const templateParams = {
      to_email: student.parentEmail,
      student_name: student.name,
      date: new Date(date).toLocaleDateString(),
      grade: student.grade,
      parent_name: `Parent of ${student.name}`,
      from_name: 'Excellence Coaching Center',
      subject: `Absence Alert - ${student.name}`,
      message: `Dear Parent,\n\nThis is to inform you that ${student.name} (Grade ${student.grade}) was absent from class on ${new Date(date).toLocaleDateString()}.\n\nIf this absence was planned, please ignore this message. Otherwise, please contact us for more information.\n\nBest regards,\nExcellence Coaching Center`
    };

    try {
      await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        templateParams
      );

      StorageService.addNotification({
        type: 'attendance',
        message: `Absence notification sent to ${student.name}'s parent`,
        read: false,
        studentId: student.id
      });
    } catch (error) {
      console.error('Failed to send absence notification:', error);
      throw error;
    }
  }

  static async sendFeeReminder(student: Student, fee: { amount: number; dueDate: string; description: string }): Promise<void> {
    if (!this.config || !this.config.serviceId || !this.config.templateId) {
      throw new Error('Email configuration not set');
    }

    const isOverdue = new Date(fee.dueDate) < new Date();
    const daysOverdue = isOverdue ? Math.floor((new Date().getTime() - new Date(fee.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const templateParams = {
      to_email: student.parentEmail,
      student_name: student.name,
      amount: fee.amount,
      due_date: new Date(fee.dueDate).toLocaleDateString(),
      description: fee.description,
      grade: student.grade,
      parent_name: `Parent of ${student.name}`,
      from_name: 'Excellence Coaching Center',
      subject: isOverdue ? `Overdue Fee Payment - ${student.name}` : `Fee Payment Reminder - ${student.name}`,
      message: isOverdue 
        ? `Dear Parent,\n\nThis is to remind you that the fee payment for ${student.name} (Grade ${student.grade}) is overdue by ${daysOverdue} days.\n\nAmount: ₹${fee.amount}\nDue Date: ${new Date(fee.dueDate).toLocaleDateString()}\nDescription: ${fee.description}\n\nPlease make the payment at the earliest to avoid any inconvenience.\n\nBest regards,\nExcellence Coaching Center`
        : `Dear Parent,\n\nThis is a friendly reminder that the fee payment for ${student.name} (Grade ${student.grade}) is due.\n\nAmount: ₹${fee.amount}\nDue Date: ${new Date(fee.dueDate).toLocaleDateString()}\nDescription: ${fee.description}\n\nPlease make the payment on time to avoid late fees.\n\nBest regards,\nExcellence Coaching Center`
    };

    try {
      await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        templateParams
      );

      StorageService.addNotification({
        type: 'fee',
        message: `Fee reminder sent to ${student.name}'s parent`,
        read: false,
        studentId: student.id
      });
    } catch (error) {
      console.error('Failed to send fee reminder:', error);
      throw error;
    }
  }

  static async sendCustomMessage(recipients: string[], subject: string, message: string): Promise<void> {
    if (!this.config || !this.config.serviceId || !this.config.templateId) {
      throw new Error('Email configuration not set');
    }

    const promises = recipients.map(email => {
      const templateParams = {
        to_email: email,
        subject,
        message,
        from_name: 'Excellence Coaching Center'
      };

      return emailjs.send(
        this.config!.serviceId,
        this.config!.templateId,
        templateParams
      );
    });

    try {
      await Promise.all(promises);

      StorageService.addNotification({
        type: 'custom',
        message: `Custom message sent to ${recipients.length} recipients`,
        read: false
      });
    } catch (error) {
      console.error('Failed to send custom message:', error);
      throw error;
    }
  }
}
