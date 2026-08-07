'use client';

import React, { useState } from 'react';
import { Printer, FileDown, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function PrintButton({ invoiceNumber }: { invoiceNumber?: string }) {
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      // The print page has a main container we can target
      const element = document.getElementById('print-container');
      if (!element) {
        throw new Error('Container not found');
      }

      // Hide the buttons for the screenshot
      const buttons = document.getElementById('print-buttons-container');
      if (buttons) buttons.style.display = 'none';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      if (buttons) buttons.style.display = 'flex';

      const imgData = canvas.toDataURL('image/png');
      // F4 size is roughly 210 x 330 mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [210, 330]
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Surat_Jalan_${invoiceNumber || 'Document'}.pdf`);
      setShowModal(false);
    } catch (error) {
      console.error('Failed to generate PDF', error);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div id="print-buttons-container" className="absolute top-0 right-0 m-8 print:hidden flex items-center gap-4 z-10">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-3 bg-white text-slate-700 rounded-xl font-bold border border-slate-300 shadow-sm hover:bg-slate-50 transition-colors hover:scale-105 active:scale-95"
        >
          Kembali
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-colors hover:scale-105 active:scale-95"
        >
          <Printer className="w-5 h-5" /> Cetak Dokumen
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Opsi Cetak Surat Jalan</h3>
              <button 
                onClick={() => !isGenerating && setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors disabled:opacity-50"
                disabled={isGenerating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setTimeout(() => window.print(), 100);
                }}
                disabled={isGenerating}
                className="w-full flex items-center p-4 gap-4 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-800 hover:bg-slate-50 transition-all group disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-slate-200 group-hover:text-slate-900 text-slate-500 transition-colors shrink-0">
                  <Printer className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-900 text-sm">Cetak ke Printer</div>
                  <div className="text-[11px] text-slate-500 font-medium">Print langsung menggunakan mesin cetak.</div>
                </div>
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="w-full flex items-center p-4 gap-4 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-all group disabled:opacity-50 text-left"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-700 text-blue-500 transition-colors shrink-0">
                  {isGenerating ? <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <FileDown className="w-6 h-6" />}
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-900 text-sm">{isGenerating ? 'Menyiapkan PDF...' : 'Unduh File PDF'}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Simpan dokumen ini ke dalam perangkat Anda.</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
