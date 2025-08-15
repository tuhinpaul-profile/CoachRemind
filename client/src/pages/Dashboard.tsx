import { useState, useEffect } from "react";
import { Users, ClipboardCheck, DollarSign, TrendingUp } from "lucide-react";
import { StorageService } from "@/lib/storage";
import { Student, Fee, AttendanceRecord, DashboardStats } from "@/types";
import { AttendanceChart } from "@/components/Charts/AttendanceChart";
import { FeeChart } from "@/components/Charts/FeeChart";

export function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    todayAttendance: 0,
    attendancePercentage: 0,
    pendingFees: 0,
    monthlyRevenue: 0,
    presentCount: 0,
    absentCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    dueSoonCount: 0,
  });

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

    calculateStats(studentsData, feesData, attendanceData);
  };

  const calculateStats = (studentsData: Student[], feesData: Fee[], attendanceData: AttendanceRecord) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendanceData[today] || {};

    const presentCount = Object.values(todayAttendance).filter(status => status === 'present').length;
    const absentCount = Object.values(todayAttendance).filter(status => status === 'absent').length;
    const pendingCount = studentsData.length - presentCount - absentCount;
    const attendancePercentage = studentsData.length > 0 ? Math.round((presentCount / studentsData.length) * 100) : 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = feesData
      .filter(fee => fee.status === 'paid' && fee.paidDate)
      .filter(fee => {
        const paidDate = new Date(fee.paidDate!);
        return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
      })
      .reduce((total, fee) => total + (fee.paidAmount || 0), 0);

    const overdueCount = feesData.filter(fee => fee.status === 'overdue').length;
    const dueSoonCount = feesData.filter(fee => {
      if (fee.status !== 'pending') return false;
      const dueDate = new Date(fee.dueDate);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    }).length;

    const pendingFees = feesData.filter(fee => fee.status === 'overdue' || fee.status === 'pending').length;

    setStats({
      totalStudents: studentsData.length,
      todayAttendance: presentCount,
      attendancePercentage,
      pendingFees,
      monthlyRevenue,
      presentCount,
      absentCount,
      pendingCount,
      overdueCount,
      dueSoonCount,
    });
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle: string;
  }) => (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-3xl font-bold ${color}`} data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </p>
          <p className="text-sm text-gray-600 font-medium">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 ${color.replace('text-', 'bg-').replace('-600', '-100')} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="text-blue-600"
          subtitle="Enrolled students"
        />
        <StatCard
          title="Attendance Today"
          value={`${stats.attendancePercentage}%`}
          icon={ClipboardCheck}
          color="text-green-600"
          subtitle="Students present"
        />
        <StatCard
          title="Pending Fees"
          value={stats.pendingFees}
          icon={DollarSign}
          color="text-orange-600"
          subtitle="Students with due fees"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₹${stats.monthlyRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="text-violet-600"
          subtitle="This month's collection"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Attendance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-900">Mark Daily Attendance</span>
              </div>
              <button 
                className="btn-success"
                data-testid="button-start-attendance"
                onClick={() => window.location.href = '/attendance'}
              >
                Start
              </button>
            </div>
            <div className="text-sm text-gray-600" data-testid="attendance-summary">
              <span data-testid="present-count">{stats.presentCount}</span> Present • 
              <span data-testid="absent-count"> {stats.absentCount}</span> Absent • 
              <span data-testid="pending-count"> {stats.pendingCount}</span> Pending
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Management</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-900">Send Fee Reminders</span>
              </div>
              <button 
                className="btn-warning"
                data-testid="button-send-reminders"
                onClick={() => window.location.href = '/notifications'}
              >
                Send
              </button>
            </div>
            <div className="text-sm text-gray-600" data-testid="fee-summary">
              <span data-testid="overdue-count">{stats.overdueCount}</span> Overdue • 
              <span data-testid="due-soon-count"> {stats.dueSoonCount}</span> Due Soon
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trends</h3>
          <AttendanceChart attendance={attendance} students={students} />
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Collection Trends</h3>
          <FeeChart fees={fees} students={students} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3" data-testid="recent-activity">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">System initialized with {stats.totalStudents} students</span>
            <span className="text-xs text-gray-400 ml-auto">Today</span>
          </div>
          {stats.presentCount > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">{stats.presentCount} students marked present today</span>
              <span className="text-xs text-gray-400 ml-auto">Today</span>
            </div>
          )}
          {stats.monthlyRevenue > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
              <span className="text-sm text-gray-600">₹{stats.monthlyRevenue.toLocaleString()} collected this month</span>
              <span className="text-xs text-gray-400 ml-auto">This month</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
