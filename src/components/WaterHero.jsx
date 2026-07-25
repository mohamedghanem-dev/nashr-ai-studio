import React from 'react';
import { Zap, Layers } from 'lucide-react';
import { GithubIcon } from './Icons';

export function WaterHero({ totalProjects, vercelCount, gitHubCount }) {
  return (
    <div className="relative h-44 flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0070F3]/15 via-[#7C5CFC]/10 to-transparent border-b border-[#2A2A50]">
      {/* Animated concentric water ripple rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-[70px] h-[70px] rounded-full border border-[#7C5CFC]/40 animate-water-ring-1" />
        <div className="absolute w-[120px] h-[120px] rounded-full border border-[#7C5CFC]/30 animate-water-ring-2" />
        <div className="absolute w-[180px] h-[180px] rounded-full border border-[#0070F3]/30 animate-water-ring-3" />
        <div className="absolute w-[240px] h-[240px] rounded-full border border-[#0070F3]/20 animate-water-ring-4" />
        <div className="absolute w-[310px] h-[310px] rounded-full border border-[#7C5CFC]/15 animate-water-ring-5" />
      </div>

      {/* Floating logo icon */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(124,92,252,0.6)] border border-white/20 animate-float mb-2">
          <img src="/icon.png" alt="NASHR PRO" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-xl font-black text-white tracking-tight">
          NASHR PRO · المركز الموحد
        </h1>
        <p className="text-xs text-[#8888BB] mt-0.5">
          إدارة واستكشاف ونشر مشاريع Vercel و GitHub بسرعة فائقة
        </p>
      </div>

      {/* Bottom overlay badge */}
      <div className="absolute bottom-2 right-4 left-4 flex items-center justify-between text-[11px] text-[#8888BB] bg-[#060610]/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#0070F3]">
            <Zap className="w-3 h-3" /> {vercelCount} Vercel
          </span>
          <span className="flex items-center gap-1 text-[#22C55E]">
            <GithubIcon className="w-3 h-3" /> {gitHubCount} GitHub
          </span>
        </div>
        <div className="flex items-center gap-1 text-[#E8E8FF]">
          <Layers className="w-3 h-3 text-[#7C5CFC]" /> {totalProjects} مشروع إجمالي
        </div>
      </div>
    </div>
  );
}
