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
    studentId: 0,
    amount: 2500,
    dueDate: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const fee: Omit<Fee, 'id'> = {
      ...formData,
      status: 'pending',
    };
    
    onAdd(fee);
    setFormData({
      studentId: 0,
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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add Fee Record</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="studentId">Student</Label>
            <Select value={formData.studentId.toString()} onValueChange={(value) => handleChange('studentId', parseInt(value))}>
              <SelectTrigger data-testid="select-student">
                <SelectValue placeholder="Select Student" />
              </SelectTrigger>
              <SelectContent>
                {students.map(student => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.name} ({student.grade})
                  </SelectItem>
                ))}
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
