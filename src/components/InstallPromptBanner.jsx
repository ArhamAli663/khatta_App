import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle2, ShieldCheck, Sparkles, HelpCircle } from 'lucide-react';
import { sounds } from '../sound';

export default function InstallPromptBanner({ lang = 'ur' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    try {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        localStorage.getItem('khatta_app_installed_v1') === 'true'
      );
    } catch (e) {
      return false;
    }
  });
  const [showHowToModal, setShowHowToModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode or marked as installed
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      localStorage.getItem('khatta_app_installed_v1') === 'true'
    ) {
      setIsInstalled(true);
      window.khattaIsInstalled = true;
      return;
    }

    const handleBeforeInstall = (e) => {
      if (localStorage.getItem('khatta_app_installed_v1') === 'true') return;
      e.preventDefault();
      setDeferredPrompt(e);
      window.khattaInstallPrompt = e;
      window.dispatchEvent(new CustomEvent('khatta-install-ready'));
    };

    const handleAppInstalled = () => {
      try {
        localStorage.setItem('khatta_app_installed_v1', 'true');
      } catch (e) {}
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.khattaInstallPrompt = null;
      window.khattaIsInstalled = true;
      window.dispatchEvent(new CustomEvent('khatta-installed-complete'));
      sounds.playSuccessFanfare();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // If already installed or dismissed, hide banner forever
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    sounds.playTap();
    const promptEvent = deferredPrompt || window.khattaInstallPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        try {
          localStorage.setItem('khatta_app_installed_v1', 'true');
        } catch (e) {}
        setIsInstalled(true);
        window.khattaIsInstalled = true;
        window.dispatchEvent(new CustomEvent('khatta-installed-complete'));
        sounds.playSuccessFanfare();
        setDeferredPrompt(null);
        window.khattaInstallPrompt = null;
      }
    } else {
      // If browser hasn't fired prompt (iOS or delayed Chrome event), show step-by-step
      setShowHowToModal(true);
    }
  };



  return (
    <>
      {/* Eye-catching Install Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
          color: 'white',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          boxShadow: '0 4px 12px rgba(6, 78, 59, 0.35)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Download size={18} color="#ffffff" className="animate-bounce" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {lang === 'ur' ? '📲 موبائل میں ایپ انسٹال کریں' : '📲 Install Khatta App on Phone'}
            </div>
            <div style={{ fontSize: '10px', color: '#a7f3d0' }}>
              {lang === 'ur' ? '100% محفوظ • پلے پروٹیکٹ ویری فائیڈ' : '100% Safe • Play Protect Verified'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleInstallClick}
            style={{
              height: '32px',
              padding: '0 12px',
              borderRadius: '8px',
              border: 'none',
              background: '#ffffff',
              color: '#065f46',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
            }}
          >
            <Download size={13} />
            <span>{lang === 'ur' ? 'انسٹال کریں' : 'Install'}</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Step-by-Step Instructions Modal (if native prompt isn't directly triggered) */}
      {showHowToModal && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 999999, background: 'rgba(15, 23, 42, 0.8)' }}
          onClick={() => setShowHowToModal(false)}
        >
          <div
            className="modal-sheet animate-slide-up"
            style={{
              maxWidth: '380px',
              margin: 'auto',
              padding: '24px 20px',
              textAlign: 'center',
              borderRadius: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <ShieldCheck size={28} />
            </div>

            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
              {lang === 'ur' ? 'کروم (Chrome) سے انسٹال کرنے کا طریقہ' : 'How to Install from Chrome'}
            </div>

            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '18px' }}>
              {lang === 'ur'
                ? 'یہ ایپ موبائل کے لیے 100% محفوظ ہے اور پلے پروٹیکٹ اس پر کوئی وارننگ نہیں دیتا۔'
                : '100% Safe WebAPK without any unknown source warnings.'}
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'right', marginBottom: '20px' }}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>1</div>
                <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>
                  {lang === 'ur' ? 'براؤزر کے اوپر دائیں کونے میں 3 ڈاٹس (⋮) دبائیں۔' : 'Tap the 3 dots (⋮) in Chrome top right.'}
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>2</div>
                <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>
                  {lang === 'ur' ? '"Install app" یا "Add to Home screen" دبائیں۔' : 'Select "Install app" or "Add to Home Screen".'}
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>3</div>
                <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>
                  {lang === 'ur' ? 'ایپ خودکار طور پر موبائل کی ایپس میں شامل ہو جائے گی!' : 'App installs cleanly without any warning!'}
                </div>
              </div>
            </div>

            <button
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '12px',
                border: 'none',
                background: '#059669',
                color: 'white',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
              onClick={() => setShowHowToModal(false)}
            >
              {lang === 'ur' ? 'سمجھ آ گئی' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
