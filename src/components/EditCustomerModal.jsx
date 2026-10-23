import React, { useState } from 'react';
import { X, Mic, UserCheck, Check, Trash2 } from 'lucide-react';
import { sounds } from '../sound';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../speech';
import { convertToUrduScript } from '../urduTransliterate';

export default function EditCustomerModal({ customer, onClose, onSave, onDeleteCustomer, t, lang }) {
  const [name, setName] = useState(customer.name || '');
  const [phone, setPhone] = useState(customer.phone || '');
  const [address, setAddress] = useState(customer.address || '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isListeningName, setIsListeningName] = useState(false);
  const [isListeningAddress, setIsListeningAddress] = useState(false);

  // Voice speech for Customer Name (Converts to Urdu automatically!)
  const handleVoiceName = () => {
    if (!isSpeechRecognitionSupported()) {
      alert(t.notSupportedVoice);
      return;
    }
    sounds.playTap();
    setIsListeningName(true);
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
      onError: () => setIsListeningName(false),
      onEnd: () => setIsListeningName(false)
    });
    if (recognizer) {
      try { recognizer.start(); } catch (e) { setIsListeningName(false); }
    }
  };

  // Voice speech for Customer Address (Converts to Urdu automatically!)
  const handleVoiceAddress = () => {
    if (!isSpeechRecognitionSupported()) {
      alert(t.notSupportedVoice);
      return;
    }
    sounds.playTap();
    setIsListeningAddress(true);
    const recognizer = createSpeechRecognizer({
      lang: 'ur-PK',
      autoConvertToUrdu: true,
      onResult: (urduAddress) => {
        setIsListeningAddress(false);
        setAddress(urduAddress);
        sounds.playCashChime();
      },
      onError: () => setIsListeningAddress(false),
      onEnd: () => setIsListeningAddress(false)
    });
    if (recognizer) {
      try { recognizer.start(); } catch (e) { setIsListeningAddress(false); }
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    sounds.playCashChime();

    const finalName = convertToUrduScript(name.trim()) || name.trim();
    const finalAddress = address ? (convertToUrduScript(address.trim()) || address.trim()) : '';

    onSave({
      ...customer,
      name: finalName,
      phone: phone.trim(),
      address: finalAddress,
      updatedAt: new Date().toISOString()
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ color: 'var(--primary)' }}>
            <UserCheck size={22} />
            <span>{lang === 'ur' ? 'گاہک کی معلومات تبدیل کریں' : 'Edit Customer Info'}</span>
          </div>

          <button
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            onClick={() => { sounds.playTap(); onClose(); }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Customer Name with Mic (Auto-Urdu) */}
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
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="گاہک کا نام لکھیں یا بولیں..."
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

        {/* Mobile / WhatsApp Number */}
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

        {/* Address with Voice Mic */}
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
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="مثلاً: گلی نمبر 4، پیلا مکان مسجد کے سامنے..."
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
              title="Speak Address"
            >
              <Mic size={16} className={isListeningAddress ? 'animate-pulse-soft' : ''} />
            </button>
          </div>
        </div>

        {/* Action Buttons: Save & Delete */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
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
              boxShadow: '0 8px 16px rgba(5, 150, 105, 0.35)'
            }}
            disabled={!name.trim()}
            onClick={handleSave}
          >
            <Check size={20} />
            <span>{lang === 'ur' ? 'تبدیلیاں محفوظ کریں' : 'Save Changes'}</span>
          </button>

          {onDeleteCustomer && (
            confirmDelete ? (
              <div style={{
                background: '#fff1f2',
                border: '1.5px solid #fecdd3',
                borderRadius: '14px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#e11d48', marginBottom: '8px' }}>
                  {lang === 'ur' ? 'کیا آپ واقعی یہ کھاتہ مکمل ڈیلیٹ کرنا چاہتے ہیں؟' : 'Permanently delete this customer record?'}
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#e11d48',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      sounds.playDeleteTone();
                      onDeleteCustomer(customer.id);
                      onClose();
                    }}
                  >
                    {lang === 'ur' ? 'ہاں، ڈیلیٹ کریں' : 'Yes, Delete'}
                  </button>
                  <button
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: 'white',
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setConfirmDelete(false)}
                  >
                    {t.cancel || 'کینسل'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                style={{
                  height: '42px',
                  borderRadius: '14px',
                  border: '1px solid #fecdd3',
                  background: '#fff1f2',
                  color: '#e11d48',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  sounds.playTap();
                  setConfirmDelete(true);
                }}
              >
                <Trash2 size={15} />
                <span>{lang === 'ur' ? 'یہ گاہک مکمل ڈیلیٹ کریں' : 'Delete Customer Account'}</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
