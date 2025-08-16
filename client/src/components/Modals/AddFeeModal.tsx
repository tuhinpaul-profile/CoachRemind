import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Student, Fee } from "@/types";

interface AddFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (fee: Omit<Fee, 'id'>) => void;
  students: Student[];
}

export function AddFeeModal({ isOpen, onClose, onAdd, students }: AddFeeModalProps) {
  const [formData, setFormData] = useState({
    studentName: '',
    grade: '',
    amount: 2500,
    dueDate: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find or create student with the entered name and grade
    let student = students.find(s => s.name.toLowerCase() === formData.studentName.toLowerCase() && s.grade === formData.grade);
    
    if (!student) {
      // If student doesn't exist, we'll need to create one
      // For now, we'll use a temporary ID - this should be handled by the parent component
      student = {
        id: Date.now(), // Temporary ID
        name: formData.studentName,
        grade: formData.grade,
        rollNumber: `TEMP-${Date.now()}`,
        email: '',
        phone: '',
        parentEmail: '',
        parentPhone: '',
        monthlyFee: formData.amount,
        status: 'active' as const,
        enrollmentDate: new Date().toISOString().split('T')[0]
      };
    }
    
    const fee: Omit<Fee, 'id'> = {
      studentId: student!.id,
      amount: formData.amount,
      dueDate: formData.dueDate,
      description: formData.description,
      status: 'pending',
    };
    
    onAdd(fee);
    setFormData({
      studentName: '',
      grade: '',
      amount: 2500,
      dueDate: '',
      description: '',
    });
    onClose();
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add Fee Record</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="studentName">Student Name</Label>
            <Input
              id="studentName"
              type="text"
              value={formData.studentName}
              onChange={(e) => handleChange('studentName', e.target.value)}
              placeholder="Enter student name"
              required
              data-testid="input-student-name"
            />
          </div>
          
          <div>
            <Label htmlFor="grade">Grade</Label>
            <Select value={formData.grade} onValueChange={(value) => handleChange('grade', value)}>
              <SelectTrigger data-testid="select-grade">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Grade 1">Grade 1</SelectItem>
                <SelectItem value="Grade 2">Grade 2</SelectItem>
                <SelectItem value="Grade 3">Grade 3</SelectItem>
                <SelectItem value="Grade 4">Grade 4</SelectItem>
                <SelectItem value="Grade 5">Grade 5</SelectItem>
                <SelectItem value="Grade 6">Grade 6</SelectItem>
                <SelectItem value="Grade 7">Grade 7</SelectItem>
                <SelectItem value="Grade 8">Grade 8</SelectItem>
                <SelectItem value="Grade 9">Grade 9</SelectItem>
                <SelectItem value="Grade 10">Grade 10</SelectItem>
                <SelectItem value="Grade 11">Grade 11</SelectItem>
                <SelectItem value="Grade 12">Grade 12</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange('amount', parseInt(e.target.value))}
                required
                data-testid="input-fee-amount"
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                required
                data-testid="input-due-date"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="e.g., Monthly Fee - January 2024"
              required
              data-testid="input-fee-description"
            />
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-fee"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-primary"
              data-testid="button-add-fee"
            >
              Add Fee
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
