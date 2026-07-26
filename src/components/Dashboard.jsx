import React, { useState, useEffect } from 'react';
import { WaterHero } from './WaterHero';
import { storage } from '../services/api';
import { Zap, Layers, ShieldCheck, RefreshCw, PlusCircle, ExternalLink, Copy, Check, Trash2, Smartphone, Search, Rocket } from 'lucide-react';
import { GithubIcon } from './Icons';

export function Dashboard({ onNavigate, onNotify, onSyncAll }) {
  const [projects, setProjects] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProjects(storage.getProjects());
    setAccounts(storage.getAccounts());
  };

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    onNotify('تم نسخ الرابط بنجاح!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteProject = (id) => {
    if (!window.confirm('هل تريد حذف هذا المشروع من السجل المحلي؟')) return;
    const updated = storage.deleteProject(id);
    setProjects(updated);
    onNotify('تم حذف المشروع بنجاح', 'success');
  };

  const vercelProjects = projects.filter(p => p.platform === 'vercel');
  const gitHubProjects = projects.filter(p => p.platform === 'github');

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.deployedUrl || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-24 space-y-6">
      {/* Water Ripple Hero Banner */}
      <WaterHero
        totalProjects={projects.length}
        vercelCount={vercelProjects.length}
        gitHubCount={gitHubProjects.length}
      />

      <div className="px-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => onNavigate('projects')}
            className="p-4 rounded-2xl bg-[#141428] border border-[#2A2A50] hover:border-[#7C5CFC] transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#7C5CFC]/15 text-[#7C5CFC] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-xl font-extrabold text-white">{projects.length}</div>
            <div className="text-xs text-[#8888BB]">المشاريع المحفوظة</div>
          </div>

          <div
            onClick={() => onNavigate('accounts')}
            className="p-4 rounded-2xl bg-[#141428] border border-[#2A2A50] hover:border-[#60A5FF] transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#60A5FF]/15 text-[#60A5FF] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xl font-extrabold text-white">{accounts.length}</div>
            <div className="text-xs text-[#8888BB]">الحسابات المربوطة</div>
          </div>

          <div
            onClick={() => onNavigate('vercel')}
            className="p-4 rounded-2xl bg-[#141428] border border-[#2A2A50] hover:border-[#0070F3] transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0070F3]/15 text-[#0070F3] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-xl font-extrabold text-white">{vercelProjects.length}</div>
            <div className="text-xs text-[#8888BB]">مشاريع Vercel</div>
          </div>

          <div
            onClick={() => onNavigate('github')}
            className="p-4 rounded-2xl bg-[#141428] border border-[#2A2A50] hover:border-[#238636] transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#238636]/15 text-[#238636] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <GithubIcon className="w-5 h-5" />
            </div>
            <div className="text-xl font-extrabold text-white">{gitHubProjects.length}</div>
            <div className="text-xs text-[#8888BB]">مستودعات GitHub</div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => onNavigate('deploy')}
            className="flex flex-col items-center gap-1.5 p-3 min-w-[85px] rounded-2xl bg-[#141428] border border-[#2A2A50] hover:border-[#0070F3] transition-all shrink-0 text-center active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0070F3]/15 text-[#0070F3] flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">نشر Vercel</span>
          </button>

          <button
            onClick={() => onNavigate('github')}
            className="flex flex-col items-center gap-1.5 p-3 min-w-[85px] rounded-2xl bg-[#141428] border border-[#2A2A50] hover:border-[#238636] transition-all shrink-0 text-center active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-[#238636]/15 text-[#238636] flex items-center justify-center">
              <GithubIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">GitHub Repos</span>
          </button>

          <button
            onClick={onSyncAll}
            className="flex flex-col items-center gap-1.5 p-3 min-w-[85px] rounded-2xl bg-[#141428] border border-[#2A2A50] hover:border-[#7C5CFC] transition-all shrink-0 text-center active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-[#7C5CFC]/15 text-[#7C5CFC] flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">مزامنة الكُني</span>
          </button>

          <button
            onClick={() => onNavigate('apk')}
            className="flex flex-col items-center gap-1.5 p-3 min-w-[85px] rounded-2xl bg-[#141428] border border-[#2A2A50] hover:border-[#F59E0B] transition-all shrink-0 text-center active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">مولد APK</span>
          </button>

          <button
            onClick={() => onNavigate('site-to-apk')}
            className="flex flex-col items-center gap-1.5 p-3 min-w-[85px] rounded-2xl bg-[#141428] border border-[#2A2A50] hover:border-[#F59E0B] transition-all shrink-0 text-center active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center">
              <Rocket className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">APK من رابط</span>
          </button>

          <button
            onClick={() => onNavigate('accounts')}
            className="flex flex-col items-center gap-1.5 p-3 min-w-[85px] rounded-2xl bg-[#141428] border border-[#2A2A50] hover:border-[#60A5FF] transition-all shrink-0 text-center active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-[#60A5FF]/15 text-[#60A5FF] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">الحسابات</span>
          </button>
        </div>

        {/* Saved Projects List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7C5CFC]" />
              <span>سجل المشاريع المحفوظة والمزامنة</span>
            </h2>

            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-bold text-[#7C5CFC] hover:underline"
            >
              عرض الكل ({projects.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-[#8888BB]" />
            <input
              type="text"
              placeholder="تصفية السجل المحلي..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#141428] border border-[#2A2A50] rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-[#8888BB] outline-none focus:border-[#7C5CFC] transition-colors"
            />
          </div>

          {filteredProjects.length === 0 ? (
            <div className="p-8 text-center bg-[#141428] rounded-2xl border border-[#2A2A50] text-xs text-[#8888BB]">
              لا توجد مشاريع محلياً. اضغط "مزامنة" أو انشر مشروع جديد!
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProjects.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-[#141428] border border-[#2A2A50] hover:border-[#7C5CFC]/40 transition-all rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                      p.platform === 'vercel'
                        ? 'bg-[#0070F3]/15 text-[#0070F3]'
                        : 'bg-[#238636]/15 text-[#238636]'
                    }`}>
                      {p.platform === 'vercel' ? '▲' : <GithubIcon className="w-4 h-4" />}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-extrabold text-white truncate font-['JetBrains_Mono',monospace]">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-[#8888BB] dir-ltr text-left truncate">
                        {p.deployedUrl || '—'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.deployedUrl && (
                      <>
                        <a
                          href={p.deployedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-[#0E0E1E] text-white hover:text-[#0070F3] transition-colors"
                          title="فتح الرابط"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleCopy(p.deployedUrl, p.id)}
                          className="p-1.5 rounded-lg bg-[#0E0E1E] text-white hover:text-[#22C55E] transition-colors"
                          title="نسخ الرابط"
                        >
                          {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="p-1.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/25 transition-colors"
                      title="حذف من السجل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
