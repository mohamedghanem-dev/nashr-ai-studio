import React, { useState } from 'react';
import { storage } from '../services/api';
import { Settings as SettingsIcon, Sun, Moon, Lock, Download, Upload, Trash2, Shield, Info } from 'lucide-react';

export function Settings({ theme, toggleTheme, onNotify }) {
  const [pinInput, setPinInput] = useState(storage.getPin());
  const [pinSavedMsg, setPinSavedMsg] = useState('');

  const handleSavePin = (e) => {
    e.preventDefault();
    storage.savePin(pinInput);
    setPinSavedMsg('تم حفظ رمز PIN بنجاح!');
    onNotify('تم تحديث قفل PIN', 'success');
    setTimeout(() => setPinSavedMsg(''), 2000);
  };

  const handleExportData = () => {
    const data = {
      accounts: storage.getAccounts(),
      projects: storage.getProjects(),
      settings: storage.getSettings()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nashr_pro_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    onNotify('تم تصدير النسخة الاحتياطية بنجاح!', 'success');
  };

  const handleImportData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.accounts) localStorage.setItem('nashr_accounts_v2', JSON.stringify(parsed.accounts));
        if (parsed.projects) localStorage.setItem('nashr_projects_v2', JSON.stringify(parsed.projects));
        onNotify('تم استعادة البيانات بنجاح! جاري التحديث...', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        onNotify('ملف غير صالح', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (!window.confirm('هل أنت تأكد من مسح جميع الحسابات والمشاريع المحفوظة؟')) return;
    localStorage.clear();
    onNotify('تم مسح جميع البيانات', 'info');
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-[#7C5CFC]" />
          <span>إعدادات النظام والأمان</span>
        </h2>
      </div>

      {/* Appearance */}
      <div className="bg-[#141428] border border-[#2A2A50] rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-[#8888BB] uppercase tracking-wider">المظهر</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-[#7C5CFC]" /> : <Sun className="w-5 h-5 text-[#F59E0B]" />}
            <div>
              <div className="text-xs font-bold text-white">النمط {theme === 'dark' ? 'الليلي الداكن' : 'النهاري المضيء'}</div>
              <div className="text-[11px] text-[#8888BB]">تخصيص ألوان الواجهة وفق تفضيلك</div>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl bg-[#0E0E1E] border border-[#2A2A50] text-xs font-bold text-white hover:border-[#7C5CFC]"
          >
            تغيير المظهر
          </button>
        </div>
      </div>

      {/* Security PIN */}
      <div className="bg-[#141428] border border-[#2A2A50] rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-[#8888BB] uppercase tracking-wider flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[#22C55E]" />
          <span>قفل الحماية بكلمة مرور PIN</span>
        </h3>

        <form onSubmit={handleSavePin} className="space-y-3">
          <div>
            <label className="text-xs text-[#8888BB] block mb-1">رمز PIN من 4 أرقام (اتركه فارغاً للإلغاء)</label>
            <input
              type="password"
              maxLength={4}
              placeholder="****"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-32 bg-[#0E0E1E] border border-[#2A2A50] rounded-xl px-3 py-2 text-center text-sm text-white font-mono dir-ltr outline-none focus:border-[#22C55E]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#22C55E] text-white text-xs font-bold hover:bg-[#22C55E]/90"
          >
            حفظ رمز القفل
          </button>
          {pinSavedMsg && <div className="text-xs text-[#22C55E]">{pinSavedMsg}</div>}
        </form>
      </div>

      {/* Backup and Restore */}
      <div className="bg-[#141428] border border-[#2A2A50] rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-[#8888BB] uppercase tracking-wider">النسخ الاحتياطي والاستعادة</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C5CFC] text-white text-xs font-bold hover:bg-[#7C5CFC]/90"
          >
            <Download className="w-4 h-4" />
            <span>تصدير نسخة احتياطية</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E0E1E] border border-[#2A2A50] text-white text-xs font-bold hover:border-[#7C5CFC] cursor-pointer">
            <Upload className="w-4 h-4 text-[#7C5CFC]" />
            <span>استعادة نسخة JSON</span>
            <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#141428] border border-[#EF4444]/30 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-[#EF4444] uppercase tracking-wider flex items-center gap-1.5">
          <Trash2 className="w-3.5 h-3.5" />
          <span>منطقة الخطر</span>
        </h3>
        <p className="text-xs text-[#8888BB]">مسح جميع البيانات والتوكنات المخزنة محلياً</p>
        <button
          onClick={handleClearAll}
          className="px-4 py-2 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold hover:bg-[#EF4444]/30"
        >
          مسح كافة البيانات المحلية
        </button>
      </div>
    </div>
  );
}
