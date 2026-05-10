import { PrismaClient, UserRole } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Simple password hashing using Node.js crypto (scrypt)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === verifyHash;
}

async function main() {
  console.log('🌱 Seeding database...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });

  if (existingAdmin) {
    console.log('✅ Admin already exists:', existingAdmin.nickname);
    return;
  }

  // Create default admin
  const admin = await prisma.user.create({
    data: {
      nickname: 'admin',
      password: hashPassword('admin123'),
      role: UserRole.ADMIN,
      avatarColor: '#C67B3C',
    },
  });

  console.log('✅ Admin created:', admin.nickname);
  console.log('   Password: admin123');
  console.log('   ⚠️  Please change the password after first login!');

  // Create a demo writer
  const writer = await prisma.user.create({
    data: {
      nickname: 'Penulis',
      password: hashPassword('writer123'),
      role: UserRole.WRITER,
      avatarColor: '#8B6E4E',
    },
  });

  console.log('✅ Demo writer created:', writer.nickname);
  console.log('   Password: writer123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
