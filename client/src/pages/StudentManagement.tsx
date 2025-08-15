import { useState, useEffect } from "react";
import { Search, Filter, Plus, Edit, Trash2, Download, Upload } from "lucide-react";
import { StorageService } from "@/lib/storage";
import { Student, Fee } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddStudentModal } from "@/components/Modals/AddStudentModal";
import { useToast } from "@/hooks/useToast";

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, gradeFilter, statusFilter]);

  const loadData = () => {
    const studentsData = StorageService.getStudents();
    const feesData = StorageService.getFees();
    setStudents(studentsData);
    setFees(feesData);
  };

  const filterStudents = () => {
    let filtered = [...students];

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (gradeFilter && gradeFilter !== 'all') {
      filtered = filtered.filter(student => student.grade === gradeFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    setFilteredStudents(filtered);
  };

  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    const newId = Math.max(...students.map(s => s.id), 0) + 1;
    const newStudent: Student = {
      ...studentData,
      id: newId
    };

    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    StorageService.setStudents(updatedStudents);

    // Create initial fee record
    const newFee: Fee = {
      id: Math.max(...fees.map(f => f.id), 0) + 1,
      studentId: newId,
      amount: studentData.monthlyFee,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Monthly Fee - ' + new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      status: 'pending'
    };

    const updatedFees = [...fees, newFee];
    setFees(updatedFees);
    StorageService.setFees(updatedFees);

    toast.success('Student added successfully');
    StorageService.addNotification({
      type: 'info',
      message: `New student ${newStudent.name} enrolled`,
      read: false,
      studentId: newId
    });
  };

  const handleDeleteStudent = (studentId: number) => {
    if (!confirm('Are you sure you want to delete this student? This will also remove all their records.')) {
      return;
    }

    const student = students.find(s => s.id === studentId);
    const updatedStudents = students.filter(s => s.id !== studentId);
    const updatedFees = fees.filter(f => f.studentId !== studentId);
    
    // Remove from attendance records
    const attendance = StorageService.getAttendance();
    Object.keys(attendance).forEach(date => {
      delete attendance[date][studentId];
    });

    setStudents(updatedStudents);
    setFees(updatedFees);
    StorageService.setStudents(updatedStudents);
    StorageService.setFees(updatedFees);
    StorageService.setAttendance(attendance);

    toast.success(`Student ${student?.name} deleted successfully`);
    StorageService.addNotification({
      type: 'info',
      message: `Student ${student?.name} removed from system`,
      read: false
    });
  };

  const handleToggleStatus = (studentId: number) => {
    const updatedStudents = students.map(student => {
      if (student.id === studentId) {
        return { ...student, status: student.status === 'active' ? 'inactive' : 'active' as 'active' | 'inactive' };
      }
      return student;
    });

    setStudents(updatedStudents);
    StorageService.setStudents(updatedStudents);
    toast.success('Student status updated');
  };

  const exportStudents = () => {
    const dataStr = JSON.stringify(students, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Student data exported successfully');
  };

  const getStudentFeeStatus = (studentId: number) => {
    const studentFees = fees.filter(fee => fee.studentId === studentId);
    const hasOverdue = studentFees.some(fee => fee.status === 'overdue');
    const hasPending = studentFees.some(fee => fee.status === 'pending');
    
    if (hasOverdue) return { status: 'overdue', color: 'red' };
    if (hasPending) return { status: 'pending', color: 'yellow' };
    return { status: 'paid', color: 'green' };
  };

  const grades = ['6th', '7th', '8th', '9th', '10th', '11th', '12th'];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Student Management</h3>
            <p className="text-sm text-gray-500">Total: {students.length} students enrolled</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={exportStudents}
              variant="outline"
              className="flex items-center space-x-2"
              data-testid="button-export-students"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary flex items-center space-x-2"
              data-testid="button-add-student"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search students by name, email, or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-student-search"
            />
          </div>
          <div className="flex space-x-2">
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-40" data-testid="select-grade-filter">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map(grade => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200" data-testid="students-table-body">
              {filteredStudents.map((student) => {
                const feeStatus = getStudentFeeStatus(student.id);
                
                return (
                  <tr key={student.id} data-testid={`student-row-${student.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-violet-800">
                            {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900" data-testid={`student-name-${student.id}`}>
                            {student.name}
                          </div>
                          <div className="text-sm text-gray-500">Roll: {student.rollNumber}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.phone}</div>
                      <div className="text-sm text-gray-500">{student.parentPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full fee-status-${feeStatus.status}`}>
                        {feeStatus.status.charAt(0).toUpperCase() + feeStatus.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(student.id)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                        data-testid={`button-toggle-status-${student.id}`}
                      >
                        {student.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toast.info('Edit functionality coming soon')}
                          className="text-violet-600 hover:text-violet-900"
                          data-testid={`button-edit-${student.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="text-red-600 hover:text-red-900"
                          data-testid={`button-delete-${student.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No students found</div>
            <div className="text-gray-400 text-sm mt-2">
              {searchTerm || gradeFilter || statusFilter
                ? 'Try adjusting your search or filters'
                : 'Add your first student to get started'}
            </div>
          </div>
        )}
      </div>

      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddStudent}
      />
    </div>
  );
}
