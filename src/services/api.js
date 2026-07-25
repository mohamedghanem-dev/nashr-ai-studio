// API and Local Storage Service for NASHR PRO

const STORAGE_KEYS = {
  ACCOUNTS: 'nashr_accounts_v2',
  PROJECTS: 'nashr_projects_v2',
  SETTINGS: 'nashr_settings_v2',
  PIN: 'nashr_pin_v2'
};

export const storage = {
  getAccounts: () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
    } catch {
      return [];
    }
  },
  saveAccount: (account) => {
    const accounts = storage.getAccounts();
    const existingIdx = accounts.findIndex(a => a.id === account.id || (a.platform === account.platform && a.token === account.token));
    if (existingIdx >= 0) {
      accounts[existingIdx] = { ...accounts[existingIdx], ...account };
    } else {
      accounts.push({ id: account.id || Date.now(), ...account });
    }
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    return accounts;
  },
  deleteAccount: (id) => {
    const accounts = storage.getAccounts().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    return accounts;
  },

  getProjects: () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    } catch {
      return [];
    }
  },
  saveProject: (project) => {
    const projects = storage.getProjects();
    const existingIdx = projects.findIndex(p => p.id === project.id || (p.platform === project.platform && p.name === project.name));
    if (existingIdx >= 0) {
      projects[existingIdx] = { ...projects[existingIdx], ...project, updatedAt: Date.now() };
    } else {
      projects.unshift({ id: project.id || Date.now(), ...project, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return projects;
  },
  deleteProject: (id) => {
    const projects = storage.getProjects().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return projects;
  },

  getSettings: () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{"theme":"dark","autoSync":true}');
    } catch {
      return { theme: 'dark', autoSync: true };
    }
  },
  saveSettings: (settings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  },

  getPin: () => localStorage.getItem(STORAGE_KEYS.PIN) || '',
  savePin: (pin) => localStorage.setItem(STORAGE_KEYS.PIN, pin || ''),
};

// ── VERCEL API ──
export const vercelApi = {
  getUser: async (token) => {
    const res = await fetch('https://api.vercel.com/v2/user', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('فشل التحقق من توكن Vercel');
    const data = await res.json();
    return data.user || data;
  },

  getProjects: async (token) => {
    const res = await fetch('https://api.vercel.com/v9/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('فشل جلب مشاريع Vercel');
    const data = await res.json();
    return data.projects || [];
  },

  triggerRedeploy: async (projectId, token) => {
    const res = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: projectId, target: 'production' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'فشلت عملية إعادت النشر');
    return data;
  },

  deleteProject: async (projectId, token) => {
    const res = await fetch(`https://api.vercel.com/v9/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error?.message || 'فشل حذف المشروع');
    }
    return true;
  },

  applyAlias: async (deploymentId, alias, token) => {
    const cleanAlias = alias.replace(/\.vercel\.app$/i, '');
    const res = await fetch(`https://api.vercel.com/v2/deployments/${deploymentId}/aliases`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ alias: `${cleanAlias}.vercel.app` })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'فشل تعيين النطاق');
    return `https://${cleanAlias}.vercel.app`;
  },

  deployRawFiles: async (projectName, files, token, onProgress) => {
    if (onProgress) onProgress('إعداد تجهيز الملفات...');
    
    // Deploy request to Vercel v13 API
    const res = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: projectName,
        files: files, // Array of { file: 'index.html', data: 'content...' }
        projectSettings: { framework: null }
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'فشل نشر الملفات على Vercel');
    
    const deploymentId = data.id;
    const url = data.url ? `https://${data.url}` : `https://${projectName}.vercel.app`;

    // Poll status
    if (onProgress) onProgress('مراقبة اكتمل البناء...');
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statusData = await statusRes.json();
      if (statusData.readyState === 'READY') {
        return { id: deploymentId, url: `https://${statusData.url || data.url}` };
      }
      if (statusData.readyState === 'ERROR') {
        throw new Error('حدث خطأ أثناء بناء المشروع على Vercel');
      }
    }
    return { id: deploymentId, url };
  }
};

// ── GITHUB API ──
export const gitHubApi = {
  getUser: async (token) => {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (!res.ok) throw new Error('فشل التحقق من حساب GitHub');
    return await res.json();
  },

  getRepos: async (token) => {
    const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated&type=all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (!res.ok) throw new Error('فشل جلب مستودعات GitHub');
    return await res.json();
  },

  getBranches: async (owner, repo, token) => {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (!res.ok) return [];
    return await res.json();
  },

  createRepo: async (repoName, description, isPrivate, token) => {
    const res = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        name: repoName,
        description: description || 'Created via NASHR PRO',
        private: Boolean(isPrivate),
        auto_init: true
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل إنشاء مستودع GitHub');
    return data;
  },

  uploadFile: async (owner, repo, filePath, contentB64, commitMessage, token) => {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: commitMessage || 'Upload file via NASHR PRO',
        content: contentB64
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'فشل رفع الملف إلى GitHub');
    return data;
  },

  connectGitHubRepoToVercel: async (repoOwner, repoName, vercelToken) => {
    // Create or link Vercel project to GitHub Repo
    const res = await fetch('https://api.vercel.com/v9/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        gitRepository: {
          type: 'github',
          repo: `${repoOwner}/${repoName}`
        }
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'فشل ربط مستودع GitHub بـ Vercel');
    return data;
  }
};
