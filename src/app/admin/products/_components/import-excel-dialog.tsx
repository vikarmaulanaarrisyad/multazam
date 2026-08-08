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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    try {

      const data = [{
        'PRODUK': 'Contoh Produk A',
        'KATEGORI': 'Minuman',
        'ISI': '48btl',
        'BTL,RTG,PCS,BAG': '27.500 per 4 pcs',
        'HARGA KARTON': 150000,
        'HARGA BELI': 130000,
        'STOK': 100,
        'DESKRIPSI': 'Opsional'
      }];
      
      const worksheet = xlsx.utils.json_to_sheet(data);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 30 }, // PRODUK
        { wch: 15 }, // KATEGORI
        { wch: 10 }, // ISI
        { wch: 20 }, // BTL,RTG,PCS,BAG
        { wch: 15 }, // HARGA KARTON
        { wch: 15 }, // HARGA BELI
        { wch: 10 }, // STOK
        { wch: 30 }, // DESKRIPSI
      ];

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Produk');
      
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
      
      const response = await importProductsAction(formData);

      if (response.success) {
        toast.success(response.message);
        setFile(null);
        onOpenChange(false);
        if (onSuccess) onSuccess();
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
