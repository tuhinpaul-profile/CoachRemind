import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Student, Fee, AttendanceRecord, ReportData } from '@/types';
import { StorageService } from './storage';

export class ReportService {
  static generateAttendanceReport(dateRange?: { start: string; end: string }): void {
    const students = StorageService.getStudents();
    const attendance = StorageService.getAttendance();
    const settings = StorageService.getSettings();
    
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.text(settings.centerName, 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('Attendance Report', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    if (dateRange) {
      doc.text(`Period: ${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}`, 20, yPosition);
      yPosition += 15;
    }

    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance[today] || {};
    const presentCount = Object.values(todayAttendance).filter(status => status === 'present').length;
    const absentCount = Object.values(todayAttendance).filter(status => status === 'absent').length;
    const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

    // Stats section
    doc.text('Summary Statistics:', 20, yPosition);
    yPosition += 8;
    doc.text(`Total Students: ${students.length}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Present Today: ${presentCount}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Absent Today: ${absentCount}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Attendance Rate: ${attendanceRate}%`, 30, yPosition);
    yPosition += 15;

    // Student details
    doc.text('Student Attendance Details:', 20, yPosition);
    yPosition += 10;

    students.forEach((student) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      const status = todayAttendance[student.id] || 'pending';
      doc.text(`${student.name} (${student.grade}) - ${status.toUpperCase()}`, 20, yPosition);
      yPosition += 6;
    });

    doc.save(`Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  static generateFeeReport(): void {
    const students = StorageService.getStudents();
    const fees = StorageService.getFees();
    const settings = StorageService.getSettings();
    
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.text(settings.centerName, 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('Fee Collection Report', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // Calculate fee stats
    const totalCollected = fees.filter(fee => fee.status === 'paid').reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
    const totalPending = fees.filter(fee => fee.status === 'pending').reduce((sum, fee) => sum + fee.amount, 0);
    const totalOverdue = fees.filter(fee => fee.status === 'overdue').reduce((sum, fee) => sum + fee.amount, 0);
    const totalExpected = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    // Stats section
    doc.text('Financial Summary:', 20, yPosition);
    yPosition += 8;
    doc.text(`Total Collected: ₹${totalCollected.toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Total Pending: ₹${totalPending.toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Total Overdue: ₹${totalOverdue.toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Collection Rate: ${collectionRate}%`, 30, yPosition);
    yPosition += 15;

    // Student fee details
    doc.text('Student Fee Details:', 20, yPosition);
    yPosition += 10;

    students.forEach((student) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      const studentFees = fees.filter(fee => fee.studentId === student.id);
      const unpaidFees = studentFees.filter(fee => fee.status !== 'paid');
      
      if (unpaidFees.length > 0) {
        doc.text(`${student.name} (${student.grade}):`, 20, yPosition);
        yPosition += 6;
        
        unpaidFees.forEach(fee => {
          doc.text(`  ${fee.description} - ₹${fee.amount} (${fee.status})`, 30, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }
    });

    doc.save(`Fee_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  static generateStudentReport(): void {
    const students = StorageService.getStudents();
    const settings = StorageService.getSettings();
    
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.text(settings.centerName, 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text('Student Directory Report', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // Stats
    const gradeStats = students.reduce((acc, student) => {
      acc[student.grade] = (acc[student.grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    doc.text('Enrollment Statistics:', 20, yPosition);
    yPosition += 8;
    doc.text(`Total Students: ${students.length}`, 30, yPosition);
    yPosition += 8;

    Object.entries(gradeStats).forEach(([grade, count]) => {
      doc.text(`${grade}: ${count} students`, 30, yPosition);
      yPosition += 6;
    });
    yPosition += 10;

    // Student details
    doc.text('Student Details:', 20, yPosition);
    yPosition += 10;

    students.forEach((student) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.text(`Name: ${student.name}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Grade: ${student.grade} | Roll: ${student.rollNumber}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Email: ${student.email}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Phone: ${student.phone}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Parent Email: ${student.parentEmail}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Monthly Fee: ₹${student.monthlyFee}`, 20, yPosition);
      yPosition += 10;
    });

    doc.save(`Student_Directory_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  static exportToExcel(): void {
    const students = StorageService.getStudents();
    const fees = StorageService.getFees();
    const attendance = StorageService.getAttendance();

    const workbook = XLSX.utils.book_new();

    // Students sheet
    const studentsData = students.map(student => ({
      'ID': student.id,
      'Name': student.name,
      'Grade': student.grade,
      'Roll Number': student.rollNumber,
      'Email': student.email,
      'Phone': student.phone,
      'Parent Email': student.parentEmail,
      'Parent Phone': student.parentPhone,
      'Monthly Fee': student.monthlyFee,
      'Status': student.status,
      'Enrollment Date': student.enrollmentDate
    }));

    const studentsSheet = XLSX.utils.json_to_sheet(studentsData);
    XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Students');

    // Fees sheet
    const feesData = fees.map(fee => {
      const student = students.find(s => s.id === fee.studentId);
      return {
        'Fee ID': fee.id,
        'Student Name': student?.name || 'Unknown',
        'Student ID': fee.studentId,
        'Amount': fee.amount,
        'Due Date': fee.dueDate,
        'Description': fee.description,
        'Status': fee.status,
        'Paid Date': fee.paidDate || '',
        'Paid Amount': fee.paidAmount || ''
      };
    });

    const feesSheet = XLSX.utils.json_to_sheet(feesData);
    XLSX.utils.book_append_sheet(workbook, feesSheet, 'Fees');

    // Attendance sheet
    const attendanceData: any[] = [];
    Object.entries(attendance).forEach(([date, dayAttendance]) => {
      Object.entries(dayAttendance).forEach(([studentId, status]) => {
        const student = students.find(s => s.id === parseInt(studentId));
        attendanceData.push({
          'Date': date,
          'Student Name': student?.name || 'Unknown',
          'Student ID': studentId,
          'Grade': student?.grade || '',
          'Status': status
        });
      });
    });

    const attendanceSheet = XLSX.utils.json_to_sheet(attendanceData);
    XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Attendance');

    // Save file
    XLSX.writeFile(workbook, `Excellence_Coaching_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  static printReport(reportType: 'attendance' | 'fees' | 'students'): void {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    const students = StorageService.getStudents();
    const fees = StorageService.getFees();
    const attendance = StorageService.getAttendance();
    const settings = StorageService.getSettings();

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .stats { margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #8b5cf6; color: white; }
          .stat-card { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${settings.centerName}</h1>
          <h2>${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
    `;

    if (reportType === 'attendance') {
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendance[today] || {};
      const presentCount = Object.values(todayAttendance).filter(status => status === 'present').length;
      const absentCount = Object.values(todayAttendance).filter(status => status === 'absent').length;
      const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

      htmlContent += `
        <div class="stats">
          <div class="stat-card">
            <h3>Total Students</h3>
            <p>${students.length}</p>
          </div>
          <div class="stat-card">
            <h3>Present Today</h3>
            <p>${presentCount}</p>
          </div>
          <div class="stat-card">
            <h3>Absent Today</h3>
            <p>${absentCount}</p>
          </div>
          <div class="stat-card">
            <h3>Attendance Rate</h3>
            <p>${attendanceRate}%</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Grade</th>
              <th>Roll Number</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      students.forEach(student => {
        const status = todayAttendance[student.id] || 'pending';
        htmlContent += `
          <tr>
            <td>${student.name}</td>
            <td>${student.grade}</td>
            <td>${student.rollNumber}</td>
            <td style="color: ${status === 'present' ? 'green' : status === 'absent' ? 'red' : 'orange'}">${status}</td>
          </tr>
        `;
      });

      htmlContent += '</tbody></table>';
    }

    htmlContent += `
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #8b5cf6; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Report</button>
          <button onclick="window.close()" style="padding: 10px 20px; background-color: #gray; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `;

    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
  }
}
