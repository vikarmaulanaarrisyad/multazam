import React from 'react';
import { getSettings } from '@/actions/settings-actions';
import { SettingsClient } from '@/app/super-admin/settings/_components/SettingsClient';

export default async function AdminSettingsPage() {
  const setting = await getSettings();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Aplikasi</h1>
        <p className="text-slate-500">Konfigurasi logo dan identitas perusahaan</p>
      </div>
      
      <SettingsClient initialSetting={setting} />
    </div>
  );
}
