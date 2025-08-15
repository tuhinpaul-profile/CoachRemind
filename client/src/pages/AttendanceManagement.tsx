import { useState, useEffect } from "react";
import { Check, X, Search, Filter, Clock } from "lucide-react";
import { StorageService } from "@/lib/storage";
import { EmailService } from "@/lib/emailService";
import { Student, AttendanceRecord, AttendanceStats } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
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
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, gradeFilter]);

  useEffect(() => {
    calculateStats();
  }, [filteredStudents, attendance, selectedDate]);

  useEffect(() => {
    paginateStudents();
  }, [filteredStudents, currentPage, pageSize]);

  const loadData = () => {
    const studentsData = StorageService.getStudents();
    const attendanceData = StorageService.getAttendance();
    setStudents(studentsData);
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
      // Always update attendance regardless of role (simplified for demo)
      const updatedAttendance = {
        ...attendance,
        [selectedDate]: {
          ...attendance[selectedDate],
          [studentId]: status
        }
      };

      setAttendance(updatedAttendance);
      StorageService.setAttendance(updatedAttendance);

      // Send automatic notification for absent students
      if (status === 'absent') {
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

      toast.success(`Attendance marked as ${status}`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
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

  const saveAttendance = () => {
    console.log('Save button clicked! Grade filter:', gradeFilter);
    
    if (gradeFilter === 'all') {
      console.log('Blocking save - all grades selected');
      toast.error('Please select a specific grade to save attendance');
      return;
    }

    try {
      console.log('Saving attendance for grade:', gradeFilter);
      console.log('Current attendance data:', attendance);
      
      StorageService.setAttendance(attendance);
      StorageService.addNotification({
        type: 'attendance',
        message: `Attendance saved for ${gradeFilter} on ${new Date(selectedDate).toLocaleDateString()}`,
        read: false
      });
      
      // Count how many students have attendance marked for this date in the filtered grade
      const dayAttendance = attendance[selectedDate] || {};
      const filteredStudentIds = filteredStudents.map(s => s.id);
      const markedCount = filteredStudentIds.filter(id => dayAttendance[id]).length;
      
      console.log('Save successful! Marked count:', markedCount);
      toast.success(`Attendance saved for ${gradeFilter}! ${markedCount} students recorded for ${new Date(selectedDate).toLocaleDateString()}`);
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance');
    }
  };

  const getAttendanceStatus = (studentId: number) => {
    return attendance[selectedDate]?.[studentId] || 'pending';
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
          <h3 className="text-lg font-semibold text-gray-900">Daily Attendance Tracking</h3>
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
            <button 
              onClick={saveAttendance} 
              disabled={gradeFilter === 'all'}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                gradeFilter === 'all' 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-violet-600 hover:bg-violet-700 text-white'
              }`} 
              data-testid="button-save-attendance"
            >
              Save Attendance
            </button>
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
      </div>
    </div>
  );
}
