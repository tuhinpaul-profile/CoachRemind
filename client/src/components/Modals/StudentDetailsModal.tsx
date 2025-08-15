import { X, User, Mail, Phone, Calendar, MapPin, Heart, UserCheck, Clock, AlertCircle, Award, BookOpen, TrendingUp, TrendingDown, MessageCircle, Star, Target, Brain } from "lucide-react";
import { Student, Fee } from "@/types";
import { StorageService } from "@/lib/storage";

interface StudentDetailsModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentDetailsModal({ student, isOpen, onClose }: StudentDetailsModalProps) {
  if (!isOpen) return null;

  const attendance = StorageService.getAttendance();
  const allDates = Object.keys(attendance).sort();
  const studentRecords = allDates.map(date => attendance[date]?.[student.id] || null).filter(Boolean);
  
  const totalDays = studentRecords.length;
  const presentDays = studentRecords.filter(status => status === 'present').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Generate realistic student performance data
  const getStudentPerformance = () => {
    const subjects = ['Mathematics', 'English', 'Science', 'History', 'Geography', 'Computer Science'];
    const basePerformance = {
      'Mathematics': Math.floor(Math.random() * 30) + 60, // 60-89
      'English': Math.floor(Math.random() * 25) + 70, // 70-94
      'Science': Math.floor(Math.random() * 20) + 75, // 75-94
      'History': Math.floor(Math.random() * 25) + 65, // 65-89
      'Geography': Math.floor(Math.random() * 30) + 60, // 60-89
      'Computer Science': Math.floor(Math.random() * 20) + 70 // 70-89
    };
    
    return subjects.map(subject => ({
      subject,
      score: basePerformance[subject as keyof typeof basePerformance],
      trend: Math.random() > 0.5 ? 'up' : 'down'
    }));
  };

  const getStudentAchievements = () => {
    const possibleAchievements = [
      'Science Fair 2nd Place',
      'Perfect Attendance Award',
      'Math Olympiad Participant',
      'Best Team Player',
      'Creative Writing Contest Winner',
      'Student of the Month - October',
      'Outstanding Improvement in English',
      'Leadership Award',
      'Art Competition Finalist',
      'Debate Team Member'
    ];
    
    const numAchievements = Math.floor(Math.random() * 4) + 2; // 2-5 achievements
    return possibleAchievements
      .sort(() => Math.random() - 0.5)
      .slice(0, numAchievements);
  };

  const getParentTeacherRemarks = () => {
    const positiveRemarks = [
      'Shows excellent problem-solving skills',
      'Very attentive and participates well in class',
      'Has shown remarkable improvement this term',
      'Great team player and helps classmates',
      'Demonstrates strong analytical thinking'
    ];
    
    const improvementAreas = [
      'Could benefit from more practice in time management',
      'Needs to work on completing homework consistently',
      'Should participate more in group discussions',
      'Can improve handwriting and presentation',
      'Would benefit from additional reading practice'
    ];
    
    return {
      positive: positiveRemarks[Math.floor(Math.random() * positiveRemarks.length)],
      improvement: improvementAreas[Math.floor(Math.random() * improvementAreas.length)],
      lastMeeting: '2024-12-15'
    };
  };

  const performance = getStudentPerformance();
  const achievements = getStudentAchievements();
  const remarks = getParentTeacherRemarks();
  
  const strongSubjects = performance.filter(p => p.score >= 80);
  const weakSubjects = performance.filter(p => p.score < 70);

  // Generate a consistent student image based on their ID
  const getStudentImage = (studentId: number) => {
    // Using a deterministic approach to assign images based on student ID
    const imageOptions = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=150&h=150&fit=crop&crop=face'
    ];
    return imageOptions[studentId % imageOptions.length];
  };

  const studentImage = student.profileImage || getStudentImage(student.id);

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border dark:border-gray-700" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-xl overflow-hidden shadow-lg ring-4 ring-white dark:ring-gray-800">
                <img
                  src={studentImage}
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
                  <span className="text-lg font-bold text-violet-700">
                    {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </span>
                </div>
              </div>
              {student.status === 'active' && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white dark:border-gray-800 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{student.name}</h2>
              <p className="text-gray-600 dark:text-gray-300">Roll Number: {student.rollNumber}</p>
              <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border mt-2 ${getStatusColor(student.status)}`}>
                {student.status === 'active' ? <UserCheck className="w-4 h-4 mr-1" /> : <Clock className="w-4 h-4 mr-1" />}
                {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            data-testid="button-close-modal"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-violet-600" />
                Student Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Grade:</span>
                    <span className="ml-2 font-medium">{student.grade}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Email:</span>
                    <span className="ml-2 font-medium">{student.email}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Student Phone:</span>
                    <span className="ml-2 font-medium">{student.phone}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Parent Phone:</span>
                    <span className="ml-2 font-medium">{student.parentPhone}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-violet-600" />
                Additional Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-sm text-gray-500">Address:</span>
                    <p className="font-medium text-gray-900">
                      123 Education Street, Knowledge City, Learning State - 12345
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Heart className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Blood Group:</span>
                    <span className="ml-2 font-medium">B+</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Emergency Contact:</span>
                    <span className="ml-2 font-medium">{student.parentPhone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements Section */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-600" />
              Recent Achievements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm">
                  <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">{achievement}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Performance */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
              Subject Performance
            </h3>
            <div className="space-y-3">
              {performance.map((subject) => (
                <div key={subject.subject} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      subject.score >= 80 ? 'bg-green-500' :
                      subject.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium text-gray-700">{subject.subject}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-bold ${
                      subject.score >= 80 ? 'text-green-600' :
                      subject.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{subject.score}%</span>
                    {subject.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths and Weaknesses */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Strong Subjects
              </h3>
              <div className="space-y-2">
                {strongSubjects.length > 0 ? strongSubjects.map((subject) => (
                  <div key={subject.subject} className="flex items-center justify-between p-2 bg-white rounded">
                    <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
                    <span className="text-sm font-bold text-green-600">{subject.score}%</span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 italic">Working on building strengths</p>
                )}
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Target className="w-5 h-5 mr-2 text-red-600" />
                Improvement Areas
              </h3>
              <div className="space-y-2">
                {weakSubjects.length > 0 ? weakSubjects.map((subject) => (
                  <div key={subject.subject} className="flex items-center justify-between p-2 bg-white rounded">
                    <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
                    <span className="text-sm font-bold text-red-600">{subject.score}%</span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 italic">Performing well across all subjects!</p>
                )}
              </div>
            </div>
          </div>

          {/* Parent-Teacher Meeting Remarks */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-purple-600" />
              Last Parent-Teacher Meeting
            </h3>
            <div className="space-y-4">
              <div className="bg-white p-3 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-700 mb-1">Positive Feedback</h4>
                    <p className="text-sm text-gray-700">{remarks.positive}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-orange-700 mb-1">Areas for Growth</h4>
                    <p className="text-sm text-gray-700">{remarks.improvement}</p>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 text-right">
                Last meeting: {new Date(remarks.lastMeeting).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-gray-600" />
              Quick Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-violet-600">{attendanceRate}%</div>
                <div className="text-xs text-gray-500">Attendance</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{Math.round(performance.reduce((sum, p) => sum + p.score, 0) / performance.length)}%</div>
                <div className="text-xs text-gray-500">Avg. Score</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{strongSubjects.length}</div>
                <div className="text-xs text-gray-500">Strong Subjects</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-600">{achievements.length}</div>
                <div className="text-xs text-gray-500">Achievements</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}