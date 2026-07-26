import React, { useState, useEffect, useRef } from 'react';
import { gitHubApi, storage } from '../services/api';
import {
  Smartphone, Upload, Rocket, RefreshCw, CheckCircle2,
  XCircle, ExternalLink, Download, Wifi, WifiOff, Image as ImageIcon
} from 'lucide-react';

// المستودع الثابت المخصص لبناء APK من رابط — لازم يكون فيه workflow build.yml
// (اللي جهزناه في مستودع apks-for-nashr)
const TARGET_OWNER = 'adamstamer030-jpg';
const TARGET_REPO = 'apks-for-nashr';
const WORKFLOW_FILE = 'build.yml';

export function SiteToApk({ onNotify, onNavigateAccounts }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const [siteUrl, setSiteUrl] = useState('');
  const [appName, setAppName] = useState('');
  const [appId, setAppId] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);

  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [isBuilding, setIsBuilding] = useState(false);
  const [stage, setStage] = useState(''); // 'uploading-icon' | 'dispatching' | 'queued' | 'in_progress' | 'completed' | 'failed'
  const [runInfo, setRunInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const pollRef = useRef(null);
  const dispatchTimeRef = useRef(null);

  useEffect(() => {
    const accs = storage.getAccounts().filter(a => a.platform === 'github');
    setAccounts(accs);
    if (accs.length > 0) setSelectedAccountId(accs[0].id);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const currentAcc = accounts.find(a => Number(a.id) === Number(selectedAccountId));

  const handleIconFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onNotify('اختر ملف صورة صحيح فقط', 'warning');
      return;
    }
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const resetBuildState = () => {
    setIsBuilding(false);
    setStage('');
    setRunInfo(null);
    setErrorMsg('');
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const startPolling = () => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      if (attempts > 120) { // ~10 دقايق كحد أقصى
        clearInterval(pollRef.current);
        setErrorMsg('استغرق البناء وقت أطول من المتوقع — تابع الحالة من GitHub Actions مباشرة');
        setIsBuilding(false);
        return;
      }
      try {
        const runs = await gitHubApi.getWorkflowRuns(TARGET_OWNER, TARGET_REPO, WORKFLOW_FILE, currentAcc.token);
        const dispatchTime = dispatchTimeRef.current;
        const candidate = runs.find(r => new Date(r.created_at).getTime() >= dispatchTime - 5000);
        if (!candidate) return; // لسه الـ run مظهرش في القائمة

        setRunInfo(candidate);

        if (candidate.status === 'completed') {
          clearInterval(pollRef.current);
          setIsBuilding(false);
          if (candidate.conclusion === 'success') {
            setStage('completed');
            const artifacts = await gitHubApi.getRunArtifacts(TARGET_OWNER, TARGET_REPO, candidate.id, currentAcc.token);
            setRunInfo(prev => ({ ...prev, artifacts }));
            onNotify('🎉 اكتمل بناء الـ APK بنجاح!', 'success');
          } else {
            setStage('failed');
            onNotify('❌ فشل بناء الـ APK — راجع سجل الـ Actions', 'error');
          }
        } else {
          setStage(candidate.status); // queued / in_progress
        }
      } catch (err) {
        // مفيش داعي نوقف الـ polling لخطأ عابر في الشبكة
        console.warn('poll error', err);
      }
    }, 5000);
  };

  const handleBuild = async () => {
    if (!siteUrl.trim()) { onNotify('أدخل رابط الموقع', 'warning'); return; }
    if (!appName.trim()) { onNotify('أدخل اسم التطبيق', 'warning'); return; }
    if (!currentAcc) { onNotify('اختر حساب GitHub أولاً', 'warning'); return; }
    if (!iconFile) { onNotify('اختر أيقونة التطبيق', 'warning'); return; }

    const cleanAppId = appId.trim() || `com.nashr.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    resetBuildState();
    setIsBuilding(true);

    try {
      setStage('uploading-icon');
      const iconB64 = await fileToBase64(iconFile);
      await gitHubApi.uploadFile(
        TARGET_OWNER, TARGET_REPO, 'inputs/icon.png', iconB64,
        `Update icon via NASHR PRO (${appName})`, currentAcc.token
      );

      setStage('dispatching');
      dispatchTimeRef.current = Date.now();
      await gitHubApi.triggerWorkflow(TARGET_OWNER, TARGET_REPO, WORKFLOW_FILE, {
        site_url: siteUrl.trim(),
        app_name: appName.trim(),
        app_id: cleanAppId,
        offline_mode: offlineMode ? 'true' : 'false'
      }, currentAcc.token);

      setStage('queued');
      onNotify('🚀 تم تشغيل عملية البناء — بتابع الحالة تلقائيًا', 'success');
      startPolling();
    } catch (err) {
      setIsBuilding(false);
      setErrorMsg(err.message);
      onNotify(`❌ ${err.message}`, 'error');
    }
  };

  const handleDownload = async (artifact) => {
    try {
      onNotify('⏳ جارٍ تجهيز التحميل...', 'info');
      const blob = await gitHubApi.downloadArtifact(TARGET_OWNER, TARGET_REPO, artifact.id, currentAcc.token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${appName || 'app'}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      onNotify(`❌ ${err.message}`, 'error');
    }
  };

  const stageLabel = {
    'uploading-icon': 'جارٍ رفع الأيقونة...',
    'dispatching': 'جارٍ تشغيل البناء...',
    'queued': 'في الانتظار...',
    'in_progress': 'جارٍ البناء...',
    'completed': 'اكتمل البناء',
    'failed': 'فشل البناء'
  };

  return (
    <div className="p-4 space-y-4 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Smartphone className="w-5 h-5 text-[#F59E0B]" />
        <h2 className="text-base font-extrabold text-white">APK من رابط موقع</h2>
      </div>

      <div className="bg-[#141428] border border-[#2A2A50] rounded-2xl p-5 space-y-4">
        {/* Account Selector */}
        <div>
          <label className="text-xs text-[#8888BB] font-bold block mb-1">حساب GitHub للبناء</label>
          {accounts.length === 0 ? (
            <div className="p-3 bg-[#0E0E1E] border border-[#EF4444]/30 text-[#EF4444] rounded-xl text-xs flex items-center justify-between">
              <span>لا يوجد حساب GitHub مربوط</span>
              <button onClick={onNavigateAccounts} className="px-3 py-1 rounded-lg bg-[#EF4444] text-white font-bold text-xs">
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
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* Site URL */}
        <div>
          <label className="text-xs text-[#8888BB] font-bold block mb-1">رابط الموقع</label>
          <input
            type="url"
            placeholder="https://example.com"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            className="w-full bg-[#0E0E1E] border border-[#2A2A50] rounded-xl px-3 py-2.5 text-xs text-white font-mono dir-ltr text-left outline-none focus:border-[#7C5CFC]"
          />
        </div>

        {/* App Name & ID */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[#8888BB] font-bold block mb-1">اسم التطبيق</label>
            <input
              type="text"
              placeholder="متجري"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full bg-[#0E0E1E] border border-[#2A2A50] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#7C5CFC]"
            />
          </div>
          <div>
            <label className="text-xs text-[#8888BB] font-bold block mb-1">Package ID (اختياري)</label>
            <input
              type="text"
              placeholder="com.company.app"
              value={appId}
              onChange={(e) => setAppId(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ''))}
              className="w-full bg-[#0E0E1E] border border-[#2A2A50] rounded-xl px-3 py-2.5 text-xs text-white font-mono dir-ltr text-left outline-none focus:border-[#7C5CFC]"
            />
          </div>
        </div>

        {/* Icon Upload */}
        <div>
          <label className="text-xs text-[#8888BB] font-bold block mb-1">أيقونة التطبيق</label>
          <label
            htmlFor="icon-upload-input"
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleIconFile(e.dataTransfer.files?.[0]);
            }}
            className={`w-full flex items-center gap-3 border-2 border-dashed rounded-xl p-3 cursor-pointer transition-all ${
              isDragOver ? 'border-[#7C5CFC] bg-[#7C5CFC]/10' : 'border-[#2A2A50] hover:border-[#7C5CFC]'
            }`}
          >
            {iconPreview ? (
              <img src={iconPreview} alt="icon preview" className="w-12 h-12 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#0E0E1E] flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5 text-[#7C5CFC]" />
              </div>
            )}
            <div className="text-xs">
              <div className="text-white font-bold">{iconFile ? iconFile.name : 'اضغط أو اسحب صورة هنا'}</div>
              <div className="text-[#8888BB] text-[10px] mt-0.5">مربعة يفضل — PNG/JPG</div>
            </div>
            <input
              id="icon-upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleIconFile(e.target.files?.[0])}
            />
          </label>
        </div>

        {/* Offline Mode Switch */}
        <div>
          <label className="text-xs text-[#8888BB] font-bold block mb-1">وضع التشغيل</label>
          <div className="flex bg-[#0E0E1E] p-1 rounded-xl border border-[#2A2A50]">
            <button
              type="button"
              onClick={() => setOfflineMode(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                !offlineMode ? 'bg-[#0070F3] text-white' : 'text-[#8888BB]'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>أونلاين بس</span>
            </button>
            <button
              type="button"
              onClick={() => setOfflineMode(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                offlineMode ? 'bg-[#7C5CFC] text-white' : 'text-[#8888BB]'
              }`}
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>أونلاين + أوفلاين</span>
            </button>
          </div>
          {offlineMode && (
            <div className="text-[10px] text-[#8888BB] mt-1.5 leading-relaxed">
              هياخد لقطة من شكل الموقع وقت البناء تُعرض لو التطبيق اتفتح من غير نت. الميزات
              اللي محتاجة سيرفر حي (بحث، تسجيل دخول...) مش هتشتغل أوفلاين.
            </div>
          )}
        </div>

        {/* Build Button */}
        <button
          onClick={handleBuild}
          disabled={isBuilding || accounts.length === 0}
          className="w-full py-3 rounded-xl font-extrabold text-xs text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg bg-[#F59E0B] hover:bg-[#F59E0B]/90 shadow-[#F59E0B]/20"
        >
          {isBuilding ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{stageLabel[stage] || 'جارٍ العمل...'}</span>
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              <span>ابني الـ APK</span>
            </>
          )}
        </button>
      </div>

      {/* Status Card */}
      {(runInfo || errorMsg) && (
        <div className="bg-[#141428] border border-[#2A2A50] rounded-2xl p-5 space-y-3">
          {errorMsg && (
            <div className="flex items-center gap-2 text-[#EF4444] text-xs">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {runInfo && (
            <>
              <div className="flex items-center gap-2">
                {stage === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                ) : stage === 'failed' ? (
                  <XCircle className="w-5 h-5 text-[#EF4444]" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-[#F59E0B] animate-spin" />
                )}
                <span className="text-sm font-bold text-white">{stageLabel[stage] || runInfo.status}</span>
              </div>

              <a
                href={runInfo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#0070F3] hover:underline"
              >
                <span>فتح تفاصيل التشغيل في GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {stage === 'completed' && runInfo.artifacts?.length > 0 && (
                <div className="pt-2 border-t border-[#2A2A50] space-y-2">
                  {runInfo.artifacts.map(artifact => (
                    <button
                      key={artifact.id}
                      onClick={() => handleDownload(artifact)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#22C55E] text-white font-extrabold text-xs hover:bg-[#22C55E]/90"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل {artifact.name} ({(artifact.size_in_bytes / 1024 / 1024).toFixed(1)}MB)</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
