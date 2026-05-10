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

// POST /api/versions/[id] — Restore a version
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

    const version = await db.chapterVersion.findUnique({
      where: { id },
      include: { chapter: { include: { novel: true } } },
    });

    if (!version) {
      return NextResponse.json({ error: 'Versi tidak ditemukan' }, { status: 404 });
    }

    if (version.chapter.novel.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kamu tidak bisa mengembalikan versi ini' }, { status: 403 });
    }

    // Get current chapter content before restoring (save as new version)
    const currentChapter = version.chapter;

    // Create a version entry for the current state before restoring
    const maxVersion = await db.chapterVersion.findFirst({
      where: { chapterId: version.chapterId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const newVersionNum = (maxVersion?.version ?? 0) + 1;

    await db.chapterVersion.create({
      data: {
        chapterId: version.chapterId,
        title: currentChapter.title,
        content: currentChapter.content,
        version: newVersionNum,
      },
    });

    // Update the chapter with the restored content
    const updatedChapter = await db.chapter.update({
      where: { id: version.chapterId },
      data: {
        title: version.title,
        content: version.content,
      },
      include: {
        povCharacter: { select: { id: true, name: true, avatarColor: true, theme: true } },
      },
    });

    return NextResponse.json({ chapter: updatedChapter, version });
  } catch (error) {
    console.error('Restore version error:', error);
    return NextResponse.json({ error: 'Gagal mengembalikan versi' }, { status: 500 });
  }
}
