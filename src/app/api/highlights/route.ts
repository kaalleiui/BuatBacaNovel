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

// GET /api/highlights?chapterId=xxx
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan masuk terlebih dahulu' }, { status: 401 });
    }

    const chapterId = req.nextUrl.searchParams.get('chapterId');
    if (!chapterId) {
      return NextResponse.json({ error: 'chapterId diperlukan' }, { status: 400 });
    }

    const highlights = await db.highlight.findMany({
      where: { chapterId, userId: currentUser.id },
      orderBy: { startOffset: 'asc' },
    });

    return NextResponse.json({ highlights });
  } catch (error) {
    console.error('Get highlights error:', error);
    return NextResponse.json({ error: 'Gagal mengambil highlight' }, { status: 500 });
  }
}

// POST /api/highlights — Create highlight
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan masuk terlebih dahulu' }, { status: 401 });
    }

    const body = await req.json();
    const { chapterId, text, startOffset, endOffset, color, note } = body;

    if (!chapterId || !text || startOffset === undefined || endOffset === undefined) {
      return NextResponse.json({ error: 'Data highlight tidak lengkap' }, { status: 400 });
    }

    const highlight = await db.highlight.create({
      data: {
        chapterId,
        userId: currentUser.id,
        text,
        startOffset,
        endOffset,
        color: color || '#F59E0B',
        note: note || null,
      },
    });

    return NextResponse.json({ highlight });
  } catch (error) {
    console.error('Create highlight error:', error);
    return NextResponse.json({ error: 'Gagal membuat highlight' }, { status: 500 });
  }
}
