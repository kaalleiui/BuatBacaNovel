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

// GET /api/novels/[id]/characters
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const characters = await db.character.findMany({
      where: { novelId: id },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ characters });
  } catch (error) {
    console.error('Get characters error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data karakter' }, { status: 500 });
  }
}

// POST /api/novels/[id]/characters - add character (owner/ADMIN only)
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
      return NextResponse.json({ error: 'Kamu tidak bisa menambah karakter ke novel ini' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Nama karakter wajib diisi' }, { status: 400 });
    }

    const theme = body.theme || {
      backgroundColor: '#FDF6EC',
      textColor: '#3D2B1F',
      accentColor: '#C67B3C',
      fontFamily: 'serif',
      lineHeight: 'relaxed',
    };

    const character = await db.character.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || '',
        avatarColor: body.avatarColor || '#C67B3C',
        theme: JSON.stringify(theme),
        novelId: id,
      },
    });

    return NextResponse.json({ character }, { status: 201 });
  } catch (error) {
    console.error('Create character error:', error);
    return NextResponse.json({ error: 'Gagal membuat karakter' }, { status: 500 });
  }
}
