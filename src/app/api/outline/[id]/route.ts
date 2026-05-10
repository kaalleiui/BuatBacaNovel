import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/outline/[id] — Update outline item
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const item = await db.outlineItem.update({
      where: { id },
      data: {
        ...(body.content !== undefined && { content: body.content }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.completed !== undefined && { completed: body.completed }),
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Update outline error:', error);
    return NextResponse.json({ error: 'Gagal mengupdate outline' }, { status: 500 });
  }
}

// DELETE /api/outline/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.outlineItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete outline error:', error);
    return NextResponse.json({ error: 'Gagal menghapus outline' }, { status: 500 });
  }
}
