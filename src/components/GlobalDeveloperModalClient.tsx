"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function GlobalDeveloperModalClient({ 
  show, 
  title, 
  content 
}: { 
  show: boolean, 
  title: string | null, 
  content: string | null 
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (show) {
      setIsOpen(true);
    }
  }, [show]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="bg-primary/10 p-4 border-b border-primary/20 flex justify-between items-center">
          <h3 className="font-bold text-lg text-primary">{title || "Pemberitahuan Sistem"}</h3>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6">
          <div className="prose prose-sm text-slate-700 whitespace-pre-wrap">
            {content || "Silakan hubungi developer untuk informasi lebih lanjut."}
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
          <button onClick={() => setIsOpen(false)} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
