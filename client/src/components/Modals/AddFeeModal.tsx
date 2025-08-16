import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Student, Fee } from "@/types";

interface PrefillData {
  student?: Student;
  fee?: Fee;
  lateFee?: number;
}

interface AddFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (fee: Omit<Fee, 'id'>) => void;
  students: Student[];
  prefillData?: PrefillData;
}

export function AddFeeModal({ isOpen, onClose, onAdd, students, prefillData }: AddFeeModalProps) {
  const [searchData, setSearchData] = useState({
    academicYear: '2024-2025',
    classSection: '',
    selectedStudent: null as Student | null,
    rollNumber: ''
  });

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [monthlyFees, setMonthlyFees] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState({
    paymentType: '',
    referenceNo: '',
    remarks: '',
    selectedMonths: new Set<string>()
  });

  const months = [
    'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December', 'January', 'February', 'March'
  ];

  const classSections = [
    'Class 1 Sec: A', 'Class 1 Sec: B', 'Class 2 Sec: A', 'Class 2 Sec: B',
    'Class 3 Sec: A', 'Class 3 Sec: B', 'Class 4 Sec: A', 'Class 4 Sec: B',
    'Class 5 Sec: A', 'Class 5 Sec: B', 'Class 6 Sec: A', 'Class 6 Sec: B',
    'Class 7 Sec: A', 'Class 7 Sec: B', 'Class 8 Sec: A', 'Class 8 Sec: B',
    'Class 9 Sec: A', 'Class 9 Sec: B', 'Class 10 Sec: A', 'Class 10 Sec: B'
  ];

  const paymentTypes = ['Cash', 'Online', 'Bank Transfer', 'Cheque', 'UPI'];

  useEffect(() => {
    // Handle prefilled data when modal opens for fee collection
    if (prefillData?.student && prefillData?.fee) {
      setSelectedStudent(prefillData.student);
      const classSection = prefillData.student.grade;
      setSearchData({
        academicYear: '2024-2025',
        classSection: classSection,
        selectedStudent: prefillData.student,
        rollNumber: prefillData.student.rollNumber
      });
      
      // Set the specific month as selected for payment
      const feeDescription = prefillData.fee.description;
      const monthMatch = feeDescription.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i);
      if (monthMatch) {
        const selectedMonth = monthMatch[1];
        setPaymentData(prev => ({
          ...prev,
          selectedMonths: new Set([selectedMonth])
        }));
      }
    }
  }, [prefillData]);

  useEffect(() => {
    if (selectedStudent) {
      // Generate monthly fee data for the selected student
      const fees = months.map((month, index) => ({
        month,
        amount: selectedStudent.monthlyFee || 600,
        status: Math.random() > 0.5 ? 'paid' : 'due', // Random status for demo
        dueDate: `2024-${String(index + 4 > 12 ? index - 8 : index + 4).padStart(2, '0')}-05`
      }));
      setMonthlyFees(fees);
      
      // If this is a prefilled fee, mark the specific month as due
      if (prefillData?.fee) {
        const feeDescription = prefillData.fee.description;
        const monthMatch = feeDescription.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i);
        if (monthMatch) {
          const selectedMonth = monthMatch[1];
          const updatedFees = fees.map(fee => 
            fee.month === selectedMonth 
              ? { ...fee, status: 'due', amount: prefillData.fee!.amount }
              : fee
          );
          setMonthlyFees(updatedFees);
        }
      }
    }
  }, [selectedStudent, prefillData]);

  const handleSearch = () => {
    if (searchData.classSection) {
      // Filter students by class section
      const filteredStudents = students.filter(student => {
        const grade = searchData.classSection.split(' ')[1]; // Extract class number
        return student.grade.includes(grade);
      });
      
      if (filteredStudents.length > 0) {
        setSelectedStudent(filteredStudents[0]);
      }
    }
  };

  const handleStudentSelect = (studentId: string) => {
    const student = students.find(s => s.id.toString() === studentId);
    setSelectedStudent(student || null);
    if (student) {
      setSearchData(prev => ({ ...prev, rollNumber: student.rollNumber }));
    }
  };

  const handleMonthToggle = (month: string) => {
    const newSelected = new Set(paymentData.selectedMonths);
    if (newSelected.has(month)) {
      newSelected.delete(month);
    } else {
      newSelected.add(month);
    }
    setPaymentData(prev => ({ ...prev, selectedMonths: newSelected }));
  };

  const getTotalAmount = () => {
    return monthlyFees
      .filter(fee => paymentData.selectedMonths.has(fee.month) && fee.status === 'due')
      .reduce((total, fee) => total + fee.amount, 0);
  };

  const handlePayNow = () => {
    if (!selectedStudent || paymentData.selectedMonths.size === 0) {
      alert('Please select a student and at least one month to pay.');
      return;
    }

    // Create fee records for selected months
    const selectedFees = monthlyFees.filter(fee => 
      paymentData.selectedMonths.has(fee.month) && fee.status === 'due'
    );

    selectedFees.forEach(fee => {
      const feeRecord: Omit<Fee, 'id'> = {
        studentId: selectedStudent.id,
        amount: fee.amount,
        dueDate: fee.dueDate,
        description: `${fee.month} Fee - ${searchData.academicYear}`,
        status: 'paid',
      };
      onAdd(feeRecord);
    });

    // Reset form
    setSelectedStudent(null);
    setMonthlyFees([]);
    setPaymentData({
      paymentType: '',
      referenceNo: '',
      remarks: '',
      selectedMonths: new Set()
    });
    setSearchData({
      academicYear: '2024-2025',
      classSection: '',
      selectedStudent: null,
      rollNumber: ''
    });
    
    onClose();
  };

  const handleSearchDataChange = (field: string, value: string) => {
    setSearchData(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentDataChange = (field: string, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fee Collection</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Search Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="academicYear">Academic Year</Label>
              <Select value={searchData.academicYear} onValueChange={(value) => handleSearchDataChange('academicYear', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023-2024">April 2023 - March 2024</SelectItem>
                  <SelectItem value="2024-2025">April 2024 - March 2025</SelectItem>
                  <SelectItem value="2025-2026">April 2025 - March 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="classSection">Class Section</Label>
              <Select value={searchData.classSection} onValueChange={(value) => handleSearchDataChange('classSection', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class Section" />
                </SelectTrigger>
                <SelectContent>
                  {classSections.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="selectStudent">Select Student</Label>
              <Select value={selectedStudent?.id.toString() || ''} onValueChange={handleStudentSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  {students
                    .filter(student => {
                      if (!searchData.classSection) return true;
                      const grade = searchData.classSection.split(' ')[1];
                      return student.grade.includes(grade);
                    })
                    .map(student => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.name} ({student.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rollNumber">Roll No.</Label>
              <Select value={searchData.rollNumber} onValueChange={(value) => handleSearchDataChange('rollNumber', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Roll Number" />
                </SelectTrigger>
                <SelectContent>
                  {students
                    .filter(student => !selectedStudent || student.id === selectedStudent.id)
                    .map(student => (
                    <SelectItem key={student.rollNumber} value={student.rollNumber}>
                      {student.rollNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSearch} className="w-full bg-green-600 hover:bg-green-700">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Right Panel - Student Details & Payment */}
          <div className="space-y-4">
            {selectedStudent ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedStudent.name} ({selectedStudent.id})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Student ID:</span>
                      <span>{selectedStudent.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Phone No:</span>
                      <span>{selectedStudent.phone || '91-9452454543'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Class/Section:</span>
                      <span>{searchData.classSection || selectedStudent.grade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Roll No:</span>
                      <span>{selectedStudent.rollNumber}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Fees Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {monthlyFees.map((fee) => (
                    <div
                      key={fee.month}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        fee.status === 'paid'
                          ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200'
                          : paymentData.selectedMonths.has(fee.month)
                          ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200'
                          : 'bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => fee.status === 'due' && handleMonthToggle(fee.month)}
                    >
                      <div className="text-xs font-medium">{fee.month.slice(0, 3).toUpperCase()}</div>
                      <div className="text-xs">{fee.amount}</div>
                      <Badge
                        variant={fee.status === 'paid' ? 'default' : 'secondary'}
                        className="text-xs mt-1"
                      >
                        {fee.status === 'paid' ? 'Paid' : 'Due'}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Late Fee Section */}
                {prefillData?.lateFee && prefillData.lateFee > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">Late Fee Calculation</div>
                    <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                      This fee is overdue. Additional late fee applies:
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-red-600 dark:text-red-400">Late Fee:</span>
                      <span className="font-semibold text-red-700 dark:text-red-300">₹{prefillData.lateFee.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                      * ₹10/day for first 30 days, then ₹20/day
                    </div>
                  </div>
                )}

                {/* Grand Total */}
                <div className="bg-blue-600 text-white p-4 rounded-lg text-center">
                  <div className="text-sm font-medium">GRAND TOTAL</div>
                  <div className="text-xl font-bold">₹{(getTotalAmount() + (prefillData?.lateFee || 0)).toFixed(2)}</div>
                  {prefillData?.lateFee && prefillData.lateFee > 0 && (
                    <div className="text-xs mt-1">Includes ₹{prefillData.lateFee.toLocaleString()} late fee</div>
                  )}
                </div>

                {/* Payment Details */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="paymentType">Select Payment Type</Label>
                    <Select value={paymentData.paymentType} onValueChange={(value) => handlePaymentDataChange('paymentType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Payment Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="referenceNo">Reference No.</Label>
                    <Input
                      id="referenceNo"
                      value={paymentData.referenceNo}
                      onChange={(e) => handlePaymentDataChange('referenceNo', e.target.value)}
                      placeholder="Enter reference number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      value={paymentData.remarks}
                      onChange={(e) => handlePaymentDataChange('remarks', e.target.value)}
                      placeholder="Enter any remarks"
                      rows={2}
                    />
                  </div>

                  <Button
                    onClick={handlePayNow}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                    disabled={paymentData.selectedMonths.size === 0 || !paymentData.paymentType}
                  >
                    Pay Now
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Select a student to view fee details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
