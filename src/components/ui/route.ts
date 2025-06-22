
import { NextResponse } from 'next/server';

export async function GET() {
  // This endpoint is used to check if the server is running.
  // It has no dependencies on databases or secrets.
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
