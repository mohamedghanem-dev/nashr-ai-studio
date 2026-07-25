import React, { useState, useEffect } from 'react';
import { vercelApi, storage } from '../services/api';
import { Zap, RefreshCw, ExternalLink, Trash2, Play, Globe, Search, PlusCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export function VercelExplorer({ onNotify, onNavigateDeploy }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    loadAccountsAndProjects();
  }, []);

  const loadAccountsAndProjects = async () => {
    const accs = storage.getAccounts().filter(a => a.platform === 'vercel');
    setAccounts(accs);
    if (accs.length > 0) {
      setSelectedAccount(accs[0]);
      await fetchVercelData(accs[0].token);
    }
  };

  const fetchVercelData = async (token) => {
    setLoading(true);
    try {
      const uData = await vercelApi.getUser(token);
      setUser(uData);

      const pData = await vercelApi.getProjects(token);
      setProjects(pData);

      // Save synced projects to local storage
      pData.forEach(p => {
        const domain = p.targets?.production?.url || `${p.name}.vercel.app`;
        const url = domain.startsWith('http') ? domain : `https://${domain}`;
        storage.saveProject({
          vercelId: p.id,
          name: p.name,
          platform: 'vercel',
          deployedUrl: url,
          framework: p.framework || 'other'
        });
      });
    } catch (err) {
      onNotify(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = async (acc) => {
    setSelectedAccount(acc);
    await fetchVercelData(acc.token);
  };

  const handleRedeploy = async (projectId) => {
    if (!selectedAccount) return;
    onNotify('⏳ جارٍ إطلاق طلب إعادة البناء...', 'info');
    try {
      await vercelApi.triggerRedeploy(projectId, selectedAccount.token);
      onNotify('✅ تم إطلاق عملية البناء بنجاح على Vercel!', 'success');
    } catch (err) {
      onNotify(`❌ ${err.message}`, 'error');
    }
  };

  const handleDelete = async (projectId, projectName) => {
    if (!window.confirm(`هل أنت تأكد من حذف المشروع "${projectName}" نهائياً من حساب Vercel؟`)) return;
    if (!selectedAccount) return;
    onNotify('⏳ جارٍ حذف المشروع...', 'info');
    try {
      await vercelApi.deleteProject(projectId, selectedAccount.token);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      onNotify(`✅ تم حذف المشروع ${projectName} بنجاح!`, 'success');
    } catch (err) {
      onNotify(`❌ ${err.message}`, 'error');
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.targets?.production?.url || '').toLowerCase().includes(search.toLowerCase())
  );

  if (accounts.length === 0) {
    return (
      <div className="p-6 text-center bg-[#141428] rounded-2xl border border-[#2A2A50] m-4">
        <div className="w-12 h-12 rounded-2xl bg-[#0070F3]/15 text-[#0070F3] flex items-center justify-center mx-auto mb-3">
          <Zap className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">لا يوجد حساب Vercel مربوط</h3>
        <p className="text-xs text-[#8888BB] mb-4">أضف توكن Vercel في تبويب الحسابات لتصفح كل مشاريعك وإدارتها مباشر.</p>
        <button
          onClick={() => onNavigateDeploy()}
          className="px-4 py-2 rounded-xl bg-[#0070F3] text-white font-bold text-xs hover:bg-[#0070F3]/90 transition-all"
        >
          إضافة توكن Vercel الان
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Account Switcher Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0070F3]/15 via-[#141428] to-[#141428] border border-[#0070F3]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0070F3] text-white flex items-center justify-center font-black text-lg">
            ▲
          </div>
          <div>
            <div className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>{user ? (user.username || user.name) : selectedAccount?.label}</span>
              <span className="text-[10px] bg-[#0070F3]/20 border border-[#0070F3]/40 text-[#0070F3] px-2 py-0.5 rounded-md">
                {user?.plan || 'Vercel Account'}
              </span>
            </div>
            <div className="text-xs text-[#8888BB]">
              {user?.email || 'حساب Vercel مربوط'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {accounts.length > 1 && (
            <select
              value={selectedAccount?.id}
              onChange={(e) => {
                const acc = accounts.find(a => a.id === Number(e.target.value));
                if (acc) handleAccountChange(acc);
              }}
              className="bg-[#0E0E1E] border border-[#2A2A50] rounded-xl text-xs text-white px-3 py-2 outline-none"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => fetchVercelData(selectedAccount.token)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0070F3] text-white font-bold text-xs hover:bg-[#0070F3]/90 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Header Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-3 text-[#8888BB]" />
          <input
            type="text"
            placeholder="البحث في مشاريع Vercel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141428] border border-[#2A2A50] rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-[#8888BB] outline-none focus:border-[#0070F3] transition-colors"
          />
        </div>
        <button
          onClick={onNavigateDeploy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] font-bold text-xs hover:bg-[#22C55E]/25 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>نشر جديد</span>
        </button>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[#8888BB]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0070F3]" />
          جاري جلب المشاريع المباشرة من حساب Vercel...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-10 bg-[#141428] rounded-2xl border border-[#2A2A50] text-xs text-[#8888BB]">
          لا توجد مشاريع مطابقة للبحث
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredProjects.map((p) => {
            const domain = p.targets?.production?.url || `${p.name}.vercel.app`;
            const url = domain.startsWith('http') ? domain : `https://${domain}`;
            return (
              <div
                key={p.id}
                className="bg-[#141428] border border-[#2A2A50] hover:border-[#0070F3]/50 transition-all rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0070F3]/20 text-[#0070F3] flex items-center justify-center text-xs font-black">
                        ▲
                      </div>
                      <span className="font-['JetBrains_Mono',monospace] font-bold text-sm text-white truncate max-w-[180px]">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0070F3]/15 text-[#0070F3] border border-[#0070F3]/30">
                      {p.framework || 'Web'}
                    </span>
                  </div>

                  <div className="text-xs text-[#8888BB] font-mono dir-ltr text-left truncate mb-3 hover:text-white">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                      <Globe className="w-3 h-3 text-[#0070F3] shrink-0" />
                      <span>{url}</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#2A2A50]/60 gap-2">
                  <div className="flex items-center gap-1">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-[#0E0E1E] border border-[#2A2A50] text-white hover:bg-[#0070F3] hover:border-[#0070F3] transition-all text-xs font-semibold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>معاينة</span>
                    </a>

                    <button
                      onClick={() => handleRedeploy(p.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0070F3]/15 border border-[#0070F3]/30 text-[#0070F3] hover:bg-[#0070F3]/30 transition-all text-xs font-semibold flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      <span>إعادة بناء</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="p-1.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] hover:bg-[#EF4444]/25 transition-all"
                    title="حذف المشروع"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
