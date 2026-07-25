import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              // نسخة جديدة اتفعّلت — ممكن تعرض تنبيه تحديث هنا لو حابب
              console.log('NASHR PRO: تم تفعيل نسخة محدثة');
            }
          });
        });
      })
      .catch(err => console.warn('Service worker registration failed:', err));
  });
}
