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

// GET /api/settings — Get current user's reader settings
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan masuk terlebih dahulu' }, { status: 401 });
    }

    const settings = await db.readerSettings.findUnique({
      where: { userId: currentUser.id },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Gagal mengambil pengaturan' }, { status: 500 });
  }
}

// PUT /api/settings — Upsert reader settings
export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan masuk terlebih dahulu' }, { status: 401 });
    }

    const body = await req.json();

    const settings = await db.readerSettings.upsert({
      where: { userId: currentUser.id },
      update: {
        ...(body.fontSize !== undefined && { fontSize: body.fontSize }),
        ...(body.fontFamily !== undefined && { fontFamily: body.fontFamily }),
        ...(body.lineHeight !== undefined && { lineHeight: body.lineHeight }),
        ...(body.pageMargin !== undefined && { pageMargin: body.pageMargin }),
        ...(body.theme !== undefined && { theme: body.theme }),
        ...(body.customBgColor !== undefined && { customBgColor: body.customBgColor }),
        ...(body.customTextColor !== undefined && { customTextColor: body.customTextColor }),
        ...(body.customAccentColor !== undefined && { customAccentColor: body.customAccentColor }),
      },
      create: {
        userId: currentUser.id,
        fontSize: body.fontSize ?? 18,
        fontFamily: body.fontFamily ?? 'serif',
        lineHeight: body.lineHeight ?? 'relaxed',
        pageMargin: body.pageMargin ?? 20,
        theme: body.theme ?? 'classic',
        customBgColor: body.customBgColor ?? '#FDF6EC',
        customTextColor: body.customTextColor ?? '#3D2B1F',
        customAccentColor: body.customAccentColor ?? '#C67B3C',
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Upsert settings error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 });
  }
}
