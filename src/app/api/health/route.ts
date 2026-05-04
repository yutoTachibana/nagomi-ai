import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.2.0',
    });
  } catch {
    return Response.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Database connection failed',
    }, { status: 503 });
  }
}
