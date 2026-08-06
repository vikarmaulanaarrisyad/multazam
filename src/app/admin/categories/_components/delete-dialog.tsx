'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { deleteCategory } from '@/actions/categories';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: { id: string; name: string } | null;
  onSuccess?: () => void;
}

export function DeleteDialog({ open, onOpenChange, category, onSuccess }: DeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  async function onConfirm() {
    if (!category) return;
    
    setLoading(true);
    try {
      const response = await deleteCategory(category.id);
      if (response.success) {
        toast.success(response.message);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus Kategori</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus kategori <strong>{category?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading} className="w-28">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses
              </>
            ) : (
              'Hapus'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
