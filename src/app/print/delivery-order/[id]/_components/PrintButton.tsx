'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Printer, FileDown } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useSearchParams } from 'next/navigation';

export function PrintButton({ invoiceNumber }: { invoiceNumber?: string }) {
  const searchParams = useSearchParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const actionTriggered = useRef(false);

  const handleDownloadPDF = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const element = document.getElementById('print-container');
      if (!element) throw new Error('Container not found');

      const buttons = document.getElementById('print-buttons-container');
      if (buttons) buttons.style.display = 'none';

      const dataUrl = await toPng(element, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        filter: (node) => {
          if (node.nodeType === 1) {
            const htmlNode = node as HTMLElement;
            if (htmlNode.classList && htmlNode.classList.contains('print:hidden')) {
              return false;
            }
          }
          return true;
        }
      });
      
      if (buttons) buttons.style.display = 'flex';
      const orientation = searchParams.get('orientation') === 'landscape' ? 'landscape' : 'portrait';
      
      const dummyPdf = new jsPDF({ unit: 'mm' });
      const imgProps = dummyPdf.getImageProperties(dataUrl);
      
      let pdf;
      let printWidth;
      let printHeight;
      
      if (orientation === 'portrait') {
        // Mode Portrait: Kertas A4 standar (tegak)
        pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        printWidth = 210; // Lebar A4
        printHeight = (imgProps.height * printWidth) / imgProps.width;
      } else {
        // Mode Landscape: Dipotong presisi sesuai ukuran faktur
        printWidth = 215; // 21.5cm
        printHeight = (imgProps.height * printWidth) / imgProps.width;
        pdf = new jsPDF({
          orientation: printWidth > printHeight ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [printWidth, printHeight]
        });
      }
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, printWidth, printHeight);
      pdf.save(`Surat_Jalan_${invoiceNumber || 'Document'}.pdf`);
      
      // Navigate back after download if it was auto-triggered
      if (searchParams.get('action') === 'download') {
        if (searchParams.get('iframe') === 'true') {
          window.parent.postMessage('print-action-done', '*');
        } else {
          setTimeout(() => {
            window.history.back();
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Failed to generate PDF', error);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (actionTriggered.current) return;
    
    const action = searchParams.get('action');
    if (action === 'print') {
      actionTriggered.current = true;
      setTimeout(() => {
        window.focus();
        window.print();
        if (searchParams.get('iframe') === 'true') {
          window.parent.postMessage('print-dialog-opened', '*');
        }
        // Disabled auto-back to prevent dialog closing prematurely on mobile
      }, 500);
    } else if (action === 'download') {
      actionTriggered.current = true;
      setTimeout(() => {
        handleDownloadPDF();
      }, 800);
    }
  }, [searchParams]);

  return (
    <div id="print-buttons-container" className="absolute top-0 right-0 m-8 print:hidden flex items-center gap-4 z-10">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 px-4 py-3 bg-white text-slate-700 rounded-xl font-bold border border-slate-300 shadow-sm hover:bg-slate-50 transition-colors hover:scale-105 active:scale-95"
      >
        Kembali
      </button>
      <button
        onClick={handleDownloadPDF}
        disabled={isGenerating}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        {isGenerating ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <FileDown className="w-5 h-5" />
        )}
        Unduh PDF
      </button>
      <button
        onClick={() => window.print()}
        disabled={isGenerating}
        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-colors hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        <Printer className="w-5 h-5" /> Cetak ke Printer
      </button>
    </div>
  );
}
