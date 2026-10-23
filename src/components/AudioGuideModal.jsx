import React from 'react';
import { X, Volume2, Plus, Minus, Mic, Users, Building2, CheckCircle2, Phone, Share2, HelpCircle } from 'lucide-react';
import { sounds } from '../sound';
import { speakText } from '../speech';

export default function AudioGuideModal({ onClose, lang = 'ur' }) {
  const guideTextUrdu = `
    السلام علیکم! کھاتہ ایپ چلانے کا آسان طریقہ:
    نمبر 1: گاہک بنانے کے لیے نیچے دیا گیا گول پلس کا بٹن دبائیں۔
    نمبر 2: جب آپ گاہک کو ادھار سامان دیں، تو لال رنگ کا بٹن "سامان دیا" دبائیں۔
    نمبر 3: جب گاہک سے پیسے وصول ہوں، تو ہرا رنگ کا بٹن "پیسے ملے" دبائیں۔
    نمبر 4: بول کر حساب درج کرنے کے لیے مائیکروفون کا بٹن دبائیں اور بولیں، جیسے "علی پانچ سو ادھار"۔
    نمبر 5: دکان کا ڈیٹا کبھی ضائع نہیں ہوگا اور موبائل فون اور کلاؤڈ میں ہمیشہ محفوظ رہے گا۔
  `;

  const guideTextRoman = `
    Assalam-o-Alaikum! Khatta App chalane ka asaan tareeqa:
    Number 1: Naya grahak banane k liye neeche diya gaya Plus ka button dabayein.
    Number 2: Jab aap udhar saman dein, to Laal (Red) button "Saman Diya" dabayein.
    Number 3: Jab paise wasool hon, to Hara (Green) button "Paise Mile" dabayein.
    Number 4: Bol kar hisab likhne k liye mic ka button dabayein aur bolein, jaise "Ali 500 udhar".
    Number 5: Apka hisab hamesha phone aur internet cloud dono me mehfooz rahega.
  `;

  const handleSpeak = () => {
    sounds.playTap();
    speakText(lang === 'ur' ? guideTextUrdu : guideTextRoman, lang);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="modal-sheet animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', margin: 'auto', padding: '24px 20px', maxHeight: '88vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <HelpCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                {lang === 'ur' ? 'ایپ چلانے کا آسان طریقہ' : 'App Chalane Ka Tareeqa'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {lang === 'ur' ? 'آسان رہنمائی اور ہدایات' : 'Easy Audio & Visual Guide'}
              </div>
            </div>
          </div>

          <button
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            onClick={() => { sounds.playTap(); onClose(); }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Big Audio Listen Bar */}
        <button
          onClick={handleSpeak}
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: 'white',
            fontSize: '15px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
            marginBottom: '18px'
          }}
        >
          <Volume2 size={20} />
          <span>{lang === 'ur' ? '🔊 پوری رہنمائی آواز میں سنیں' : '🔊 Awaz Me Tareeqa Sunen'}</span>
        </button>

        {/* 4 Illustrated Step Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Step 1: Red Button (Udhar Diya) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '14px',
            background: '#fff1f2',
            border: '1.5px solid #fecdd3'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#e11d48',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Minus size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#be123c' }}>
                {lang === 'ur' ? '1. لال رنگ: سامان دیا (ادھار)' : '1. Red Button: Saman Diya (Udhar)'}
              </div>
              <div style={{ fontSize: '12px', color: '#881337', marginTop: '2px' }}>
                {lang === 'ur' ? 'جب بھی دکان سے ادھار سامان جائے، لال بٹن دبا کر رقم درج کریں۔' : 'Jab bhi udhar saman dein to yeh button dabayein.'}
              </div>
            </div>
          </div>

          {/* Step 2: Green Button (Paise Mile) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '14px',
            background: '#f0fdf4',
            border: '1.5px solid #bbf7d0'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#16a34a',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Plus size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#15803d' }}>
                {lang === 'ur' ? '2. ہرا رنگ: پیسے ملے (وصولی)' : '2. Green Button: Paise Mile (Wasool)'}
              </div>
              <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>
                {lang === 'ur' ? 'جب گاہک نقد رقم جمع کروائے، تو ہرا بٹن دبا کر وصولی درج کریں۔' : 'Jab grahak paise wapis kare to hara button dabayein.'}
              </div>
            </div>
          </div>

          {/* Step 3: Voice Mic */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '14px',
            background: '#eff6ff',
            border: '1.5px solid #bfdbfe'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#2563eb',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Mic size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#1d4ed8' }}>
                {lang === 'ur' ? '3. مائیک: بول کر حساب لکھیں' : '3. Mic Button: Bol Kar Likhein'}
              </div>
              <div style={{ fontSize: '12px', color: '#1e40af', marginTop: '2px' }}>
                {lang === 'ur' ? 'مائیک دبا کر منہ سے بولیں جیسے "علی ہزار روپے ادھار"، یہ خود درج کرے گا۔' : 'Bol kar hisab darj karein, typing ki zaroorat nahi.'}
              </div>
            </div>
          </div>

          {/* Step 4: Add New Customer / Supplier */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '14px',
            background: '#faf5ff',
            border: '1.5px solid #e9d5ff'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#9333ea',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#7e22ce' }}>
                {lang === 'ur' ? '4. نیا کھاتہ کھولنا (+ بٹن)' : '4. Naya Khata (+ Button)'}
              </div>
              <div style={{ fontSize: '12px', color: '#6b21a8', marginTop: '2px' }}>
                {lang === 'ur' ? 'اسکرین کے نیچے گول (+) بٹن دبا کر نیا گاہک یا نیا سپلائر شامل کریں۔' : 'Neeche Plus button daba kar naya banda shamil karein.'}
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          style={{
            width: '100%',
            height: '44px',
            borderRadius: '14px',
            border: '1px solid #cbd5e1',
            background: 'white',
            color: '#475569',
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            marginTop: '20px'
          }}
          onClick={() => { sounds.playTap(); onClose(); }}
        >
          {lang === 'ur' ? 'سمجھ آ گیا (بند کریں)' : 'Samajh Aa Gaya (Close)'}
        </button>
      </div>
    </div>
  );
}
