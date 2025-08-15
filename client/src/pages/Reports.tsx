import { useState, useEffect } from "react";
import { FileText, Download, BarChart3, PieChart, Printer } from "lucide-react";
import { StorageService } from "@/lib/storage";
import { ReportService } from "@/lib/reportService";
import { Student, Fee, AttendanceRecord } from "@/types";
import { Button } from "@/components/ui/button";
import { AttendanceChart } from "@/components/Charts/AttendanceChart";
import { FeeChart } from "@/components/Charts/FeeChart";
import { useToast } from "@/hooks/useToast";

export function Reports() {
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [reportData, setReportData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const studentsData = StorageService.getStudents();
    const feesData = StorageService.getFees();
    const attendanceData = StorageService.getAttendance();
    
    setStudents(studentsData);
    setFees(feesData);
    setAttendance(attendanceData);
  };

  const generateAttendanceReport = () => {
    try {
      ReportService.generateAttendanceReport();
      toast.success('Attendance report generated successfully');
    } catch (error) {
      toast.error('Failed to generate attendance report');
    }
  };

  const generateFeeReport = () => {
    try {
      ReportService.generateFeeReport();
      toast.success('Fee report generated successfully');
    } catch (error) {
      toast.error('Failed to generate fee report');
    }
  };

  const generateStudentReport = () => {
    try {
      ReportService.generateStudentReport();
      toast.success('Student report generated successfully');
    } catch (error) {
      toast.error('Failed to generate student report');
    }
  };

  const exportToExcel = () => {
    try {
      ReportService.exportToExcel();
      toast.success('Data exported to Excel successfully');
    } catch (error) {
      toast.error('Failed to export to Excel');
    }
  };

  const printReport = () => {
    try {
      ReportService.printReport('attendance');
      toast.success('Report sent to printer');
    } catch (error) {
      toast.error('Failed to print report');
    }
  };

  const calculateQuickStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance[today] || {};
    const presentCount = Object.values(todayAttendance).filter(status => status === 'present').length;
    const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

    const totalRevenue = fees.filter(fee => fee.status === 'paid').reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
    const pendingRevenue = fees.filter(fee => fee.status !== 'paid').reduce((sum, fee) => sum + fee.amount, 0);

    const gradeDistribution = students.reduce((acc, student) => {
      acc[student.grade] = (acc[student.grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalStudents: students.length,
      attendanceRate,
      presentToday: presentCount,
      totalRevenue,
      pendingRevenue,
      gradeDistribution
    };
  };

  const stats = calculateQuickStats();

  return (
    <div className="space-y-6">
      {/* Report Generation */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Reports & Analytics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div 
            className="p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-colors cursor-pointer"
            onClick={generateAttendanceReport}
            data-testid="card-attendance-report"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Attendance Report</h4>
            </div>
            <p className="text-sm text-gray-600">Generate comprehensive attendance reports with charts and analytics</p>
          </div>
          
          <div 
            className="p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-colors cursor-pointer"
            onClick={generateFeeReport}
            data-testid="card-fee-report"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <PieChart className="w-5 h-5 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Fee Report</h4>
            </div>
            <p className="text-sm text-gray-600">Financial reports with collection status and revenue analytics</p>
          </div>
          
          <div 
            className="p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-colors cursor-pointer"
            onClick={generateStudentReport}
            data-testid="card-student-report"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Student Report</h4>
            </div>
            <p className="text-sm text-gray-600">Complete student profiles with enrollment and performance data</p>
          </div>
        </div>
        
        {/* Export Options */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => ReportService.generateAttendanceReport()}
            className="btn-danger flex items-center space-x-2"
            data-testid="button-export-pdf"
          >
            <Download className="w-4 h-4" />
            <span>Export to PDF</span>
          </Button>
          
          <Button
            onClick={exportToExcel}
            className="btn-success flex items-center space-x-2"
            data-testid="button-export-excel"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel</span>
          </Button>
          
          <Button
            onClick={printReport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            data-testid="button-print-report"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trends</h4>
          <AttendanceChart attendance={attendance} students={students} />
        </div>
        
        <div className="card">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Fee Collection Trends</h4>
          <FeeChart fees={fees} students={students} />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600" data-testid="kpi-total-students">
              {stats.totalStudents}
            </div>
            <div className="text-sm text-blue-700">Total Students</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600" data-testid="kpi-attendance-rate">
              {stats.attendanceRate}%
            </div>
            <div className="text-sm text-green-700">Attendance Rate</div>
          </div>
          <div className="text-center p-4 bg-violet-50 rounded-lg">
            <div className="text-2xl font-bold text-violet-600" data-testid="kpi-total-revenue">
              ₹{(stats.totalRevenue / 100000).toFixed(1)}L
            </div>
            <div className="text-sm text-violet-700">Total Revenue</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600" data-testid="kpi-pending-revenue">
              ₹{(stats.pendingRevenue / 100000).toFixed(1)}L
            </div>
            <div className="text-sm text-orange-700">Pending Revenue</div>
          </div>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
            <div key={grade} className="text-center p-3 border rounded-lg">
              <div className="text-xl font-bold text-gray-900" data-testid={`grade-count-${grade}`}>
                {count}
              </div>
              <div className="text-sm text-gray-600">{grade}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Report Content */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analytics</h4>
        <div className="space-y-4" data-testid="detailed-analytics">
          {reportData ? (
            <div>
              {/* Dynamic report content would go here */}
              <p className="text-gray-600">Detailed report data will be displayed here when generated.</p>
            </div>
          ) : (
            <p className="text-gray-600">Select a report type above to view detailed analytics</p>
          )}
        </div>
      </div>
    </div>
  );
}
