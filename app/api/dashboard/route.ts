import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const summary = db.dailySummaries[date] || {
    id: crypto.randomUUID(),
    date,
    revenue: 0,
    orders: 0,
    fuelCost: 0,
    foodCost: 0,
    otherCost: 0,
    targetRevenue: 0,
  };

  const sessions = db.workSessions.filter(s => s.date === date);
  
  let totalMinutes = 0;
  for (const s of sessions) {
    const start = new Date(`${date}T${s.startTime}:00`);
    const end = new Date(`${date}T${s.endTime}:00`);
    const diff = (end.getTime() - start.getTime()) / 60000;
    if (diff > 0) totalMinutes += diff;
  }
  
  const totalHours = totalMinutes / 60;
  const totalCost = summary.fuelCost + summary.foodCost + summary.otherCost;
  const profit = summary.revenue - totalCost;
  const revenuePerHour = totalHours > 0 ? summary.revenue / totalHours : 0;
  const profitPerHour = totalHours > 0 ? profit / totalHours : 0;
  
  return NextResponse.json({
    summary,
    calculated: {
      totalHours,
      totalCost,
      profit,
      revenuePerHour,
      profitPerHour,
      completionPercent: summary.targetRevenue > 0 ? (summary.revenue / summary.targetRevenue) * 100 : 0
    }
  });
}
