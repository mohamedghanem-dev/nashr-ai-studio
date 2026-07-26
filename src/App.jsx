import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { FloatingNav } from './components/FloatingNav';
import { Dashboard } from './components/Dashboard';
import { VercelExplorer } from './components/VercelExplorer';
import { GitHubExplorer } from './components/GitHubExplorer';
import { ProjectsManager } from './components/ProjectsManager';
import { DeployHub } from './components/DeployHub';
import { AccountsManager } from './components/AccountsManager';
import { ApkPwaTool } from './components/ApkPwaTool';
import { SiteToApk } from './components/SiteToApk';
import { Settings } from './components/Settings';
import { storage, vercelApi, gitHubApi } from './services/api';
import { Lock, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState(() => storage.getSettings().theme || 'dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accounts, setAccounts] = useState(() => storage.getAccounts());
  const [toast, setToast] = useState(null);

  // Security PIN state
  const [pin, setPin] = useState(() => storage.getPin());
  const [pinUnlocked, setPinUnlocked] = useState(() => !storage.getPin());
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.body.classList.add('theme-light', 'bg-[#F4F6FF]', 'text-[#1A1A3E]');
      document.body.classList.remove('bg-[#060610]', 'text-[#E8E8FF]');
    } else {
      document.body.classList.remove('theme-light', 'bg-[#F4F6FF]', 'text-[#1A1A3E]');
      document.body.classList.add('bg-[#060610]', 'text-[#E8E8FF]');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    storage.saveSettings({ ...storage.getSettings(), theme: newTheme });
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (enteredPin === pin) {
      setPinUnlocked(true);
      setPinError(false);
      showToast('تم إلغاء القفل بنجاح!', 'success');
    } else {
      setPinError(true);
      setEnteredPin('');
      showToast('رمز PIN غير صحيح', 'error');
    }
  };

  const handleSyncAll = async () => {
    const currentAccs = storage.getAccounts();
    if (currentAccs.length === 0) {
      showToast('⚠️ أضف توكن Vercel أو GitHub أولاً لبدء المزامنة', 'warning');
      setActiveTab('accounts');
      return;
    }

    showToast('⏳ جاري مزامنة كل المشاريع والمستودعات...', 'info');
    let totalSynced = 0;

    for (const acc of currentAccs) {
      try {
        if (acc.platform === 'vercel') {
          const vProjects = await vercelApi.getProjects(acc.token);
          vProjects.forEach(p => {
            const domain = p.targets?.production?.url || `${p.name}.vercel.app`;
            const url = domain.startsWith('http') ? domain : `https://${domain}`;
            storage.saveProject({
              vercelId: p.id,
              name: p.name,
              platform: 'vercel',
              deployedUrl: url,
              framework: p.framework || 'other'
            });
            totalSynced++;
          });
        } else if (acc.platform === 'github') {
          const ghRepos = await gitHubApi.getRepos(acc.token);
          ghRepos.forEach(r => {
            storage.saveProject({
              githubId: r.id,
              name: r.name,
              platform: 'github',
              deployedUrl: r.html_url,
              isPrivate: r.private
            });
            totalSynced++;
          });
        }
      } catch (err) {
        console.error('Sync error:', err);
      }
    }

    showToast(`✅ تمت مزامنة ${totalSynced} مشروع ومستودع بنجاح!`, 'success');
    setAccounts(storage.getAccounts());
  };

  // If PIN lock is active and locked
  if (pin && !pinUnlocked) {
    return (
      <div className="min-h-screen bg-[#060610] flex items-center justify-center p-4">
        <div className="bg-[#141428] border border-[#2A2A50] rounded-3xl p-8 w-full max-w-sm text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#7C5CFC]/20 text-[#7C5CFC] border border-[#7C5CFC]/40 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(124,92,252,0.3)]">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">تطبيق NASHR PRO محمى</h2>
            <p className="text-xs text-[#8888BB] mt-1">أدخل رمز PIN المكون من 4 أرقام للمتابعة</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={4}
              autoFocus
              placeholder="****"
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value.replace(/[^0-9]/g, ''))}
              className={`w-full bg-[#0E0E1E] border rounded-2xl py-3 text-center text-xl text-white font-mono tracking-widest outline-none transition-colors ${
                pinError ? 'border-[#EF4444]' : 'border-[#2A2A50] focus:border-[#7C5CFC]'
              }`}
            />
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#7C5CFC] text-white font-extrabold text-sm hover:bg-[#7C5CFC]/90 transition-all shadow-lg shadow-[#7C5CFC]/30"
            >
              فتح التطبيق
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative font-['Cairo',sans-serif]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-2.5 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs font-extrabold backdrop-blur-xl ${
            toast.type === 'success'
              ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]'
              : toast.type === 'error'
              ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]'
              : toast.type === 'warning'
              ? 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B]'
              : 'bg-[#7C5CFC]/15 border-[#7C5CFC]/40 text-[#A78BFA]'
          }`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        accountCount={accounts.length}
        onSyncAll={handleSyncAll}
        onOpenAccounts={() => setActiveTab('accounts')}
      />

      {/* Main Content View Switcher */}
      <main className="max-w-4xl mx-auto">
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigate={(tab) => setActiveTab(tab)}
            onNotify={showToast}
            onSyncAll={handleSyncAll}
          />
        )}

        {activeTab === 'vercel' && (
          <VercelExplorer
            onNotify={showToast}
            onNavigateDeploy={() => setActiveTab('deploy')}
          />
        )}

        {activeTab === 'github' && (
          <GitHubExplorer
            onNotify={showToast}
            onNavigateAccounts={() => setActiveTab('accounts')}
          />
        )}

        {activeTab === 'deploy' && (
          <DeployHub
            onNotify={showToast}
            onNavigateAccounts={() => setActiveTab('accounts')}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsManager
            onNotify={showToast}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsManager
            onNotify={showToast}
          />
        )}

        {activeTab === 'apk' && (
          <ApkPwaTool
            onNotify={showToast}
          />
        )}

        {activeTab === 'site-to-apk' && (
          <SiteToApk
            onNotify={showToast}
            onNavigateAccounts={() => setActiveTab('accounts')}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            theme={theme}
            toggleTheme={toggleTheme}
            onNotify={showToast}
          />
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <FloatingNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
