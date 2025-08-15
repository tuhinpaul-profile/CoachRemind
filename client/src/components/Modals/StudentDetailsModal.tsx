import { X, User, Mail, Phone, Calendar, MapPin, Heart, UserCheck, Clock, AlertCircle } from "lucide-react";
import { Student, Fee } from "@/types";
import { StorageService } from "@/lib/storage";

interface StudentDetailsModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentDetailsModal({ student, isOpen, onClose }: StudentDetailsModalProps) {
  if (!isOpen) return null;

  const fees = StorageService.getFees().filter(fee => fee.studentId === student.id);
  const attendance = StorageService.getAttendance();
  const allDates = Object.keys(attendance).sort();
  const studentRecords = allDates.map(date => attendance[date]?.[student.id] || null).filter(Boolean);
  
  const totalDays = studentRecords.length;
  const presentDays = studentRecords.filter(status => status === 'present').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-violet-200 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-xl font-bold text-violet-700">
                {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
              <p className="text-gray-600">Roll Number: {student.rollNumber}</p>
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

          {/* Performance Statistics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-violet-600">{attendanceRate}%</div>
                <div className="text-sm text-gray-500">Attendance Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{presentDays}</div>
                <div className="text-sm text-gray-500">Days Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">₹{student.monthlyFee}</div>
                <div className="text-sm text-gray-500">Monthly Fee</div>
              </div>
            </div>
          </div>

          {/* Recent Fee History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Fee Payments</h3>
            <div className="space-y-2">
              {fees.slice(0, 3).map((fee) => (
                <div key={fee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{fee.description}</div>
                    <div className="text-sm text-gray-500">Due: {fee.dueDate}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">₹{fee.amount}</div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      fee.status === 'paid' ? 'bg-green-100 text-green-700' :
                      fee.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {fee.status}
                    </span>
                  </div>
                </div>
              ))}
              {fees.length === 0 && (
                <div className="text-center py-4 text-gray-500">No fee records found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}