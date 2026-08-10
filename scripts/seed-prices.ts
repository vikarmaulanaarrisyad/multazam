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

const rawData = `LBB200	BADAK BOTOL 200ML	151.744	160.000	3400	LBB200
LBB500	BADAK BOTOL 500ML	156.080	164.000	27,500 per 4 pcs	LBB500
STRAW	BADAK STRAWBERRY CAN	136.570	142.000	6000	STRAW
JAMBU	BADAK JAMBU CAN	136.570	142.000	6000	JAMBU
LECI005	BADAK LECI CAN	136.570	142.000	6000	LECI
JERUK	BADAK JERUK CAN	136.570	142.000	6000	JERUK
ANGGUR	BADAK ANGGUR CAN	136.570	142.000	6000	ANGGUR
PCR350	POCARY 350ML	123.525	128.000	5200	PCR350
PCR500	POCARY 500ML	147.388	154.000	6500	PCR500
POCA010	POCARY KALENG	112.788	120.000	5000	
CINC011	CINCAU CAP PANDA HITAM	121.000	125.000	5300	
CINC012	CINCAU CAP PANDA HIJAU	121.000	125.000	5300	
K3BO013	K3 BOTOL ANAK 200ML	150.400	160.000	3400	
K3BO014	K3 BOTOL DEWASA 200ML	137.900	148.000	3200	
K3BO015	K3 BOTOL DEWASA 500ML	140.400	151.000	6400	
K3KA016	K3 KALENG DEWASA JAMBU	122.400	129.000	5400	
K3KA017	K3 KALENG DEWASA JERUK	122.400	129.000	5400	
K3KA018	K3 KALENG DEWASA LECI	122.400	129.000	5400`;

function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  // Remove thousand separators (dots) and convert to number
  return parseFloat(priceStr.replace(/\./g, ''));
}

async function seedPrices() {
  console.log('Starting price master seed...');
  
  const lines = rawData.trim().split('\n');
  let successCount = 0;
  let failCount = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split('\t');
    const sku = parts[0];
    const purchase_price_per_dus = parts[2];
    const selling_price_per_dus = parts[3];
    const retail_price_reference = parts[4];
    const legacy_code = parts[5] || null;

    try {
      const product = await prisma.product.findUnique({
        where: { code: sku }
      });

      if (!product) {
        console.warn(`Product not found for SKU: ${sku}`);
        failCount++;
        continue;
      }

      await prisma.product.update({
        where: { code: sku },
        data: {
          purchasePrice: parsePrice(purchase_price_per_dus),
          price: parsePrice(selling_price_per_dus),
          retailPriceNote: retail_price_reference,
          legacyCode: legacy_code
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

seedPrices()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
