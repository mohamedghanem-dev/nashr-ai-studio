import React from 'react';
import { Home, Zap, Rocket, Layers, ShieldCheck, Settings } from 'lucide-react';
import { GithubIcon } from './Icons';

export function FloatingNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'dashboard', label: 'الرئيسية', icon: Home, color: '#7C5CFC' },
    { id: 'vercel', label: 'Vercel', icon: Zap, color: '#0070F3' },
    { id: 'github', label: 'GitHub', icon: GithubIcon, color: '#238636' },
    { id: 'deploy', label: 'نشر', icon: Rocket, color: '#22C55E' },
    { id: 'projects', label: 'السجل', icon: Layers, color: '#A78BFA' },
    { id: 'accounts', label: 'الحسابات', icon: ShieldCheck, color: '#60A5FF' },
    { id: 'settings', label: 'الإعدادات', icon: Settings, color: '#F59E0B' },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg">
      <nav className="floating-nav rounded-2xl p-1.5 flex items-center justify-around gap-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-white font-extrabold scale-105'
                  : 'text-[#8888BB] hover:text-white'
              }`}
            >
              {isActive && (
                <div
                  className="absolute inset-0 rounded-xl opacity-20 blur-sm"
                  style={{ backgroundColor: t.color }}
                />
              )}
              <Icon
                className={`w-5 h-5 relative z-10 transition-transform ${isActive ? 'scale-110' : ''}`}
                style={{ color: isActive ? t.color : undefined }}
              />
              <span className="text-[10px] mt-0.5 relative z-10 leading-none">
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
