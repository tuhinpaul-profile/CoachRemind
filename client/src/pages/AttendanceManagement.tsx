import { useState, useEffect } from "react";
import { Check, X, Search, Filter, Clock, Calendar, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { StorageService } from "@/lib/storage";
import { EmailService } from "@/lib/emailService";
import { Student, AttendanceRecord, AttendanceStats, AttendanceBatch, AttendanceSubmission } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";

export function AttendanceManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [paginatedStudents, setPaginatedStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [stats, setStats] = useState<AttendanceStats>({ present: 0, absent: 0, pending: 0 });
  const [pendingAttendance, setPendingAttendance] = useState<{[key: string]: 'present' | 'absent'}>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'pending'>('saved');
  const [pendingBatches, setPendingBatches] = useState<AttendanceBatch[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState(isAdmin ? 'take-attendance' : 'take-attendance');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    if (isAdmin) {
      loadPendingBatches();
    }
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, gradeFilter]);

  useEffect(() => {
    calculateStats();
  }, [filteredStudents, attendance, selectedDate]);

  // Auto-save when attendance changes
  useEffect(() => {
    if (Object.keys(attendance).length > 0) {
      setAutoSaveStatus('pending');
      const saveTimer = setTimeout(() => {
        autoSaveAttendance();
      }, 1000); // Auto-save after 1 second of inactivity
      
      return () => clearTimeout(saveTimer);
    }
  }, [attendance]);

  useEffect(() => {
    paginateStudents();
  }, [filteredStudents, currentPage, pageSize]);

  const loadPendingBatches = () => {
    if (isAdmin) {
      const batches = StorageService.getPendingAttendanceBatches();
      setPendingBatches(batches);
    }
  };

  const loadData = () => {
    let studentsData = StorageService.getStudents();
    const attendanceData = StorageService.getAttendance();
    console.log('Raw students data:', studentsData);
    
    // If no students exist, create some sample data for testing
    if (studentsData.length === 0) {
      console.log('No students found, creating sample data');
      const sampleStudents = [
        { 
          id: 1, name: 'Kavya Kapoor', rollNumber: '8-016', grade: '8th', 
          phone: '9876543210', email: 'kavya@example.com', 
          parentEmail: 'kapoor@example.com', parentPhone: '9876543210',
          monthlyFee: 2500, status: 'active' as const,
          enrollmentDate: '2024-01-15'
        },
        { 
          id: 2, name: 'Pari Mehta', rollNumber: '8-020', grade: '8th', 
          phone: '9876543211', email: 'pari@example.com', 
          parentEmail: 'mehta@example.com', parentPhone: '9876543211',
          monthlyFee: 2500, status: 'active' as const,
          enrollmentDate: '2024-01-20'
        },
        { 
          id: 3, name: 'Sai Singh', rollNumber: '9-005', grade: '9th', 
          phone: '9876543212', email: 'sai@example.com', 
          parentEmail: 'singh@example.com', parentPhone: '9876543212',
          monthlyFee: 2500, status: 'active' as const,
          enrollmentDate: '2024-02-01'
        },
        { 
          id: 4, name: 'Arjun Sharma', rollNumber: '10-012', grade: '10th', 
          phone: '9876543213', email: 'arjun@example.com', 
          parentEmail: 'sharma@example.com', parentPhone: '9876543213',
          monthlyFee: 2500, status: 'active' as const,
          enrollmentDate: '2024-02-10'
        },
        { 
          id: 5, name: 'Priya Gupta', rollNumber: '7-008', grade: '7th', 
          phone: '9876543214', email: 'priya@example.com', 
          parentEmail: 'gupta@example.com', parentPhone: '9876543214',
          monthlyFee: 2500, status: 'active' as const,
          enrollmentDate: '2024-01-25'
        }
      ];
      StorageService.setStudents(sampleStudents);
      studentsData = sampleStudents;
    }
    
    // Create sample attendance submissions for demonstration if none exist
    const existingSubmissions = StorageService.getAttendanceSubmissions();
    if (existingSubmissions.length === 0 && isAdmin) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Create sample submissions from different teachers
      const sampleAttendanceData = {
        [yesterday]: {
          1: 'present' as const,
          2: 'absent' as const,
          3: 'present' as const
        }
      };
      
      StorageService.submitAttendanceForApproval(
        yesterday,
        sampleAttendanceData[yesterday],
        'teacher1',
        'Ms. Sarah Johnson',
        studentsData
      );
      
      // Create another batch for today
      const todayAttendanceData = {
        [today]: {
          1: 'present' as const,
          2: 'present' as const,
          4: 'absent' as const,
          5: 'present' as const
        }
      };
      
      StorageService.submitAttendanceForApproval(
        today,
        todayAttendanceData[today],
        'teacher2', 
        'Mr. David Wilson',
        studentsData
      );
    }
    
    console.log('Students with status:', studentsData.map(s => ({ id: s.id, name: s.name, status: s.status })));
    
    // Only show students with active status
    const activeStudents = studentsData.filter(student => 
      !student.status || student.status === 'active'
    );
    console.log('Active students:', activeStudents.length);
    setStudents(activeStudents);
    setAttendance(attendanceData);
  };

  const filterStudents = () => {
    let filtered = [...students];

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (gradeFilter && gradeFilter !== 'all') {
      filtered = filtered.filter(student => student.grade === gradeFilter);
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  };

  const paginateStudents = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setPaginatedStudents(filteredStudents.slice(startIndex, endIndex));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const calculateStats = () => {
    const dayAttendance = attendance[selectedDate] || {};
    
    // Calculate stats based on filtered students only
    const filteredStudentIds = filteredStudents.map(s => s.id);
    const present = filteredStudentIds.filter(id => dayAttendance[id] === 'present').length;
    const absent = filteredStudentIds.filter(id => dayAttendance[id] === 'absent').length;
    const pending = filteredStudents.length - present - absent;

    setStats({ present, absent, pending });
  };

  const markAttendance = async (studentId: number, status: 'present' | 'absent') => {
    try {
      if (isAdmin) {
        // Admin can directly update attendance
        const updatedAttendance = {
          ...attendance,
          [selectedDate]: {
            ...attendance[selectedDate],
            [studentId]: status
          }
        };

        setAttendance(updatedAttendance);
        StorageService.setAttendance(updatedAttendance);
      } else {
        // Teachers update pending attendance for later submission
        setPendingAttendance(prev => ({
          ...prev,
          [`${selectedDate}-${studentId}`]: status
        }));
      }

      // Send automatic notification for absent students (admin only)
      if (isAdmin && status === 'absent') {
        const student = students.find(s => s.id === studentId);
        if (student) {
          try {
            await EmailService.sendAbsenceNotification(student, selectedDate);
            toast.success(`Absence notification sent to ${student.name}'s parent`);
          } catch (error) {
            console.error('Failed to send absence notification:', error);
          }
        }
      }

      toast.success(`Attendance marked as ${status}${!isAdmin ? ' (pending approval)' : ''}`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  };

  const submitAttendanceForApproval = () => {
    if (Object.keys(pendingAttendance).length === 0) {
      toast.error("Please mark attendance for students before submitting.");
      return;
    }

    // Convert pending attendance to the format expected by the service
    const attendanceByStudent: { [studentId: number]: 'present' | 'absent' | 'late' } = {};
    
    Object.entries(pendingAttendance).forEach(([key, status]) => {
      const [date, studentIdStr] = key.split('-');
      if (date === selectedDate) {
        attendanceByStudent[parseInt(studentIdStr)] = status;
      }
    });

    const submissions = StorageService.submitAttendanceForApproval(
      selectedDate,
      attendanceByStudent,
      user?.id || 'teacher',
      user?.username || 'Teacher',
      students
    );

    if (submissions.length > 0) {
      toast.success(`Attendance for ${submissions.length} students submitted for admin approval.`);
      
      // Clear pending attendance for this date
      const newPending = { ...pendingAttendance };
      Object.keys(newPending).forEach(key => {
        if (key.startsWith(selectedDate)) {
          delete newPending[key];
        }
      });
      setPendingAttendance(newPending);
    } else {
      toast.error("Failed to submit attendance for approval.");
    }
  };

  const markAllPresent = () => {
    if (gradeFilter === 'all') {
      toast.error('Please select a specific grade to mark attendance');
      return;
    }

    const updatedAttendance = {
      ...attendance,
      [selectedDate]: {
        ...attendance[selectedDate]
      }
    };

    // Only mark filtered students as present
    filteredStudents.forEach(student => {
      updatedAttendance[selectedDate][student.id] = 'present';
    });

    setAttendance(updatedAttendance);
    StorageService.setAttendance(updatedAttendance);
    toast.success(`All ${filteredStudents.length} students in ${gradeFilter} marked present`);
  };

  const markAllAbsent = () => {
    if (gradeFilter === 'all') {
      toast.error('Please select a specific grade to mark attendance');
      return;
    }

    const updatedAttendance = {
      ...attendance,
      [selectedDate]: {
        ...attendance[selectedDate]
      }
    };

    // Only mark filtered students as absent
    filteredStudents.forEach(student => {
      updatedAttendance[selectedDate][student.id] = 'absent';
    });

    setAttendance(updatedAttendance);
    StorageService.setAttendance(updatedAttendance);
    toast.warning(`All ${filteredStudents.length} students in ${gradeFilter} marked absent`);
  };

  const autoSaveAttendance = () => {
    setAutoSaveStatus('saving');
    
    try {
      console.log('Auto-saving attendance data');
      StorageService.setAttendance(attendance);
      setLastSaved(new Date());
      setAutoSaveStatus('saved');
      
      // Add notification for significant changes (when a full grade is processed)
      if (gradeFilter !== 'all') {
        const dayAttendance = attendance[selectedDate] || {};
        const filteredStudentIds = filteredStudents.map(s => s.id);
        const markedCount = filteredStudentIds.filter(id => dayAttendance[id]).length;
        
        if (markedCount > 0) {
          StorageService.addNotification({
            type: 'attendance',
            message: `Attendance updated for ${gradeFilter} - ${markedCount} students marked`,
            read: false
          });
        }
      }
      
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('pending');
      toast.error('Auto-save failed - please check your connection');
    }
  };

  const getAttendanceStatus = (studentId: number) => {
    if (isAdmin) {
      return attendance[selectedDate]?.[studentId] || 'pending';
    } else {
      // For teachers, check pending attendance first
      const pendingKey = `${selectedDate}-${studentId}`;
      return pendingAttendance[pendingKey] || attendance[selectedDate]?.[studentId] || 'pending';
    }
  };

  // Approval functions
  const handleApproveSelected = () => {
    if (selectedSubmissions.size === 0) {
      toast.error("Please select attendance records to approve.");
      return;
    }

    const success = StorageService.approveAttendanceSubmissions(
      Array.from(selectedSubmissions),
      String(user?.id || 'admin')
    );

    if (success) {
      toast.success(`${selectedSubmissions.size} attendance records have been approved. Teachers will be notified via email.`);
      setSelectedSubmissions(new Set());
      loadPendingBatches();
      loadData(); // Refresh the main attendance data
    } else {
      toast.error("Failed to approve attendance records.");
    }
  };

  const handleRejectSelected = () => {
    if (selectedSubmissions.size === 0) {
      toast.error("Please select attendance records to reject.");
      return;
    }

    const success = StorageService.rejectAttendanceSubmissions(
      Array.from(selectedSubmissions),
      String(user?.id || 'admin')
    );

    if (success) {
      toast.success(`${selectedSubmissions.size} attendance records have been rejected. Teachers will be notified via email.`);
      setSelectedSubmissions(new Set());
      loadPendingBatches();
    } else {
      toast.error("Failed to reject attendance records.");
    }
  };

  const handleApproveBatch = (batch: AttendanceBatch) => {
    const submissionIds = batch.submissions.map(s => s.id);
    const success = StorageService.approveAttendanceSubmissions(
      submissionIds,
      String(user?.id || 'admin')
    );

    if (success) {
      toast.success(`All ${batch.totalStudents} records for ${batch.grade} on ${batch.date} have been approved. Teacher will be notified via email.`);
      loadPendingBatches();
      loadData();
    }
  };

  const handleRejectBatch = (batch: AttendanceBatch) => {
    const submissionIds = batch.submissions.map(s => s.id);
    const success = StorageService.rejectAttendanceSubmissions(
      submissionIds,
      String(user?.id || 'admin')
    );

    if (success) {
      toast.success(`All ${batch.totalStudents} records for ${batch.grade} on ${batch.date} have been rejected. Teacher will be notified via email.`);
      loadPendingBatches();
    }
  };

  const toggleSubmissionSelection = (submissionId: string) => {
    const newSelection = new Set(selectedSubmissions);
    if (newSelection.has(submissionId)) {
      newSelection.delete(submissionId);
    } else {
      newSelection.add(submissionId);
    }
    setSelectedSubmissions(newSelection);
  };

  const selectAllInBatch = (batch: AttendanceBatch) => {
    const newSelection = new Set(selectedSubmissions);
    batch.submissions.forEach(submission => {
      newSelection.add(submission.id);
    });
    setSelectedSubmissions(newSelection);
  };



  const grades = ['6th', '7th', '8th', '9th', '10th', '11th', '12th'];

  // Student image function (same as StudentManagement)
  const getStudentImage = (studentId: number) => {
    const imageOptions = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=100&h=100&fit=crop&crop=face'
    ];
    return imageOptions[studentId % imageOptions.length];
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Attendance Management</h3>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`} data-testid="tabs-attendance-management">
            <TabsTrigger value="take-attendance" data-testid="tab-take-attendance">
              <Calendar className="w-4 h-4 mr-2" />
              Take Attendance
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="approve-attendance" data-testid="tab-approve-attendance">
                <AlertCircle className="w-4 h-4 mr-2" />
                Approve Attendance
                {pendingBatches.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingBatches.reduce((sum, batch) => sum + batch.pendingCount, 0)}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="take-attendance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-800">Daily Attendance Tracking</h4>
              <div className="flex items-center space-x-4">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                  data-testid="input-attendance-date"
                />
                <button 
                  onClick={markAllPresent} 
                  disabled={gradeFilter === 'all'}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    gradeFilter === 'all' 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`} 
                  data-testid="button-mark-all-present"
                >
                  Mark All Present
                </button>
                <button 
                  onClick={markAllAbsent} 
                  disabled={gradeFilter === 'all'}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    gradeFilter === 'all' 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`} 
                  data-testid="button-mark-all-absent"
                >
                  Mark All Absent
                </button>
                {!isAdmin && Object.keys(pendingAttendance).some(key => key.startsWith(selectedDate)) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-violet-600 hover:bg-violet-700" data-testid="button-submit-for-approval">
                        <Clock className="w-4 h-4 mr-2" />
                        Submit for Approval
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent data-testid="dialog-submit-approval">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Submit Attendance for Approval</AlertDialogTitle>
                        <AlertDialogDescription>
                          Submit attendance records for {selectedDate} to admin for approval? This will send all marked attendance for this date.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel-submit">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={submitAttendanceForApproval} data-testid="button-confirm-submit">
                          Submit
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${
                    autoSaveStatus === 'saved' ? 'bg-green-50 text-green-700' :
                    autoSaveStatus === 'saving' ? 'bg-blue-50 text-blue-700' :
                    'bg-orange-50 text-orange-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      autoSaveStatus === 'saved' ? 'bg-green-500' :
                      autoSaveStatus === 'saving' ? 'bg-blue-500 animate-pulse' :
                      'bg-orange-500'
                    }`}></div>
                    <span>
                      {autoSaveStatus === 'saved' && lastSaved ? 
                        `Auto-saved ${lastSaved.toLocaleTimeString()}` :
                        autoSaveStatus === 'saving' ? 'Saving...' :
                        'Pending save'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-4 flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-student-search"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-48 pl-10" data-testid="select-grade-filter">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map(grade => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Attendance Progress */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600" data-testid="stat-present">{stats.present}</div>
            <div className="text-sm text-green-700">Present</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600" data-testid="stat-absent">{stats.absent}</div>
            <div className="text-sm text-red-700">Absent</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-600" data-testid="stat-pending">{stats.pending}</div>
            <div className="text-sm text-gray-700">Pending</div>
          </div>
        </div>

        {/* Attendance List */}
        <div className="space-y-2" data-testid="attendance-list">
          {paginatedStudents.map(student => {
            const status = getAttendanceStatus(student.id);
            const statusColors = {
              present: 'attendance-status-present',
              absent: 'attendance-status-absent',
              pending: 'attendance-status-pending'
            };

            return (
              <div
                key={student.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${statusColors[status]}`}
                data-testid={`attendance-item-${student.id}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-violet-100 flex-shrink-0">
                    <img
                      src={getStudentImage(student.id)}
                      alt={student.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className="absolute inset-0 bg-violet-100 rounded-full flex items-center justify-center" style={{display: 'none'}}>
                      <span className="text-violet-600 font-medium text-sm">
                        {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.grade} • Roll: {student.rollNumber}</div>
                    {!isAdmin && pendingAttendance[`${selectedDate}-${student.id}`] && (
                      <div className="text-xs text-orange-600 font-medium mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Pending Approval
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => markAttendance(student.id, 'present')}
                    className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      status === 'present' 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'border border-green-600 text-green-600 hover:bg-green-50 bg-white'
                    }`}
                    data-testid={`button-present-${student.id}`}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Present
                  </button>
                  <button
                    onClick={() => markAttendance(student.id, 'absent')}
                    className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      status === 'absent' 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'border border-red-600 text-red-600 hover:bg-red-50 bg-white'
                    }`}
                    data-testid={`button-absent-${student.id}`}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Absent
                  </button>
                </div>
              </div>
            );
          })}
        </div>

            {/* Pagination */}
            {filteredStudents.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredStudents.length / pageSize)}
                pageSize={pageSize}
                totalItems={filteredStudents.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </TabsContent>

          {/* Approval Tab for Admin */}
          {isAdmin && (
            <TabsContent value="approve-attendance" className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-800">Pending Attendance Approvals</h4>
                {selectedSubmissions.size > 0 && (
                  <div className="flex items-center space-x-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="default" className="bg-green-600 hover:bg-green-700" data-testid="button-approve-selected">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Selected ({selectedSubmissions.size})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-testid="dialog-approve-selected">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Approve Selected Attendance</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to approve {selectedSubmissions.size} attendance record(s)? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-approve">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleApproveSelected} data-testid="button-confirm-approve">
                            Approve
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" data-testid="button-reject-selected">
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject Selected ({selectedSubmissions.size})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-testid="dialog-reject-selected">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject Selected Attendance</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to reject {selectedSubmissions.size} attendance record(s)? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-reject">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleRejectSelected} data-testid="button-confirm-reject">
                            Reject
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>

              {pendingBatches.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
                  <p className="text-gray-500">No pending attendance approvals at the moment.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingBatches.map((batch) => (
                    <div key={batch.id} className="border rounded-lg p-6 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {batch.grade} - {new Date(batch.date).toLocaleDateString()}
                            </h5>
                            <p className="text-sm text-gray-500">
                              Submitted by {batch.teacherName} • {batch.totalStudents} students
                              <span className="ml-2 text-xs text-gray-400">
                                {new Date(batch.submittedAt).toLocaleString()}
                              </span>
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            {batch.pendingCount} pending
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => selectAllInBatch(batch)}
                            data-testid={`button-select-all-${batch.id}`}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Select All
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" data-testid={`button-approve-batch-${batch.id}`}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve Batch
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Approve Entire Batch</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to approve all {batch.totalStudents} attendance records for {batch.grade} on {new Date(batch.date).toLocaleDateString()}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleApproveBatch(batch)}>
                                  Approve All
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" data-testid={`button-reject-batch-${batch.id}`}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject Batch
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject Entire Batch</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to reject all {batch.totalStudents} attendance records for {batch.grade} on {new Date(batch.date).toLocaleDateString()}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRejectBatch(batch)}>
                                  Reject All
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {batch.submissions.map((submission) => (
                          <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedSubmissions.has(submission.id)}
                                onChange={() => toggleSubmissionSelection(submission.id)}
                                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                data-testid={`checkbox-${submission.id}`}
                              />
                              <div>
                                <div className="font-medium text-gray-900">{submission.studentName}</div>
                                <div className="text-sm text-gray-500">Roll: {submission.studentId}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={submission.status === 'present' ? 'default' : submission.status === 'absent' ? 'destructive' : 'secondary'}
                                className={submission.status === 'present' ? 'bg-green-100 text-green-700' : ''}
                              >
                                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {new Date(submission.submittedAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
