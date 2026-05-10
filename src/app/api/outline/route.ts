import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/outline?chapterId=xxx
export async function GET(req: NextRequest) {
  try {
    const chapterId = req.nextUrl.searchParams.get('chapterId');
    if (!chapterId) {
      return NextResponse.json({ error: 'chapterId diperlukan' }, { status: 400 });
    }

    const items = await db.outlineItem.findMany({
      where: { chapterId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Get outline error:', error);
    return NextResponse.json({ error: 'Gagal mengambil outline' }, { status: 500 });
  }
}

// POST /api/outline — Create outline item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chapterId, content, order } = body;

    if (!chapterId || !content) {
      return NextResponse.json({ error: 'Data outline tidak lengkap' }, { status: 400 });
    }

    // Get max order for the chapter
    const maxOrder = await db.outlineItem.findFirst({
      where: { chapterId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const item = await db.outlineItem.create({
      data: {
        chapterId,
        content,
        order: order ?? (maxOrder?.order ?? 0) + 1,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Create outline error:', error);
    return NextResponse.json({ error: 'Gagal membuat outline' }, { status: 500 });
  }
}
