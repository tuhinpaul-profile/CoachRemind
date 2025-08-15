import { useState, useEffect, useRef } from "react";
import { Search, Filter, Plus, Edit, Trash2, Download, Upload, User, Mail, Phone, CheckCircle, XCircle, Clock, MoreVertical, Eye, UserCheck, AlertTriangle, FileText, FileSpreadsheet, Globe } from "lucide-react";
import { StorageService } from "@/lib/storage";
import { Student, Fee } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddStudentModal } from "@/components/Modals/AddStudentModal";
import { StudentDetailsModal } from "@/components/Modals/StudentDetailsModal";
import { AdminStudentModal } from "@/components/Modals/AdminStudentModal";
import { TablePagination } from "@/components/ui/table-pagination";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";

export function StudentManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [paginatedStudents, setPaginatedStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<Student | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedStudentForAdmin, setSelectedStudentForAdmin] = useState<Student | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminModalMode, setAdminModalMode] = useState<'add' | 'edit' | 'view'>('view');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, gradeFilter, statusFilter]);

  useEffect(() => {
    paginateStudents();
  }, [filteredStudents, currentPage, pageSize]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    setCurrentPage(1); // Reset to first page when filtering
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

  const toggleStudentSelection = (studentId: number) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedStudents.size === paginatedStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(paginatedStudents.map(s => s.id)));
    }
  };

  const bulkDeleteStudents = () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select students to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedStudents.size} students? This will also remove all their records.`)) {
      return;
    }

    const updatedStudents = students.filter(s => !selectedStudents.has(s.id));
    const updatedFees = fees.filter(f => !selectedStudents.has(f.studentId));
    
    // Remove from attendance records
    const attendance = StorageService.getAttendance();
    Object.keys(attendance).forEach(date => {
      selectedStudents.forEach(studentId => {
        delete attendance[date][studentId];
      });
    });

    setStudents(updatedStudents);
    setFees(updatedFees);
    StorageService.setStudents(updatedStudents);
    StorageService.setFees(updatedFees);
    StorageService.setAttendance(attendance);
    setSelectedStudents(new Set());

    toast.success(`${selectedStudents.size} students deleted successfully`);
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
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const newStatus = student.status === 'active' ? 'inactive' : 'active';

    if (isAdmin) {
      // Admin can directly update status
      const updatedStudents = students.map(s => {
        if (s.id === studentId) {
          return { ...s, status: newStatus as 'active' | 'inactive' };
        }
        return s;
      });

      setStudents(updatedStudents);
      StorageService.setStudents(updatedStudents);
      toast.success(`Student status updated to ${newStatus}`);
    } else {
      // Teacher submits for approval
      const updatedStudent = { ...student, status: newStatus as 'active' | 'inactive' };
      
      StorageService.addPendingApproval({
        type: 'student_edit',
        teacherName: user?.name || 'Teacher',
        teacherId: user?.id || 0,
        data: updatedStudent,
        description: `Change ${student.name}'s status from ${student.status} to ${newStatus}`
      });

      toast.success(`Status change submitted for admin approval: ${student.name} to be marked as ${newStatus}`);
    }
  };

  // Admin handlers for comprehensive student management
  const openAdminAddModal = () => {
    setSelectedStudentForAdmin(null);
    setAdminModalMode('add');
    setIsAdminModalOpen(true);
  };

  const openAdminEditModal = (student: Student) => {
    setSelectedStudentForAdmin(student);
    setAdminModalMode('edit');
    setIsAdminModalOpen(true);
  };

  const openAdminViewModal = (student: Student) => {
    setSelectedStudentForAdmin(student);
    setAdminModalMode('view');
    setIsAdminModalOpen(true);
  };

  const handleAdminSaveStudent = (studentData: Student) => {
    if (adminModalMode === 'add') {
      // Adding new student with comprehensive data
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

      toast.success('Student added successfully with comprehensive details');
      StorageService.addNotification({
        type: 'info',
        message: `New student ${newStudent.name} enrolled with detailed profile`,
        read: false,
        studentId: newId
      });
    } else if (adminModalMode === 'edit') {
      // Editing existing student with comprehensive data
      const updatedStudents = students.map(s => 
        s.id === studentData.id ? studentData : s
      );
      
      setStudents(updatedStudents);
      StorageService.setStudents(updatedStudents);
      
      toast.success('Student profile updated successfully');
      StorageService.addNotification({
        type: 'info',
        message: `Student ${studentData.name} profile updated`,
        read: false,
        studentId: studentData.id
      });
    }
    
    setIsAdminModalOpen(false);
    setSelectedStudentForAdmin(null);
  };

  const exportStudents = async (format: 'pdf' | 'excel' | 'html' = 'excel') => {
    const studentsToExport = selectedStudents.size > 0 
      ? paginatedStudents.filter(s => selectedStudents.has(s.id))
      : paginatedStudents;

    const exportData = studentsToExport.map(student => ({
      'Name': student.name,
      'Roll Number': student.rollNumber,
      'Grade': student.grade,
      'Email': student.email,
      'Phone': student.phone,
      'Parent Phone': student.parentPhone,
      'Status': student.status,
      'Enrollment Date': student.enrollmentDate
    }));

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `students_export_page${currentPage}_${dateStr}`;

    if (format === 'excel') {
      const csvContent = [
        Object.keys(exportData[0] || {}).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'html') {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Excellence Coaching - Student Report</title>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              padding: 20px;
              position: relative;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              color: rgba(255,255,255,0.05);
              font-weight: 900;
              z-index: 1;
              pointer-events: none;
              white-space: nowrap;
            }
            .container {
              background: white;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.1);
              overflow: hidden;
              position: relative;
              z-index: 2;
            }
            .header {
              background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
              padding: 40px;
              color: white;
              text-align: center;
            }
            .logo {
              width: 80px;
              height: 80px;
              background: rgba(255,255,255,0.2);
              border-radius: 50%;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 36px;
              font-weight: bold;
            }
            .header h1 {
              font-size: 2.5rem;
              font-weight: 700;
              margin-bottom: 10px;
            }
            .header p {
              font-size: 1.1rem;
              opacity: 0.9;
            }
            .report-info {
              background: #F8FAFC;
              padding: 30px 40px;
              border-bottom: 3px solid #E5E7EB;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
            }
            .info-card {
              background: white;
              padding: 20px;
              border-radius: 12px;
              border-left: 4px solid #8B5CF6;
              box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            .info-label {
              font-size: 0.875rem;
              color: #6B7280;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.025em;
            }
            .info-value {
              font-size: 1.25rem;
              color: #111827;
              font-weight: 600;
              margin-top: 4px;
            }
            .table-container {
              padding: 40px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            th { 
              background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
              color: white;
              padding: 16px;
              font-weight: 600;
              font-size: 0.875rem;
              text-transform: uppercase;
              letter-spacing: 0.025em;
              text-align: left;
            }
            td { 
              padding: 16px;
              border-bottom: 1px solid #E5E7EB;
              font-size: 0.875rem;
            }
            tr:nth-child(even) {
              background-color: #F9FAFB;
            }
            tr:hover {
              background-color: #F3F4F6;
            }
            .status-active {
              background: #10B981;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 0.75rem;
              font-weight: 600;
            }
            .status-inactive {
              background: #6B7280;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 0.75rem;
              font-weight: 600;
            }
            .footer {
              text-align: center;
              padding: 30px;
              background: #F8FAFC;
              color: #6B7280;
              font-size: 0.875rem;
              border-top: 1px solid #E5E7EB;
            }
            @media print {
              body { background: white; }
              .watermark { display: block; }
            }
          </style>
        </head>
        <body>
          <div class="watermark">EXCELLENCE COACHING</div>
          <div class="container">
            <div class="header">
              <div class="logo">🎓</div>
              <h1>Excellence Coaching</h1>
              <p>Student Management System • Academic Report</p>
            </div>
            
            <div class="report-info">
              <div class="info-grid">
                <div class="info-card">
                  <div class="info-label">Report Date</div>
                  <div class="info-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Page Number</div>
                  <div class="info-value">${currentPage}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Total Students</div>
                  <div class="info-value">${studentsToExport.length}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Report Type</div>
                  <div class="info-value">Student Directory</div>
                </div>
              </div>
            </div>
            
            <div class="table-container">
              <table>
                <thead>
                  <tr>${Object.keys(exportData[0] || {}).map(key => `<th>${key}</th>`).join('')}</tr>
                </thead>
                <tbody>
                  ${exportData.map(row => `<tr>${Object.values(row).map(val => 
                    typeof val === 'string' && (val === 'active' || val === 'inactive') 
                      ? `<td><span class="status-${val}">${val.toUpperCase()}</span></td>`
                      : `<td>${val}</td>`
                  ).join('')}</tr>`).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="footer">
              <p><strong>Excellence Coaching Student Management System</strong></p>
              <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              <p style="margin-top: 10px; font-style: italic;">"Excellence in Education, Success in Life"</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.html`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Dynamic import to reduce bundle size
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Add watermark
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(60);
      doc.setTextColor(240, 240, 240);
      doc.text('EXCELLENCE COACHING', pageWidth/2, pageHeight/2, {
        align: 'center',
        angle: 45
      } as any);
      
      // Header with logo and title
      doc.setTextColor(139, 92, 246);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Excellence Coaching', pageWidth/2, 30, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(100, 100, 100);
      doc.text('Student Directory Report', pageWidth/2, 40, { align: 'center' });
      
      // Report info
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55);
      doc.text(`Page: ${currentPage}`, 20, 62);
      doc.text(`Total Students: ${studentsToExport.length}`, 20, 69);
      
      // Table headers
      const headers = Object.keys(exportData[0] || {});
      const startY = 80;
      let currentY = startY;
      const rowHeight = 10;
      const minColWidth = 25;
      const totalAvailableWidth = pageWidth - 40;
      
      // Calculate column widths based on content
      const colWidths = headers.map((header, index) => {
        const headerLength = header.length;
        const maxContentLength = Math.max(
          ...exportData.map(row => String(Object.values(row)[index]).length)
        );
        const baseWidth = Math.max(headerLength * 2.5, maxContentLength * 1.5, minColWidth);
        return Math.min(baseWidth, totalAvailableWidth / headers.length * 1.5);
      });
      
      // Normalize widths to fit page
      const totalWidth = colWidths.reduce((sum, w) => sum + w, 0);
      if (totalWidth > totalAvailableWidth) {
        const scaleFactor = totalAvailableWidth / totalWidth;
        colWidths.forEach((width, i) => colWidths[i] = width * scaleFactor);
      }
      
      const drawTableHeader = () => {
        // Header background
        doc.setFillColor(139, 92, 246);
        doc.rect(20, currentY, totalAvailableWidth, rowHeight, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        
        let xPos = 22;
        headers.forEach((header, index) => {
          // Use splitTextToSize to handle long headers
          const lines = doc.splitTextToSize(header, colWidths[index] - 4);
          doc.text(lines[0] || header, xPos, currentY + 6);
          xPos += colWidths[index];
        });
        
        currentY += rowHeight;
      };
      
      // Draw initial header
      drawTableHeader();
      
      // Table rows
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      exportData.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (currentY > pageHeight - 40) {
          doc.addPage();
          currentY = 30;
          // Add watermark to new page
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(60);
          doc.setTextColor(240, 240, 240);
          doc.text('EXCELLENCE COACHING', pageWidth/2, pageHeight/2, {
            align: 'center',
            angle: 45
          } as any);
          
          // Redraw header on new page
          drawTableHeader();
          doc.setTextColor(40, 40, 40);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
        }
        
        // Alternate row colors
        if (rowIndex % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(20, currentY, totalAvailableWidth, rowHeight, 'F');
        }
        
        let xPos = 22;
        Object.values(row).forEach((value, colIndex) => {
          const text = String(value);
          const colWidth = colWidths[colIndex];
          
          // Use splitTextToSize for proper text wrapping
          const lines = doc.splitTextToSize(text, colWidth - 4);
          const displayText = lines[0] || text;
          
          doc.text(displayText, xPos, currentY + 6);
          xPos += colWidth;
        });
        
        currentY += rowHeight;
      });
      
      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 40, pageHeight - 10);
        doc.text('Excellence Coaching Student Management System', 20, pageHeight - 10);
      }
      
      doc.save(`${fileName}.pdf`);
    }

    toast.success(`${studentsToExport.length} students exported as ${format.toUpperCase()} for page ${currentPage}`);
  };

  const getStudentFeeStatus = (studentId: number) => {
    const studentFees = fees.filter(fee => fee.studentId === studentId);
    const hasOverdue = studentFees.some(fee => fee.status === 'overdue');
    const hasPending = studentFees.some(fee => fee.status === 'pending');
    
    if (hasOverdue) return { status: 'overdue', color: 'red' };
    if (hasPending) return { status: 'pending', color: 'yellow' };
    return { status: 'paid', color: 'green' };
  };

  const getStudentImage = (studentId: number) => {
    // Using a deterministic approach to assign images based on student ID
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

  const getStudentAttendanceInfo = (studentId: number) => {
    const attendance = StorageService.getAttendance();
    const allDates = Object.keys(attendance).sort();
    const studentRecords = allDates.map(date => attendance[date]?.[studentId] || null).filter(Boolean);
    
    const totalDays = studentRecords.length;
    const presentDays = studentRecords.filter(status => status === 'present').length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    // Find last attendance status and date
    let lastAttendanceStatus = null;
    let lastAttendanceDate = null;
    for (let i = allDates.length - 1; i >= 0; i--) {
      const date = allDates[i];
      const status = attendance[date]?.[studentId];
      if (status) {
        lastAttendanceStatus = status;
        lastAttendanceDate = date;
        break;
      }
    }
    
    // Calculate days since last present
    let daysSincePresent = 0;
    if (lastAttendanceDate) {
      const lastDate = new Date(lastAttendanceDate);
      const today = new Date();
      daysSincePresent = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    return {
      attendanceRate,
      lastStatus: lastAttendanceStatus,
      lastDate: lastAttendanceDate,
      daysSincePresent,
      totalDays,
      presentDays
    };
  };

  const grades = ['6th', '7th', '8th', '9th', '10th', '11th', '12th'];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold text-foreground tracking-tight">Student Management</h3>
            <p className="text-muted-foreground">
              {isAdmin 
                ? `Add, edit, and manage student information with full administrative control`
                : `View student information and manage status • Changes require admin approval`
              }
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Total: {students.length} students enrolled • Showing: {filteredStudents.length}
              {!isAdmin && ` • Active: ${students.filter(s => s.status === 'active').length} • Inactive: ${students.filter(s => s.status === 'inactive').length}`}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {isAdmin && selectedStudents.size > 0 && (
              <Button
                onClick={bulkDeleteStudents}
                variant="destructive"
                className="flex items-center space-x-2"
                data-testid="button-bulk-delete"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected ({selectedStudents.size})</span>
              </Button>
            )}
            <div className="relative" ref={exportDropdownRef}>
              <Button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                variant="outline"
                className="flex items-center space-x-2"
                data-testid="button-export-students"
              >
                <Download className="w-4 h-4" />
                <span>Export Page Data</span>
              </Button>
              {showExportDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-48">
                  <button
                    onClick={() => { exportStudents('excel'); setShowExportDropdown(false); }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 w-full text-left rounded-t-lg text-gray-700 dark:text-gray-300"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    <span>Export as Excel</span>
                  </button>
                  <button
                    onClick={() => { exportStudents('pdf'); setShowExportDropdown(false); }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 w-full text-left border-t border-gray-100 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    <FileText className="w-4 h-4 text-red-600" />
                    <span>Export as PDF</span>
                  </button>
                  <button
                    onClick={() => { exportStudents('html'); setShowExportDropdown(false); }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 w-full text-left border-t border-gray-100 dark:border-gray-600 rounded-b-lg text-gray-700 dark:text-gray-300"
                  >
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Export as HTML</span>
                  </button>
                </div>
              )}
            </div>
            {isAdmin && (
              <>
                <Button
                  onClick={openAdminAddModal}
                  className="btn-primary flex items-center space-x-2"
                  data-testid="button-admin-add-student"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Student</span>
                </Button>
                <Button
                  onClick={() => toast.info('Admin Dashboard with full control features coming soon!')}
                  variant="outline"
                  className="flex items-center space-x-2 border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                  <User className="w-4 h-4" />
                  <span>Admin Dashboard</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={paginatedStudents.length > 0 && selectedStudents.size === paginatedStudents.length}
                      onChange={toggleAllSelection}
                      className="w-4 h-4 rounded border-2 border-muted-foreground/30 text-primary focus:ring-2 focus:ring-primary/20"
                      title={`Select all ${paginatedStudents.length} students for: Delete, Export to PDF/Excel`}
                    />
                    <span className="text-xs text-muted-foreground/70">Select All</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Student Details</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Grade & Performance
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>Contact Info</span>
                  </div>
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Fee Status
                  </th>
                )}
                {!isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Attendance
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Enrollment Status</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <MoreVertical className="w-4 h-4" />
                    <span>Quick Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border/50" data-testid="students-table-body">
              {paginatedStudents.map((student) => {
                const feeStatus = getStudentFeeStatus(student.id);
                const attendanceInfo = getStudentAttendanceInfo(student.id);
                
                return (
                  <tr key={student.id} data-testid={`student-row-${student.id}`} className={`hover:bg-muted/20 transition-colors ${selectedStudents.has(student.id) ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="w-4 h-4 rounded border-2 border-muted-foreground/30 text-primary focus:ring-2 focus:ring-primary/20"
                        title={`Select ${student.name} for bulk actions: Delete or Export data`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm ring-2 ring-white dark:ring-gray-800">
                            <img
                              src={student.profileImage || getStudentImage(student.id)}
                              alt={student.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div className="w-full h-full bg-gradient-to-br from-violet-100 to-violet-200 rounded-xl flex items-center justify-center shadow-sm" style={{display: 'none'}}>
                              <span className="text-sm font-semibold text-violet-700">
                                {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </span>
                            </div>
                          </div>
                          {student.status === 'active' && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                              <CheckCircle className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-semibold text-foreground" data-testid={`student-name-${student.id}`}>
                              {student.name}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                              Roll: {student.rollNumber}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 mt-1 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{student.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {student.grade} Grade
                        </div>
                        {!isAdmin && (
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                              Math.min(attendanceInfo.attendanceRate + 15, 100) >= 85 ? 'bg-green-100 text-green-700' :
                              Math.min(attendanceInfo.attendanceRate + 15, 100) >= 70 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {Math.min(attendanceInfo.attendanceRate + 15, 100)}%
                            </span>
                          </div>
                        )}
                        {isAdmin && (
                          <div className="flex items-center space-x-1">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                              feeStatus.status === 'paid' ? 'bg-green-100 text-green-700' :
                              feeStatus.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              Fee: {feeStatus.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm text-foreground">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span className="font-medium">Student:</span>
                          <span>{student.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span className="font-medium">Parent:</span>
                          <span>{student.parentPhone}</span>
                        </div>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full fee-status-${feeStatus.status}`}>
                          {feeStatus.status.charAt(0).toUpperCase() + feeStatus.status.slice(1)}
                        </span>
                      </td>
                    )}
                    {!isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              attendanceInfo.attendanceRate >= 80 ? 'bg-green-100 text-green-800' :
                              attendanceInfo.attendanceRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {attendanceInfo.attendanceRate}%
                            </span>
                            {attendanceInfo.lastStatus && (
                              <span className={`text-xs ${
                                attendanceInfo.lastStatus === 'present' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                Last: {attendanceInfo.lastStatus}
                              </span>
                            )}
                          </div>
                          {attendanceInfo.totalDays > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {attendanceInfo.presentDays}/{attendanceInfo.totalDays} days
                              {attendanceInfo.daysSincePresent > 7 && (
                                <span className="text-orange-600 ml-2">
                                  • {attendanceInfo.daysSincePresent}d ago
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleToggleStatus(student.id)}
                          className={`inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                            student.status === 'active'
                              ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                              : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                          }`}
                          data-testid={`button-toggle-status-${student.id}`}
                          title={`Click to ${student.status === 'active' ? 'deactivate' : 'activate'} student ${!isAdmin ? '(requires admin approval)' : ''}`}
                        >
                          {student.status === 'active' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span className="capitalize">{student.status}</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedStudentForDetails(student);
                            setIsDetailsModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center w-9 h-9 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors shadow-sm"
                          data-testid={`button-view-${student.id}`}
                          title="View detailed student information"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openAdminEditModal(student)}
                              className="inline-flex items-center justify-center w-9 h-9 text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors shadow-sm"
                              data-testid={`button-edit-${student.id}`}
                              title="Edit comprehensive student information"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="inline-flex items-center justify-center w-9 h-9 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shadow-sm"
                              data-testid={`button-delete-${student.id}`}
                              title="Delete student and all records"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
            <div className="text-muted-foreground text-lg">No students found</div>
            <div className="text-muted-foreground/70 text-sm mt-2">
              {searchTerm || gradeFilter || statusFilter
                ? 'Try adjusting your search or filters'
                : 'Add your first student to get started'}
            </div>
          </div>
        )}

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

      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddStudent}
      />
      
      {selectedStudentForDetails && (
        <StudentDetailsModal
          student={selectedStudentForDetails}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedStudentForDetails(null);
          }}
        />
      )}

      {/* Admin Student Management Modal - Comprehensive student data management */}
      <AdminStudentModal
        student={selectedStudentForAdmin}
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          setSelectedStudentForAdmin(null);
        }}
        onSave={handleAdminSaveStudent}
        mode={adminModalMode}
      />
    </div>
  );
}
