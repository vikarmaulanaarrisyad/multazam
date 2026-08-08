const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');

const prisma = new PrismaClient();

async function run() {
  try {
    const workbook = xlsx.readFile('E:\\NEXTJS\\multazam-app\\Template_Import_Produk (5).xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    
    // minimal subset of product.service logic to find what fails
    
    // get categories
    const categories = await prisma.category.findMany();
    const categoryMap = new Map();
    categories.forEach(c => categoryMap.set(c.name.toLowerCase(), c.id));
    
    // existing products
    const existingProducts = await prisma.product.findMany();
    const productCodeMap = new Map();
    existingProducts.forEach(p => productCodeMap.set(p.name.toLowerCase(), p.code));
    
    const validProducts = [];
    
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNum = i + 2; 
        
        const rawName = row['PRODUK'] || row['Nama Produk'] || row['nama_produk'] || row['name'];
        if (!rawName || typeof rawName !== 'string') continue;
        const name = rawName.trim();
        if (name.length === 0 || name.length > 100) continue;
        
        const categoryName = row['KATEGORI'] || row['Kategori'] || row['kategori'] || row['Category'];
        if (!categoryName || typeof categoryName !== 'string') continue;
        
        let categoryId = categoryMap.get(categoryName.trim().toLowerCase());
        if (!categoryId) {
            const newCategory = await prisma.category.create({ data: { name: categoryName.trim() } });
            categoryId = newCategory.id;
            categoryMap.set(categoryName.trim().toLowerCase(), categoryId);
        }
        
        let code = row['Kode Produk'] || row['kode_produk'] || row['code'];
        if (code && typeof code === 'string') {
          code = code.trim();
        } else {
          const existingCode = productCodeMap.get(name.toLowerCase());
          if (existingCode) {
            code = existingCode;
          } else {
            const prefix = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
            const randomStr = Math.floor(10000 + Math.random() * 90000).toString();
            code = `${prefix}-${randomStr}`;
          }
        }
        
        const rawPrice = row['HARGA KARTON'] || row['Harga'] || row['harga'] || row['price'];
        let price = parseFloat(rawPrice);
        if (isNaN(price) || price < 0) price = 0;
        
        const rawPurchasePrice = row['HARGA BELI'] || row['Harga Beli'] || null;
        let purchasePrice = null;
        if (rawPurchasePrice !== null) {
          const parsed = parseFloat(rawPurchasePrice);
          if (!isNaN(parsed) && parsed >= 0) purchasePrice = parsed;
        }
        
        const contents = (row['ISI'] || row['isi'] || '')?.toString() || null;
        let retailPriceNote = (row['BTL,RTG,PCS,BAG'] || row['Eceran'] || '')?.toString() || null;
        if (!retailPriceNote && price > 0) retailPriceNote = price.toString();
        
        const rawStock = row['STOK'] || row['Stok'] || row['stok'] || row['stock'];
        let stock = parseInt(rawStock);
        if (isNaN(stock) || stock < 0) stock = 0;
        
        const description = row['DESKRIPSI'] || row['Deskripsi'] || row['deskripsi'] || row['description'] || null;
        
        validProducts.push({
            code,
            name,
            description,
            price,
            purchasePrice,
            contents,
            retailPriceNote,
            stock,
            categoryId,
            unitId: null
        });
    }
    
    console.log("Valid products:", validProducts.length);
    if (validProducts.length === 0) return;
    
    // Now simulate upsertMany
    const transactions = validProducts.map(item => 
      prisma.product.upsert({
        where: { code: item.code },
        update: {
          name: item.name,
          description: item.description,
          price: item.price,
          purchasePrice: item.purchasePrice,
          contents: item.contents,
          retailPriceNote: item.retailPriceNote,
          stock: item.stock,
          categoryId: item.categoryId,
          unitId: item.unitId,
        },
        create: {
          code: item.code,
          name: item.name,
          description: item.description,
          price: item.price,
          purchasePrice: item.purchasePrice,
          contents: item.contents,
          retailPriceNote: item.retailPriceNote,
          stock: item.stock,
          categoryId: item.categoryId,
          unitId: item.unitId,
        }
      })
    );
    
    await prisma.$transaction(transactions);
    console.log("Import success");
    
  } catch (e) {
    console.error("IMPORT ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
