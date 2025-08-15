import { StorageService } from './storage';

export function addSampleNotifications() {
  const existingNotifications = StorageService.getNotifications();
  
  // Only add sample notifications if none exist
  if (existingNotifications.length === 0) {
    const sampleNotifications = [
      {
        type: 'custom' as const,
        message: 'Welcome to Excellence Coaching! Please remember to mark attendance daily for all grades.',
        read: false
      },
      {
        type: 'attendance' as const,
        message: 'Reminder: Attendance for 8th grade needs to be completed for today.',
        read: false
      },
      {
        type: 'fee' as const,
        message: 'Monthly fee collection deadline is approaching. 15 students have pending payments.',
        read: false
      },
      {
        type: 'info' as const,
        message: 'System backup completed successfully. All data is secure.',
        read: true
      },
      {
        type: 'custom' as const,
        message: 'New feature: Auto-save is now enabled for attendance management.',
        read: true
      },
      {
        type: 'attendance' as const,
        message: 'Attendance report for 9th grade has been generated and is ready for review.',
        read: false
      }
    ];

    // Add each notification
    sampleNotifications.forEach(notification => {
      StorageService.addNotification(notification);
    });

    console.log('Sample notifications added successfully');
  }
}