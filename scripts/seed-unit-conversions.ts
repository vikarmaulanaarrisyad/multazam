import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '../.env') });

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const rawData = `LBB200	BADAK BOTOL 200ML	DUS	BTL	48	FIXED	TRUE
LBB500	BADAK BOTOL 500ML	DUS	BTL	24	FIXED	TRUE
STRAW	BADAK STRAWBERRY CAN	DUS	KLG	24	FIXED	TRUE
JAMBU	BADAK JAMBU CAN	DUS	KLG	24	FIXED	TRUE
LECI005	BADAK LECI CAN	DUS	KLG	24	FIXED	TRUE
JERUK	BADAK JERUK CAN	DUS	KLG	24	FIXED	TRUE
ANGGUR	BADAK ANGGUR CAN	DUS	KLG	24	FIXED	TRUE
PCR350	POCARY 350ML	DUS	BTL	24	FIXED	TRUE
PCR500	POCARY 500ML	DUS	BTL	24	FIXED	TRUE
POCA010	POCARY KALENG	DUS	KLG	24	FIXED	TRUE
CINC011	CINCAU CAP PANDA HITAM	DUS	KLG	24	FIXED	TRUE
CINC012	CINCAU CAP PANDA HIJAU	DUS	KLG	24	FIXED	TRUE
K3BO013	K3 BOTOL ANAK 200ML	DUS	BTL	48	FIXED	TRUE
K3BO014	K3 BOTOL DEWASA 200ML	DUS	BTL	48	FIXED	TRUE
K3BO015	K3 BOTOL DEWASA 500ML	DUS	BTL	24	FIXED	TRUE
K3KA016	K3 KALENG DEWASA JAMBU	DUS	KLG	24	FIXED	TRUE
K3KA017	K3 KALENG DEWASA JERUK	DUS	KLG	24	FIXED	TRUE
K3KA018	K3 KALENG DEWASA LECI	DUS	KLG	24	FIXED	TRUE
K3KA019	K3 KALENG DEWASA STRAW	DUS	KLG	24	FIXED	TRUE
K3KA020	K3 KALENG DEWASA ANGGUR	DUS	KLG	24	FIXED	TRUE
K3KA021	K3 KALENG ANAK JAMBU	DUS	KLG	24	FIXED	TRUE
K3KA022	K3 KALENG ANAK STRAW	DUS	KLG	24	FIXED	TRUE
K3KA023	K3 KALENG ANAK ANGGUR	DUS	KLG	24	FIXED	TRUE
K3KA024	K3 KALENG ANAK LECI	DUS	KLG	24	FIXED	TRUE
K3KA025	K3 KALENG ANAK JERUK	DUS	KLG	24	FIXED	TRUE
AQG026	AQUA GELAS	DUS	CUP	48	FIXED	TRUE
AQB027	AQUA 330ML	DUS	BTL	24	FIXED	TRUE
AQB028	AQUA 600ML	DUS	BTL	24	FIXED	TRUE
AQB029	AQUA 1500ML	DUS	BTL	12	FIXED	TRUE
VIG030	VIT GELAS	DUS	CUP	48	FIXED	TRUE
VIB031	VIT 330ML	DUS	BTL	24	FIXED	TRUE
VIB032	VIT 600ML	DUS	BTL	24	FIXED	TRUE
VIB033	VIT 1500ML	DUS	BTL	12	FIXED	TRUE
CLEG034	CLEO GELAS	DUS	CUP	48	FIXED	TRUE
CLEB035	CLEO 220ML	DUS	BTL	24	FIXED	TRUE
CLEB036	CLEO 330ML	DUS	BTL	24	FIXED	TRUE
CLEB037	CLEO 550ML	DUS	BTL	24	FIXED	TRUE
CLEB038	CLEO 1500ML	DUS	BTL	12	FIXED	TRUE
LEMG039	LE MINERALE GELAS	DUS	CUP	48	FIXED	TRUE
LEMB040	LE MINERALE 330ML	DUS	BTL	24	FIXED	TRUE
LEMB041	LE MINERALE 600ML	DUS	BTL	24	FIXED	TRUE
LEMB042	LE MINERALE 1500ML	DUS	BTL	12	FIXED	TRUE
UC043	UC1000 LEMON	DUS	BTL	30	FIXED	TRUE
UC044	UC1000 ORANGE	DUS	BTL	30	FIXED	TRUE`;

async function seedUnitConversions() {
  console.log('Starting unit conversion seed...');
  
  const lines = rawData.trim().split('\n');
  let successCount = 0;
  let failCount = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split('\t');
    if (parts.length < 7) continue;

    const [
      sku,
      product_name,
      from_unit,
      to_unit,
      conversion_qty,
      conversion_type,
      active
    ] = parts;

    try {
      // Find the product by SKU
      const product = await prisma.product.findUnique({
        where: { code: sku }
      });

      if (!product) {
        console.warn(`Product not found for SKU: ${sku}`);
        failCount++;
        continue;
      }

      // Upsert the unit conversion
      await prisma.unitConversion.upsert({
        where: {
          productId_fromUnit_toUnit: {
            productId: product.id,
            fromUnit: from_unit,
            toUnit: to_unit,
          }
        },
        update: {
          conversionQty: parseInt(conversion_qty, 10),
          conversionType: conversion_type,
          active: active.toUpperCase() === 'TRUE',
        },
        create: {
          productId: product.id,
          fromUnit: from_unit,
          toUnit: to_unit,
          conversionQty: parseInt(conversion_qty, 10),
          conversionType: conversion_type,
          active: active.toUpperCase() === 'TRUE',
        }
      });
      successCount++;
    } catch (error) {
      console.error(`Error processing SKU ${sku}:`, error);
      failCount++;
    }
  }

  console.log(`Seed completed. Success: ${successCount}, Failed: ${failCount}`);
}

seedUnitConversions()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
