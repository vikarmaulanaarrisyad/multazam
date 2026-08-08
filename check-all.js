const xlsx = require('xlsx');

const workbook = xlsx.readFile('E:\\NEXTJS\\multazam-app\\Template_Import_Produk (5).xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const jsonData = xlsx.utils.sheet_to_json(worksheet);

for (let i = 0; i < jsonData.length; i++) {
  const row = jsonData[i];
  const rawName = row['PRODUK'] || row['Nama Produk'] || row['nama_produk'] || row['name'];
  if (!rawName || typeof rawName !== 'string' || rawName.trim().length === 0) {
    console.log(`Row ${i+2} missing name`);
  }
  const categoryName = row['KATEGORI'] || row['Kategori'] || row['kategori'] || row['Category'];
  if (!categoryName || typeof categoryName !== 'string') {
    console.log(`Row ${i+2} missing category`);
  }
}
console.log("Check complete.");
