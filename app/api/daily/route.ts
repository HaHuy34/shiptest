import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, ...updates } = body;
    
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }
    
    if (!db.dailySummaries[date]) {
      db.dailySummaries[date] = {
        id: crypto.randomUUID(),
        date,
        revenue: 0,
        orders: 0,
        fuelCost: 0,
        foodCost: 0,
        otherCost: 0,
        targetRevenue: 0,
      };
    }
    
    db.dailySummaries[date] = {
      ...db.dailySummaries[date],
      ...updates
    };
    
    return NextResponse.json(db.dailySummaries[date]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update daily summary' }, { status: 500 });
  }
}
