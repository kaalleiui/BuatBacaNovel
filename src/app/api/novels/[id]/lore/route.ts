import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseTags } from '@/lib/types';

async function getCurrentUser(req: NextRequest) {
  const userId = req.cookies.get('novelshelf-user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, nickname: true, role: true, avatarColor: true },
  });
}

// GET /api/novels/[id]/lore
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const where: Record<string, unknown> = { novelId: id };
    if (category) where.category = category;

    const loreEntries = await db.loreEntry.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    // Parse tags from JSON strings
    const parsed = loreEntries.map((entry) => ({
      ...entry,
      tags: parseTags(entry.tags),
    }));

    return NextResponse.json({ loreEntries: parsed });
  } catch (error) {
    console.error('Get lore error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data lore' }, { status: 500 });
  }
}

// POST /api/novels/[id]/lore - add lore entry (owner/ADMIN only)
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

    const novel = await db.novel.findUnique({ where: { id } });
    if (!novel) {
      return NextResponse.json({ error: 'Novel tidak ditemukan' }, { status: 404 });
    }

    if (novel.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kamu tidak bisa menambah lore ke novel ini' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Judul lore wajib diisi' }, { status: 400 });
    }

    const tags = Array.isArray(body.tags) ? JSON.stringify(body.tags) : '[]';

    const loreEntry = await db.loreEntry.create({
      data: {
        title: body.title.trim(),
        content: body.content?.trim() || '',
        category: body.category || 'notes',
        tags,
        novelId: id,
      },
    });

    return NextResponse.json({
      loreEntry: { ...loreEntry, tags: JSON.parse(loreEntry.tags) },
    }, { status: 201 });
  } catch (error) {
    console.error('Create lore error:', error);
    return NextResponse.json({ error: 'Gagal membuat lore' }, { status: 500 });
  }
}
