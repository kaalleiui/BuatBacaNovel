import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to get current user from cookie
async function getCurrentUser(req: NextRequest) {
  const userId = req.cookies.get('novelshelf-user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, nickname: true, role: true, avatarColor: true },
  });
}

// GET /api/novels - list all novels (public)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const genre = searchParams.get('genre');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (genre) where.genre = genre;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const novels = await db.novel.findMany({
      where,
      include: {
        user: {
          select: { id: true, nickname: true, avatarColor: true },
        },
        _count: {
          select: { chapters: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ novels });
  } catch (error) {
    console.error('Get novels error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data novel' }, { status: 500 });
  }
}

// POST /api/novels - create novel (WRITER/ADMIN only)
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan masuk terlebih dahulu' }, { status: 401 });
    }

    if (currentUser.role === 'READER') {
      return NextResponse.json({ error: 'Reader tidak bisa membuat novel' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, coverColor, coverImage, genre, readMode } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Judul novel wajib diisi' }, { status: 400 });
    }

    const novel = await db.novel.create({
      data: {
        title: title.trim(),
        description: description?.trim() || '',
        coverColor: coverColor || '#C67B3C',
        coverImage: coverImage || null,
        genre: genre || '',
        readMode: readMode || 'swipe',
        userId: currentUser.id,
      },
      include: {
        user: {
          select: { id: true, nickname: true, avatarColor: true },
        },
        _count: {
          select: { chapters: true },
        },
      },
    });

    return NextResponse.json({ novel }, { status: 201 });
  } catch (error) {
    console.error('Create novel error:', error);
    return NextResponse.json({ error: 'Gagal membuat novel' }, { status: 500 });
  }
}
