import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { initStorage } from './storage';
import { I18nProvider } from './i18n';
import App from './App';

initStorage();

// Offline support: precache the whole app (public/sw.js). Production only, so dev reloads stay fresh.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* offline support is best-effort */ });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
