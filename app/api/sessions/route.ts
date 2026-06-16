import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  
  if (date) {
    return NextResponse.json(db.workSessions.filter(s => s.date === date));
  }
  return NextResponse.json(db.workSessions);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, startTime, endTime } = body;
    
    if (!date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const newSession = {
      id: crypto.randomUUID(),
      date,
      startTime,
      endTime
    };
    
    db.workSessions.push(newSession);
    return NextResponse.json(newSession);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add session' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    db.workSessions = db.workSessions.filter(s => s.id !== id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
