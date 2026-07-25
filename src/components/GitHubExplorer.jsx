import React, { useState, useEffect } from 'react';
import { gitHubApi, vercelApi, storage } from '../services/api';
import { RefreshCw, ExternalLink, Search, PlusCircle, Star, GitFork, Lock, Globe, Rocket, FolderPlus, Upload, CheckCircle2 } from 'lucide-react';
import { GithubIcon } from './Icons';

export function GitHubExplorer({ onNotify, onNavigateAccounts }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, public, private
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [vercelAccounts, setVercelAccounts] = useState([]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [targetRepo, setTargetRepo] = useState(null);
  const [uploadPath, setUploadPath] = useState('index.html');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadCommit, setUploadCommit] = useState('Update via NASHR PRO');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAccountsAndRepos();
  }, []);

  const loadAccountsAndRepos = async () => {
    const ghAccs = storage.getAccounts().filter(a => a.platform === 'github');
    const vAccs = storage.getAccounts().filter(a => a.platform === 'vercel');
    setAccounts(ghAccs);
    setVercelAccounts(vAccs);

    if (ghAccs.length > 0) {
      setSelectedAccount(ghAccs[0]);
      await fetchGitHubData(ghAccs[0].token);
    }
  };

  const fetchGitHubData = async (token) => {
    setLoading(true);
    try {
      const uData = await gitHubApi.getUser(token);
      setUser(uData);

      const repoList = await gitHubApi.getRepos(token);
      setRepos(repoList);

      // Sync GitHub repos to local storage
      repoList.forEach(r => {
        storage.saveProject({
          githubId: r.id,
          name: r.name,
          platform: 'github',
          deployedUrl: r.html_url,
          isPrivate: r.private
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
    await fetchGitHubData(acc.token);
  };

  const handleCreateRepo = async (e) => {
    e.preventDefault();
    if (!newRepoName.trim() || !selectedAccount) return;
    setCreating(true);
    onNotify('⏳ جارٍ إنشاء المستودع على GitHub...', 'info');
    try {
      const createdRepo = await gitHubApi.createRepo(
        newRepoName.trim(),
        newRepoDesc,
        newRepoPrivate,
        selectedAccount.token
      );
      setRepos(prev => [createdRepo, ...prev]);
      setShowCreateModal(false);
      setNewRepoName('');
      setNewRepoDesc('');
      onNotify(`✅ تم إنشاء المستودع "${createdRepo.name}" بنجاح على GitHub!`, 'success');
    } catch (err) {
      onNotify(`❌ ${err.message}`, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!targetRepo || !uploadPath.trim() || !uploadContent || !selectedAccount) return;
    setUploading(true);
    onNotify('⏳ جارٍ رفع الملف إلى GitHub...', 'info');
    try {
      const b64Content = btoa(unescape(encodeURIComponent(uploadContent)));
      await gitHubApi.uploadFile(
        targetRepo.owner.login,
        targetRepo.name,
        uploadPath.trim(),
        b64Content,
        uploadCommit,
        selectedAccount.token
      );
      setShowUploadModal(false);
      setUploadContent('');
      onNotify('✅ تم رفع الملف بنجاح إلى المستودع!', 'success');
    } catch (err) {
      onNotify(`❌ ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeployToVercel = async (repo) => {
    if (vercelAccounts.length === 0) {
      onNotify('⚠️ أضف حساب Vercel أولاً في تبويب الحسابات لنشر المستودع!', 'warning');
      onNavigateAccounts();
      return;
    }
    const vercelToken = vercelAccounts[0].token;
    onNotify(`⏳ جارٍ ربط المستودع ${repo.name} بـ Vercel...`, 'info');
    try {
      const vProj = await gitHubApi.connectGitHubRepoToVercel(
        repo.owner.login,
        repo.name,
        vercelToken
      );
      const url = `https://${vProj.name || repo.name}.vercel.app`;
      storage.saveProject({
        name: repo.name,
        platform: 'vercel',
        deployedUrl: url
      });
      onNotify(`🎉 تم ربط المستودع بـ Vercel بنجاح! الرابط: ${url}`, 'success');
    } catch (err) {
      onNotify(`❌ ${err.message}`, 'error');
    }
  };

  const filteredRepos = repos.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase());
    if (filterType === 'public') return matchesSearch && !r.private;
    if (filterType === 'private') return matchesSearch && r.private;
    return matchesSearch;
  });

  if (accounts.length === 0) {
    return (
      <div className="p-6 text-center bg-[#141428] rounded-2xl border border-[#2A2A50] m-4">
        <div className="w-12 h-12 rounded-2xl bg-[#238636]/15 text-[#238636] flex items-center justify-center mx-auto mb-3">
          <GithubIcon className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">لا يوجد حساب GitHub مربوط</h3>
        <p className="text-xs text-[#8888BB] mb-4">أضف توكن GitHub Personal Access Token لجلب كل المستودعات وإدارتها ونشرها.</p>
        <button
          onClick={onNavigateAccounts}
          className="px-4 py-2 rounded-xl bg-[#238636] text-white font-bold text-xs hover:bg-[#238636]/90 transition-all"
        >
          ربط حساب GitHub الآن
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Account Switcher Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#238636]/15 via-[#141428] to-[#141428] border border-[#238636]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#238636] text-white flex items-center justify-center font-black text-lg">
            <GithubIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>{user ? (user.login || user.name) : selectedAccount?.label}</span>
              <span className="text-[10px] bg-[#238636]/20 border border-[#238636]/40 text-[#238636] px-2 py-0.5 rounded-md">
                GitHub Account
              </span>
            </div>
            <div className="text-xs text-[#8888BB]">
              {user?.public_repos !== undefined ? `${user.public_repos} مستودع عام` : 'حساب GitHub مربوط'}
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
            onClick={() => fetchGitHubData(selectedAccount.token)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#238636] text-white font-bold text-xs hover:bg-[#238636]/90 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>مزامنة</span>
          </button>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-3 text-[#8888BB]" />
          <input
            type="text"
            placeholder="البحث في مستودعات GitHub..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141428] border border-[#2A2A50] rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-[#8888BB] outline-none focus:border-[#238636] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Visibility filter */}
          <div className="flex items-center bg-[#141428] p-1 rounded-xl border border-[#2A2A50] text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${filterType === 'all' ? 'bg-[#238636] text-white font-bold' : 'text-[#8888BB]'}`}
            >
              الكل ({repos.length})
            </button>
            <button
              onClick={() => setFilterType('public')}
              className={`px-2.5 py-1 rounded-lg transition-all ${filterType === 'public' ? 'bg-[#238636] text-white font-bold' : 'text-[#8888BB]'}`}
            >
              عام
            </button>
            <button
              onClick={() => setFilterType('private')}
              className={`px-2.5 py-1 rounded-lg transition-all ${filterType === 'private' ? 'bg-[#238636] text-white font-bold' : 'text-[#8888BB]'}`}
            >
              خاس
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#238636] text-white font-bold text-xs hover:bg-[#238636]/90 transition-all shrink-0"
          >
            <FolderPlus className="w-4 h-4" />
            <span>مستودع جديد</span>
          </button>
        </div>
      </div>

      {/* Repos Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[#8888BB]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#238636]" />
          جاري جلب المستودعات من GitHub...
        </div>
      ) : filteredRepos.length === 0 ? (
        <div className="text-center py-10 bg-[#141428] rounded-2xl border border-[#2A2A50] text-xs text-[#8888BB]">
          لا توجد مستودعات مطابقة للبحث
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredRepos.map((r) => (
            <div
              key={r.id}
              className="bg-[#141428] border border-[#2A2A50] hover:border-[#238636]/50 transition-all rounded-2xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <GithubIcon className="w-4 h-4 text-[#238636]" />
                    <span className="font-['JetBrains_Mono',monospace] font-bold text-sm text-white truncate max-w-[180px]">
                      {r.name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                    r.private
                      ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                      : 'bg-[#238636]/15 text-[#238636] border-[#238636]/30'
                  }`}>
                    {r.private ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                    <span>{r.private ? 'خاص' : 'عام'}</span>
                  </span>
                </div>

                {r.description && (
                  <p className="text-xs text-[#8888BB] mb-3 line-clamp-2">
                    {r.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-[11px] text-[#8888BB] mb-3">
                  {r.language && (
                    <span className="flex items-center gap-1 text-white/80 font-mono">
                      <span className="w-2 h-2 rounded-full bg-[#238636]" /> {r.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-[#F59E0B]" /> {r.stargazers_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3 h-3" /> {r.forks_count || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#2A2A50]/60 gap-2">
                <div className="flex items-center gap-1">
                  <a
                    href={r.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-[#0E0E1E] border border-[#2A2A50] text-white hover:border-[#238636] transition-all text-xs font-semibold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3 text-[#238636]" />
                    <span>فتح GitHub</span>
                  </a>

                  <button
                    onClick={() => {
                      setTargetRepo(r);
                      setShowUploadModal(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#141428] border border-[#2A2A50] text-[#E8E8FF] hover:border-[#7C5CFC] transition-all text-xs font-semibold flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3 text-[#7C5CFC]" />
                    <span>رفع ملف</span>
                  </button>
                </div>

                <button
                  onClick={() => handleDeployToVercel(r)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0070F3]/15 border border-[#0070F3]/30 text-[#0070F3] hover:bg-[#0070F3]/30 transition-all text-xs font-bold flex items-center gap-1"
                  title="نشر هذا المستودع مباشرة على Vercel"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>ربط بـ Vercel</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create New Repo Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141428] border border-[#2A2A50] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-[#238636]" />
              <span>إنشاء مستودع جديد على GitHub</span>
            </h3>

            <form onSubmit={handleCreateRepo} className="space-y-3">
              <div>
                <label className="text-xs text-[#8888BB] block mb-1">اسم المستودع</label>
                <input
                  type="text"
                  required
                  placeholder="my-cool-project"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="w-full bg-[#0E0E1E] border border-[#2A2A50] rounded-xl px-3 py-2 text-xs text-white dir-ltr text-left outline-none focus:border-[#238636]"
                />
              </div>

              <div>
                <label className="text-xs text-[#8888BB] block mb-1">وصف المشروع (اختياري)</label>
                <textarea
                  placeholder="وصف مختصر للمشروع..."
                  value={newRepoDesc}
                  onChange={(e) => setNewRepoDesc(e.target.value)}
                  className="w-full bg-[#0E0E1E] border border-[#2A2A50] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#238636] h-20"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private-check"
                  checked={newRepoPrivate}
                  onChange={(e) => setNewRepoPrivate(e.target.checked)}
                  className="rounded border-[#2A2A50]"
                />
                <label htmlFor="private-check" className="text-xs text-white">
                  مستودع خاص (Private Repository)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0E0E1E] border border-[#2A2A50] text-[#8888BB] text-xs font-bold hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-[#238636] text-white text-xs font-bold hover:bg-[#238636]/90 disabled:opacity-50"
                >
                  {creating ? 'جاري الإنشاء...' : 'إنشاء المستودع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && targetRepo && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141428] border border-[#2A2A50] rounded-2xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#7C5CFC]" />
              <span>رفع ملف إلى: {targetRepo.name}</span>
            </h3>

            <form onSubmit={handleUploadFile} className="space-y-3">
              <div>
                <label className="text-xs text-[#8888BB] block mb-1">مسار الملف في المستودع</label>
                <input
                  type="text"
                  required
                  placeholder="index.html أو src/App.js"
                  value={uploadPath}
                  onChange={(e) => setUploadPath(e.target.value)}
                  className="w-full bg-[#0E0E1E] border border-[#2A2A50] rounded-xl px-3 py-2 text-xs text-white dir-ltr text-left outline-none focus:border-[#7C5CFC]"
                />
              </div>

              <div>
                <label className="text-xs text-[#8888BB] block mb-1">محتوى الملف النصي/الكود</label>
                <textarea
                  required
                  rows={6}
                  placeholder="<!-- اكتب هنا كود الملف HTML / JS / CSS -->"
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  className="w-full bg-[#0E0E1E] border border-[#2A2A50] rounded-xl p-3 text-xs text-white font-mono dir-ltr text-left outline-none focus:border-[#7C5CFC]"
                />
              </div>

              <div>
                <label className="text-xs text-[#8888BB] block mb-1">رسالة التغيير (Commit Message)</label>
                <input
                  type="text"
                  value={uploadCommit}
                  onChange={(e) => setUploadCommit(e.target.value)}
                  className="w-full bg-[#0E0E1E] border border-[#2A2A50] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#7C5CFC]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0E0E1E] border border-[#2A2A50] text-[#8888BB] text-xs font-bold hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl bg-[#7C5CFC] text-white text-xs font-bold hover:bg-[#7C5CFC]/90 disabled:opacity-50"
                >
                  {uploading ? 'جاري الرفع...' : 'رفع إلى GitHub'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
