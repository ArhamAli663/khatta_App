import React, { useState, useEffect } from 'react';
import { Store, Mic, Database, Lock, User, Volume2, HelpCircle, Download, LogIn, UserCheck, History } from 'lucide-react';
import { sounds } from '../sound';

export default function Header({
  shop,
  lang,
  setLang,
  t,
  onOpenVoice,
  onOpenBackup,
  onOpenAuth,
  onLockApp,
  onOpenGuide,
  onOpenHistory
}) {
  const [canInstall, setCanInstall] = useState(Boolean(window.khattaInstallPrompt));
  const [isInstalled, setIsInstalled] = useState(() => {
    try {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        localStorage.getItem('khatta_app_installed_v1') === 'true' ||
        window.khattaIsInstalled === true
      );
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const handleReady = () => setCanInstall(true);
    const handleInstalled = () => {
      setIsInstalled(true);
      window.khattaIsInstalled = true;
    };
    window.addEventListener('khatta-install-ready', handleReady);
    window.addEventListener('khatta-installed-complete', handleInstalled);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('khatta-install-ready', handleReady);
      window.removeEventListener('khatta-installed-complete', handleInstalled);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleHeaderInstall = () => {
    sounds.playTap();
    if (window.khattaInstallPrompt) {
      window.khattaInstallPrompt.prompt();
    } else {
      onOpenGuide();
    }
  };

  return (
    <header className="app-header">
      <div className="header-top">
        {/* Shop Badge */}
        <div className="shop-badge clickable" onClick={() => { sounds.playTap(); onOpenAuth(); }}>
          <div className="shop-icon-box">
            <Store size={22} />
          </div>
          <div>
            <div className="shop-title">{shop.shopName || t.appName}</div>
            <div className="shop-subtitle">
              <User size={12} />
              <span>{shop.ownerName || 'دکاندار'}</span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="header-actions">
          {/* Prominent Login Button for Non-Logged-in Users */}
          {!shop.isLoggedIn ? (
            <button
              className="header-login-btn"
              onClick={() => { sounds.playTap(); onOpenAuth(); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                height: '32px',
                padding: '0 10px',
                borderRadius: '10px',
                border: '1.5px solid #059669',
                background: '#ecfdf5',
                color: '#065f46',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(5, 150, 105, 0.15)',
                whiteSpace: 'nowrap'
              }}
              title={lang === 'ur' ? 'اکاؤنٹ لاگ ان کریں' : 'Log In'}
            >
              <LogIn size={14} />
              <span>{lang === 'ur' ? 'لاگ ان' : 'Login'}</span>
            </button>
          ) : (
            <button
              className="header-login-btn"
              onClick={() => { sounds.playTap(); onOpenAuth(); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                height: '32px',
                padding: '0 9px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#0f172a',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              title={lang === 'ur' ? 'دکان کی پروفائل' : 'Profile'}
            >
              <UserCheck size={14} color="#059669" />
              <span>{lang === 'ur' ? 'پروفائل' : 'Profile'}</span>
            </button>
          )}

          {/* Khata History & Recycle Bin */}
          <button
            className="icon-btn"
            style={{ width: '32px', height: '32px', color: '#6366f1', borderColor: '#c7d2fe', background: '#eef2ff' }}
            onClick={() => { sounds.playTap(); onOpenHistory(); }}
            title={lang === 'ur' ? 'کھاتہ ہسٹری اور ری سائیکل بن' : 'Khata History'}
            aria-label="Khata History"
          >
            <History size={16} />
          </button>

          {/* Backup / Export */}
          <button
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            onClick={() => { sounds.playTap(); onOpenBackup(); }}
            title={t.backupTitle}
            aria-label={t.backupTitle}
          >
            <Database size={16} />
          </button>

          {/* Lock App PIN */}
          {shop.pin && (
            <button
              className="icon-btn"
              style={{ width: '32px', height: '32px', color: '#e11d48', borderColor: '#fecdd3', background: '#fff1f2' }}
              onClick={() => { sounds.playTap(); onLockApp(); }}
              title={lang === 'ur' ? 'ایپ لاک کریں' : 'Lock App'}
              aria-label="Lock App"
            >
              <Lock size={15} />
            </button>
          )}

          {/* Direct Install PWA Button (Hidden forever if already installed) */}
          {!isInstalled && (
            <button
              className="icon-btn"
              style={{ width: '32px', height: '32px', color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5', position: 'relative' }}
              onClick={handleHeaderInstall}
              title={lang === 'ur' ? '📲 موبائل میں ایپ انسٹال کریں' : 'Install Khatta App'}
              aria-label="Install App"
            >
              <Download size={16} />
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10b981'
              }}></span>
            </button>
          )}
        </div>
      </div>


      {/* Language Switcher Bar & Audio Guide Pill */}
      <div className="header-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="lang-switcher">
          <button
            className={`lang-btn ${lang === 'ur' ? 'active' : ''}`}
            onClick={() => { sounds.playTap(); setLang('ur'); }}
          >
            اردو
          </button>
          <button
            className={`lang-btn ${lang === 'roman' ? 'active' : ''}`}
            onClick={() => { sounds.playTap(); setLang('roman'); }}
          >
            Roman Urdu
          </button>
          <button
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => { sounds.playTap(); setLang('en'); }}
          >
            English
          </button>
        </div>

        {/* Audio Help Pill */}
        <button
          onClick={() => { sounds.playTap(); onOpenGuide(); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '999px',
            border: '1px solid #a7f3d0',
            background: '#ecfdf5',
            color: '#059669',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          <Volume2 size={12} />
          <span>{lang === 'ur' ? 'رہنمائی سنیں' : 'Audio Guide'}</span>
        </button>
      </div>
    </header>
  );
}
