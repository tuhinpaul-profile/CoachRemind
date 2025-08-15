import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (recipients: string, subject: string, message: string) => void;
}

export function CustomMessageModal({ isOpen, onClose, onSend }: CustomMessageModalProps) {
  const [formData, setFormData] = useState({
    recipients: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(formData.recipients, formData.subject, formData.message);
    setFormData({
      recipients: '',
      subject: '',
      message: '',
    });
    onClose();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Send Custom Message</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="recipients">Recipients</Label>
            <Select value={formData.recipients} onValueChange={(value) => handleChange('recipients', value)}>
              <SelectTrigger data-testid="select-recipients">
                <SelectValue placeholder="Select Recipients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_parents">All Parents</SelectItem>
                <SelectItem value="all_students">All Students</SelectItem>
                <SelectItem value="overdue_fees">Students with Overdue Fees</SelectItem>
                <SelectItem value="low_attendance">Students with Low Attendance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              required
              data-testid="input-message-subject"
            />
          </div>
          
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              rows={4}
              required
              data-testid="input-message-content"
            />
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-message"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-primary"
              data-testid="button-send-message"
            >
              Send Message
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
