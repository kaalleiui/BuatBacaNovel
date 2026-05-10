import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/versions?chapterId=xxx
export async function GET(req: NextRequest) {
  try {
    const chapterId = req.nextUrl.searchParams.get('chapterId');
    if (!chapterId) {
      return NextResponse.json({ error: 'chapterId diperlukan' }, { status: 400 });
    }

    const versions = await db.chapterVersion.findMany({
      where: { chapterId },
      orderBy: { version: 'desc' },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Get versions error:', error);
    return NextResponse.json({ error: 'Gagal mengambil riwayat versi' }, { status: 500 });
  }
}
