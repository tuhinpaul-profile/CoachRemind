import { useState, useEffect } from "react";
import { Check, X, Search, Filter } from "lucide-react";
import { StorageService } from "@/lib/storage";
import { EmailService } from "@/lib/emailService";
import { Student, AttendanceRecord, AttendanceStats } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { useToast } from "@/hooks/useToast";

export function AttendanceManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [paginatedStudents, setPaginatedStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [stats, setStats] = useState<AttendanceStats>({ present: 0, absent: 0, pending: 0 });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStudents();
    calculateStats();
  }, [students, attendance, selectedDate, searchTerm, gradeFilter]);

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
    const present = Object.values(dayAttendance).filter(status => status === 'present').length;
    const absent = Object.values(dayAttendance).filter(status => status === 'absent').length;
    const pending = students.length - present - absent;

    setStats({ present, absent, pending });
  };

  const markAttendance = async (studentId: number, status: 'present' | 'absent') => {
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
  };

  const markAllPresent = () => {
    const updatedAttendance = {
      ...attendance,
      [selectedDate]: {}
    };

    students.forEach(student => {
      if (!updatedAttendance[selectedDate]) {
        updatedAttendance[selectedDate] = {};
      }
      (updatedAttendance[selectedDate] as any)[student.id] = 'present';
    });

    setAttendance(updatedAttendance);
    StorageService.setAttendance(updatedAttendance);
    toast.success('All students marked present');
  };

  const markAllAbsent = () => {
    const updatedAttendance = {
      ...attendance,
      [selectedDate]: {}
    };

    students.forEach(student => {
      if (!updatedAttendance[selectedDate]) {
        updatedAttendance[selectedDate] = {};
      }
      (updatedAttendance[selectedDate] as any)[student.id] = 'absent';
    });

    setAttendance(updatedAttendance);
    StorageService.setAttendance(updatedAttendance);
    toast.warning('All students marked absent');
  };

  const saveAttendance = () => {
    StorageService.setAttendance(attendance);
    StorageService.addNotification({
      type: 'attendance',
      message: `Attendance saved for ${new Date(selectedDate).toLocaleDateString()}`,
      read: false
    });
    toast.success('Attendance saved successfully');
  };

  const getAttendanceStatus = (studentId: number) => {
    return attendance[selectedDate]?.[studentId] || 'pending';
  };

  const grades = ['6th', '7th', '8th', '9th', '10th', '11th', '12th'];

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
            <Button onClick={markAllPresent} className="btn-success" data-testid="button-mark-all-present">
              Mark All Present
            </Button>
            <Button onClick={markAllAbsent} className="btn-danger" data-testid="button-mark-all-absent">
              Mark All Absent
            </Button>
            <Button onClick={saveAttendance} className="btn-primary" data-testid="button-save-attendance">
              Save Attendance
            </Button>
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
                  <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                    <span className="text-violet-600 font-medium text-sm">
                      {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.grade} • Roll: {student.rollNumber}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => markAttendance(student.id, 'present')}
                    className={`px-3 py-1 ${status === 'present' ? 'btn-success' : 'btn-secondary'} text-sm`}
                    data-testid={`button-present-${student.id}`}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Present
                  </Button>
                  <Button
                    onClick={() => markAttendance(student.id, 'absent')}
                    className={`px-3 py-1 ${status === 'absent' ? 'btn-danger' : 'btn-secondary'} text-sm`}
                    data-testid={`button-absent-${student.id}`}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Absent
                  </Button>
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
