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

// PUT /api/chapters/[id] - update chapter (owner/ADMIN only)
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

    const chapter = await db.chapter.findUnique({
      where: { id },
      include: { novel: true },
    });
    if (!chapter) {
      return NextResponse.json({ error: 'Bab tidak ditemukan' }, { status: 404 });
    }

    if (chapter.novel.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kamu tidak bisa mengedit bab ini' }, { status: 403 });
    }

    const body = await req.json();
    const updated = await db.chapter.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.povCharacterId !== undefined && { povCharacterId: body.povCharacterId || null }),
      },
      include: {
        povCharacter: { select: { id: true, name: true, avatarColor: true, theme: true } },
      },
    });

    return NextResponse.json({ chapter: updated });
  } catch (error) {
    console.error('Update chapter error:', error);
    return NextResponse.json({ error: 'Gagal mengupdate bab' }, { status: 500 });
  }
}

// DELETE /api/chapters/[id]
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

    const chapter = await db.chapter.findUnique({
      where: { id },
      include: { novel: true },
    });
    if (!chapter) {
      return NextResponse.json({ error: 'Bab tidak ditemukan' }, { status: 404 });
    }

    if (chapter.novel.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kamu tidak bisa menghapus bab ini' }, { status: 403 });
    }

    await db.chapter.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete chapter error:', error);
    return NextResponse.json({ error: 'Gagal menghapus bab' }, { status: 500 });
  }
}
