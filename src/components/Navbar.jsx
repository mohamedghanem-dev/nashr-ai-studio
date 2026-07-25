import React from 'react';
import { RefreshCw, Sun, Moon, ShieldCheck, Zap } from 'lucide-react';

export function Navbar({ theme, toggleTheme, accountCount, onSyncAll, onOpenAccounts }) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0E0E1E]/80 border-b border-[#2A2A50] px-4 py-3 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(124,92,252,0.4)] border border-white/10 flex-shrink-0">
          <img src="/icon.png" alt="NASHR PRO" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-['JetBrains_Mono',monospace] font-black text-lg tracking-wider bg-gradient-to-r from-[#60A5FF] via-[#A78BFA] to-[#F59E0B] bg-clip-text text-transparent">
              NASHR
            </span>
            <span className="text-[10px] font-black tracking-widest px-1.5 py-0.5 rounded-md bg-[#7C5CFC]/20 border border-[#7C5CFC]/40 text-[#7C5CFC]">
              PRO
            </span>
          </div>
          <div className="text-[11px] text-[#8888BB] flex items-center gap-1">
            <span>منصة النشر و المزامنة السحابية</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSyncAll}
          title="مزامنة شاملة لكل المشاريع"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0070F3]/15 border border-[#0070F3]/30 text-[#0070F3] hover:bg-[#0070F3]/25 transition-all text-xs font-bold active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">مزامنة</span>
        </button>

        <button
          onClick={onOpenAccounts}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#141428] border border-[#2A2A50] text-[#E8E8FF] hover:border-[#7C5CFC] transition-all text-xs font-semibold"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
          <span>{accountCount} حساب</span>
        </button>

        <button
          onClick={toggleTheme}
          title="تغيير المظهر"
          className="p-2 rounded-xl bg-[#141428] border border-[#2A2A50] text-[#8888BB] hover:text-white transition-all active:scale-95"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-[#F59E0B]" /> : <Moon className="w-4 h-4 text-[#7C5CFC]" />}
        </button>
      </div>
    </header>
  );
}
