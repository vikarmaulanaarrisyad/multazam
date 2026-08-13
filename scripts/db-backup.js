const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('ERROR: DATABASE_URL not found in environment variables.');
  process.exit(1);
}

const backupDir = path.join(__dirname, '..', 'backups');

// Pastikan folder backups/ tersedia
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Buat format penamaan: backup_YYYY-MM-DD_HH-mm-ss.sql
const now = new Date();
const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
const fileName = `backup_${timestamp}.sql`;
const filePath = path.join(backupDir, fileName);

console.log(`Menjalankan backup ke file: ${fileName}...`);

// Catatan: Ini membutuhkan instalasi pg_dump di server/komputer
// Untuk PostgreSQL, kita oper DATABASE_URL secara aman
const command = `pg_dump "${dbUrl}" -F p -f "${filePath}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`ERROR gagal melakukan backup: ${error.message}`);
    return;
  }
  if (stderr && stderr.toLowerCase().includes('error')) {
    console.error(`STDERR: ${stderr}`);
    return;
  }
  
  console.log(`✅ Backup berhasil disimpan di: ${filePath}`);

  // Opsional: Hapus file backup yang umurnya lebih dari 30 hari untuk hemat disk
  const files = fs.readdirSync(backupDir);
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  
  files.forEach(file => {
    if (file.endsWith('.sql')) {
      const fullPath = path.join(backupDir, file);
      const stat = fs.statSync(fullPath);
      if (now.getTime() - stat.mtime.getTime() > THIRTY_DAYS_MS) {
        fs.unlinkSync(fullPath);
        console.log(`🗑️ Menghapus backup lama: ${file}`);
      }
    }
  });
});
