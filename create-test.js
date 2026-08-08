const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// We need to run this as a ts-node script to use the actual service, or we can just reproduce the upsert transaction logic.
// Actually, let's just make a simple script using ts-node to call importProducts
const script = `
import { productService } from './src/services/product.service';
import fs from 'fs';

async function testImport() {
  const filePath = 'E:/NEXTJS/multazam-app/Template_Import_Produk (5).xlsx';
  const buffer = fs.readFileSync(filePath);
  const file = new File([buffer], 'Template_Import_Produk (5).xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const result = await productService.importProducts(formData);
    console.log("Result:", result);
  } catch (error) {
    console.error("Caught Error:", error);
  }
}

testImport().catch(console.error);
`;
fs.writeFileSync('test-import.ts', script);
