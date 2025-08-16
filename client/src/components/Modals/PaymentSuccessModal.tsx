import { X, Download, Printer, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Student } from "@/types";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentResult: {
    amount: number;
    lateFee: number;
    total: number;
    receiptId: string;
  };
  student?: Student;
}

export function PaymentSuccessModal({ isOpen, onClose, paymentResult, student }: PaymentSuccessModalProps) {
  const handleDownloadReceipt = () => {
    // Generate and download receipt
    const receiptData = {
      receiptId: paymentResult.receiptId,
      studentName: student?.name || 'N/A',
      studentId: student?.id || 'N/A',
      originalAmount: paymentResult.amount,
      lateFee: paymentResult.lateFee,
      totalAmount: paymentResult.total,
      paymentDate: new Date().toLocaleDateString(),
      paymentTime: new Date().toLocaleTimeString()
    };

    // Create a simple text receipt
    const receiptText = `
PAYMENT RECEIPT
===============

Receipt ID: ${receiptData.receiptId}
Date: ${receiptData.paymentDate}
Time: ${receiptData.paymentTime}

STUDENT DETAILS
---------------
Name: ${receiptData.studentName}
Student ID: ${receiptData.studentId}

PAYMENT BREAKDOWN
-----------------
Original Fee: ₹${receiptData.originalAmount.toLocaleString()}
Late Fee: ₹${receiptData.lateFee.toLocaleString()}
Total Paid: ₹${receiptData.totalAmount.toLocaleString()}

Payment Status: PAID
Payment Method: Online

Thank you for your payment!
    `.trim();

    // Create and download the receipt file
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${paymentResult.receiptId}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handlePrintReceipt = () => {
    // Create a print-friendly version
    const printContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Payment Receipt</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .section h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .row { display: flex; justify-content: space-between; margin: 5px 0; }
        .total { font-weight: bold; font-size: 18px; border-top: 2px solid #000; padding-top: 10px; }
        .paid-badge { background: #22c55e; color: white; padding: 5px 10px; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PAYMENT RECEIPT</h1>
        <p>Receipt ID: ${paymentResult.receiptId}</p>
        <p>Date: ${new Date().toLocaleDateString()} | Time: ${new Date().toLocaleTimeString()}</p>
    </div>
    
    <div class="section">
        <h3>Student Details</h3>
        <div class="row"><span>Name:</span><span>${student?.name || 'N/A'}</span></div>
        <div class="row"><span>Student ID:</span><span>${student?.id || 'N/A'}</span></div>
        <div class="row"><span>Grade:</span><span>${student?.grade || 'N/A'}</span></div>
    </div>
    
    <div class="section">
        <h3>Payment Breakdown</h3>
        <div class="row"><span>Original Fee:</span><span>₹${paymentResult.amount.toLocaleString()}</span></div>
        ${paymentResult.lateFee > 0 ? `<div class="row"><span>Late Fee:</span><span>₹${paymentResult.lateFee.toLocaleString()}</span></div>` : ''}
        <div class="row total"><span>Total Paid:</span><span>₹${paymentResult.total.toLocaleString()}</span></div>
    </div>
    
    <div class="section">
        <div class="row"><span>Payment Status:</span><span class="paid-badge">PAID</span></div>
        <div class="row"><span>Payment Method:</span><span>Online</span></div>
    </div>
    
    <div style="margin-top: 40px; text-align: center; color: #666;">
        <p>Thank you for your payment!</p>
        <p>This is a computer-generated receipt.</p>
    </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    printWindow!.document.write(printContent);
    printWindow!.document.close();
    printWindow!.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Successful!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fee payment has been processed</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">Payment Receipt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-4 py-2">
                Receipt ID: {paymentResult.receiptId}
              </Badge>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-400">Student:</span>
                <span className="font-medium">{student?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-400">Student ID:</span>
                <span>{student?.id || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-400">Original Fee:</span>
                <span>₹{paymentResult.amount.toLocaleString()}</span>
              </div>
              {paymentResult.lateFee > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Late Fee:</span>
                  <span className="text-red-600">₹{paymentResult.lateFee.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center font-semibold text-lg border-t pt-2">
                <span>Total Paid:</span>
                <span className="text-green-600">₹{paymentResult.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>Payment Date: {new Date().toLocaleDateString()}</p>
              <p>Payment Time: {new Date().toLocaleTimeString()}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex space-x-3">
          <Button
            onClick={handleDownloadReceipt}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
          <Button
            onClick={handlePrintReceipt}
            variant="outline"
            className="flex-1"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
        </div>

        <Button
          onClick={onClose}
          className="w-full mt-3 bg-gray-600 hover:bg-gray-700 text-white"
        >
          Close
        </Button>
      </div>
    </div>
  );
}