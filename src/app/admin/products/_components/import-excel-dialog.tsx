'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Download, UploadCloud, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { importProductsAction } from '@/actions/products';
import * as xlsx from 'xlsx';

interface ImportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImportExcelDialog({ open, onOpenChange, onSuccess }: ImportExcelDialogProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    try {
      // 1. Data Sheet
      const data = [{
        'SKU': 'PRD-001',
        'NAMA PRODUK': 'Minyak Goreng Bimoli 2L',
        'BRAND': 'Bimoli',
        'KATEGORI': 'Sembako',
        'STATUS': 'ACTIVE',
        'SATUAN BELI': 'DUS',
        'SATUAN JUAL': 'DUS',
        'SATUAN DASAR': 'POUCH',
        'QTY KONVERSI': 6,
        'SALES MODE': 'WHOLESALE_AND_RETAIL',
        'JUAL SATUAN?': 'TRUE',
        'JUAL PECAHAN?': 'FALSE',
        'HARGA JUAL': 200000,
        'HARGA BELI': 185000,
        'REF ECER': '35,000 per pouch',
        'LEGACY CODE': 'OLD-001',
        'STOK AWAL': 100,
        'DESKRIPSI': 'Minyak goreng kemasan 2 Liter'
      }];
      
      const worksheet = xlsx.utils.json_to_sheet(data);
      
      // Set column widths for Data Sheet
      worksheet['!cols'] = [
        { wch: 15 }, // SKU
        { wch: 35 }, // NAMA PRODUK
        { wch: 20 }, // BRAND
        { wch: 20 }, // KATEGORI
        { wch: 15 }, // STATUS
        { wch: 15 }, // SATUAN BELI
        { wch: 15 }, // SATUAN JUAL
        { wch: 15 }, // SATUAN DASAR
        { wch: 15 }, // QTY KONVERSI
        { wch: 25 }, // SALES MODE
        { wch: 15 }, // JUAL SATUAN?
        { wch: 15 }, // JUAL PECAHAN?
        { wch: 15 }, // HARGA JUAL
        { wch: 15 }, // HARGA BELI
        { wch: 25 }, // REF ECER
        { wch: 15 }, // LEGACY CODE
        { wch: 15 }, // STOK AWAL
        { wch: 30 }, // DESKRIPSI
      ];

      // 2. Explanation Sheet
      const explanations = [
        { 'NAMA KOLOM': 'SKU', 'STATUS': 'Opsional', 'PENJELASAN': 'Kode unik produk. Kosongkan jika ingin di-generate otomatis oleh sistem.' },
        { 'NAMA KOLOM': 'NAMA PRODUK', 'STATUS': 'Wajib', 'PENJELASAN': 'Nama lengkap produk yang akan ditampilkan.' },
        { 'NAMA KOLOM': 'BRAND', 'STATUS': 'Opsional', 'PENJELASAN': 'Merek produk tersebut.' },
        { 'NAMA KOLOM': 'KATEGORI', 'STATUS': 'Wajib', 'PENJELASAN': 'Nama Kategori. (Pastikan namanya sama persis dengan yang sudah dibuat di menu Kategori aplikasi).' },
        { 'NAMA KOLOM': 'STATUS', 'STATUS': 'Wajib', 'PENJELASAN': 'Isi dengan ACTIVE (Aktif) atau INACTIVE (Tidak Aktif).' },
        { 'NAMA KOLOM': 'SATUAN BELI', 'STATUS': 'Opsional', 'PENJELASAN': 'Satuan kemasan saat membeli barang ke supplier (Contoh: DUS / KARTON).' },
        { 'NAMA KOLOM': 'SATUAN JUAL', 'STATUS': 'Opsional', 'PENJELASAN': 'Satuan utama saat menjual barang di toko (Contoh: DUS / PCS).' },
        { 'NAMA KOLOM': 'SATUAN DASAR', 'STATUS': 'Opsional', 'PENJELASAN': 'Satuan terkecil (eceran) yang disimpan di gudang (Contoh: PCS / POUCH).' },
        { 'NAMA KOLOM': 'QTY KONVERSI', 'STATUS': 'Opsional', 'PENJELASAN': 'Jumlah satuan dasar di dalam satuan beli. (Contoh: Jika 1 Dus isi 24 Pcs, isikan 24).' },
        { 'NAMA KOLOM': 'SALES MODE', 'STATUS': 'Opsional', 'PENJELASAN': 'Pilih salah satu: WHOLESALE_AND_RETAIL (Grosir & Ecer), RETAIL_ONLY (Ecer Saja), atau WHOLESALE_ONLY (Grosir Saja).' },
        { 'NAMA KOLOM': 'JUAL SATUAN?', 'STATUS': 'Wajib', 'PENJELASAN': 'Isi TRUE jika barang boleh dijual secara eceran. Isi FALSE jika tidak boleh.' },
        { 'NAMA KOLOM': 'JUAL PECAHAN?', 'STATUS': 'Wajib', 'PENJELASAN': 'Isi TRUE jika barang boleh dijual desimal (contoh: 1.5 Kg). Isi FALSE jika harus bilangan bulat.' },
        { 'NAMA KOLOM': 'HARGA JUAL', 'STATUS': 'Wajib', 'PENJELASAN': 'Harga jual per Satuan Jual. Harus berupa angka saja (jangan pakai Rp atau titik koma).' },
        { 'NAMA KOLOM': 'HARGA BELI', 'STATUS': 'Opsional', 'PENJELASAN': 'Harga beli/modal per Satuan Beli. Harus berupa angka saja.' },
        { 'NAMA KOLOM': 'REF ECER', 'STATUS': 'Opsional', 'PENJELASAN': 'Catatan teks bebas untuk patokan harga eceran (Contoh: "15.000 per pcs").' },
        { 'NAMA KOLOM': 'LEGACY CODE', 'STATUS': 'Opsional', 'PENJELASAN': 'Kode atau ID dari sistem lama, jika Anda sedang memindahkan data.' },
        { 'NAMA KOLOM': 'STOK AWAL', 'STATUS': 'Wajib', 'PENJELASAN': 'Jumlah stok fisik saat ini. Dihitung berdasarkan Satuan Dasar. (Jika Anda import ulang, nilai stok ini TIDAK akan menimpa stok yang sedang berjalan).' },
        { 'NAMA KOLOM': 'DESKRIPSI', 'STATUS': 'Opsional', 'PENJELASAN': 'Penjelasan tambahan atau detail mengenai produk.' }
      ];

      const explanationSheet = xlsx.utils.json_to_sheet(explanations);
      
      // Set column widths for Explanation Sheet
      explanationSheet['!cols'] = [
        { wch: 20 }, // NAMA KOLOM
        { wch: 15 }, // STATUS
        { wch: 100 }, // PENJELASAN
      ];

      // 3. Assemble Workbook
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Data Produk');
      xlsx.utils.book_append_sheet(workbook, explanationSheet, 'Penjelasan Kolom');
      
      xlsx.writeFile(workbook, 'Template_Import_Produk.xlsx');
      toast.success('Template berhasil diunduh.');
    } catch (error) {
      console.error('Download template error:', error);
      toast.error('Gagal mengunduh template.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error('Harap unggah file Excel (.xlsx atau .xls)');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      setFile(selectedFile);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      toast.error('Pilih file Excel terlebih dahulu.');
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await importProductsAction(formData) as any;

      if (response.errors && Array.isArray(response.errors)) {
        setImportErrors(response.errors);
      } else {
        setImportErrors([]);
      }

      if (response.success) {
        toast.success(response.message);
        if (onSuccess) onSuccess(); // Refresh data immediately
        
        // If there are no errors, we can close the dialog automatically
        if (!response.errors || response.errors.length === 0) {
          setFile(null);
          onOpenChange(false);
        } else {
          // Keep dialog open so user can read errors, but allow them to change file
          setFile(null);
        }
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat memproses file.');
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFile(null);
      setImportErrors([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Produk</DialogTitle>
          <DialogDescription>
            Tambahkan banyak produk sekaligus menggunakan file Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Template Excel</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Gunakan template ini untuk mengisi data produk Anda agar sesuai dengan format sistem.
                </p>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="shrink-0 ml-4"
                onClick={handleDownloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div 
                className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-300 px-6 py-8"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center cursor-pointer">
                  {file ? (
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-green-500" />
                  ) : (
                    <UploadCloud className="mx-auto h-12 w-12 text-slate-300" />
                  )}
                  
                  <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                    >
                      <span>{file ? 'Ganti File' : 'Pilih File Excel'}</span>
                      <input 
                        id="file-upload" 
                        name="file-upload" 
                        type="file" 
                        accept=".xlsx, .xls"
                        className="sr-only" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={loading}
                      />
                    </label>
                  </div>
                  <p className="text-xs leading-5 text-slate-500 mt-2">
                    {file ? file.name : 'Mendukung format .xlsx, .xls'}
                  </p>
                </div>
              </div>
            </div>

            {importErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-bottom-2">
                <h4 className="text-xs font-bold text-red-800 mb-2">Detail Error (Baris yang dilewati):</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {importErrors.map((err, i) => (
                    <li key={i} className="text-xs text-red-700">{err}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Batal
              </Button>
              <Button type="submit" disabled={!file || loading} className="w-32">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses
                  </>
                ) : (
                  'Mulai Import'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
