import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '../.env') });
console.log('DB URL:', process.env.DATABASE_URL);
import { PrismaClient } from '../src/generated/prisma/client';

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const rawData = `LBB200	BADAK BOTOL 200ML	BADAK	MINUMAN	ACTIVE	DUS	DUS	BTL	48	WHOLESALE_AND_RETAIL	TRUE	FALSE	160.000	151.744	3400	LBB200
LBB500	BADAK BOTOL 500ML	BADAK	MINUMAN	ACTIVE	DUS	DUS	BTL	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	164.000	156.080	27,500 per 4 pcs	LBB500
STRAW	BADAK STRAWBERRY CAN	BADAK	MINUMAN	ACTIVE	DUS	DUS	KLG	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	142.000	136.570	6000	STRAW
JAMBU	BADAK JAMBU CAN	BADAK	MINUMAN	ACTIVE	DUS	DUS	KLG	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	142.000	136.570	6000	JAMBU
LECI005	BADAK LECI CAN	BADAK	MINUMAN	ACTIVE	DUS	DUS	KLG	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	142.000	136.570	6000	LECI
JERUK	BADAK JERUK CAN	BADAK	MINUMAN	ACTIVE	DUS	DUS	KLG	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	142.000	136.570	6000	JERUK
ANGGUR	BADAK ANGGUR CAN	BADAK	MINUMAN	ACTIVE	DUS	DUS	KLG	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	142.000	136.570	6000	ANGGUR
PCR350	POCARY 350ML	POCARI	MINUMAN	ACTIVE	DUS	DUS	BTL	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	128.000	123.525	5200	PCR350
PCR500	POCARY 500ML	POCARI	MINUMAN	ACTIVE	DUS	DUS	BTL	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	154.000	147.388	6500	PCR500
POCA010	POCARY KALENG	POCARI	MINUMAN	ACTIVE	DUS	DUS	KLG	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	120.000	112.788	5000	
CINC011	CINCAU CAP PANDA HITAM		MINUMAN	ACTIVE	DUS	DUS	KLG	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	125.000	121.000	5300	
CINC012	CINCAU CAP PANDA HIJAU		MINUMAN	ACTIVE	DUS	DUS	KLG	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	125.000	121.000	5300	
K3BO013	K3 BOTOL ANAK 200ML		LAINNYA	ACTIVE	DUS	DUS	BTL	48	WHOLESALE_AND_RETAIL	TRUE	FALSE	160.000	150.400	3400	
K3BO014	K3 BOTOL DEWASA 200ML		LAINNYA	ACTIVE	DUS	DUS	BTL	48	WHOLESALE_AND_RETAIL	TRUE	FALSE	148.000	137.900	3200	
K3BO015	K3 BOTOL DEWASA 500ML		LAINNYA	ACTIVE	DUS	DUS	BTL	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	151.000	140.400	6400	
K3KA016	K3 KALENG DEWASA JAMBU		LAINNYA	ACTIVE	DUS	DUS	KLG	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	129.000	122.400	5400	
K3KA017	K3 KALENG DEWASA JERUK		LAINNYA	ACTIVE	DUS	DUS	KLG	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	129.000	122.400	5400	
K3KA018	K3 KALENG DEWASA LECI		LAINNYA	ACTIVE	DUS	DUS	KLG	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	129.000	122.400	5400	
K3KA019	K3 KALENG DEWASA STRAW		LAINNYA	ACTIVE	DUS	DUS	KLG	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	129.000	122.400	5400	
K3KA020	K3 KALENG ANAK JERUK		LAINNYA	ACTIVE	DUS	DUS	KLG	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	125.000	119.100	5300	
K3KA021	K3 KALENG ANAK LECI		LAINNYA	ACTIVE	DUS	DUS	KLG	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	125.000	119.100	5300	
K3KA022	K3 KALENG ANAK STRAW		LAINNYA	ACTIVE	DUS	DUS	KLG	24	WHOLESALE_AND_RETAIL	TRUE	FALSE	125.000	119.100	5300	
PIAK023	PIA KACANG HIJAU		MAKANAN & SNACK	ACTIVE	DUS	DUS	PAK	6	REVIEW	FALSE	FALSE	47.000	44.000		
PIAC024	PIA COKLAT		MAKANAN & SNACK	ACTIVE	DUS	DUS	PAK	6	REVIEW	FALSE	FALSE	47.000	44.000		
PIAN025	PIA NANAS		MAKANAN & SNACK	ACTIVE	DUS	DUS	PAK	6	REVIEW	FALSE	FALSE	47.000	44.000		
LOTT026	LOTTE CHOCOPIE COKLAT		MAKANAN & SNACK	ACTIVE	DUS	DUS	PACK	8	WHOLESALE_AND_RETAIL	TRUE	FALSE	155.000	148.000	19500	
LOTT027	LOTTE CHOCOPIE STRAWBERRY		MAKANAN & SNACK	ACTIVE	DUS	DUS	PACK	8	WHOLESALE_AND_RETAIL	TRUE	FALSE	155.000	148.000	19500	
NEXT028	NEXTAR CHOCOPIE STRAWBERRY		MAKANAN & SNACK	ACTIVE	DUS	DUS	PACK	8	WHOLESALE_AND_RETAIL	TRUE	FALSE	155.000	149.000	19500	
NEXT029	NEXTAR CHOCOPIE COKLAT		MAKANAN & SNACK	ACTIVE	DUS	DUS	PACK	8	WHOLESALE_AND_RETAIL	TRUE	FALSE	155.000	149.000	19500	
NABA030	NABATI COKLAT 5000		MAKANAN & SNACK	ACTIVE	DUS	DUS	PCS	30	WHOLESALE_AND_RETAIL	TRUE	FALSE	122.000	116.000	4100	
NABA031	NABATI KEJU 5000		MAKANAN & SNACK	ACTIVE	DUS	DUS	PCS	30	WHOLESALE_AND_RETAIL	TRUE	FALSE	122.000	116.000	4100	
NABA032	NABATI COKLAT 2.000 (100PCS)		MAKANAN & SNACK	ACTIVE	DUS	DUS	PCS	100	WHOLESALE_AND_RETAIL	TRUE	FALSE	154.000	152.000	1600	
NABA033	NABATI KEJU 2.000 (100PCS)		MAKANAN & SNACK	ACTIVE	DUS	DUS	PCS	100	WHOLESALE_AND_RETAIL	TRUE	FALSE	154.000	152.000	1600	
NABA034	NABATI COKLAT 500		MAKANAN & SNACK	ACTIVE	DUS	DUS	BOX	12	WHOLESALE_AND_RETAIL	TRUE	FALSE	109.000	105.500	9200	
NABA035	NABATI KEJU 500		MAKANAN & SNACK	ACTIVE	DUS	DUS	BOX	12	WHOLESALE_AND_RETAIL	TRUE	FALSE	109.000	105.500	9200	
NEXT036	NEXTAR BROWNIS NANAS		MAKANAN & SNACK	ACTIVE	DUS	DUS	PACK	8	WHOLESALE_AND_RETAIL	TRUE	FALSE	154.000	149.000	19500	
NEXT037	NEXTAR BROWNIS COKLAT		MAKANAN & SNACK	ACTIVE	DUS	DUS	PACK	8	WHOLESALE_AND_RETAIL	TRUE	FALSE	154.000	149.000	19500	
SIIP038	SIIP COKLAT 500		MAKANAN & SNACK	ACTIVE	DUS	DUS	BOX	15	WHOLESALE_AND_RETAIL	TRUE	FALSE	119.000	115.000	8000	
SIIP039	SIIP KEJU 500		MAKANAN & SNACK	ACTIVE	DUS	DUS	BOX	15	WHOLESALE_AND_RETAIL	TRUE	FALSE	119.000	115.000	8000	
SIIP040	SIIP JAGUNG BAKAR 500		MAKANAN & SNACK	ACTIVE	DUS	DUS	BOX	15	WHOLESALE_AND_RETAIL	TRUE	FALSE	119.000	115.000	8000	
AHHK041	AHH KEJU 500		MAKANAN & SNACK	ACTIVE	DUS	DUS	BOX	15	WHOLESALE_AND_RETAIL	TRUE	FALSE	119.000	114.000	8000	
AHHC042	AHH COKLAT 500		MAKANAN & SNACK	ACTIVE	DUS	DUS	BOX	15	WHOLESALE_AND_RETAIL	TRUE	FALSE	119.000	114.000	8000	
PAST043	PASTA COKLAT		MAKANAN & SNACK	ACTIVE	DUS	DUS	BOX	9	WHOLESALE_AND_RETAIL	TRUE	FALSE	109.000	105.000	12200	
PAST044	PASTA KEJU		MAKANAN & SNACK	ACTIVE	DUS	DUS	BOX	9	WHOLESALE_AND_RETAIL	TRUE	FALSE	109.000	105.000	12200`;

async function main() {
  const lines = rawData.trim().split('\n');
  let successCount = 0;
  
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 13) continue;
    
    const [
      sku,
      product_name,
      brand,
      categoryName,
      status,
      purchase_unit,
      sales_unit,
      stock_base_unit,
      conversion_qty,
      sales_mode,
      allow_unit_sale,
      allow_fractional_qty,
      selling_price_per_dus,
      purchase_price_per_dus,
      retail_price_reference,
      legacy_code
    ] = parts;
    
    // Parse prices (remove dots, e.g. 160.000 -> 160000)
    const sellPriceStr = selling_price_per_dus.replace(/\./g, '');
    const purchPriceStr = purchase_price_per_dus ? purchase_price_per_dus.replace(/\./g, '') : null;
    
    const price = parseFloat(sellPriceStr);
    const purchasePrice = purchPriceStr ? parseFloat(purchPriceStr) : null;
    
    // Create or find category
    let category = await prisma.category.findFirst({
      where: { name: { equals: categoryName, mode: 'insensitive' } }
    });
    
    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName }
      });
    }
    
    // Create or find unit
    let unit = await prisma.unit.findFirst({
      where: { name: { equals: sales_unit, mode: 'insensitive' } }
    });
    
    if (!unit) {
      unit = await prisma.unit.create({
        data: { name: sales_unit }
      });
    }
    
    const contentsStr = `${conversion_qty} ${stock_base_unit}`;
    
    const isUnitSale = allow_unit_sale?.toUpperCase() === 'TRUE';
    const isFractional = allow_fractional_qty?.toUpperCase() === 'TRUE';
    const conversion = parseInt(conversion_qty, 10);

    const dataPayload = {
      name: product_name,
      price: price,
      purchasePrice: purchasePrice,
      categoryId: category.id,
      unitId: unit.id,
      contents: contentsStr,
      retailPriceNote: retail_price_reference || null,
      description: brand ? `Brand: ${brand}` : null,
      
      // New Fields
      brand: brand || null,
      status: status || 'ACTIVE',
      purchaseUnit: purchase_unit || null,
      stockBaseUnit: stock_base_unit || null,
      conversionQty: isNaN(conversion) ? null : conversion,
      salesMode: sales_mode || null,
      allowUnitSale: isUnitSale,
      allowFractional: isFractional,
      legacyCode: legacy_code || null,
    };
    
    await prisma.product.upsert({
      where: { code: sku },
      update: dataPayload,
      create: {
        code: sku,
        ...dataPayload
      }
    });
    
    successCount++;
  }
  
  console.log(`Successfully seeded/updated ${successCount} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
