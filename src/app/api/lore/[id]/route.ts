import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseTags, serializeTags } from '@/lib/types';

async function getCurrentUser(req: NextRequest) {
  const userId = req.cookies.get('novelshelf-user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, nickname: true, role: true, avatarColor: true },
  });
}

// PUT /api/lore/[id] - update lore entry (owner/ADMIN only)
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

    const lore = await db.loreEntry.findUnique({
      where: { id },
      include: { novel: true },
    });
    if (!lore) {
      return NextResponse.json({ error: 'Lore tidak ditemukan' }, { status: 404 });
    }

    if (lore.novel.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kamu tidak bisa mengedit lore ini' }, { status: 403 });
    }

    const body = await req.json();
    const updated = await db.loreEntry.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.tags !== undefined && { tags: serializeTags(body.tags) }),
      },
    });

    return NextResponse.json({
      loreEntry: { ...updated, tags: parseTags(updated.tags) },
    });
  } catch (error) {
    console.error('Update lore error:', error);
    return NextResponse.json({ error: 'Gagal mengupdate lore' }, { status: 500 });
  }
}

// DELETE /api/lore/[id]
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

    const lore = await db.loreEntry.findUnique({
      where: { id },
      include: { novel: true },
    });
    if (!lore) {
      return NextResponse.json({ error: 'Lore tidak ditemukan' }, { status: 404 });
    }

    if (lore.novel.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kamu tidak bisa menghapus lore ini' }, { status: 403 });
    }

    await db.loreEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete lore error:', error);
    return NextResponse.json({ error: 'Gagal menghapus lore' }, { status: 500 });
  }
}
