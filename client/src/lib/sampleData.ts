import { Student, Fee, AttendanceRecord } from '@/types';

const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Yash', 'Ananya', 'Fatima', 'Aadhya', 'Arya', 'Sara',
  'Diya', 'Pihu', 'Priya', 'Anvi', 'Riya', 'Pari', 'Kavya', 'Khushi', 'Saanvi', 'Myra',
  'Anika', 'Aarya', 'Kiara', 'Ira', 'Navya', 'Mira', 'Tara', 'Sia', 'Zara', 'Nisha'
];

const lastNames = [
  'Sharma', 'Verma', 'Singh', 'Kumar', 'Gupta', 'Agarwal', 'Mishra', 'Jain', 'Bansal', 'Goyal',
  'Arora', 'Khurana', 'Malhotra', 'Chopra', 'Kapoor', 'Mehta', 'Shah', 'Patel', 'Joshi', 'Saxena',
  'Tiwari', 'Pandey', 'Srivastava', 'Yadav', 'Reddy', 'Nair', 'Menon', 'Iyer', 'Bhat', 'Rao'
];

const grades = ['6th', '7th', '8th', '9th', '10th', '11th', '12th'];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generatePhoneNumber(): string {
  return `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`;
}

function generateEmail(firstName: string, lastName: string, domain: string = 'email.com'): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

export function generateSampleStudents(): { students: Student[], fees: Fee[] } {
  const students: Student[] = [];
  const fees: Fee[] = [];
  
  for (let i = 0; i < 100; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const grade = getRandomElement(grades);
    const gradeNumber = grade.replace(/\D/g, '');
    const rollNumber = `${gradeNumber}-${String(i + 1).padStart(3, '0')}`;
    
    // Fee structure based on grade
    let monthlyFee = 2500;
    if (['9th', '10th'].includes(grade)) monthlyFee = 3000;
    if (['11th', '12th'].includes(grade)) monthlyFee = 3500;
    
    const student: Student = {
      id: i + 1,
      name: `${firstName} ${lastName}`,
      grade,
      rollNumber,
      email: generateEmail(firstName, lastName),
      phone: generatePhoneNumber(),
      parentEmail: generateEmail(firstName, lastName, 'parent.gmail.com'),
      parentPhone: generatePhoneNumber(),
      monthlyFee,
      status: 'active',
      enrollmentDate: new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
    };
    
    students.push(student);
    
    // Generate fee records for current year
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    for (let month = 0; month <= currentMonth; month++) {
      const dueDate = new Date(currentYear, month, 10); // Due on 10th of each month
      const isPaid = Math.random() > 0.15; // 85% payment rate
      const isOverdue = dueDate < new Date() && !isPaid;
      
      const fee: Fee = {
        id: fees.length + 1,
        studentId: student.id,
        amount: monthlyFee,
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Monthly Fee - ${dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        status: isPaid ? 'paid' : (isOverdue ? 'overdue' : 'pending'),
        paidDate: isPaid ? new Date(dueDate.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
        paidAmount: isPaid ? monthlyFee : undefined
      };
      
      fees.push(fee);
    }
  }
  
  return { students, fees };
}

export function generateSampleAttendance(students: Student[]): AttendanceRecord {
  const attendance: AttendanceRecord = {};
  const today = new Date();
  
  // Generate attendance for last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends (assuming coaching center is closed on weekends)
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const dateStr = date.toISOString().split('T')[0];
    attendance[dateStr] = {};
    
    students.forEach(student => {
      // 90% attendance rate with some variation
      const isPresent = Math.random() > 0.1;
      attendance[dateStr][student.id] = isPresent ? 'present' : 'absent';
    });
  }
  
  return attendance;
}

export function initializeSampleData(): void {
  const { students, fees } = generateSampleStudents();
  const attendance = generateSampleAttendance(students);
  
  // Store data in localStorage
  localStorage.setItem('coaching_students', JSON.stringify(students));
  localStorage.setItem('coaching_fees', JSON.stringify(fees));
  localStorage.setItem('coaching_attendance', JSON.stringify(attendance));
  
  // Add initial notification
  const notifications = [{
    id: 1,
    type: 'info' as const,
    message: 'System initialized with 100 students and sample data',
    timestamp: new Date().toISOString(),
    read: false
  }];
  
  localStorage.setItem('coaching_notifications', JSON.stringify(notifications));
  
  console.log('Sample data initialized:', {
    studentsCount: students.length,
    feesCount: fees.length,
    attendanceDates: Object.keys(attendance).length
  });
}
