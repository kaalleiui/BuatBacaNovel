import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parsePOVTheme, serializePOVTheme } from '@/lib/types';

async function getCurrentUser(req: NextRequest) {
  const userId = req.cookies.get('novelshelf-user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, nickname: true, role: true, avatarColor: true },
  });
}

// PUT /api/characters/[id] - update character (owner/ADMIN only)
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

    const character = await db.character.findUnique({
      where: { id },
      include: { novel: true },
    });
    if (!character) {
      return NextResponse.json({ error: 'Karakter tidak ditemukan' }, { status: 404 });
    }

    if (character.novel.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kamu tidak bisa mengedit karakter ini' }, { status: 403 });
    }

    const body = await req.json();
    const currentTheme = parsePOVTheme(character.theme);
    const newTheme = body.theme ? { ...currentTheme, ...body.theme } : currentTheme;

    const updated = await db.character.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description.trim() }),
        ...(body.avatarColor !== undefined && { avatarColor: body.avatarColor }),
        theme: serializePOVTheme(newTheme),
      },
    });

    return NextResponse.json({ character: { ...updated, theme: parsePOVTheme(updated.theme) } });
  } catch (error) {
    console.error('Update character error:', error);
    return NextResponse.json({ error: 'Gagal mengupdate karakter' }, { status: 500 });
  }
}

// DELETE /api/characters/[id]
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

    const character = await db.character.findUnique({
      where: { id },
      include: { novel: true },
    });
    if (!character) {
      return NextResponse.json({ error: 'Karakter tidak ditemukan' }, { status: 404 });
    }

    if (character.novel.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kamu tidak bisa menghapus karakter ini' }, { status: 403 });
    }

    await db.character.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete character error:', error);
    return NextResponse.json({ error: 'Gagal menghapus karakter' }, { status: 500 });
  }
}
