import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { Role } from '@/generated/prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  // Simple secret key protection to prevent unauthorized seeding
  if (key !== 'edia123' && key !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized: Parameter key tidak valid.' }, { status: 401 });
  }

  try {
    const passwordHash = await bcrypt.hash('password123', 10);
    const results: string[] = [];

    // 1. Super Admin
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@edia.com' },
      update: {},
      create: {
        name: 'Super Admin',
        email: 'superadmin@edia.com',
        password: passwordHash,
        role: Role.SUPER_ADMIN,
      },
    });
    results.push(`Super Admin: ${superAdmin.email}`);

    // 2. Admin
    const admin = await prisma.user.upsert({
      where: { email: 'admin@edia.com' },
      update: {},
      create: {
        name: 'Administrator',
        email: 'admin@edia.com',
        password: passwordHash,
        role: Role.ADMIN,
      },
    });
    results.push(`Admin: ${admin.email}`);

    // 3. Sales
    const sales = await prisma.user.upsert({
      where: { email: 'sales@edia.com' },
      update: {},
      create: {
        name: 'Alex Sales',
        email: 'sales@edia.com',
        password: passwordHash,
        role: Role.SALES,
      },
    });
    results.push(`Sales: ${sales.email}`);

    // 4. Developer
    const devPasswordHash = await bcrypt.hash('developer123', 10);
    const developer = await prisma.user.upsert({
      where: { email: 'developer@diamakmur.com' },
      update: {},
      create: {
        name: 'Developer DMA',
        email: 'developer@diamakmur.com',
        password: devPasswordHash,
        role: Role.DEVELOPER,
      },
    });
    results.push(`Developer: ${developer.email}`);

    // 5. Default Setting if empty
    const settingCount = await prisma.setting.count();
    if (settingCount === 0) {
      await prisma.setting.create({
        data: {
          id: "1",
          companyName: "DIA MAKMUR ABADI",
          companyAddress: "Jl. Contoh Alamat No. 123",
        }
      });
      results.push("Setting toko default terbuat.");
    }

    return NextResponse.json({
      success: true,
      message: 'Seeding database berhasil dilakukan!',
      accounts: results,
      defaultPasswords: {
        superadmin: 'password123',
        admin: 'password123',
        sales: 'password123',
        developer: 'developer123',
      }
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Gagal melakukan seeding.' }, { status: 500 });
  }
}
