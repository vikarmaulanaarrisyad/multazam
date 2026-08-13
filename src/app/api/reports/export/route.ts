import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch data
    const [transactions, stockMovements, visits] = await Promise.all([
      prisma.transaction.findMany({
        where: { createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETED' },
        include: { user: { select: { name: true } }, items: { include: { product: true } } },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.stockMovement.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        include: { product: true, user: { select: { name: true } } },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.visit.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        include: { store: true, user: { select: { name: true } } },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistem DIA MAKMUR ABADI';
    workbook.created = new Date();

    // ==========================================
    // SHEET 1: Keuangan & Laba/Rugi
    // ==========================================
    const financeSheet = workbook.addWorksheet('Keuangan & Laba Rugi');
    financeSheet.columns = [
      { header: 'No Invoice', key: 'invoice', width: 20 },
      { header: 'Tanggal', key: 'date', width: 20 },
      { header: 'Sales', key: 'sales', width: 20 },
      { header: 'Pelanggan', key: 'customer', width: 25 },
      { header: 'Item (Qty x Harga)', key: 'items', width: 40 },
      { header: 'Omset Kotor (Rp)', key: 'revenue', width: 20 },
      { header: 'HPP / Modal (Rp)', key: 'cogs', width: 20 },
      { header: 'Laba Bersih (Rp)', key: 'profit', width: 20 },
    ];
    
    // Style header
    financeSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    financeSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

    let totalRevenue = 0;
    let totalCogs = 0;
    let totalProfit = 0;

    transactions.forEach(tx => {
      const itemsStr = tx.items.map(i => `${i.product.name} (${i.quantity} x Rp ${Number(i.price).toLocaleString('id-ID')})`).join(', ');
      
      const cogs = tx.items.reduce((sum, item) => {
        const cost = Number(item.purchasePrice || item.product?.purchasePrice || 0);
        return sum + (cost * item.quantity);
      }, 0);
      
      const revenue = Number(tx.totalAmount);
      const profit = revenue - cogs;

      totalRevenue += revenue;
      totalCogs += cogs;
      totalProfit += profit;

      financeSheet.addRow({
        invoice: tx.invoiceNumber,
        date: format(tx.createdAt, 'dd MMM yyyy HH:mm', { locale: id }),
        sales: tx.user.name || '-',
        customer: tx.customerName || '-',
        items: itemsStr,
        revenue: revenue,
        cogs: cogs,
        profit: profit
      });
    });

    // Add summary row
    financeSheet.addRow({});
    const summaryRow = financeSheet.addRow({
      items: 'TOTAL KESELURUHAN:',
      revenue: totalRevenue,
      cogs: totalCogs,
      profit: totalProfit
    });
    summaryRow.font = { bold: true };

    // Format numbers
    ['F', 'G', 'H'].forEach(col => {
      financeSheet.getColumn(col).numFmt = '"Rp"#,##0.00';
    });


    // ==========================================
    // SHEET 2: Pergerakan Stok
    // ==========================================
    const stockSheet = workbook.addWorksheet('Pergerakan Stok');
    stockSheet.columns = [
      { header: 'Tanggal', key: 'date', width: 20 },
      { header: 'Kode Produk', key: 'code', width: 15 },
      { header: 'Nama Produk', key: 'name', width: 30 },
      { header: 'Tipe Mutasi', key: 'type', width: 15 },
      { header: 'Jumlah', key: 'qty', width: 10 },
      { header: 'Stok Awal', key: 'before', width: 15 },
      { header: 'Stok Akhir', key: 'after', width: 15 },
      { header: 'Keterangan', key: 'notes', width: 30 },
      { header: 'Petugas', key: 'user', width: 20 },
    ];

    stockSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    stockSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };

    stockMovements.forEach(sm => {
      let typeLabel: string = sm.type;
      if (sm.type === 'IN') typeLabel = 'MASUK';
      if (sm.type === 'OUT') typeLabel = 'KELUAR';
      if (sm.type === 'ADJUSTMENT') typeLabel = 'PENYESUAIAN';
      if (sm.type === 'RETURN') typeLabel = 'RETUR';

      stockSheet.addRow({
        date: format(sm.createdAt, 'dd MMM yyyy HH:mm', { locale: id }),
        code: sm.product.code,
        name: sm.product.name,
        type: typeLabel,
        qty: sm.quantity,
        before: sm.balanceBefore,
        after: sm.balanceAfter,
        notes: sm.notes || sm.reference || '-',
        user: sm.user?.name || '-'
      });
    });


    // ==========================================
    // SHEET 3: GPS & Kunjungan Sales
    // ==========================================
    const visitSheet = workbook.addWorksheet('Kunjungan Sales (GPS)');
    visitSheet.columns = [
      { header: 'Tanggal Kunjungan', key: 'date', width: 20 },
      { header: 'Nama Sales', key: 'sales', width: 20 },
      { header: 'Toko/Pelanggan', key: 'store', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Waktu Check-in', key: 'checkin', width: 20 },
      { header: 'Koordinat GPS (Lat, Lng)', key: 'gps', width: 30 },
      { header: 'Catatan', key: 'notes', width: 40 },
    ];

    visitSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    visitSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } };

    visits.forEach(v => {
      let statusLabel: string = v.status;
      if (v.status === 'COMPLETED') statusLabel = 'Selesai';
      if (v.status === 'SCHEDULED') statusLabel = 'Terjadwal';
      if (v.status === 'CANCELLED') statusLabel = 'Dibatalkan';

      visitSheet.addRow({
        date: format(v.scheduledAt, 'dd MMM yyyy', { locale: id }),
        sales: v.user?.name || '-',
        store: v.store.name,
        status: statusLabel,
        checkin: v.checkInTime ? format(v.checkInTime, 'HH:mm', { locale: id }) : '-',
        gps: (v.actualLat && v.actualLng) ? `${v.actualLat}, ${v.actualLng}` : '-',
        notes: v.notes || '-'
      });
    });

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Laporan_${month}_${year}.xlsx"`,
      },
    });

  } catch (error: any) {
    console.error('Export Excel Error:', error);
    return NextResponse.json({ error: 'Gagal membuat laporan' }, { status: 500 });
  }
}
