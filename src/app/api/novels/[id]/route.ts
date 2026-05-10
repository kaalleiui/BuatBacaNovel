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

// GET /api/novels/[id] - get novel detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const novel = await db.novel.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, nickname: true, avatarColor: true },
        },
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            povCharacter: {
              select: { id: true, name: true, avatarColor: true, theme: true },
            },
          },
        },
        characters: true,
        loreEntries: { orderBy: { updatedAt: 'desc' } },
        comments: {
          include: {
            user: {
              select: { id: true, nickname: true, avatarColor: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!novel) {
      return NextResponse.json({ error: 'Novel tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ novel });
  } catch (error) {
    console.error('Get novel error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data novel' }, { status: 500 });
  }
}

// PUT /api/novels/[id] - update novel (owner/ADMIN only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan masuk terlebih dahulu' }, { status: 401 });
    }

    const novel = await db.novel.findUnique({ where: { id } });
    if (!novel) {
      return NextResponse.json({ error: 'Novel tidak ditemukan' }, { status: 404 });
    }

    if (novel.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kamu tidak bisa mengedit novel ini' }, { status: 403 });
    }

    const body = await req.json();
    const updated = await db.novel.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.description !== undefined && { description: body.description.trim() }),
        ...(body.coverColor !== undefined && { coverColor: body.coverColor }),
        ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
        ...(body.genre !== undefined && { genre: body.genre }),
        ...(body.readMode !== undefined && { readMode: body.readMode }),
      },
      include: {
        user: { select: { id: true, nickname: true, avatarColor: true } },
        _count: { select: { chapters: true } },
      },
    });

    return NextResponse.json({ novel: updated });
  } catch (error) {
    console.error('Update novel error:', error);
    return NextResponse.json({ error: 'Gagal mengupdate novel' }, { status: 500 });
  }
}

// DELETE /api/novels/[id] - delete novel (owner/ADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan masuk terlebih dahulu' }, { status: 401 });
    }

    const novel = await db.novel.findUnique({ where: { id } });
    if (!novel) {
      return NextResponse.json({ error: 'Novel tidak ditemukan' }, { status: 404 });
    }

    if (novel.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kamu tidak bisa menghapus novel ini' }, { status: 403 });
    }

    await db.novel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete novel error:', error);
    return NextResponse.json({ error: 'Gagal menghapus novel' }, { status: 500 });
  }
}
