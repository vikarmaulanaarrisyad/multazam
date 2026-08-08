const xlsx = require('xlsx');

const workbook = xlsx.readFile('E:\\NEXTJS\\multazam-app\\Template_Import_Produk (5).xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const jsonData = xlsx.utils.sheet_to_json(worksheet);

const errorDetails = [];
let skipped = 0;

for (let i = 0; i < jsonData.length; i++) {
  const row = jsonData[i];
  const rowNum = i + 2; 
  const rawName = row['PRODUK'] || row['Nama Produk'] || row['nama_produk'] || row['name'];
  
  if (!rawName || typeof rawName !== 'string') {
    errorDetails.push(`Baris ${rowNum}: Nama produk kosong atau tipe salah (tipe: ${typeof rawName}, nilai: ${rawName})`);
    skipped++;
    continue;
  }

  const name = rawName.trim();
  if (name.length === 0 || name.length > 100) {
    errorDetails.push(`Baris ${rowNum}: Nama produk tidak valid (kosong atau terlalu panjang)`);
    skipped++;
    continue;
  }

  const categoryName = row['KATEGORI'] || row['Kategori'] || row['kategori'] || row['Category'];
  if (!categoryName || typeof categoryName !== 'string') {
    errorDetails.push(`Baris ${rowNum}: Kategori kosong untuk produk "${name}" (tipe: ${typeof categoryName}, nilai: ${categoryName})`);
    skipped++;
    continue; 
  }
}

console.log("Total errors:", errorDetails.length);
if (errorDetails.length > 0) {
  console.log("First 10 errors:");
  console.log(errorDetails.slice(0, 10).join("\n"));
}
