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

// POST /api/export — Export novel as EPUB or PDF
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan masuk terlebih dahulu' }, { status: 401 });
    }

    const body = await req.json();
    const { novelId, format } = body;

    if (!novelId || !format) {
      return NextResponse.json({ error: 'novelId dan format diperlukan' }, { status: 400 });
    }

    const novel = await db.novel.findUnique({
      where: { id: novelId },
      include: {
        chapters: { orderBy: { order: 'asc' } },
        user: { select: { nickname: true } },
      },
    });

    if (!novel) {
      return NextResponse.json({ error: 'Novel tidak ditemukan' }, { status: 404 });
    }

    if (format === 'epub') {
      return await exportEpub(novel);
    } else if (format === 'pdf') {
      return await exportPdf(novel);
    }

    return NextResponse.json({ error: 'Format tidak didukung' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Gagal mengekspor novel' }, { status: 500 });
  }
}

async function exportEpub(novel: {
  id: string; title: string; description: string; coverColor: string;
  chapters: { id: string; title: string; content: string; order: number }[];
  user: { nickname: string };
}) {
  try {
    const EPub = (await import('epub-gen-memory')).default;

    const chapters = novel.chapters.map((ch) => ({
      title: ch.title,
      content: ch.content || '<p><em>Belum ada konten</em></p>',
    }));

    const epubOptions = {
      title: novel.title,
      author: novel.user.nickname,
      description: novel.description || undefined,
      chapters,
    };

    const buffer = await EPub(epubOptions);

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': `attachment; filename="${novel.title.replace(/[^a-zA-Z0-9]/g, '_')}.epub"`,
      },
    });
  } catch (error) {
    console.error('EPUB export error:', error);
    return NextResponse.json({ error: 'Gagal mengekspor EPUB' }, { status: 500 });
  }
}

async function exportPdf(novel: {
  id: string; title: string; description: string; coverColor: string;
  chapters: { id: string; title: string; content: string; order: number }[];
  user: { nickname: string };
}) {
  try {
    const PDFDocument = (await import('pdfkit')).default;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Title page
    doc.fontSize(28).text(novel.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`oleh ${novel.user.nickname}`, { align: 'center' });
    if (novel.description) {
      doc.moveDown();
      doc.fontSize(11).text(novel.description, { align: 'center' });
    }
    doc.moveDown(2);

    // Chapters
    for (const chapter of novel.chapters) {
      doc.addPage();
      doc.fontSize(20).text(chapter.title, { align: 'center' });
      doc.moveDown();
      // Strip HTML tags for PDF
      const plainContent = chapter.content
        ? chapter.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        : 'Belum ada konten';
      doc.fontSize(12).text(plainContent, { align: 'justify', lineGap: 4 });
    }

    doc.end();

    return new Promise<NextResponse>((resolve) => {
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${novel.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
          },
        }));
      });
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json({ error: 'Gagal mengekspor PDF' }, { status: 500 });
  }
}
