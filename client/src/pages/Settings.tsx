import { useState, useEffect } from "react";
import { Save, Upload, Download, AlertTriangle, RotateCcw, User, Lock } from "lucide-react";
import { StorageService } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";

interface Settings {
  centerName: string;
  centerEmail: string;
  centerPhone: string;
  centerAddress: string;
  defaultFee: number;
  lateFee: number;
  gracePeriod: number;
  feeDueDate: number;
}

export function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    centerName: 'Excellence Coaching Center',
    centerEmail: 'admin@excellencecoaching.com',
    centerPhone: '+91-9876543210',
    centerAddress: '123 Education Street, Knowledge City, State - 123456',
    defaultFee: 2500,
    lateFee: 100,
    gracePeriod: 3,
    feeDueDate: 10,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = StorageService.getSettings();
    setSettings(savedSettings);
  };

  const handleInputChange = (field: keyof Settings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    StorageService.setSettings(settings);
    setHasChanges(false);
    toast.success('Settings saved successfully');
    
    StorageService.addNotification({
      type: 'info',
      message: 'System settings updated',
      read: false
    });
  };

  const handleBackupData = () => {
    try {
      const backupData = StorageService.exportAllData();
      const dataBlob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `coaching_center_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Data backup exported successfully');
    } catch (error) {
      toast.error('Failed to export backup data');
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const success = StorageService.importAllData(jsonData);
        
        if (success) {
          toast.success('Data imported successfully');
          loadSettings();
          // Reload the page to update all components
          window.location.reload();
        } else {
          toast.error('Failed to import data - Invalid format');
        }
      } catch (error) {
        toast.error('Failed to import data');
      }
    };
    reader.readAsText(file);
  };

  const handleExportStudents = () => {
    try {
      const students = StorageService.getStudents();
      const dataStr = JSON.stringify(students, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `students_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Student data exported successfully');
    } catch (error) {
      toast.error('Failed to export student data');
    }
  };

  const handleClearAllAttendance = () => {
    if (!confirm('Are you sure you want to clear all attendance records? This action cannot be undone.')) {
      return;
    }

    StorageService.setAttendance({});
    toast.success('All attendance records cleared');
    
    StorageService.addNotification({
      type: 'info',
      message: 'All attendance records cleared',
      read: false
    });
  };

  const handleResetAllData = () => {
    if (!confirm('Are you sure you want to reset all data? This will delete everything and cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete all students, fees, attendance, and notifications. Are you absolutely sure?')) {
      return;
    }

    StorageService.clearAllData();
    toast.success('All data has been reset');
    
    // Reload the page to reinitialize with sample data
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleProfileUpdate = () => {
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (profileData.newPassword && profileData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    // In a real app, this would make an API call
    toast.success('Profile updated successfully');
    setProfileData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Profile Management */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-violet-500 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Profile Management</h3>
            <p className="text-sm text-muted-foreground">Manage your account information and security</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Account Information</span>
            </h4>
            <div>
              <Label htmlFor="profileName">Full Name</Label>
              <Input
                id="profileName"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="profileEmail">Email Address</Label>
              <Input
                id="profileEmail"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p><strong>Role:</strong> {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}</p>
              <p><strong>Last Login:</strong> {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>Change Password</span>
            </h4>
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={profileData.currentPassword}
                onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={profileData.newPassword}
                onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={profileData.confirmPassword}
                onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
            <Button onClick={handleProfileUpdate} className="btn-primary w-full">
              Update Profile
            </Button>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
          {hasChanges && (
            <Button
              onClick={handleSaveSettings}
              className="btn-primary flex items-center space-x-2"
              data-testid="button-save-settings"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </Button>
          )}
        </div>
        
        <div className="space-y-6">
          <div>
            <Label htmlFor="centerName">Coaching Center Name</Label>
            <Input
              id="centerName"
              value={settings.centerName}
              onChange={(e) => handleInputChange('centerName', e.target.value)}
              data-testid="input-center-name"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="centerEmail">Contact Email</Label>
              <Input
                id="centerEmail"
                type="email"
                value={settings.centerEmail}
                onChange={(e) => handleInputChange('centerEmail', e.target.value)}
                data-testid="input-center-email"
              />
            </div>
            <div>
              <Label htmlFor="centerPhone">Contact Phone</Label>
              <Input
                id="centerPhone"
                type="tel"
                value={settings.centerPhone}
                onChange={(e) => handleInputChange('centerPhone', e.target.value)}
                data-testid="input-center-phone"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="centerAddress">Address</Label>
            <Textarea
              id="centerAddress"
              value={settings.centerAddress}
              onChange={(e) => handleInputChange('centerAddress', e.target.value)}
              rows={3}
              data-testid="input-center-address"
            />
          </div>
        </div>
      </div>

      {/* Fee Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Fee Settings</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultFee">Default Monthly Fee (₹)</Label>
              <Input
                id="defaultFee"
                type="number"
                value={settings.defaultFee}
                onChange={(e) => handleInputChange('defaultFee', parseInt(e.target.value))}
                data-testid="input-default-fee"
              />
            </div>
            <div>
              <Label htmlFor="lateFee">Late Fee Penalty (₹)</Label>
              <Input
                id="lateFee"
                type="number"
                value={settings.lateFee}
                onChange={(e) => handleInputChange('lateFee', parseInt(e.target.value))}
                data-testid="input-late-fee"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gracePeriod">Grace Period (Days)</Label>
              <Input
                id="gracePeriod"
                type="number"
                value={settings.gracePeriod}
                onChange={(e) => handleInputChange('gracePeriod', parseInt(e.target.value))}
                data-testid="input-grace-period"
              />
            </div>
            <div>
              <Label htmlFor="feeDueDate">Fee Due Date</Label>
              <Select
                value={settings.feeDueDate.toString()}
                onValueChange={(value) => handleInputChange('feeDueDate', parseInt(value))}
              >
                <SelectTrigger data-testid="select-fee-due-date">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st of every month</SelectItem>
                  <SelectItem value="5">5th of every month</SelectItem>
                  <SelectItem value="10">10th of every month</SelectItem>
                  <SelectItem value="15">15th of every month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Data Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Backup & Export</h4>
            <Button
              onClick={handleBackupData}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              data-testid="button-backup-data"
            >
              <Download className="w-5 h-5" />
              <span>Export All Data</span>
            </Button>
            
            <Button
              onClick={handleExportStudents}
              className="w-full btn-success flex items-center justify-center space-x-2"
              data-testid="button-export-students"
            >
              <Download className="w-5 h-5" />
              <span>Export Students</span>
            </Button>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Import & Restore</h4>
            <div className="space-y-2">
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                data-testid="input-import-file"
              />
              <p className="text-xs text-gray-500">Select a JSON backup file to restore data</p>
            </div>
          </div>
        </div>
        
        {/* Danger Zone */}
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-md font-medium text-red-900 mb-2 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Danger Zone</span>
          </h4>
          <p className="text-sm text-red-700 mb-4">These actions cannot be undone. Please be careful.</p>
          <div className="space-y-2">
            <Button
              onClick={handleClearAllAttendance}
              className="btn-danger mr-3"
              data-testid="button-clear-attendance"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear All Attendance
            </Button>
            <Button
              onClick={handleResetAllData}
              className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-lg transition-colors"
              data-testid="button-reset-all-data"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Reset All Data
            </Button>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900" data-testid="stat-total-students">
              {StorageService.getStudents().length}
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900" data-testid="stat-total-fees">
              {StorageService.getFees().length}
            </div>
            <div className="text-sm text-gray-600">Fee Records</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900" data-testid="stat-attendance-dates">
              {Object.keys(StorageService.getAttendance()).length}
            </div>
            <div className="text-sm text-gray-600">Attendance Days</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900" data-testid="stat-notifications">
              {StorageService.getNotifications().length}
            </div>
            <div className="text-sm text-gray-600">Notifications</div>
          </div>
        </div>
      </div>
    </div>
  );
}
