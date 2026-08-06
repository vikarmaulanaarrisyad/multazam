'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createUnit, updateUnit } from '@/actions/units';

interface UnitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: { id: string; name: string } | null;
  onSuccess?: () => void;
}

export function UnitForm({ open, onOpenChange, unit, onSuccess }: UnitFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!unit;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setLoading(true);
    
    try {
      const response = isEditing 
        ? await updateUnit(unit.id, formData)
        : await createUnit(formData);

      if (response.success) {
        toast.success(response.message);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan pada sistem.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Ubah Satuan' : 'Tambah Satuan'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Ubah nama satuan yang sudah ada.' : 'Tambahkan satuan baru untuk produk Anda.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Satuan</Label>
            <Input 
              id="name" 
              name="name" 
              defaultValue={unit?.name} 
              placeholder="Misal: Elektronik, Pakaian..." 
              required
              maxLength={50}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="w-28">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
