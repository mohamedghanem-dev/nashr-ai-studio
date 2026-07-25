import React, { useState, useEffect } from 'react';
import { storage, vercelApi, gitHubApi } from '../services/api';
import { ShieldCheck, Plus, Trash2, Key, ExternalLink, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export function AccountsManager({ onNotify }) {
  const [accounts, setAccounts] = useState([]);
  const [platform, setPlatform] = useState('vercel'); // vercel, github
  const [tokenInput, setTokenInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    setAccounts(storage.getAccounts());
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      onNotify('أدخل قيمة التوكن', 'warning');
      return;
    }

    setTesting(true);
    onNotify('جاري الفحص والتحقق من التوكن...', 'info');

    try {
      let userInfo = null;
      let defaultLabel = '';

      if (platform === 'vercel') {
        userInfo = await vercelApi.getUser(tokenInput.trim());
        defaultLabel = userInfo.username || userInfo.name || 'حساب Vercel';
      } else {
        userInfo = await gitHubApi.getUser(tokenInput.trim());
        defaultLabel = userInfo.login || userInfo.name || 'حساب GitHub';
      }

      const newAccount = {
        id: Date.now(),
        platform,
        token: tokenInput.trim(),
        label: labelInput.trim() || defaultLabel,
        email: userInfo.email || ''
      };

      const updated = storage.saveAccount(newAccount);
      setAccounts(updated);
      setTokenInput('');
      setLabelInput('');
      onNotify(`✅ تم ربط حساب ${platform === 'vercel' ? 'Vercel' : 'GitHub'} (${defaultLabel}) بنجاح!`, 'success');
    } catch (err) {
      onNotify(`❌ ${err.message}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleDeleteAccount = (id) => {
    if (!window.confirm('هل أنت تأكد من إزالة هذا الحساب؟')) return;
    const updated = storage.deleteAccount(id);
    setAccounts(updated);
    onNotify('تم حذف الحساب بنجاح', 'success');
  };

  const vercelAccounts = accounts.filter(a => a.platform === 'vercel');
  const gitHubAccounts = accounts.filter(a => a.platform === 'github');

  return (
    <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
          <span>الحسابات والتوكنات المربوطة</span>
        </h2>
        <span className="text-xs text-[#8888BB] font-semibold bg-[#141428] px-2.5 py-1 rounded-xl border border-[#2A2A50]">
          {accounts.length} حساب
        </span>
      </div>

      {/* Add New Token Form */}
      <div className="bg-[#141428] border border-[#2A2A50] rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#7C5CFC]" />
          <span>ربط توكن حساب جديد</span>
        </h3>

        <form onSubmit={handleAddAccount} className="space-y-3">
          {/* Platform Selector */}
          <div className="flex bg-[#0E0E1E] p-1 rounded-xl border border-[#2A2A50]">
            <button
              type="button"
              onClick={() => setPlatform('vercel')}
              className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                platform === 'vercel' ? 'bg-[#0070F3] text-white' : 'text-[#8888BB]'
              }`}
            >
              ▲ Vercel Token
            </button>
            <button
              type="button"
              onClick={() => setPlatform('github')}
              className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                platform === 'github' ? 'bg-[#238636] text-white' : 'text-[#8888BB]'
              }`}
            >
              ⌥ GitHub Token (PAT)
            </button>
          </div>

          <div>
            <label className="text-xs text-[#8888BB] block mb-1">
              اسم التسمية للتمييز (اختياري)
            </label>
            <input
              type="text"
              placeholder={platform === 'vercel' ? 'مثلاً: حسابي الشخصي' : 'مثلاً: GitHub Work'}
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              className="w-full bg-[#0E0E1E] border border-[#2A2A50] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#7C5CFC]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#8888BB] block">رمز التوكن (Access Token)</label>
              <a
                href={
                  platform === 'vercel'
                    ? 'https://vercel.com/account/tokens'
                    : 'https://github.com/settings/tokens/new'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#0070F3] hover:underline flex items-center gap-1"
              >
                <span>احصل على التوكن من {platform === 'vercel' ? 'Vercel' : 'GitHub'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              required
              placeholder={platform === 'vercel' ? 'انسخ التوكن هنا (مثال: vtk_...)' : 'انسخ ghp_... أو gpat_...'}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full bg-[#0E0E1E] border border-[#2A2A50] rounded-xl px-3 py-2.5 text-xs text-white font-mono dir-ltr text-left outline-none focus:border-[#7C5CFC]"
            />
          </div>

          <button
            type="submit"
            disabled={testing}
            className={`w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
              platform === 'vercel' ? 'bg-[#0070F3] hover:bg-[#0070F3]/90' : 'bg-[#238636] hover:bg-[#238636]/90'
            }`}
          >
            {testing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>التحقق من التوكن...</span>
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>حفظ واختبار التوكن</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Saved Vercel Accounts */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#8888BB] uppercase tracking-wider">
          حسابات Vercel ({vercelAccounts.length})
        </h3>
        {vercelAccounts.length === 0 ? (
          <div className="p-4 text-center bg-[#141428] rounded-2xl border border-[#2A2A50] text-xs text-[#8888BB]">
            لا يوجد حساب Vercel مربوط
          </div>
        ) : (
          <div className="space-y-2">
            {vercelAccounts.map(a => (
              <div key={a.id} className="p-3 bg-[#141428] border border-[#2A2A50] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0070F3]/20 text-[#0070F3] flex items-center justify-center font-bold text-xs">
                    ▲
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{a.label}</div>
                    <div className="text-[10px] text-[#8888BB] font-mono">
                      {a.token ? a.token.slice(0, 8) + '••••' + a.token.slice(-4) : '—'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAccount(a.id)}
                  className="p-1.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/25"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved GitHub Accounts */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#8888BB] uppercase tracking-wider">
          حسابات GitHub ({gitHubAccounts.length})
        </h3>
        {gitHubAccounts.length === 0 ? (
          <div className="p-4 text-center bg-[#141428] rounded-2xl border border-[#2A2A50] text-xs text-[#8888BB]">
            لا يوجد حساب GitHub مربوط
          </div>
        ) : (
          <div className="space-y-2">
            {gitHubAccounts.map(a => (
              <div key={a.id} className="p-3 bg-[#141428] border border-[#2A2A50] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#238636]/20 text-[#238636] flex items-center justify-center font-bold text-xs">
                    ⌥
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{a.label}</div>
                    <div className="text-[10px] text-[#8888BB] font-mono">
                      {a.token ? a.token.slice(0, 8) + '••••' + a.token.slice(-4) : '—'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAccount(a.id)}
                  className="p-1.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/25"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
