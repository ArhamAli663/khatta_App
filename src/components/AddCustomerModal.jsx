import React, { useState, useRef } from 'react';
import { X, Mic, UserPlus, Check, Sparkles } from 'lucide-react';
import { sounds } from '../sound';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../speech';
import { convertToUrduScript } from '../urduTransliterate';

export default function AddCustomerModal({ onClose, onSave, t, lang }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [isListeningName, setIsListeningName] = useState(false);
  const [isListeningAddress, setIsListeningAddress] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState('');

  const nameInputRef = useRef(null);
  const addressInputRef = useRef(null);

  // Voice speech for customer name (Converts to Urdu automatically!)
  const handleVoiceName = () => {
    sounds.playTap();

    if (!isSpeechRecognitionSupported()) {
      alert(t.notSupportedVoice);
      return;
    }

    setIsListeningName(true);
    setOfflineNotice('');
    const recognizer = createSpeechRecognizer({
      lang: 'ur-PK',
      autoConvertToUrdu: true,
      onResult: (urduName, raw) => {
        setIsListeningName(false);
        const clean = (urduName || raw || '')
          .replace(/(naam|mera|grahak|customer|نام|کا)/gi, '')
          .trim();
        setName(clean || urduName);
        sounds.playCashChime();
      },
      onError: (err) => {
        setIsListeningName(false);
        setOfflineNotice(lang === 'ur' ? 'مائیک فعال ہے، واضح بولیں یا نام لکھیں۔' : 'Speak clearly or enter name.');
      },
      onEnd: () => setIsListeningName(false)
    });
    if (recognizer) {
      try { recognizer.start(); } catch (e) { setIsListeningName(false); }
    }
  };

  // Voice speech for Address (Converts to Urdu automatically!)
  const handleVoiceAddress = () => {
    sounds.playTap();

    if (!isSpeechRecognitionSupported()) {
      alert(t.notSupportedVoice);
      return;
    }

    setIsListeningAddress(true);
    setOfflineNotice('');
    const recognizer = createSpeechRecognizer({
      lang: 'ur-PK',
      autoConvertToUrdu: true,
      onResult: (urduAddress) => {
        setIsListeningAddress(false);
        setAddress(urduAddress);
        sounds.playCashChime();
      },
      onError: (err) => {
        setIsListeningAddress(false);
        setOfflineNotice(lang === 'ur' ? 'پتہ واضح بولیں یا لکھیں۔' : 'Speak clearly or enter address.');
      },
      onEnd: () => setIsListeningAddress(false)
    });
    if (recognizer) {
      try { recognizer.start(); } catch (e) { setIsListeningAddress(false); }
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    sounds.playCashChime();

    const initialTransactions = [];
    const openNum = parseFloat(openingBalance);
    if (openNum && openNum > 0) {
      initialTransactions.push({
        id: `tx-init-${Date.now()}`,
        type: 'gave',
        amount: openNum,
        details: lang === 'ur' ? 'سابقہ پرانا ادھار' : 'Purana Khata / Opening Udhar',
        date: new Date().toISOString()
      });
    }

    // Name is saved directly in proper Urdu script
    const finalName = convertToUrduScript(name.trim()) || name.trim();
    const finalAddress = address ? (convertToUrduScript(address.trim()) || address.trim()) : '';

    onSave({
      id: `cust-${Date.now()}`,
      name: finalName,
      phone: phone.trim(),
      address: finalAddress,
      createdAt: new Date().toISOString(),
      transactions: initialTransactions
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ color: 'var(--primary)' }}>
            <UserPlus size={22} />
            <span>{t.addCustomer}</span>
          </div>

          <button
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            onClick={() => { sounds.playTap(); onClose(); }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Offline Notice Banner */}
        {offlineNotice && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #10b981',
            borderRadius: '12px',
            padding: '8px 12px',
            fontSize: '12px',
            color: '#065f46',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Sparkles size={16} style={{ flexShrink: 0, color: '#059669' }} />
            <span>{offlineNotice}</span>
          </div>
        )}

        {/* Customer Name with Mic (Auto-Urdu conversion) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
              {t.customerName} *
            </label>
            <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
              (بولیں، خود بخود درست اردو میں لکھا جائے گا)
            </span>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (name.trim()) setName(convertToUrduScript(name.trim()));
              }}
              placeholder="مثلاً: اسد، علی، راشد..."
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '14px',
                border: '1px solid var(--border-light)',
                padding: '0 46px 0 14px',
                fontSize: '16px',
                fontWeight: 600,
                outline: 'none',
                background: '#ffffff'
              }}
            />
            <button
              style={{
                position: 'absolute',
                right: '8px',
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                border: 'none',
                background: isListeningName ? '#ef4444' : 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              onClick={handleVoiceName}
              title="Speak Name in Urdu"
            >
              <Mic size={18} className={isListeningName ? 'animate-pulse-soft' : ''} />
            </button>
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
            {t.phone} (WhatsApp)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0300-1234567"
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '14px',
              border: '1px solid var(--border-light)',
              padding: '0 14px',
              fontSize: '15px',
              outline: 'none'
            }}
          />
        </div>

        {/* Address with Voice Mic button */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
              {t.address} (پتہ یا نشانی)
            </label>
            <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
              🎙️ آواز سے پتہ بولیں
            </span>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              ref={addressInputRef}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => {
                if (address.trim()) setAddress(convertToUrduScript(address.trim()));
              }}
              placeholder="مثلاً: گلی نمبر 3، مسجد کے قریب..."
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '14px',
                border: '1px solid var(--border-light)',
                padding: '0 46px 0 14px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              style={{
                position: 'absolute',
                right: '8px',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                background: isListeningAddress ? '#ef4444' : '#f0fdf4',
                color: isListeningAddress ? 'white' : '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              onClick={handleVoiceAddress}
              title="Speak Address in Urdu"
            >
              <Mic size={16} className={isListeningAddress ? 'animate-pulse-soft' : ''} />
            </button>
          </div>
        </div>

        {/* Opening Balance (Purana Udhar) */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
            {t.openingBalance}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-muted)' }}>{t.rupees}</span>
            <input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0"
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '14px',
                border: '1px solid var(--border-light)',
                padding: '0 14px',
                fontSize: '16px',
                fontWeight: 700,
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          style={{
            height: '52px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: name.trim() ? 'pointer' : 'not-allowed',
            opacity: name.trim() ? 1 : 0.6,
            boxShadow: '0 8px 16px rgba(5, 150, 105, 0.35)',
            marginTop: '6px'
          }}
          disabled={!name.trim()}
          onClick={handleSave}
        >
          <Check size={20} />
          <span>{t.save}</span>
        </button>
      </div>
    </div>
  );
}
