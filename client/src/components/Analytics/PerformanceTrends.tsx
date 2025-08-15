import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, BarChart3, LineChart, Calendar, Filter, Download, Users, Award, AlertTriangle } from "lucide-react";
import { Student, AttendanceRecord } from "@/types";
import { StorageService } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";

interface PerformanceData {
  studentId: number;
  name: string;
  grade: string;
  attendanceRate: number;
  attendanceTrend: 'up' | 'down' | 'stable';
  subjectPerformance: Array<{
    subject: string;
    score: number;
    grade: string;
    trend: 'up' | 'down' | 'stable';
  }>;
  overallPerformance: number;
  improvementScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface ChartProps {
  data: PerformanceData[];
  selectedGrade: string;
  selectedMetric: string;
}

function AttendanceTrendChart({ data, selectedGrade, selectedMetric }: ChartProps) {
  const filteredData = selectedGrade === 'all' 
    ? data 
    : data.filter(student => student.grade === selectedGrade);

  const maxAttendance = Math.max(...filteredData.map(s => s.attendanceRate));
  const avgAttendance = filteredData.reduce((sum, s) => sum + s.attendanceRate, 0) / filteredData.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Attendance Performance Distribution</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{filteredData.length}</div>
              <div className="text-sm text-blue-600">Students</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{avgAttendance.toFixed(1)}%</div>
              <div className="text-sm text-green-600">Avg Attendance</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{maxAttendance}%</div>
              <div className="text-sm text-purple-600">Highest</div>
            </div>
          </div>

          <div className="space-y-2">
            {filteredData.map((student) => (
              <div key={student.studentId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{student.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${
                        student.attendanceTrend === 'up' ? 'text-green-600' :
                        student.attendanceTrend === 'down' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {student.attendanceTrend === 'up' ? <TrendingUp className="w-4 h-4" /> :
                         student.attendanceTrend === 'down' ? <TrendingDown className="w-4 h-4" /> :
                         '→'}
                      </span>
                      <span className="font-medium">{student.attendanceRate}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${
                        student.attendanceRate >= 85 ? 'bg-green-500' :
                        student.attendanceRate >= 70 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${student.attendanceRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SubjectPerformanceChart({ data, selectedGrade }: ChartProps) {
  const filteredData = selectedGrade === 'all' 
    ? data 
    : data.filter(student => student.grade === selectedGrade);

  // Aggregate subject performance across all students
  const subjectAggregation = useMemo(() => {
    const subjects: { [key: string]: { scores: number[], trends: string[] } } = {};
    
    filteredData.forEach(student => {
      student.subjectPerformance.forEach(subject => {
        if (!subjects[subject.subject]) {
          subjects[subject.subject] = { scores: [], trends: [] };
        }
        subjects[subject.subject].scores.push(subject.score);
        subjects[subject.subject].trends.push(subject.trend);
      });
    });

    return Object.entries(subjects).map(([subject, data]) => ({
      subject,
      avgScore: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
      studentCount: data.scores.length,
      trendUp: data.trends.filter(t => t === 'up').length,
      trendDown: data.trends.filter(t => t === 'down').length,
      trendStable: data.trends.filter(t => t === 'stable').length
    })).sort((a, b) => b.avgScore - a.avgScore);
  }, [filteredData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Award className="w-5 h-5" />
          <span>Subject Performance Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subjectAggregation.map((subject, index) => (
            <div key={subject.subject} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium">{subject.subject}</h4>
                  <p className="text-sm text-gray-600">{subject.studentCount} students</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{subject.avgScore.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className={`h-3 rounded-full ${
                    subject.avgScore >= 85 ? 'bg-green-500' :
                    subject.avgScore >= 70 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${subject.avgScore}%` }}
                />
              </div>

              <div className="flex justify-between text-sm">
                <div className="flex items-center space-x-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>{subject.trendUp} improving</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-600">
                  <span>{subject.trendStable} stable</span>
                </div>
                <div className="flex items-center space-x-1 text-red-600">
                  <TrendingDown className="w-4 h-4" />
                  <span>{subject.trendDown} declining</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RiskAnalysisChart({ data, selectedGrade }: ChartProps) {
  const filteredData = selectedGrade === 'all' 
    ? data 
    : data.filter(student => student.grade === selectedGrade);

  const riskDistribution = {
    high: filteredData.filter(s => s.riskLevel === 'high').length,
    medium: filteredData.filter(s => s.riskLevel === 'medium').length,
    low: filteredData.filter(s => s.riskLevel === 'low').length
  };

  const highRiskStudents = filteredData.filter(s => s.riskLevel === 'high');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Risk Analysis & Early Intervention</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{riskDistribution.high}</div>
              <div className="text-sm text-red-600">High Risk</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{riskDistribution.medium}</div>
              <div className="text-sm text-yellow-600">Medium Risk</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{riskDistribution.low}</div>
              <div className="text-sm text-green-600">Low Risk</div>
            </div>
          </div>

          {highRiskStudents.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 text-red-600">Students Requiring Immediate Attention</h4>
              <div className="space-y-2">
                {highRiskStudents.map(student => (
                  <div key={student.studentId} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-gray-600">Grade: {student.grade}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-red-600">Attendance: {student.attendanceRate}%</div>
                        <div className="text-sm text-red-600">Performance: {student.overallPerformance}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PerformanceTrends() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('attendance');
  const [dateRange, setDateRange] = useState<string>('month');

  useEffect(() => {
    loadStudentData();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      generatePerformanceData();
    }
  }, [students, dateRange]);

  const loadStudentData = () => {
    const studentsData = StorageService.getStudents();
    setStudents(studentsData);
  };

  const generatePerformanceData = () => {
    const attendance = StorageService.getAttendance();
    
    const performanceList: PerformanceData[] = students.map(student => {
      // Calculate attendance metrics
      const attendanceInfo = calculateAttendanceInfo(student.id, attendance);
      
      // Calculate overall performance based on subject performance
      const subjectPerformance = student.subjectPerformance || [];
      const overallPerformance = subjectPerformance.length > 0 
        ? subjectPerformance.reduce((sum, subject) => sum + subject.score, 0) / subjectPerformance.length
        : 0;

      // Calculate improvement score (combination of attendance trend and subject trends)
      const improvementScore = calculateImprovementScore(attendanceInfo, subjectPerformance);
      
      // Determine risk level
      const riskLevel = determineRiskLevel(attendanceInfo.attendanceRate, overallPerformance, improvementScore);

      return {
        studentId: student.id,
        name: student.name,
        grade: student.grade,
        attendanceRate: attendanceInfo.attendanceRate,
        attendanceTrend: attendanceInfo.trend,
        subjectPerformance,
        overallPerformance,
        improvementScore,
        riskLevel
      };
    });

    setPerformanceData(performanceList);
  };

  const calculateAttendanceInfo = (studentId: number, attendance: AttendanceRecord) => {
    const allDates = Object.keys(attendance).sort();
    const recentDates = allDates.slice(-30); // Last 30 days for trend analysis
    
    const studentRecords = allDates.map(date => attendance[date]?.[studentId] || null).filter(Boolean);
    const recentRecords = recentDates.map(date => attendance[date]?.[studentId] || null).filter(Boolean);
    
    const totalDays = studentRecords.length;
    const presentDays = studentRecords.filter(status => status === 'present').length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    // Calculate trend based on recent vs overall performance
    const recentPresentDays = recentRecords.filter(status => status === 'present').length;
    const recentAttendanceRate = recentRecords.length > 0 ? (recentPresentDays / recentRecords.length) * 100 : 0;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentAttendanceRate > attendanceRate + 5) trend = 'up';
    else if (recentAttendanceRate < attendanceRate - 5) trend = 'down';
    
    return { attendanceRate, trend };
  };

  const calculateImprovementScore = (attendanceInfo: any, subjectPerformance: any[]) => {
    let score = 0;
    
    // Attendance improvement factor
    if (attendanceInfo.trend === 'up') score += 20;
    else if (attendanceInfo.trend === 'down') score -= 20;
    
    // Subject improvement factor
    const improvingSubjects = subjectPerformance.filter(s => s.trend === 'up').length;
    const decliningSubjects = subjectPerformance.filter(s => s.trend === 'down').length;
    
    score += (improvingSubjects * 15) - (decliningSubjects * 15);
    
    return Math.max(-100, Math.min(100, score));
  };

  const determineRiskLevel = (attendance: number, performance: number, improvement: number): 'low' | 'medium' | 'high' => {
    if (attendance < 60 || performance < 50 || improvement < -30) return 'high';
    if (attendance < 75 || performance < 70 || improvement < -10) return 'medium';
    return 'low';
  };

  const exportReport = async () => {
    const reportData = performanceData.map(student => ({
      'Student Name': student.name,
      'Grade': student.grade,
      'Attendance Rate': `${student.attendanceRate}%`,
      'Attendance Trend': student.attendanceTrend,
      'Overall Performance': `${student.overallPerformance.toFixed(1)}%`,
      'Improvement Score': student.improvementScore,
      'Risk Level': student.riskLevel.toUpperCase()
    }));

    const csvContent = [
      Object.keys(reportData[0] || {}).join(','),
      ...reportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance_trends_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Performance trends report exported successfully');
  };

  const grades = ['6th', '7th', '8th', '9th', '10th', '11th', '12th'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Performance Trends & Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive visualization of student performance trends and risk analysis
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {grades.map(grade => (
                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance">Attendance Trends</TabsTrigger>
          <TabsTrigger value="subjects">Subject Performance</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <AttendanceTrendChart 
            data={performanceData} 
            selectedGrade={selectedGrade} 
            selectedMetric={selectedMetric} 
          />
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <SubjectPerformanceChart 
            data={performanceData} 
            selectedGrade={selectedGrade} 
            selectedMetric={selectedMetric} 
          />
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <RiskAnalysisChart 
            data={performanceData} 
            selectedGrade={selectedGrade} 
            selectedMetric={selectedMetric} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}