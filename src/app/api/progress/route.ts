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

// GET /api/progress?novelId=xxx
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan masuk terlebih dahulu' }, { status: 401 });
    }

    const novelId = req.nextUrl.searchParams.get('novelId');
    if (!novelId) {
      return NextResponse.json({ error: 'novelId diperlukan' }, { status: 400 });
    }

    const progress = await db.readingProgress.findUnique({
      where: { userId_novelId: { userId: currentUser.id, novelId } },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({ error: 'Gagal mengambil progress' }, { status: 500 });
  }
}

// PUT /api/progress — Upsert reading progress
export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan masuk terlebih dahulu' }, { status: 401 });
    }

    const body = await req.json();
    const { novelId, chapterId, progress: progressVal } = body;

    if (!novelId) {
      return NextResponse.json({ error: 'novelId diperlukan' }, { status: 400 });
    }

    const progress = await db.readingProgress.upsert({
      where: { userId_novelId: { userId: currentUser.id, novelId } },
      update: {
        progress: progressVal ?? 0,
        lastReadAt: new Date(),
        ...(chapterId !== undefined && { chapterId }),
      },
      create: {
        userId: currentUser.id,
        novelId,
        chapterId: chapterId || null,
        progress: progressVal ?? 0,
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Upsert progress error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan progress' }, { status: 500 });
  }
}
