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

// GET /api/novels/[id]/chapters
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chapters = await db.chapter.findMany({
      where: { novelId: id },
      orderBy: { order: 'asc' },
      include: {
        povCharacter: {
          select: { id: true, name: true, avatarColor: true, theme: true },
        },
      },
    });
    return NextResponse.json({ chapters });
  } catch (error) {
    console.error('Get chapters error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data bab' }, { status: 500 });
  }
}

// POST /api/novels/[id]/chapters - add chapter (owner/ADMIN only)
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

    const novel = await db.novel.findUnique({
      where: { id },
      include: { _count: { select: { chapters: true } } },
    });
    if (!novel) {
      return NextResponse.json({ error: 'Novel tidak ditemukan' }, { status: 404 });
    }

    if (novel.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kamu tidak bisa menambah bab ke novel ini' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Judul bab wajib diisi' }, { status: 400 });
    }

    const chapter = await db.chapter.create({
      data: {
        title: body.title.trim(),
        content: body.content?.trim() || '',
        order: body.order ?? novel._count.chapters,
        novelId: id,
        povCharacterId: body.povCharacterId || null,
      },
      include: {
        povCharacter: {
          select: { id: true, name: true, avatarColor: true, theme: true },
        },
      },
    });

    return NextResponse.json({ chapter }, { status: 201 });
  } catch (error) {
    console.error('Create chapter error:', error);
    return NextResponse.json({ error: 'Gagal membuat bab' }, { status: 500 });
  }
}
