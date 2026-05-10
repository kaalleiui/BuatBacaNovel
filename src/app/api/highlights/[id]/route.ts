import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function getCurrentUser(req: NextRequest) {
  const userId = req.cookies.get('novelshelf-user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, nickname: true, role: true },
  });
}

// PUT /api/highlights/[id] — Update highlight
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

    const highlight = await db.highlight.findUnique({ where: { id } });
    if (!highlight) {
      return NextResponse.json({ error: 'Highlight tidak ditemukan' }, { status: 404 });
    }
    if (highlight.userId !== currentUser.id) {
      return NextResponse.json({ error: 'Kamu tidak bisa mengedit highlight ini' }, { status: 403 });
    }

    const body = await req.json();
    const updated = await db.highlight.update({
      where: { id },
      data: {
        ...(body.color !== undefined && { color: body.color }),
        ...(body.note !== undefined && { note: body.note || null }),
      },
    });

    return NextResponse.json({ highlight: updated });
  } catch (error) {
    console.error('Update highlight error:', error);
    return NextResponse.json({ error: 'Gagal mengupdate highlight' }, { status: 500 });
  }
}

// DELETE /api/highlights/[id]
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

    const highlight = await db.highlight.findUnique({ where: { id } });
    if (!highlight) {
      return NextResponse.json({ error: 'Highlight tidak ditemukan' }, { status: 404 });
    }
    if (highlight.userId !== currentUser.id) {
      return NextResponse.json({ error: 'Kamu tidak bisa menghapus highlight ini' }, { status: 403 });
    }

    await db.highlight.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete highlight error:', error);
    return NextResponse.json({ error: 'Gagal menghapus highlight' }, { status: 500 });
  }
}
