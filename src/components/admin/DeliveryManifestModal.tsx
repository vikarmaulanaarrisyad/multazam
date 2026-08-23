'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Truck, FileText, CheckCircle2, AlertCircle, Camera, Printer, Download, Save, UserCheck, MapPin, Phone } from 'lucide-react';
import { getDeliveryRecapAction, getDriverDeliveryListAction, updateDeliveryStatusAction, DriverDeliveryItem, DeliveryRecapItem } from '@/actions/delivery-actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface DeliveryManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeliveryManifestModal({ isOpen, onClose }: DeliveryManifestModalProps) {
  const [activeTab, setActiveTab] = useState<'loading_sheet' | 'proof_of_delivery'>('loading_sheet');
  const [dateStr, setDateStr] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Loading sheet data
  const [loadingSheetData, setLoadingSheetData] = useState<DeliveryRecapItem[]>([]);
  
  // Delivery List data
  const [deliveries, setDeliveries] = useState<DriverDeliveryItem[]>([]);

  // Editing state for PoD
  const [editingPoD, setEditingPoD] = useState<Record<string, { driverName: string; deliveryStatus: string; proofUrl: string; notes: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Set default date to today or tomorrow
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      setDateStr(`${y}-${m}-${d}`);
    }
  }, [isOpen]);

  const loadData = useCallback(async () => {
    if (!dateStr) return;
    setLoading(true);
    try {
      if (activeTab === 'loading_sheet') {
        const res = await getDeliveryRecapAction(dateStr);
        if (res.success && res.data) {
          setLoadingSheetData(res.data.global);
        } else {
          toast.error(res.error || 'Gagal memuat loading sheet');
        }
      } else {
        const res = await getDriverDeliveryListAction(dateStr);
        if (res.success && res.data) {
          setDeliveries(res.data);
          const initialEditing: Record<string, any> = {};
          res.data.forEach(item => {
            initialEditing[item.id] = {
              driverName: item.driverName || '',
              deliveryStatus: item.deliveryStatus || 'PENDING',
              proofUrl: item.proofOfDeliveryUrl || '',
              notes: item.driverNotes || ''
            };
          });
          setEditingPoD(initialEditing);
        } else {
          toast.error(res.error || 'Gagal memuat daftar pengiriman driver');
        }
      }
    } catch (e: any) {
      toast.error('Terjadi kesalahan saat mengambil data pengiriman.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateStr]);

  useEffect(() => {
    if (isOpen && dateStr) {
      loadData();
    }
  }, [isOpen, dateStr, activeTab, loadData]);

  if (!isOpen) return null;

  const handleSavePoD = async (transactionId: string) => {
    const itemData = editingPoD[transactionId];
    if (!itemData) return;

    setSavingId(transactionId);
    try {
      const res = await updateDeliveryStatusAction({
        transactionId,
        deliveryStatus: itemData.deliveryStatus,
        proofOfDeliveryUrl: itemData.proofUrl || undefined,
        driverNotes: itemData.notes || undefined,
        driverName: itemData.driverName || undefined
      });

      if (res.success) {
        toast.success('Status pengiriman & Bukti PoD berhasil diperbarui!');
        loadData();
      } else {
        toast.error(res.error || 'Gagal menyimpan status pengiriman.');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan saat menyimpan PoD.');
    } finally {
      setSavingId(null);
    }
  };

  const handlePrintSuratJalan = async (deliveryItem?: DriverDeliveryItem) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const { getPublicSettings } = await import('@/actions/settings-actions');
      const publicSettings = await getPublicSettings();

      const itemsToPrint = deliveryItem ? [deliveryItem] : deliveries;
      if (itemsToPrint.length === 0) {
        toast.error('Tidak ada transaksi pengiriman untuk dicetak.');
        return;
      }

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      itemsToPrint.forEach((tx, pageIdx) => {
        if (pageIdx > 0) doc.addPage();

        // Header Perusahaan
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(publicSettings.companyName || 'DIA MAKMUR ABADI', 14, 15);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(publicSettings.companyAddress || 'Jl. Contoh Alamat No. 123', 14, 21);

        // Judul Surat Jalan
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(29, 78, 216); // blue-700
        doc.text('SURAT JALAN & PENGIRIMAN', 196, 15, { align: 'right' });
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`No. Faktur: ${tx.invoiceNumber}`, 196, 21, { align: 'right' });
        doc.text(`Tanggal: ${new Date(dateStr).toLocaleDateString('id-ID')}`, 196, 26, { align: 'right' });

        doc.setLineWidth(0.5);
        doc.line(14, 30, 196, 30);

        // Info Penerima & Driver
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text('Penerima / Toko:', 14, 37);
        doc.setFont('helvetica', 'normal');
        doc.text(`${tx.customerName} (${tx.customerPhone || 'No Telp -'})`, 14, 43);
        doc.text(`Alamat: ${tx.shippingAddress || 'Alamat tidak diisi'}`, 14, 49, { maxWidth: 100 });

        doc.setFont('helvetica', 'bold');
        doc.text('Informasi Pengirim:', 120, 37);
        doc.setFont('helvetica', 'normal');
        doc.text(`Sales: ${tx.salesName}`, 120, 43);
        doc.text(`Driver / Sopir: ${tx.driverName || 'Belum Ditunjuk'}`, 120, 49);
        doc.text(`Status Kirim: ${tx.deliveryStatus}`, 120, 55);

        // Tabel Rincian Barang
        const tableBody = tx.items.map((item, idx) => [
          idx + 1,
          item.code,
          item.name,
          `${item.quantity} ${item.unit}`,
          ''
        ]);

        autoTable(doc, {
          startY: 62,
          head: [['NO', 'SKU', 'NAMA BARANG / PRODUK', 'QTY DIKIRIM', 'CEK TERIMA']],
          body: tableBody,
          theme: 'grid',
          headStyles: { fillColor: [30, 41, 59], textColor: 255, halign: 'center', fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { cellWidth: 30 },
            2: { cellWidth: 'auto' },
            3: { halign: 'right', fontStyle: 'bold', textColor: [29, 78, 216], cellWidth: 35 },
            4: { halign: 'center', cellWidth: 25 }
          }
        });

        let finalY = (doc as any).lastAutoTable.finalY + 15;
        if (finalY > 240) {
          doc.addPage();
          finalY = 30;
        }

        // Tanda Tangan Serah Terima
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);

        doc.text('Penerima (Toko)', 40, finalY, { align: 'center' });
        doc.text('Driver / Pengirim', 105, finalY, { align: 'center' });
        doc.text('Checker / Gudang', 170, finalY, { align: 'center' });

        finalY += 22;

        doc.setLineWidth(0.5);
        doc.line(15, finalY - 2, 65, finalY - 2);
        doc.text('(Stempel & Tanda Tangan)', 40, finalY, { align: 'center' });

        doc.line(80, finalY - 2, 130, finalY - 2);
        doc.text(`(${tx.driverName || 'Sopir'})`, 105, finalY, { align: 'center' });

        doc.line(145, finalY - 2, 195, finalY - 2);
        doc.text('(Nama & Tanda Tangan)', 170, finalY, { align: 'center' });
      });

      const fileName = deliveryItem 
        ? `Surat_Jalan_${deliveryItem.invoiceNumber}.pdf` 
        : `Surat_Jalan_Gabungan_${dateStr}.pdf`;
      doc.save(fileName);
      toast.success('Surat Jalan berhasil didownload!');
    } catch (e: any) {
      console.error('Failed to generate Surat Jalan PDF', e);
      toast.error('Gagal mencetak Surat Jalan PDF.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Modul Pengiriman & Surat Jalan Driver</h2>
              <p className="text-xs text-slate-500">Kelola Rekap Muat Armada (Loading Sheet) & Proof of Delivery (PoD)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selector & Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-blue-600" /> Tanggal Kirim:
            </label>
            <input 
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('loading_sheet')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial",
                activeTab === 'loading_sheet' ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <FileText className="w-4 h-4" />
              Loading Sheet (Rekap Muat)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('proof_of_delivery')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial",
                activeTab === 'proof_of_delivery' ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <UserCheck className="w-4 h-4" />
              Surat Jalan & PoD Driver ({deliveries.length})
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <span className="text-sm font-medium">Memuat data pengiriman...</span>
            </div>
          ) : activeTab === 'loading_sheet' ? (
            /* TAB 1: LOADING SHEET (REKAP MUAT ARMADA TRUK) */
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div>
                  <h3 className="text-sm font-bold text-blue-900">Rekap Muat Barang ke Armada Truk (Loading Sheet)</h3>
                  <p className="text-xs text-blue-700">Akumulasi total barang yang wajib dimuat ke truk supir untuk tanggal {dateStr}.</p>
                </div>
              </div>

              {loadingSheetData.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
                  Tidak ada jadwal pengiriman barang pada tanggal ini.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                        <th className="p-3 text-center">No</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Nama Produk</th>
                        <th className="p-3 text-center">Isi Kemasan</th>
                        <th className="p-3 text-right">Total Qty Dimuat</th>
                        <th className="p-3 text-right">Stok Gudang saat ini</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingSheetData.map((item, idx) => {
                        const isInsufficient = item.currentStock < item.totalBaseQuantity;
                        return (
                          <tr key={item.productId + item.unit} className="hover:bg-slate-50">
                            <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-mono text-slate-600">{item.code}</td>
                            <td className="p-3 font-bold text-slate-900">{item.name}</td>
                            <td className="p-3 text-center text-slate-500">{item.contents || '-'}</td>
                            <td className="p-3 text-right font-black text-blue-700 bg-blue-50/50">
                              {item.totalQuantity} {item.unit}
                            </td>
                            <td className={cn("p-3 text-right font-bold", isInsufficient ? "text-red-600 bg-red-50" : "text-emerald-700")}>
                              {item.formattedStock}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: SURAT JALAN & PROOF OF DELIVERY (PoD) */
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Daftar Pengiriman Per Toko ({deliveries.length})</h3>
                  <p className="text-xs text-slate-500">Kelola nama supir, status pengiriman, foto bukti penerimaan (PoD), dan cetak Surat Jalan.</p>
                </div>
                {deliveries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handlePrintSuratJalan()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-xs"
                  >
                    <Printer className="w-4 h-4" />
                    Cetak Semua Surat Jalan (PDF)
                  </button>
                )}
              </div>

              {deliveries.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
                  Tidak ada toko pengiriman pada tanggal ini.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {deliveries.map((item) => {
                    const pod = editingPoD[item.id] || {
                      driverName: item.driverName || '',
                      deliveryStatus: item.deliveryStatus || 'PENDING',
                      proofUrl: item.proofOfDeliveryUrl || '',
                      notes: item.driverNotes || ''
                    };

                    return (
                      <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-4 shadow-xs">
                        
                        {/* Store Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-slate-900">{item.customerName}</span>
                              <span className="text-xs font-mono text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {item.invoiceNumber}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                              {item.shippingAddress && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  {item.shippingAddress}
                                </span>
                              )}
                              {item.customerPhone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  {item.customerPhone}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handlePrintSuratJalan(item)}
                              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              Cetak Surat Jalan
                            </button>
                          </div>
                        </div>

                        {/* Items breakdown */}
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Item Barang Diangkut:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.items.map(i => (
                              <div key={i.id} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-slate-200">
                                <span className="font-semibold text-slate-800">{i.name}</span>
                                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{i.quantity} {i.unit}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Driver & Proof of Delivery Form */}
                        <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-200/60 flex flex-col gap-3">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-amber-600" />
                            Konfirmasi Status Pengiriman Driver & Bukti Penerimaan (PoD)
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] font-bold text-slate-600">Status Delivery</label>
                              <select
                                value={pod.deliveryStatus}
                                onChange={(e) => setEditingPoD({
                                  ...editingPoD,
                                  [item.id]: { ...pod, deliveryStatus: e.target.value }
                                })}
                                className="w-full h-9 px-2 text-xs font-bold border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="PENDING">PENDING (Menunggu)</option>
                                <option value="IN_TRANSIT">IN_TRANSIT (Di Perjalanan)</option>
                                <option value="DELIVERED">DELIVERED (Terkirim)</option>
                                <option value="FAILED">FAILED (Gagal Kirim)</option>
                              </select>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] font-bold text-slate-600">Nama Driver / Sopir</label>
                              <input 
                                type="text"
                                placeholder="Masukkan nama driver..."
                                value={pod.driverName}
                                onChange={(e) => setEditingPoD({
                                  ...editingPoD,
                                  [item.id]: { ...pod, driverName: e.target.value }
                                })}
                                className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] font-bold text-slate-600">URL / Link Foto Bukti Penerimaan (PoD)</label>
                              <div className="relative flex items-center">
                                <input 
                                  type="text"
                                  placeholder="Link foto bukti penerimaan..."
                                  value={pod.proofUrl}
                                  onChange={(e) => setEditingPoD({
                                    ...editingPoD,
                                    [item.id]: { ...pod, proofUrl: e.target.value }
                                  })}
                                  className="w-full h-9 pl-8 pr-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                                />
                                <Camera className="w-4 h-4 text-slate-400 absolute left-2.5" />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <input 
                              type="text"
                              placeholder="Catatan driver (opsional: misal 'Diterima Bpk Budi / Toko Tutup')"
                              value={pod.notes}
                              onChange={(e) => setEditingPoD({
                                ...editingPoD,
                                [item.id]: { ...pod, notes: e.target.value }
                              })}
                              className="flex-1 h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleSavePoD(item.id)}
                              disabled={savingId === item.id}
                              className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
                            >
                              <Save className="w-3.5 h-3.5" />
                              {savingId === item.id ? 'Menyimpan...' : 'Simpan PoD'}
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
