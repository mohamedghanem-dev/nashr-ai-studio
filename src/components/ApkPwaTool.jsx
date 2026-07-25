import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle2, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';

export function ApkPwaTool({ onNotify }) {
  const [copiedManifest, setCopiedManifest] = useState(false);

  const manifestJson = `{
  "short_name": "NASHR PRO",
  "name": "NASHR PRO - Web Publishing Hub",
  "icons": [
    {
      "src": "/icon.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": "/",
  "background_color": "#060610",
  "theme_color": "#060610",
  "display": "standalone"
}`;

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(manifestJson);
    setCopiedManifest(true);
    onNotify('تم نسخ ملف Web Manifest!', 'success');
    setTimeout(() => setCopiedManifest(false), 2000);
  };

  return (
    <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#F59E0B]" />
          <span>مولد التطبيقات APK و PWA</span>
        </h2>
      </div>

      <div className="bg-[#141428] border border-[#2A2A50] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center font-bold text-lg">
            📲
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">تحويل أي موقع أو تطبيق إلى ملف Android APK</h3>
            <p className="text-xs text-[#8888BB]">يمكنك تحويل روابط Vercel المنشورة إلى تطبيق أندرويد جاهز للثبيت</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="p-3 bg-[#0E0E1E] rounded-xl border border-[#2A2A50] space-y-1">
            <div className="text-xs font-bold text-[#F59E0B]">الخطوة 1: انسخ رابط مشروعك المنشور من NASHR PRO</div>
            <div className="text-[11px] text-[#8888BB]">احصل على رابط .vercel.app الخاص بمشروعك المنشور</div>
          </div>

          <div className="p-3 bg-[#0E0E1E] rounded-xl border border-[#2A2A50] space-y-2">
            <div className="text-xs font-bold text-[#F59E0B]">الخطوة 2: استخدم منصة PWABuilder أو Web2APK</div>
            <div className="text-[11px] text-[#8888BB]">ضع رابط الموقع لتحويله فوراً إلى APK أصلي لأجهزة أندرويد</div>
            <a
              href="https://www.pwabuilder.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F59E0B] text-black font-extrabold text-xs hover:bg-[#F59E0B]/90 transition-all"
            >
              <span>افتح PWABuilder الآن</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Web Manifest Generator */}
      <div className="bg-[#141428] border border-[#2A2A50] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">ملف Web Manifest</h3>
          <button
            onClick={handleCopyManifest}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E0E1E] border border-[#2A2A50] text-[#E8E8FF] hover:border-[#F59E0B] text-xs font-bold"
          >
            {copiedManifest ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>نسخ Manifest</span>
          </button>
        </div>

        <pre className="bg-[#0E0E1E] border border-[#2A2A50] p-3 rounded-xl text-xs font-mono dir-ltr text-left text-[#A78BFA] overflow-x-auto">
          {manifestJson}
        </pre>
      </div>
    </div>
  );
}
