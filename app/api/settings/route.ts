import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json(db.settings);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.discordWebhook === 'string') {
      db.settings.discordWebhook = body.discordWebhook;
    }
    return NextResponse.json(db.settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
