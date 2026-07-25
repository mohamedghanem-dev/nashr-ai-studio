import React, { useState, useEffect } from 'react';
import { storage } from '../services/api';
import { Layers, Search, ExternalLink, Copy, Check, Trash2, Zap } from 'lucide-react';
import { GithubIcon } from './Icons';

export function ProjectsManager({ onNotify }) {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all'); // all, vercel, github
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    setProjects(storage.getProjects());
  }, []);

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    onNotify('تم نسخ الرابط!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id) => {
    if (!window.confirm('هل تريد حذف هذا المشروع من السجل المحلي؟')) return;
    const updated = storage.deleteProject(id);
    setProjects(updated);
    onNotify('تم الحذف بنجاح', 'success');
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.deployedUrl || '').toLowerCase().includes(search.toLowerCase());
    if (platformFilter === 'vercel') return matchesSearch && p.platform === 'vercel';
    if (platformFilter === 'github') return matchesSearch && p.platform === 'github';
    return matchesSearch;
  });

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#7C5CFC]" />
          <span>المشاريع المحفوظة والمزامنة</span>
        </h2>
        <span className="text-xs text-[#8888BB] font-semibold bg-[#141428] px-2.5 py-1 rounded-xl border border-[#2A2A50]">
          إجمالي {filteredProjects.length}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-3 text-[#8888BB]" />
          <input
            type="text"
            placeholder="البحث بالاسم أو الرابط..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141428] border border-[#2A2A50] rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-[#8888BB] outline-none focus:border-[#7C5CFC] transition-colors"
          />
        </div>

        <div className="flex items-center bg-[#141428] p-1 rounded-xl border border-[#2A2A50] text-xs">
          <button
            onClick={() => setPlatformFilter('all')}
            className={`px-3 py-1 rounded-lg transition-all ${platformFilter === 'all' ? 'bg-[#7C5CFC] text-white font-bold' : 'text-[#8888BB]'}`}
          >
            الكل
          </button>
          <button
            onClick={() => setPlatformFilter('vercel')}
            className={`px-3 py-1 rounded-lg transition-all ${platformFilter === 'vercel' ? 'bg-[#0070F3] text-white font-bold' : 'text-[#8888BB]'}`}
          >
            Vercel
          </button>
          <button
            onClick={() => setPlatformFilter('github')}
            className={`px-3 py-1 rounded-lg transition-all ${platformFilter === 'github' ? 'bg-[#238636] text-white font-bold' : 'text-[#8888BB]'}`}
          >
            GitHub
          </button>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-[#141428] rounded-2xl border border-[#2A2A50] text-xs text-[#8888BB]">
          لا توجد مشاريع مطابقة للبحث
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="bg-[#141428] border border-[#2A2A50] hover:border-[#7C5CFC]/50 transition-all rounded-2xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                      p.platform === 'vercel'
                        ? 'bg-[#0070F3]/20 text-[#0070F3]'
                        : 'bg-[#238636]/20 text-[#238636]'
                    }`}>
                      {p.platform === 'vercel' ? '▲' : <GithubIcon className="w-4 h-4" />}
                    </div>
                    <span className="font-['JetBrains_Mono',monospace] font-bold text-sm text-white truncate max-w-[180px]">
                      {p.name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    p.platform === 'vercel'
                      ? 'bg-[#0070F3]/15 text-[#0070F3] border-[#0070F3]/30'
                      : 'bg-[#238636]/15 text-[#238636] border-[#238636]/30'
                  }`}>
                    {p.platform === 'vercel' ? '▲ Vercel' : '⌥ GitHub'}
                  </span>
                </div>

                <div className="text-xs text-[#8888BB] font-mono dir-ltr text-left truncate mb-3">
                  {p.deployedUrl ? (
                    <a href={p.deployedUrl} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-white">
                      {p.deployedUrl}
                    </a>
                  ) : (
                    '—'
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#2A2A50]/60 gap-2">
                <div className="flex items-center gap-1.5">
                  {p.deployedUrl && (
                    <>
                      <a
                        href={p.deployedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-[#0E0E1E] border border-[#2A2A50] text-white hover:border-[#7C5CFC] transition-all text-xs font-semibold flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3 text-[#7C5CFC]" />
                        <span>فتح الرابط</span>
                      </a>
                      <button
                        onClick={() => handleCopy(p.deployedUrl, p.id)}
                        className="p-1.5 rounded-lg bg-[#0E0E1E] border border-[#2A2A50] text-[#8888BB] hover:text-white transition-all"
                        title="نسخ الرابط"
                      >
                        {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] hover:bg-[#EF4444]/25 transition-all"
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
  );
}
