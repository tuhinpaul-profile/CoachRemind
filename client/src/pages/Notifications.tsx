import { useState, useEffect } from "react";
import { Send, Mail, Settings, History, TestTube } from "lucide-react";
import { StorageService } from "@/lib/storage";
import { EmailService } from "@/lib/emailService";
import { Student, Fee, Notification, EmailConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomMessageModal } from "@/components/Modals/CustomMessageModal";
import { useToast } from "@/hooks/useToast";

export function Notifications() {
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    serviceId: '',
    templateId: '',
    publicKey: ''
  });
  const [isCustomMessageModalOpen, setIsCustomMessageModalOpen] = useState(false);
  const [emailStats, setEmailStats] = useState({
    todayCount: 0,
    monthCount: 0,
    successRate: 100
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const studentsData = StorageService.getStudents();
    const feesData = StorageService.getFees();
    const notificationsData = StorageService.getNotifications();
    const savedEmailConfig = StorageService.getEmailConfig();

    setStudents(studentsData);
    setFees(feesData);
    setNotifications(notificationsData);

    if (savedEmailConfig) {
      setEmailConfig(savedEmailConfig);
    }

    calculateEmailStats(notificationsData);
  };

  const calculateEmailStats = (notificationsData: Notification[]) => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const todayNotifications = notificationsData.filter(n => 
      n.timestamp.startsWith(today) && (n.type === 'attendance' || n.type === 'fee')
    );

    const monthNotifications = notificationsData.filter(n => {
      const notifDate = new Date(n.timestamp);
      return notifDate.getMonth() === currentMonth && 
             notifDate.getFullYear() === currentYear &&
             (n.type === 'attendance' || n.type === 'fee');
    });

    setEmailStats({
      todayCount: todayNotifications.length,
      monthCount: monthNotifications.length,
      successRate: 100 // Assuming all notifications are successful for demo
    });
  };

  const handleSaveEmailConfig = () => {
    EmailService.setConfig(emailConfig);
    toast.success('Email configuration saved successfully');
  };

  const handleTestEmailConnection = async () => {
    if (!emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) {
      toast.error('Please fill in all email configuration fields');
      return;
    }

    try {
      await EmailService.testConnection();
      toast.success('Email connection test successful');
    } catch (error) {
      toast.error('Email connection test failed');
    }
  };

  const handleSendAbsenceNotifications = async () => {
    const today = new Date().toISOString().split('T')[0];
    const attendance = StorageService.getAttendance();
    const todayAttendance = attendance[today] || {};
    
    const absentStudents = students.filter(student => todayAttendance[student.id] === 'absent');
    
    if (absentStudents.length === 0) {
      toast.info('No absent students today');
      return;
    }

    if (!emailConfig.serviceId) {
      toast.error('Email configuration required');
      return;
    }

    let successCount = 0;
    
    for (const student of absentStudents) {
      try {
        await EmailService.sendAbsenceNotification(student, today);
        successCount++;
      } catch (error) {
        console.error(`Failed to send absence notification to ${student.name}:`, error);
      }
    }

    toast.success(`Absence notifications sent to ${successCount} parents`);
    loadData(); // Reload to update notification history
  };

  const handleSendFeeNotifications = async () => {
    const overdueAndPendingFees = fees.filter(fee => fee.status === 'overdue' || fee.status === 'pending');
    
    if (overdueAndPendingFees.length === 0) {
      toast.info('No overdue or pending fees');
      return;
    }

    if (!emailConfig.serviceId) {
      toast.error('Email configuration required');
      return;
    }

    let successCount = 0;
    
    for (const fee of overdueAndPendingFees) {
      const student = students.find(s => s.id === fee.studentId);
      if (student) {
        try {
          await EmailService.sendFeeReminder(student, {
            amount: fee.amount,
            dueDate: fee.dueDate,
            description: fee.description
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to send fee reminder to ${student.name}:`, error);
        }
      }
    }

    toast.success(`Fee reminders sent to ${successCount} parents`);
    loadData(); // Reload to update notification history
  };

  const handleSendCustomMessage = async (recipients: string, subject: string, message: string) => {
    if (!emailConfig.serviceId) {
      toast.error('Email configuration required');
      return;
    }

    let emailList: string[] = [];

    switch (recipients) {
      case 'all_parents':
        emailList = students.map(s => s.parentEmail);
        break;
      case 'all_students':
        emailList = students.map(s => s.email);
        break;
      case 'overdue_fees':
        const overdueStudents = fees
          .filter(fee => fee.status === 'overdue')
          .map(fee => students.find(s => s.id === fee.studentId))
          .filter(Boolean)
          .map(student => student!.parentEmail);
        emailList = Array.from(new Set(overdueStudents)); // Remove duplicates
        break;
      case 'low_attendance':
        // For demo, assume low attendance students are those absent today
        const today = new Date().toISOString().split('T')[0];
        const attendance = StorageService.getAttendance();
        const todayAttendance = attendance[today] || {};
        const lowAttendanceStudents = students
          .filter(student => todayAttendance[student.id] === 'absent')
          .map(student => student.parentEmail);
        emailList = lowAttendanceStudents;
        break;
    }

    if (emailList.length === 0) {
      toast.error('No recipients found for the selected group');
      return;
    }

    try {
      await EmailService.sendCustomMessage(emailList, subject, message);
      toast.success(`Custom message sent to ${emailList.length} recipients`);
      loadData(); // Reload to update notification history
    } catch (error) {
      toast.error('Failed to send custom message');
    }
  };

  const handleClearNotificationHistory = () => {
    if (confirm('Are you sure you want to clear all notification history?')) {
      StorageService.setNotifications([]);
      setNotifications([]);
      toast.success('Notification history cleared');
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Configuration */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Email Configuration (EmailJS)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="serviceId">Service ID</Label>
            <Input
              id="serviceId"
              type="text"
              value={emailConfig.serviceId}
              onChange={(e) => setEmailConfig(prev => ({ ...prev, serviceId: e.target.value }))}
              placeholder="your_service_id"
              data-testid="input-email-service-id"
            />
          </div>
          <div>
            <Label htmlFor="templateId">Template ID</Label>
            <Input
              id="templateId"
              type="text"
              value={emailConfig.templateId}
              onChange={(e) => setEmailConfig(prev => ({ ...prev, templateId: e.target.value }))}
              placeholder="your_template_id"
              data-testid="input-email-template-id"
            />
          </div>
          <div>
            <Label htmlFor="publicKey">Public Key</Label>
            <Input
              id="publicKey"
              type="text"
              value={emailConfig.publicKey}
              onChange={(e) => setEmailConfig(prev => ({ ...prev, publicKey: e.target.value }))}
              placeholder="your_public_key"
              data-testid="input-email-public-key"
            />
          </div>
          <div className="flex items-end space-x-2">
            <Button
              onClick={handleSaveEmailConfig}
              className="btn-primary"
              data-testid="button-save-email-config"
            >
              <Settings className="w-4 h-4 mr-2" />
              Save Config
            </Button>
            <Button
              onClick={handleTestEmailConnection}
              variant="outline"
              data-testid="button-test-email-connection"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Test
            </Button>
          </div>
        </div>
      </div>

      {/* Automation Rules */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Automation Rules</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">Daily Attendance Reminders</h5>
              <p className="text-sm text-gray-600">Send email to parents when student is absent</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">Fee Due Reminders</h5>
              <p className="text-sm text-gray-600">Send reminders 3 days before fee due date</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">Overdue Fee Alerts</h5>
              <p className="text-sm text-gray-600">Daily reminders for overdue payments</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Manual Notifications and Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Send Manual Notifications</h3>
          <div className="space-y-4">
            <Button
              onClick={handleSendAbsenceNotifications}
              className="w-full btn-success flex items-center justify-center space-x-2"
              data-testid="button-send-absence-notifications"
            >
              <Mail className="w-5 h-5" />
              <span>Send Attendance Alerts</span>
            </Button>
            
            <Button
              onClick={handleSendFeeNotifications}
              className="w-full btn-warning flex items-center justify-center space-x-2"
              data-testid="button-send-fee-notifications"
            >
              <Send className="w-5 h-5" />
              <span>Send Fee Reminders</span>
            </Button>
            
            <Button
              onClick={() => setIsCustomMessageModalOpen(true)}
              className="w-full btn-primary flex items-center justify-center space-x-2"
              data-testid="button-send-custom-message"
            >
              <Mail className="w-5 h-5" />
              <span>Send Custom Message</span>
            </Button>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Emails Sent Today</span>
              <span className="text-sm font-bold text-green-600" data-testid="stat-emails-today">
                {emailStats.todayCount}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Total This Month</span>
              <span className="text-sm font-bold text-blue-600" data-testid="stat-emails-month">
                {emailStats.monthCount}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-violet-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Success Rate</span>
              <span className="text-sm font-bold text-violet-600" data-testid="stat-success-rate">
                {emailStats.successRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification History */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Notification History</h3>
          <Button
            onClick={handleClearNotificationHistory}
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            data-testid="button-clear-history"
          >
            <History className="w-4 h-4 mr-2" />
            Clear History
          </Button>
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto" data-testid="notification-history">
          {notifications.length > 0 ? (
            notifications.slice(0, 20).map((notification) => (
              <div key={notification.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  notification.type === 'attendance' ? 'bg-blue-500' :
                  notification.type === 'fee' ? 'bg-orange-500' :
                  notification.type === 'custom' ? 'bg-violet-500' :
                  'bg-gray-500'
                }`}></div>
                <span className="text-sm text-gray-600 flex-1">{notification.message}</span>
                <span className="text-xs text-gray-400">
                  {new Date(notification.timestamp).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">System notifications will appear here</span>
              <span className="text-xs text-gray-400 ml-auto">Ready</span>
            </div>
          )}
        </div>
      </div>

      <CustomMessageModal
        isOpen={isCustomMessageModalOpen}
        onClose={() => setIsCustomMessageModalOpen(false)}
        onSend={handleSendCustomMessage}
      />
    </div>
  );
}
