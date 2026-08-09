'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createReturn } from '@/actions/return-actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Loader2 } from 'lucide-react';

type ReturnType = 'EXCHANGE' | 'REFUND';
type ReturnCondition = 'GOOD' | 'BAD';

export default function NewReturnClient({ products }: { products: any[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [type, setType] = useState<ReturnType>('EXCHANGE');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1, condition: 'BAD' as ReturnCondition, price: 0 }]);

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, condition: 'BAD', price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item: any = newItems[index];
    item[field] = value;
    
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) item.price = Number(prod.price);
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) return toast.error('Nama pelanggan harus diisi');
    if (items.some(i => !i.productId || i.quantity < 1)) return toast.error('Pilih produk dan isi jumlah yang benar');
    
    setLoading(true);
    try {
      const res = await createReturn({
        customerName,
        userId: session?.user?.id as string,
        type,
        notes,
        items
      });
      if (res.success) {
        toast.success('Retur berhasil diajukan');
        router.push('/sales/returns');
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nama Pelanggan (Toko)</Label>
              <Input 
                value={customerName} 
                onChange={e => setCustomerName(e.target.value)} 
                placeholder="Misal: Toko Berkah"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipe Pengembalian</Label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value as ReturnType)}
                className="w-full flex h-10 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="EXCHANGE">Tukar Guling (Ganti Barang)</option>
                <option value="REFUND">Refund / Potong Tagihan</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Keterangan Tambahan (Opsional)</Label>
            <Textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              placeholder="Alasan retur, nomor invoice (jika ada), dll"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="font-semibold text-slate-800">Daftar Produk Retur</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> Tambah Item
            </Button>
          </div>

          <div className="space-y-4 pt-2">
            {items.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 p-4 rounded-lg">
                <div className="flex-1 space-y-2 w-full">
                  <Label>Produk</Label>
                  <select 
                    value={item.productId} 
                    onChange={e => updateItem(index, 'productId', e.target.value)}
                    className="w-full flex h-10 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>Pilih Produk</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="w-full sm:w-24 space-y-2">
                  <Label>Qty</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={item.quantity} 
                    onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    className="bg-white"
                  />
                </div>

                <div className="w-full sm:w-40 space-y-2">
                  <Label>Kondisi</Label>
                  <select 
                    value={item.condition} 
                    onChange={e => updateItem(index, 'condition', e.target.value)}
                    className="w-full flex h-10 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="BAD">Rusak / Basi</option>
                    <option value="GOOD">Bagus / Utuh</option>
                  </select>
                </div>

                <Button 
                  type="button" 
                  variant="destructive" 
                  size="icon" 
                  className="mb-0.5 shrink-0"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Ajukan Retur
        </Button>
      </div>
    </form>
  );
}
