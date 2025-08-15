import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Student } from "@/types";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (student: Omit<Student, 'id'>) => void;
}

export function AddStudentModal({ isOpen, onClose, onAdd }: AddStudentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    rollNumber: '',
    email: '',
    phone: '',
    parentEmail: '',
    parentPhone: '',
    monthlyFee: 2500,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const student: Omit<Student, 'id'> = {
      ...formData,
      status: 'active',
      enrollmentDate: new Date().toISOString().split('T')[0],
    };
    
    onAdd(student);
    setFormData({
      name: '',
      grade: '',
      rollNumber: '',
      email: '',
      phone: '',
      parentEmail: '',
      parentPhone: '',
      monthlyFee: 2500,
    });
    onClose();
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add New Student</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Student Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              data-testid="input-student-name"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Select value={formData.grade} onValueChange={(value) => handleChange('grade', value)}>
                <SelectTrigger data-testid="select-grade">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6th">6th Grade</SelectItem>
                  <SelectItem value="7th">7th Grade</SelectItem>
                  <SelectItem value="8th">8th Grade</SelectItem>
                  <SelectItem value="9th">9th Grade</SelectItem>
                  <SelectItem value="10th">10th Grade</SelectItem>
                  <SelectItem value="11th">11th Grade</SelectItem>
                  <SelectItem value="12th">12th Grade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                value={formData.rollNumber}
                onChange={(e) => handleChange('rollNumber', e.target.value)}
                required
                data-testid="input-roll-number"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Student Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              data-testid="input-student-email"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Student Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              required
              data-testid="input-student-phone"
            />
          </div>
          
          <div>
            <Label htmlFor="parentEmail">Parent Email</Label>
            <Input
              id="parentEmail"
              type="email"
              value={formData.parentEmail}
              onChange={(e) => handleChange('parentEmail', e.target.value)}
              required
              data-testid="input-parent-email"
            />
          </div>
          
          <div>
            <Label htmlFor="parentPhone">Parent Phone</Label>
            <Input
              id="parentPhone"
              type="tel"
              value={formData.parentPhone}
              onChange={(e) => handleChange('parentPhone', e.target.value)}
              required
              data-testid="input-parent-phone"
            />
          </div>
          
          <div>
            <Label htmlFor="monthlyFee">Monthly Fee</Label>
            <Input
              id="monthlyFee"
              type="number"
              value={formData.monthlyFee}
              onChange={(e) => handleChange('monthlyFee', parseInt(e.target.value))}
              required
              data-testid="input-monthly-fee"
            />
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-student"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-primary"
              data-testid="button-add-student"
            >
              Add Student
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
