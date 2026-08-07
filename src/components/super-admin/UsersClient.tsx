'use client';

import React, { useState, useMemo } from 'react';
import { User, Plus, Edit2, Trash2, Mail, Key, Shield, Search, RefreshCw } from 'lucide-react';
import { createUser, updateUser, deleteUser, resetPassword } from '@/actions/user-actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DataTable } from '@/components/datatable/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SALES';

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  createdAt: Date;
}

interface UsersClientProps {
  users: UserItem[];
}

export function UsersClient({ users }: UsersClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<UserRole | 'ALL'>('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination
  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  
  // Edit mode state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SALES' as UserRole
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesTab = activeTab === 'ALL' || user.role === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setFormData({ name: '', email: '', password: '', role: 'SALES' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // blank intentionally for edit
      role: user.role
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingUserId) {
        const res = await updateUser(editingUserId, formData);
        if (res.success) {
          toast.success('Data pengguna berhasil diperbarui!');
          setIsModalOpen(false);
        } else {
          toast.error(res.error || 'Gagal memperbarui pengguna');
        }
      } else {
        const res = await createUser(formData);
        if (res.success) {
          toast.success('Pengguna berhasil ditambahkan!');
          setIsModalOpen(false);
        } else {
          toast.error(res.error || 'Gagal menambahkan pengguna');
        }
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan yang tidak terduga');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    
    const res = await deleteUser(id);
    if (res.success) {
      toast.success('Pengguna berhasil dihapus!');
    } else {
      toast.error(res.error || 'Gagal menghapus pengguna');
    }
  };

  const handleResetPassword = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin me-reset password untuk ${name}? Password baru akan digenerate otomatis.`)) {
      const loadingToast = toast.loading('Mereset password...');
      const result = await resetPassword(id);
      
      if (result.success) {
        // We use alert here so the admin is forced to see and copy it.
        // It's safer than a transient toast.
        toast.dismiss(loadingToast);
        alert(`Password untuk ${name} berhasil direset!\n\nPassword Baru: ${result.newPassword}\n\nSilakan copy dan beritahukan kepada pengguna.`);
      } else {
        toast.error(result.error || 'Gagal mereset password', { id: loadingToast });
      }
    }
  };

  const roleLabel = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Super Admin</span>;
      case 'ADMIN': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Admin (Karyawan)</span>;
      case 'SALES': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Sales</span>;
    }
  };

  const columns: ColumnDef<UserItem>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Nama Lengkap',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm">
            {row.original.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="font-bold text-slate-900">{row.original.name || 'Tanpa Nama'}</span>
        </div>
      )
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="text-slate-500 text-sm">{row.original.email || '-'}</span>
    },
    {
      accessorKey: 'role',
      header: 'Hak Akses',
      cell: ({ row }) => roleLabel(row.original.role)
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <button 
            onClick={() => handleResetPassword(row.original.id, row.original.name || 'User')}
            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Reset Password"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleOpenEdit(row.original)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {row.original.role !== 'SUPER_ADMIN' && (
            <button 
              onClick={() => handleDelete(row.original.id, row.original.name || 'User')}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Hapus"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ], []);

  const pageCount = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, pageIndex, pageSize]);

  return (
    <div className="flex flex-col w-full gap-4 pb-24 md:pb-6">
      
      {/* Header Info & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Pengguna</h2>
          <p className="text-sm text-slate-500">Kelola akses akun Karyawan (Admin) dan Sales.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition-colors w-full md:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            className="w-full h-11 pl-10 pr-4 bg-slate-50 text-slate-900 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-slate-200" 
            placeholder="Cari nama atau email..." 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto hide-scrollbar pb-1 sm:pb-0">
          {(['ALL', 'ADMIN', 'SALES', 'SUPER_ADMIN'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors",
                activeTab === tab 
                  ? "bg-slate-900 text-white" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              {tab === 'ALL' ? 'Semua' : tab === 'ADMIN' ? 'Admin' : tab === 'SALES' ? 'Sales' : 'Super Admin'}
            </button>
          ))}
        </div>
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={paginatedUsers}
        pageCount={pageCount}
        pagination={{ pageIndex, pageSize }}
        onPaginationChange={setPagination}
      />

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">
                {editingUserId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <User className="w-5 h-5 opacity-0" /> {/* dummy spacer or close icon */}
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Nama Lengkap
                </label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full h-11 px-3 rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 border"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Alamat Email
                </label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full h-11 px-3 rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 border"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Password
                </label>
                <input 
                  type="password" 
                  placeholder={editingUserId ? "Kosongkan jika tidak ingin diubah" : "Minimal 6 karakter"}
                  required={!editingUserId}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full h-11 px-3 rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 border"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Hak Akses (Role)
                </label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                  className="w-full h-11 px-3 rounded-lg bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 border appearance-none"
                >
                  <option value="SALES">Sales</option>
                  <option value="ADMIN">Admin (Karyawan Gudang/Operasional)</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 p-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 p-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
