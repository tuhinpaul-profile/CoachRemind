import { useEffect, useRef } from 'react';
import { Fee, Student } from '@/types';

interface FeeChartProps {
  fees: Fee[];
  students: Student[];
}

export function FeeChart({ fees, students }: FeeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate monthly collection data for last 6 months
    const months: string[] = [];
    const collections: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('en', { month: 'short' });
      
      const monthlyCollection = fees
        .filter(fee => fee.status === 'paid' && fee.paidDate)
        .filter(fee => {
          const paidDate = new Date(fee.paidDate!);
          return paidDate.getMonth() === date.getMonth() && paidDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);

      months.push(monthStr);
      collections.push(monthlyCollection);
    }

    // Chart dimensions
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    const barWidth = chartWidth / months.length - 10;
    const maxCollection = Math.max(...collections, 1);

    // Draw bars
    ctx.fillStyle = '#f59e0b';
    months.forEach((month, index) => {
      const barHeight = (collections[index] / maxCollection) * chartHeight;
      const x = padding + index * (barWidth + 10);
      const y = canvas.height - padding - barHeight;

      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw labels
      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(month, x + barWidth / 2, canvas.height - 10);
      ctx.fillText(`₹${(collections[index] / 1000).toFixed(0)}k`, x + barWidth / 2, y - 5);

      ctx.fillStyle = '#f59e0b';
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
    for (let i = 0; i <= 5; i++) {
      const value = (maxCollection / 5) * i;
      const y = canvas.height - padding - (i / 5) * chartHeight;
      ctx.fillText(`₹${(value / 1000).toFixed(0)}k`, padding - 10, y + 3);
    }
  }, [fees, students]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={200}
      className="w-full h-48"
      data-testid="fee-chart"
    />
  );
}
