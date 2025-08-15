import { useState, useEffect } from "react";
import { X, Plus, Edit, Trash2, Save, Calendar, Users, Award, TrendingUp, MessageSquare, Phone, Mail, MapPin, Droplets } from "lucide-react";
import { Student, SubjectPerformance, ParentTeacherMeeting } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StorageService } from "@/lib/storage";
import { useToast } from "@/hooks/useToast";

interface AdminStudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
  mode: 'add' | 'edit' | 'view';
}

export function AdminStudentModal({ student, isOpen, onClose, onSave, mode }: AdminStudentModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Student>({
    id: 0,
    name: '',
    grade: '',
    rollNumber: '',
    email: '',
    phone: '',
    parentEmail: '',
    parentPhone: '',
    monthlyFee: 0,
    status: 'active',
    enrollmentDate: new Date().toISOString().split('T')[0],
    address: '',
    emergencyContact: '',
    bloodGroup: '',
    achievements: [],
    subjectPerformance: [],
    strongSubjects: [],
    improvementAreas: [],
    parentMeetings: [],
    notes: '',
  });

  const [newAchievement, setNewAchievement] = useState('');
  const [newSubject, setNewSubject] = useState({ subject: '', score: 0, grade: 'A', trend: 'stable' as const });
  const [newMeeting, setNewMeeting] = useState<Omit<ParentTeacherMeeting, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    attendees: [],
    topics: [],
    remarks: '',
    actionItems: [],
    createdBy: 'Admin',
  });

  useEffect(() => {
    if (student && isOpen) {
      setFormData({
        ...student,
        achievements: student.achievements || [],
        subjectPerformance: student.subjectPerformance || [],
        strongSubjects: student.strongSubjects || [],
        improvementAreas: student.improvementAreas || [],
        parentMeetings: student.parentMeetings || [],
        address: student.address || '',
        emergencyContact: student.emergencyContact || '',
        bloodGroup: student.bloodGroup || '',
        notes: student.notes || '',
      });
    } else if (mode === 'add' && isOpen) {
      // Reset form for new student
      setFormData({
        id: Date.now(),
        name: '',
        grade: '',
        rollNumber: '',
        email: '',
        phone: '',
        parentEmail: '',
        parentPhone: '',
        monthlyFee: 2500,
        status: 'active',
        enrollmentDate: new Date().toISOString().split('T')[0],
        achievements: [],
        subjectPerformance: [],
        strongSubjects: [],
        improvementAreas: [],
        parentMeetings: [],
        address: '',
        emergencyContact: '',
        bloodGroup: '',
        notes: '',
      });
    }
  }, [student, isOpen, mode]);

  const handleInputChange = (field: keyof Student, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setFormData(prev => ({
        ...prev,
        achievements: [...(prev.achievements || []), newAchievement.trim()]
      }));
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements?.filter((_, i) => i !== index) || []
    }));
  };

  const addSubjectPerformance = () => {
    if (newSubject.subject.trim()) {
      const performance: SubjectPerformance = {
        ...newSubject,
        lastUpdated: new Date().toISOString(),
      };
      setFormData(prev => ({
        ...prev,
        subjectPerformance: [...(prev.subjectPerformance || []), performance]
      }));
      setNewSubject({ subject: '', score: 0, grade: 'A', trend: 'stable' });
    }
  };

  const removeSubjectPerformance = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subjectPerformance: prev.subjectPerformance?.filter((_, i) => i !== index) || []
    }));
  };

  const addParentMeeting = () => {
    if (newMeeting.remarks.trim()) {
      const meeting: ParentTeacherMeeting = {
        ...newMeeting,
        id: Date.now().toString(),
        attendees: newMeeting.attendees.length ? newMeeting.attendees : ['Parent', 'Teacher'],
        topics: newMeeting.topics.length ? newMeeting.topics : ['Academic Progress'],
        actionItems: newMeeting.actionItems.length ? newMeeting.actionItems : []
      };
      setFormData(prev => ({
        ...prev,
        parentMeetings: [...(prev.parentMeetings || []), meeting],
        lastParentMeeting: meeting
      }));
      setNewMeeting({
        date: new Date().toISOString().split('T')[0],
        attendees: [],
        topics: [],
        remarks: '',
        actionItems: [],
        createdBy: 'Admin',
      });
    }
  };

  const handleSave = () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Student name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!formData.rollNumber.trim()) {
      toast.error('Roll number is required');
      return;
    }

    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const isReadOnly = mode === 'view';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'add' ? 'Add New Student' : mode === 'edit' ? 'Edit Student' : 'Student Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <Tabs defaultValue="basic" className="p-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="meetings">Parent Meetings</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter student name"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rollNumber">Roll Number *</Label>
                    <Input
                      id="rollNumber"
                      value={formData.rollNumber}
                      onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                      placeholder="Enter roll number"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="grade">Grade</Label>
                    <Select
                      value={formData.grade}
                      onValueChange={(value) => handleInputChange('grade', value)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={`${i + 1}th Grade`}>
                            {i + 1}th Grade
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select
                      value={formData.bloodGroup}
                      onValueChange={(value) => handleInputChange('bloodGroup', value)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter complete address"
                    disabled={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="w-5 h-5" />
                  <span>Parent/Guardian Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentEmail">Parent Email</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                      placeholder="Enter parent email"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentPhone">Parent Phone</Label>
                    <Input
                      id="parentPhone"
                      value={formData.parentPhone}
                      onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                      placeholder="Enter parent phone"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                      placeholder="Enter emergency contact"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthlyFee">Monthly Fee (₹)</Label>
                    <Input
                      id="monthlyFee"
                      type="number"
                      value={formData.monthlyFee}
                      onChange={(e) => handleInputChange('monthlyFee', parseInt(e.target.value))}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Subject Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isReadOnly && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <Input
                      placeholder="Subject name"
                      value={newSubject.subject}
                      onChange={(e) => setNewSubject(prev => ({ ...prev, subject: e.target.value }))}
                    />
                    <Input
                      type="number"
                      placeholder="Score (%)"
                      value={newSubject.score}
                      onChange={(e) => setNewSubject(prev => ({ ...prev, score: parseInt(e.target.value) }))}
                    />
                    <Select
                      value={newSubject.grade}
                      onValueChange={(value) => setNewSubject(prev => ({ ...prev, grade: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'].map(grade => (
                          <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addSubjectPerformance} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2">
                  {formData.subjectPerformance?.map((subject, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{subject.subject}</div>
                        <div className="text-sm text-gray-600">
                          Score: {subject.score}% | Grade: {subject.grade} | 
                          Trend: {subject.trend === 'up' ? '📈' : subject.trend === 'down' ? '📉' : '➡️'}
                        </div>
                      </div>
                      {!isReadOnly && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSubjectPerformance(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Strong Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.strongSubjects?.join(', ') || ''}
                    onChange={(e) => handleInputChange('strongSubjects', e.target.value.split(', ').filter(s => s.trim()))}
                    placeholder="Enter subjects separated by commas"
                    disabled={isReadOnly}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Improvement Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.improvementAreas?.join(', ') || ''}
                    onChange={(e) => handleInputChange('improvementAreas', e.target.value.split(', ').filter(s => s.trim()))}
                    placeholder="Enter areas separated by commas"
                    disabled={isReadOnly}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Recent Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isReadOnly && (
                  <div className="flex space-x-2 mb-4">
                    <Input
                      placeholder="Enter achievement"
                      value={newAchievement}
                      onChange={(e) => setNewAchievement(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
                    />
                    <Button onClick={addAchievement}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2">
                  {formData.achievements?.map((achievement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-yellow-600" />
                        <span>{achievement}</span>
                      </div>
                      {!isReadOnly && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAchievement(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {(!formData.achievements || formData.achievements.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No achievements recorded yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Parent-Teacher Meetings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isReadOnly && (
                  <div className="p-4 bg-gray-50 rounded-lg mb-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="meetingDate">Meeting Date</Label>
                        <Input
                          id="meetingDate"
                          type="date"
                          value={newMeeting.date}
                          onChange={(e) => setNewMeeting(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="attendees">Attendees</Label>
                        <Input
                          id="attendees"
                          placeholder="Enter attendees separated by commas"
                          value={newMeeting.attendees.join(', ')}
                          onChange={(e) => setNewMeeting(prev => ({ 
                            ...prev, 
                            attendees: e.target.value.split(', ').filter(a => a.trim()) 
                          }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="topics">Topics Discussed</Label>
                      <Input
                        id="topics"
                        placeholder="Enter topics separated by commas"
                        value={newMeeting.topics.join(', ')}
                        onChange={(e) => setNewMeeting(prev => ({ 
                          ...prev, 
                          topics: e.target.value.split(', ').filter(t => t.trim()) 
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="remarks">Remarks & Discussion</Label>
                      <Textarea
                        id="remarks"
                        placeholder="Enter meeting remarks and discussion points"
                        value={newMeeting.remarks}
                        onChange={(e) => setNewMeeting(prev => ({ ...prev, remarks: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="actionItems">Action Items</Label>
                      <Textarea
                        id="actionItems"
                        placeholder="Enter action items separated by new lines"
                        value={newMeeting.actionItems.join('\n')}
                        onChange={(e) => setNewMeeting(prev => ({ 
                          ...prev, 
                          actionItems: e.target.value.split('\n').filter(item => item.trim()) 
                        }))}
                      />
                    </div>
                    <Button onClick={addParentMeeting}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Meeting Record
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  {formData.parentMeetings?.map((meeting, index) => (
                    <div key={meeting.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">
                          Meeting on {new Date(meeting.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          by {meeting.createdBy}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><strong>Attendees:</strong> {meeting.attendees.join(', ')}</div>
                        <div><strong>Topics:</strong> {meeting.topics.join(', ')}</div>
                        <div><strong>Remarks:</strong> {meeting.remarks}</div>
                        {meeting.actionItems.length > 0 && (
                          <div>
                            <strong>Action Items:</strong>
                            <ul className="list-disc list-inside ml-4">
                              {meeting.actionItems.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!formData.parentMeetings || formData.parentMeetings.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No meeting records found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Additional Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Enter any additional notes about the student..."
                  rows={8}
                  disabled={isReadOnly}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!isReadOnly && (
            <Button onClick={handleSave} className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              {mode === 'add' ? 'Add Student' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}