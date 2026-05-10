import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// POST /api/auth/register
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nickname, password, role } = body;

    if (!nickname || !password) {
      return NextResponse.json(
        { error: 'Nickname dan password wajib diisi' },
        { status: 400 }
      );
    }

    if (nickname.length < 3) {
      return NextResponse.json(
        { error: 'Nickname minimal 3 karakter' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { nickname } });

    if (existing) {
      return NextResponse.json(
        { error: 'Nickname sudah dipakai' },
        { status: 409 }
      );
    }

    const userRole: UserRole = role === 'WRITER' ? UserRole.WRITER : UserRole.READER;

    const user = await db.user.create({
      data: {
        nickname,
        password: hashPassword(password),
        role: userRole,
        avatarColor: ['#C67B3C', '#8B6E4E', '#D4874D', '#A0522D', '#9B2335', '#2D5F4A', '#3D6B8E', '#6B4E71'][
          Math.floor(Math.random() * 8)
        ],
      },
      select: {
        id: true,
        nickname: true,
        role: true,
        avatarColor: true,
      },
    });

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set('novelshelf-user-id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Gagal mendaftar' }, { status: 500 });
  }
}
