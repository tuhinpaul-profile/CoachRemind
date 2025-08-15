import { useEffect, useRef } from 'react';
import { AttendanceRecord, Student } from '@/types';

interface AttendanceChartProps {
  attendance: AttendanceRecord;
  students: Student[];
}

export function AttendanceChart({ attendance, students }: AttendanceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get last 7 days of data
    const days: string[] = [];
    const attendanceRates: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayAttendance = attendance[dateStr] || {};

      const presentCount = Object.values(dayAttendance).filter(status => status === 'present').length;
      const rate = students.length > 0 ? (presentCount / students.length) * 100 : 0;

      days.push(date.toLocaleDateString('en', { weekday: 'short' }));
      attendanceRates.push(rate);
    }

    // Chart dimensions
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    const barWidth = chartWidth / days.length - 10;

    // Draw bars
    ctx.fillStyle = '#8b5cf6';
    days.forEach((day, index) => {
      const barHeight = (attendanceRates[index] / 100) * chartHeight;
      const x = padding + index * (barWidth + 10);
      const y = canvas.height - padding - barHeight;

      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw labels
      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(day, x + barWidth / 2, canvas.height - 10);
      ctx.fillText(`${Math.round(attendanceRates[index])}%`, x + barWidth / 2, y - 5);

      ctx.fillStyle = '#8b5cf6';
    });

    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 100; i += 20) {
      const y = canvas.height - padding - (i / 100) * chartHeight;
      ctx.fillText(`${i}%`, padding - 10, y + 3);
    }
  }, [attendance, students]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={200}
      className="w-full h-48"
      data-testid="attendance-chart"
    />
  );
}
