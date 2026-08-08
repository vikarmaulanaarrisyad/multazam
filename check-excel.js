const xlsx = require('xlsx');

const workbook = xlsx.readFile('E:\\NEXTJS\\multazam-app\\Template_Import_Produk (5).xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const jsonData = xlsx.utils.sheet_to_json(worksheet);

console.log("Total rows:", jsonData.length);
if (jsonData.length > 0) {
    console.log("First row keys:", Object.keys(jsonData[0]));
    console.log("First row data:", jsonData[0]);
    if (jsonData.length > 1) {
        console.log("Second row data:", jsonData[1]);
    }
}
