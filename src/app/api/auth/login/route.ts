import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nickname, password } = body;

    if (!nickname || !password) {
      return NextResponse.json(
        { error: 'Nickname dan password wajib diisi' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { nickname } });

    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: 'Nickname atau password salah' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        nickname: user.nickname,
        role: user.role,
        avatarColor: user.avatarColor,
      },
    });

    response.cookies.set('novelshelf-user-id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Gagal masuk' }, { status: 500 });
  }
}
