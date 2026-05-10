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

// DELETE /api/comments/[id] - delete comment (owner/admin only)
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

    const comment = await db.comment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json({ error: 'Komentar tidak ditemukan' }, { status: 404 });
    }

    // Can delete if: own comment, admin, or owner of the novel
    if (
      comment.userId !== currentUser.id &&
      currentUser.role !== 'ADMIN'
    ) {
      // Check if user owns the novel
      const novel = await db.novel.findUnique({ where: { id: comment.novelId } });
      if (!novel || novel.userId !== currentUser.id) {
        return NextResponse.json({ error: 'Kamu tidak bisa menghapus komentar ini' }, { status: 403 });
      }
    }

    await db.comment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Gagal menghapus komentar' }, { status: 500 });
  }
}
