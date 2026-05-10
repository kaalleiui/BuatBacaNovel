import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function getCurrentUser(req: NextRequest) {
  const userId = req.cookies.get('novelshelf-user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, nickname: true, role: true, avatarColor: true },
  });
}

// GET /api/novels/[id]/comments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await db.comment.findMany({
      where: { novelId: id },
      include: {
        user: { select: { id: true, nickname: true, avatarColor: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Gagal mengambil komentar' }, { status: 500 });
  }
}

// POST /api/novels/[id]/comments - add comment (any logged-in user)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan masuk terlebih dahulu' }, { status: 401 });
    }

    const body = await req.json();
    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Komentar tidak boleh kosong' }, { status: 400 });
    }

    const comment = await db.comment.create({
      data: {
        content: body.content.trim(),
        novelId: id,
        chapterId: body.chapterId || null,
        userId: currentUser.id,
      },
      include: {
        user: { select: { id: true, nickname: true, avatarColor: true } },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Gagal membuat komentar' }, { status: 500 });
  }
}
