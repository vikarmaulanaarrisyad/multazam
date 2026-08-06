import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sinkronisasi | Multazam',
  description: 'Halaman Sinkronisasi Data',
};

export default function SyncPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sinkronisasi</h1>
        <p className="text-slate-500 mt-2">
          Sinkronisasi data sistem dengan aplikasi eksternal atau basis data cadangan.
        </p>
      </div>

      <div className="rounded-md border bg-white p-8 text-center shadow-sm">
        <h3 className="text-lg font-medium text-slate-900">Fitur sedang dalam pengembangan</h3>
        <p className="text-sm text-slate-500 mt-2">
          Modul sinkronisasi data masih dalam tahap pengembangan.
        </p>
      </div>
    </div>
  );
}
