import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { vercelApi, gitHubApi, storage } from '../services/api';
import { Zap, Upload, Code, CheckCircle2, Rocket, ExternalLink, Copy, Check, RefreshCw, FileArchive } from 'lucide-react';
import { GithubIcon } from './Icons';

export function DeployHub({ onNotify, onNavigateAccounts }) {
  const [activeTab, setActiveTab] = useState('vercel'); // vercel, github
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Source mode: 'code' (نص HTML واحد) أو 'zip' (مشروع كامل مضغوط)
  const [sourceMode, setSourceMode] = useState('code');
  const [zipFile, setZipFile] = useState(null);
  const [zipFileCount, setZipFileCount] = useState(0);

  // Form states
  const [siteName, setSiteName] = useState('');
  const [codeContent, setCodeContent] = useState('<!DOCTYPE html>\n<html>\n<head>\n  <title>My App</title>\n</head>\n<body>\n  <h1>Hello World from NASHR PRO</h1>\n</body>\n</html>');
  const [isDeploying, setIsDeploying] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [deployedResult, setDeployedResult] = useState(null);

  // Alias state
  const [aliasInput, setAliasInput] = useState('');
  const [aliasMsg, setAliasMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [activeTab]);

  const loadAccounts = () => {
    const accs = storage.getAccounts().filter(a => a.platform === activeTab);
    setAccounts(accs);
    if (accs.length > 0) {
      setSelectedAccountId(accs[0].id);
    } else {
      setSelectedAccountId('');
    }
  };

  const [isDragOver, setIsDragOver] = useState(false);

  const processZipFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      onNotify('اختر ملف ZIP صحيح فقط', 'warning');
      return;
    }
    try {
      const zip = await JSZip.loadAsync(file);
      const count = Object.values(zip.files).filter(f => !f.dir).length;
      if (count === 0) {
        onNotify('ملف ZIP فاضي أو تالف', 'error');
        return;
      }
      setZipFile(file);
      setZipFileCount(count);
      onNotify(`تم اختيار ZIP فيه ${count} ملف`, 'success');
    } catch (err) {
      onNotify('فشل قراءة ملف ZIP — تأكد إنه سليم', 'error');
    }
  };

  const handleZipSelect = async (e) => {
    const file = e.target.files?.[0];
    await processZipFile(file);
  };

  const handleZipDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    await processZipFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // بيحول ملف ZIP لقائمة ملفات بصيغة base64 صالحة لكل من Vercel وGitHub
  const extractZipFiles = async (file) => {
    const zip = await JSZip.loadAsync(file);
    const entries = Object.values(zip.files).filter(f => !f.dir);
    const files = [];
    for (const entry of entries) {
      const base64 = await entry.async('base64');
      // نتجاهل أي مجلد جذر واحد ملفوف داخل الـ ZIP (نمط شائع عند التصدير من أدوات كتير)
      let cleanPath = entry.name;
      files.push({ path: cleanPath, base64 });
    }
    return files;
  };


  const handleDeploy = async (e) => {
    e.preventDefault();
    if (!siteName.trim()) {
      onNotify('أدخل اسم الموقع أو المستودع', 'warning');
      return;
    }
    if (sourceMode === 'zip' && !zipFile) {
      onNotify('اختر ملف ZIP أولاً', 'warning');
      return;
    }
    const currentAcc = accounts.find(a => Number(a.id) === Number(selectedAccountId));
    if (!currentAcc) {
      onNotify(`اختر حساب ${activeTab === 'vercel' ? 'Vercel' : 'GitHub'} أولاً`, 'warning');
      return;
    }

    setIsDeploying(true);
    setDeployedResult(null);
    setProgressMsg('جارٍ إعداد عملية النشر...');

    try {
      if (activeTab === 'vercel') {
        const cleanName = siteName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        let files;

        if (sourceMode === 'zip') {
          setProgressMsg('جارٍ فك ضغط الملفات...');
          const extracted = await extractZipFiles(zipFile);
          const hasIndex = extracted.some(f => /(^|\/)index\.html$/i.test(f.path));
          if (!hasIndex) {
            throw new Error('لازم يكون في ملف index.html داخل الـ ZIP');
          }
          files = extracted.map(f => ({ file: f.path, data: f.base64, encoding: 'base64' }));
        } else {
          files = [{ file: 'index.html', data: codeContent }];
        }

        const res = await vercelApi.deployRawFiles(cleanName, files, currentAcc.token, (msg) => {
          setProgressMsg(msg);
        });

        const url = res.url;
        storage.saveProject({
          name: cleanName,
          platform: 'vercel',
          deployedUrl: url
        });

        setDeployedResult({
          url,
          id: res.id,
          name: cleanName
        });
        onNotify('🎉 تم نشر الموقع على Vercel بنجاح!', 'success');
      } else {
        // GitHub publish
        const cleanRepoName = siteName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        setProgressMsg('إنشاء المستودع على GitHub...');

        const createdRepo = await gitHubApi.createRepo(cleanRepoName, 'Deployed via NASHR PRO', false, currentAcc.token);

        if (sourceMode === 'zip') {
          const extracted = await extractZipFiles(zipFile);
          const filesList = extracted.map(f => ({ path: f.path, contentB64: f.base64 }));
          await gitHubApi.uploadMultipleFiles(
            createdRepo.owner.login,
            createdRepo.name,
            filesList,
            'Initial commit via NASHR PRO (ZIP)',
            currentAcc.token,
            createdRepo.default_branch,
            (msg) => setProgressMsg(msg)
          );
        } else {
          setProgressMsg('رفع ملف index.html إلى المستودع...');
          const b64 = btoa(unescape(encodeURIComponent(codeContent)));
          await gitHubApi.uploadFile(
            createdRepo.owner.login,
            createdRepo.name,
            'index.html',
            b64,
            'Initial commit via NASHR PRO',
            currentAcc.token,
            createdRepo.default_branch
          );
        }

        storage.saveProject({
          name: cleanRepoName,
          platform: 'github',
          deployedUrl: createdRepo.html_url
        });

        setDeployedResult({
          url: createdRepo.html_url,
          name: cleanRepoName
        });
        onNotify('🎉 تم نشر المستودع والملفات على GitHub بنجاح!', 'success');
      }
    } catch (err) {
      onNotify(`❌ ${err.message}`, 'error');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleApplyAlias = async () => {
    if (!aliasInput.trim() || !deployedResult?.id) return;
    const currentAcc = accounts.find(a => Number(a.id) === Number(selectedAccountId));
    if (!currentAcc) return;

    setAliasMsg('جارٍ تعيين النطاق المخصص...');
    try {
      const newUrl = await vercelApi.applyAlias(deployedResult.id, aliasInput.trim(), currentAcc.token);
      setDeployedResult(prev => ({ ...prev, url: newUrl }));
      setAliasMsg(`✅ تم تطبيق النطاق الجديد: ${newUrl}`);
      onNotify('تمت إضافة النطاق المخصص بنجاح!', 'success');
    } catch (err) {
      setAliasMsg(`❌ ${err.message}`);
    }
  };

  const handleCopyUrl = () => {
    if (!deployedResult?.url) return;
    navigator.clipboard.writeText(deployedResult.url);
    setCopied(true);
    onNotify('تم نسخ الرابط بنجاح!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 space-y-4 pb-24 max-w-2xl mx-auto">
      {/* Platform Tabs */}
      <div className="flex bg-[#141428] p-1 rounded-2xl border border-[#2A2A50]">
        <button
          onClick={() => setActiveTab('vercel')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'vercel'
              ? 'bg-[#0070F3] text-white shadow-lg shadow-[#0070F3]/30'
              : 'text-[#8888BB] hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>▲ Vercel Deploy</span>
        </button>

        <button
          onClick={() => setActiveTab('github')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'github'
              ? 'bg-[#238636] text-white shadow-lg shadow-[#238636]/30'
              : 'text-[#8888BB] hover:text-white'
          }`}
        >
          <GithubIcon className="w-4 h-4" />
          <span>⌥ GitHub Repository</span>
        </button>
      </div>

      {/* Deploy Form */}
      <div className="bg-[#141428] border border-[#2A2A50] rounded-2xl p-5 space-y-4">
        {/* Account Selector */}
        <div>
          <label className="text-xs text-[#8888BB] font-bold block mb-1">
            الحساب المربوط للنشر
          </label>
          {accounts.length === 0 ? (
            <div className="p-3 bg-[#0E0E1E] border border-[#EF4444]/30 text-[#EF4444] rounded-xl text-xs flex items-center justify-between">
              <span>لا يوجد حساب {activeTab === 'vercel' ? 'Vercel' : 'GitHub'} مربوط</span>
              <button
                onClick={onNavigateAccounts}
                className="px-3 py-1 rounded-lg bg-[#EF4444] text-white font-bold text-xs"
              >
                ربط حساب
              </button>
            </div>
          ) : (
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-[#0E0E1E] border border-[#2A2A50] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#7C5CFC]"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.label} ({a.token ? a.token.slice(0, 8) + '...' : ''})</option>
              ))}
            </select>
          )}
        </div>

        {/* Site / Repo Name */}
        <div>
          <label className="text-xs text-[#8888BB] font-bold block mb-1">
            {activeTab === 'vercel' ? 'اسم الموقع على Vercel' : 'اسم المستودع على GitHub'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              required
              placeholder={activeTab === 'vercel' ? 'my-awesome-site' : 'my-awesome-repo'}
              value={siteName}
              onChange={(e) => setSiteName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              className="flex-1 bg-[#0E0E1E] border border-[#2A2A50] rounded-xl px-3 py-2.5 text-xs text-white font-mono dir-ltr text-left outline-none focus:border-[#7C5CFC]"
            />
            {activeTab === 'vercel' && (
              <span className="text-xs text-[#8888BB] font-mono dir-ltr shrink-0">
                .vercel.app
              </span>
            )}
          </div>
        </div>

        {/* Source Mode Switch */}
        <div>
          <label className="text-xs text-[#8888BB] font-bold block mb-1">مصدر الملفات</label>
          <div className="flex bg-[#0E0E1E] p-1 rounded-xl border border-[#2A2A50]">
            <button
              type="button"
              onClick={() => setSourceMode('code')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                sourceMode === 'code' ? 'bg-[#7C5CFC] text-white' : 'text-[#8888BB]'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>ملف واحد (نص)</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('zip')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                sourceMode === 'zip' ? 'bg-[#7C5CFC] text-white' : 'text-[#8888BB]'
              }`}
            >
              <FileArchive className="w-3.5 h-3.5" />
              <span>مشروع كامل (ZIP)</span>
            </button>
          </div>
        </div>

        {sourceMode === 'zip' ? (
          /* ZIP Upload Zone */
          <div>
            <label className="text-xs text-[#8888BB] font-bold block mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FileArchive className="w-3.5 h-3.5 text-[#7C5CFC]" />
                <span>ملف ZIP للمشروع</span>
              </span>
              <span className="text-[10px] text-[#8888BB]">لازم يحتوي على index.html</span>
            </label>
            <label
              htmlFor="zip-upload-input"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleZipDrop}
              className={`w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-6 cursor-pointer transition-all ${
                isDragOver ? 'border-[#7C5CFC] bg-[#7C5CFC]/10' : 'border-[#2A2A50] hover:border-[#7C5CFC]'
              }`}
            >
              <Upload className={`w-6 h-6 text-[#7C5CFC] ${isDragOver ? 'scale-110' : ''} transition-transform`} />
              {zipFile ? (
                <div className="text-center">
                  <div className="text-xs text-white font-bold">{zipFile.name}</div>
                  <div className="text-[10px] text-[#8888BB] mt-0.5">{zipFileCount} ملف — اضغط أو اسحب ملف تاني للتغيير</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-xs text-white font-bold">
                    {isDragOver ? 'أفلت الملف هنا' : 'اضغط أو اسحب ملف ZIP هنا'}
                  </div>
                  <div className="text-[10px] text-[#8888BB] mt-0.5">مثل vercel.com/drop بالظبط</div>
                </div>
              )}
              <input
                id="zip-upload-input"
                type="file"
                accept=".zip"
                onChange={handleZipSelect}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          /* Code Editor */
          <div>
            <label className="text-xs text-[#8888BB] font-bold block mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Code className="w-3.5 h-3.5 text-[#7C5CFC]" />
                <span>محتوى الملف الرئيسي (index.html)</span>
              </span>
              <span className="text-[10px] text-[#8888BB]">HTML / JS / Tailwind CSS</span>
            </label>
            <textarea
              rows={8}
              value={codeContent}
              onChange={(e) => setCodeContent(e.target.value)}
              className="w-full bg-[#0E0E1E] border border-[#2A2A50] rounded-xl p-3 text-xs text-white font-mono dir-ltr text-left outline-none focus:border-[#7C5CFC] leading-relaxed"
            />
          </div>
        )}

        {/* Deploy Button */}
        <button
          onClick={handleDeploy}
          disabled={isDeploying || accounts.length === 0 || (sourceMode === 'zip' && !zipFile)}
          className={`w-full py-3 rounded-xl font-extrabold text-xs text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg ${
            activeTab === 'vercel'
              ? 'bg-[#0070F3] hover:bg-[#0070F3]/90 shadow-[#0070F3]/20'
              : 'bg-[#238636] hover:bg-[#238636]/90 shadow-[#238636]/20'
          }`}
        >
          {isDeploying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{progressMsg || 'جاري النشر...'}</span>
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              <span>نشر على {activeTab === 'vercel' ? 'Vercel' : 'GitHub'} الآن</span>
            </>
          )}
        </button>
      </div>

      {/* Deployment Result Card */}
      {deployedResult && (
        <div className="bg-[#141428] border border-[#22C55E]/40 rounded-2xl p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center font-bold text-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">تم النشر بنجاح! 🎉</h3>
              <p className="text-xs text-[#8888BB]">المشروع جاهز أونلاين ويعمل مباشرة</p>
            </div>
          </div>

          <div className="bg-[#0E0E1E] border border-[#2A2A50] p-3 rounded-xl flex items-center justify-between gap-2">
            <a
              href={deployedResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-[#0070F3] hover:underline dir-ltr text-left truncate flex-1"
            >
              {deployedResult.url}
            </a>

            <div className="flex items-center gap-1 shrink-0">
              <a
                href={deployedResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-[#141428] text-white hover:text-[#0070F3]"
                title="فتح الرابط"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={handleCopyUrl}
                className="p-1.5 rounded-lg bg-[#141428] text-white hover:text-[#22C55E]"
                title="نسخ"
              >
                {copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Vercel Alias Config */}
          {activeTab === 'vercel' && (
            <div className="pt-3 border-t border-[#2A2A50] space-y-2">
              <label className="text-xs text-[#8888BB] font-bold block">
                تخصيص اسم الرابط (Alias)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="my-custom-name"
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="flex-1 bg-[#0E0E1E] border border-[#2A2A50] rounded-xl px-3 py-2 text-xs text-white font-mono dir-ltr text-left outline-none focus:border-[#0070F3]"
                />
                <span className="text-xs text-[#8888BB] font-mono dir-ltr">.vercel.app</span>
                <button
                  onClick={handleApplyAlias}
                  className="px-3 py-2 rounded-xl bg-[#0070F3] text-white font-bold text-xs hover:bg-[#0070F3]/90"
                >
                  تطبيق
                </button>
              </div>
              {aliasMsg && <div className="text-xs text-[#22C55E] mt-1">{aliasMsg}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
