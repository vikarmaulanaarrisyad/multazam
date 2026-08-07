'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supplierSchema, SupplierInput } from '@/validations/supplier.validation';
import { createSupplierAction, updateSupplierAction } from '@/actions/suppliers';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { SupplierType } from '@/repositories/supplier.repository';

interface SupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: SupplierType | null;
}

export function SupplierForm({ open, onOpenChange, supplier }: SupplierFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    values: supplier ? {
      code: supplier.code || '',
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    } : {
      code: '',
      name: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  const onSubmit = async (data: SupplierInput) => {
    setLoading(true);
    try {
      const isEditing = !!supplier?.id;
      const result = isEditing
        ? await updateSupplierAction(supplier!.id!, data)
        : await createSupplierAction(data);

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        if (!isEditing) reset();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan yang tidak terduga.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{supplier ? 'Edit Supplier' : 'Tambah Supplier'}</DialogTitle>
          <DialogDescription>
            {supplier ? 'Ubah informasi supplier di bawah ini.' : 'Masukkan informasi supplier baru.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Kode Supplier (Opsional)</Label>
            <Input
              id="code"
              placeholder="Kosongkan untuk generate otomatis"
              {...register('code')}
            />
            {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama Perusahaan / Pemasok <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              placeholder="PT Maju Bersama"
              {...register('name')}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                {...register('email')}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                placeholder="0812xxxx"
                {...register('phone')}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              placeholder="Alamat lengkap..."
              className="resize-none h-24"
              {...register('address')}
            />
            {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {supplier?.id ? 'Simpan Perubahan' : 'Tambah Supplier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
