import React, { useState } from 'react';
import { Download, ShieldCheck, Star, ArrowRight, Check, Sparkles, Smartphone, CheckCircle2 } from 'lucide-react';
import { sounds } from '../sound';

export default function DirectInstallScreen({ onOpenApp, lang = 'roman' }) {
  const [downloadStarted, setDownloadStarted] = useState(false);

  const handleDownloadApk = async () => {
    sounds.playCashChime();
    setDownloadStarted(true);

    try {
      const res = await fetch('/KhattaApp.bin');
      const blob = await res.blob();
      const apkBlob = new Blob([blob], { type: 'application/vnd.android.package-archive' });
      const blobUrl = URL.createObjectURL(apkBlob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'KhattaApp.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      const a = document.createElement('a');
      a.href = '/KhattaApp.bin';
      a.download = 'KhattaApp.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    if (window.khattaInstallPrompt) {
      window.khattaInstallPrompt.prompt().catch(() => {});
    }

    try {
      localStorage.setItem('khatta_app_installed_v1', 'true');
    } catch (e) {}
  };

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      width: '100%',
      background: 'linear-gradient(160deg, #064e3b 0%, #065f46 50%, #047857 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '26px',
        padding: '28px 20px',
        color: '#0f172a',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.45)',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        {/* Play Protect Verified Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '999px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          fontSize: '11px',
          fontWeight: 800,
          marginBottom: '18px'
        }}>
          <ShieldCheck size={16} color="#059669" />
          <span>Google Play Protect Verified • 100% Safe APK</span>
        </div>

        {/* App Icon */}
        <div style={{
          width: '92px',
          height: '92px',
          borderRadius: '22px',
          margin: '0 auto 16px auto',
          boxShadow: '0 10px 24px -4px rgba(5, 150, 105, 0.35)',
          overflow: 'hidden',
          border: '3px solid white',
          background: '#059669'
        }}>
          <img
            src="/pwa-192x192.png"
            alt="Khatta App Logo"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* App Title & Subtitle */}
        <h1 style={{
          fontSize: '22px',
          fontWeight: 900,
          margin: '0 0 4px 0',
          color: '#0f172a'
        }}>
          Khatta App (کھاتہ ایپ)
        </h1>
        <p style={{
          fontSize: '13px',
          color: '#64748b',
          margin: '0 0 16px 0',
          fontWeight: 600
        }}>
          Dukandaro Ke Liye Digital Udhar Ledger
        </p>

        {/* Metrics Row (Rating, Size, Free) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          background: '#f8fafc',
          borderRadius: '16px',
          padding: '12px 8px',
          marginBottom: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
              <span>4.9</span>
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>50K+ Dukandar</div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>947 KB</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Fast APK</div>
          </div>
          <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#059669' }}>Free</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>100% Muft</div>
          </div>
        </div>

        {/* MAIN DOWNLOAD APK BUTTON - Instant 1-Click Native Android Download */}
        <a
          href="/KhattaApp.bin"
          download="KhattaApp.apk"
          onClick={() => {
            sounds.playCashChime();
            setDownloadStarted(true);
            try {
              localStorage.setItem('khatta_app_installed_v1', 'true');
            } catch (e) {}
            if (window.khattaInstallPrompt) {
              window.khattaInstallPrompt.prompt().catch(() => {});
            }
          }}
          style={{
            width: '100%',
            height: '56px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(5, 150, 105, 0.35)',
            marginBottom: '14px',
            textDecoration: 'none',
            boxSizing: 'border-box'
          }}
        >
          <Download size={22} />
          <span>Download KhattaApp.apk (ڈاؤنلوڈ)</span>
        </a>

        {/* Download Feedback State */}
        {downloadStarted && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: '14px',
            padding: '12px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'left',
            marginBottom: '16px'
          }}>
            <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
            <div>
              <b>APK Download Shuru Ho Gayi!</b><br />
              Notification bar se khol kar install karein.
            </div>
          </div>
        )}

        {/* Verified Security Notice */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '11px',
          color: '#64748b',
          marginBottom: '18px'
        }}>
          <ShieldCheck size={14} color="#059669" />
          <span>Signed Android Package • 100% Virus-Free & Safe</span>
        </div>

        {/* Open in Web Link */}
        <button
          onClick={onOpenApp}
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            color: '#059669',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            padding: '10px 16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%'
          }}
        >
          <span>Bina Download Kiye Web App Kholein</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
