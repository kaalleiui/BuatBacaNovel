import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function getCurrentUser(req: NextRequest) {
  const userId = req.cookies.get('novelshelf-user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, nickname: true, role: true },
  });
}

// GET /api/progress/all — Get all reading progress for user
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan masuk terlebih dahulu' }, { status: 401 });
    }

    const progress = await db.readingProgress.findMany({
      where: { userId: currentUser.id },
      include: { novel: { select: { id: true, title: true, coverColor: true, coverImage: true } } },
      orderBy: { lastReadAt: 'desc' },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Get all progress error:', error);
    return NextResponse.json({ error: 'Gagal mengambil progress' }, { status: 500 });
  }
}
