import { useState, useEffect } from "react";
import { Search, Filter, Plus, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { StorageService } from "@/lib/storage";
import { EmailService } from "@/lib/emailService";
import { Student, Fee, FeeStats } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddFeeModal } from "@/components/Modals/AddFeeModal";
import { TablePagination } from "@/components/ui/table-pagination";
import { useToast } from "@/hooks/useToast";

export function FeeManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [filteredFees, setFilteredFees] = useState<Fee[]>([]);
  const [paginatedFees, setPaginatedFees] = useState<Fee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [stats, setStats] = useState<FeeStats>({
    totalOutstanding: 0,
    monthlyCollection: 0,
    collectionRate: 0,
    paid: 0,
    pending: 0,
    overdue: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterFees();
    calculateStats();
  }, [fees, students, searchTerm, statusFilter]);

  useEffect(() => {
    paginateFees();
  }, [filteredFees, currentPage, pageSize]);

  const loadData = () => {
    const studentsData = StorageService.getStudents();
    const feesData = StorageService.getFees();
    setStudents(studentsData);
    setFees(feesData);
  };

  const filterFees = () => {
    let filtered = [...fees];

    if (searchTerm) {
      filtered = filtered.filter(fee => {
        const student = students.find(s => s.id === fee.studentId);
        return student && student.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'due_soon') {
        filtered = filtered.filter(fee => {
          if (fee.status !== 'pending') return false;
          const dueDate = new Date(fee.dueDate);
          const today = new Date();
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 3 && diffDays >= 0;
        });
      } else {
        filtered = filtered.filter(fee => fee.status === statusFilter);
      }
    }

    setFilteredFees(filtered);
    setCurrentPage(1);
  };

  const paginateFees = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setPaginatedFees(filteredFees.slice(startIndex, endIndex));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const calculateStats = () => {
    const totalOutstanding = fees
      .filter(fee => fee.status !== 'paid')
      .reduce((total, fee) => total + fee.amount, 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyCollection = fees
      .filter(fee => fee.status === 'paid' && fee.paidDate)
      .filter(fee => {
        const paidDate = new Date(fee.paidDate!);
        return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
      })
      .reduce((total, fee) => total + (fee.paidAmount || 0), 0);

    const totalExpected = fees.reduce((total, fee) => total + fee.amount, 0);
    const totalCollected = fees.filter(fee => fee.status === 'paid').reduce((total, fee) => total + (fee.paidAmount || 0), 0);
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    const paid = fees.filter(fee => fee.status === 'paid').reduce((total, fee) => total + (fee.paidAmount || 0), 0);
    const pending = fees.filter(fee => fee.status === 'pending').reduce((total, fee) => total + fee.amount, 0);
    const overdue = fees.filter(fee => fee.status === 'overdue').reduce((total, fee) => total + fee.amount, 0);

    setStats({
      totalOutstanding,
      monthlyCollection,
      collectionRate,
      paid,
      pending,
      overdue
    });
  };

  const handleAddFee = (feeData: Omit<Fee, 'id'>) => {
    const newId = Math.max(...fees.map(f => f.id), 0) + 1;
    const newFee: Fee = {
      ...feeData,
      id: newId
    };

    const updatedFees = [...fees, newFee];
    setFees(updatedFees);
    StorageService.setFees(updatedFees);
    toast.success('Fee record added successfully');
  };

  const handleCollectFee = (feeId: number) => {
    const updatedFees = fees.map(fee => {
      if (fee.id === feeId) {
        return {
          ...fee,
          status: 'paid' as const,
          paidDate: new Date().toISOString().split('T')[0],
          paidAmount: fee.amount
        };
      }
      return fee;
    });

    setFees(updatedFees);
    StorageService.setFees(updatedFees);
    
    const fee = fees.find(f => f.id === feeId);
    const student = students.find(s => s.id === fee?.studentId);
    
    toast.success(`Fee collected from ${student?.name}`);
    StorageService.addNotification({
      type: 'fee',
      message: `Fee payment received from ${student?.name} - ₹${fee?.amount}`,
      read: false,
      studentId: fee?.studentId
    });
  };

  const handleSendReminder = async (studentId: number, feeId: number) => {
    const student = students.find(s => s.id === studentId);
    const fee = fees.find(f => f.id === feeId);
    
    if (!student || !fee) return;

    try {
      await EmailService.sendFeeReminder(student, {
        amount: fee.amount,
        dueDate: fee.dueDate,
        description: fee.description
      });
      toast.success(`Fee reminder sent to ${student.name}'s parent`);
    } catch (error) {
      toast.error('Failed to send fee reminder');
    }
  };

  const handleSendAllReminders = async () => {
    const overdueAndPendingFees = fees.filter(fee => fee.status === 'overdue' || fee.status === 'pending');
    
    if (overdueAndPendingFees.length === 0) {
      toast.info('No pending or overdue fees to remind');
      return;
    }

    let successCount = 0;
    
    for (const fee of overdueAndPendingFees) {
      const student = students.find(s => s.id === fee.studentId);
      if (student) {
        try {
          await EmailService.sendFeeReminder(student, {
            amount: fee.amount,
            dueDate: fee.dueDate,
            description: fee.description
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to send reminder to ${student.name}:`, error);
        }
      }
    }

    toast.success(`Fee reminders sent to ${successCount} parents`);
  };

  const collectAllPendingFees = () => {
    const pendingFees = fees.filter(fee => fee.status !== 'paid');
    
    if (pendingFees.length === 0) {
      toast.info('No pending fees to collect');
      return;
    }

    const updatedFees = fees.map(fee => {
      if (fee.status !== 'paid') {
        return {
          ...fee,
          status: 'paid' as const,
          paidDate: new Date().toISOString().split('T')[0],
          paidAmount: fee.amount
        };
      }
      return fee;
    });

    setFees(updatedFees);
    StorageService.setFees(updatedFees);
    
    const totalAmount = pendingFees.reduce((sum, fee) => sum + fee.amount, 0);
    toast.success(`Collected ₹${totalAmount.toLocaleString()} from ${pendingFees.length} students`);
  };

  const getStudentName = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Unknown Student';
  };

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Outstanding</p>
              <p className="text-2xl font-bold text-red-600" data-testid="stat-total-outstanding">
                ₹{stats.totalOutstanding.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Collected This Month</p>
              <p className="text-2xl font-bold text-green-600" data-testid="stat-monthly-collection">
                ₹{stats.monthlyCollection.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Collection Rate</p>
              <p className="text-2xl font-bold text-violet-600" data-testid="stat-collection-rate">
                {stats.collectionRate}%
              </p>
            </div>
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-violet-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Fee Management</h3>
            <p className="text-sm text-gray-500">Track and manage student fee payments</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={collectAllPendingFees}
              className="btn-success"
              data-testid="button-collect-all-fees"
            >
              Collect All Pending
            </Button>
            <Button
              onClick={handleSendAllReminders}
              className="btn-warning"
              data-testid="button-send-all-reminders"
            >
              Send All Reminders
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary flex items-center space-x-2"
              data-testid="button-add-fee"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Fee</span>
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-4 flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-fee-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="select-fee-status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="due_soon">Due Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fee List */}
        <div className="space-y-3" data-testid="fee-list">
          {paginatedFees.map(fee => {
            const student = students.find(s => s.id === fee.studentId);
            if (!student) return null;

            const statusColors = {
              paid: 'fee-status-paid',
              overdue: 'fee-status-overdue',
              pending: 'fee-status-pending'
            };

            const isOverdue = fee.status === 'overdue';
            const daysOverdue = isOverdue ? getDaysOverdue(fee.dueDate) : 0;

            return (
              <div
                key={fee.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${statusColors[fee.status]}`}
                data-testid={`fee-item-${fee.id}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                    <span className="text-violet-600 font-medium text-sm">
                      {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">{fee.description}</div>
                    <div className="text-sm text-gray-500">
                      Due: {new Date(fee.dueDate).toLocaleDateString()}
                      {isOverdue && <span className="text-red-600 ml-2">({daysOverdue} days overdue)</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900" data-testid={`fee-amount-${fee.id}`}>
                      ₹{fee.amount.toLocaleString()}
                    </div>
                    <div className={`text-sm capitalize ${
                      fee.status === 'paid' ? 'text-green-600' : 
                      fee.status === 'overdue' ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {fee.status}
                    </div>
                  </div>
                  {fee.status !== 'paid' ? (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleCollectFee(fee.id)}
                        className="btn-success text-sm"
                        data-testid={`button-collect-fee-${fee.id}`}
                      >
                        Collect
                      </Button>
                      <Button
                        onClick={() => handleSendReminder(fee.studentId, fee.id)}
                        className="btn-warning text-sm"
                        data-testid={`button-send-reminder-${fee.id}`}
                      >
                        Remind
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-green-600" data-testid={`paid-date-${fee.id}`}>
                      Paid: {fee.paidDate ? new Date(fee.paidDate).toLocaleDateString() : 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredFees.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">No fee records found</div>
            <div className="text-muted-foreground/70 text-sm mt-2">
              {searchTerm || statusFilter
                ? 'Try adjusting your search or filters'
                : 'Add fee records to get started'}
            </div>
          </div>
        )}

        {/* Pagination */}
        {filteredFees.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredFees.length / pageSize)}
            pageSize={pageSize}
            totalItems={filteredFees.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>

      <AddFeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddFee}
        students={students}
      />
    </div>
  );
}
