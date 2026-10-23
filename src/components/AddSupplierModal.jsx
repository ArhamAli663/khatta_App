import React, { useState, useRef } from 'react';
import { X, UserPlus, Mic, Check, Sparkles, Building2 } from 'lucide-react';
import { sounds } from '../sound';
import { convertToUrduScript } from '../urduTransliterate';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../speech';

export default function AddSupplierModal({
  onClose,
  onSave,
  t,
  lang = 'ur'
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [isListeningName, setIsListeningName] = useState(false);
  const [isListeningPhone, setIsListeningPhone] = useState(false);
  const [isListeningAddress, setIsListeningAddress] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState('');

  const nameInputRef = useRef(null);
  const addressInputRef = useRef(null);

  // Auto transliterate to Urdu
  const handleNameChange = (val) => {
    setName(val);
  };

  const handleNameBlur = () => {
    if (name.trim()) {
      setName(convertToUrduScript(name.trim()));
    }
  };

  // Voice speech for Supplier Name
  const handleVoiceName = () => {
    sounds.playTap();

    if (!isSpeechRecognitionSupported()) {
      alert(t.notSupportedVoice || 'Voice recognition not supported');
      return;
    }

    setIsListeningName(true);
    setOfflineNotice('');
    const recognizer = createSpeechRecognizer({
      lang: 'ur-PK',
      autoConvertToUrdu: true,
      onResult: (spoken, raw) => {
        setIsListeningName(false);
        const urduName = convertToUrduScript(spoken || raw || '').replace(/(supplier|naam|mera|نام|سپلائر)/gi, '').trim();
        setName(urduName || spoken);
        sounds.playCashChime();
      },
      onError: (err) => {
        setIsListeningName(false);
        setOfflineNotice(
          lang === 'ur'
            ? 'مائیک کے لیے 1 سیکنڈ انٹرنیٹ آن کریں، یا ہاتھ سے لکھ لیں۔'
            : 'Turn on internet to speak, or type name manually.'
        );
      },
      onEnd: () => setIsListeningName(false)
    });
    if (recognizer) {
      try { recognizer.start(); } catch (e) { setIsListeningName(false); }
    }
  };

  // Voice speech for Phone Number
  const handleVoicePhone = () => {
    if (!isSpeechRecognitionSupported()) {
      alert(t.notSupportedVoice || 'Voice recognition not supported');
      return;
    }
    sounds.playTap();
    setIsListeningPhone(true);
    const recognizer = createSpeechRecognizer({
      lang: 'ur-PK',
      onResult: (spoken) => {
        setIsListeningPhone(false);
        const digits = spoken.replace(/[^0-9]/g, '');
        if (digits) setPhone(digits);
        sounds.playCashChime();
      },
      onError: () => setIsListeningPhone(false),
      onEnd: () => setIsListeningPhone(false)
    });
    if (recognizer) {
      try { recognizer.start(); } catch (e) { setIsListeningPhone(false); }
    }
  };

  // Voice speech for Address
  const handleVoiceAddress = () => {
    sounds.playTap();

    if (!isSpeechRecognitionSupported()) {
      alert(t.notSupportedVoice || 'Voice recognition not supported');
      return;
    }

    setIsListeningAddress(true);
    setOfflineNotice('');
    const recognizer = createSpeechRecognizer({
      lang: 'ur-PK',
      autoConvertToUrdu: true,
      onResult: (spoken) => {
        setIsListeningAddress(false);
        const urduAddress = convertToUrduScript(spoken) || spoken;
        setAddress(urduAddress);
        sounds.playCashChime();
      },
      onError: () => {
        setIsListeningAddress(false);
        setOfflineNotice(
          lang === 'ur'
            ? 'پتہ واضح بولیں یا ہاتھ سے لکھ لیں۔'
            : 'Speak address clearly or enter manually.'
        );
      },
      onEnd: () => setIsListeningAddress(false)
    });
    if (recognizer) {
      try { recognizer.start(); } catch (e) { setIsListeningAddress(false); }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(lang === 'ur' ? 'برائے مہربانی سپلائر کا نام درج کریں۔' : 'Please enter supplier name.');
      return;
    }

    sounds.playSuccessFanfare();
    const finalName = convertToUrduScript(name.trim()) || name.trim();
    const finalAddress = address.trim() ? (convertToUrduScript(address.trim()) || address.trim()) : '';

    const newSupplier = {
      id: `sup-${Date.now()}`,
      name: finalName,
      phone: phone.trim(),
      address: finalAddress,
      createdAt: new Date().toISOString(),
      transactions: []
    };

    const initialAmount = parseFloat(openingBalance);
    if (initialAmount && initialAmount > 0) {
      newSupplier.transactions.push({
        id: `tx-init-${Date.now()}`,
        type: 'took',
        amount: initialAmount,
        details: lang === 'ur' ? 'سابقہ واجب الادا ادھار' : 'Starting Payable Udhar',
        date: new Date().toISOString()
      });
    }

    onSave(newSupplier);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '20px' }}>
        {/* Header */}
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <div className="modal-title" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={22} color="var(--primary)" />
            <span>{t.addSupplier || (lang === 'ur' ? 'نیا سپلائر / ہول سیلر' : 'Add New Supplier')}</span>
          </div>
          <button
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            onClick={() => { sounds.playTap(); onClose(); }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Offline Notice */}
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
            gap: '6px',
            marginBottom: '14px'
          }}>
            <Sparkles size={16} style={{ flexShrink: 0, color: '#059669' }} />
            <span>{offlineNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Supplier Name */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                {t.supplierName || (lang === 'ur' ? 'سپلائر / ہول سیلر کا نام' : 'Supplier Name')} *
              </label>
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                {lang === 'ur' ? '(بولیں یا لکھیں، اردو میں تبدیل ہوگا)' : '(Speak or type)'}
              </span>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={handleNameBlur}
                placeholder={lang === 'ur' ? 'مثلاً: حاجی سلیم ہول سیلر...' : 'e.g. Haji Saleem Supplier...'}
                required
                autoFocus
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-light)',
                  padding: '0 46px 0 14px',
                  fontSize: '15px',
                  fontWeight: 600,
                  outline: 'none',
                  background: '#ffffff',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
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
                title="Speak Supplier Name"
              >
                <Mic size={17} className={isListeningName ? 'animate-pulse-soft' : ''} />
              </button>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                {t.phone || (lang === 'ur' ? 'موبائل نمبر (WhatsApp)' : 'Phone Number')}
              </label>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-1234567"
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-light)',
                  padding: '0 46px 0 14px',
                  fontSize: '15px',
                  fontWeight: 600,
                  outline: 'none',
                  background: '#ffffff',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                style={{
                  position: 'absolute',
                  right: '8px',
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isListeningPhone ? '#ef4444' : 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onClick={handleVoicePhone}
                title="Speak Phone"
              >
                <Mic size={17} className={isListeningPhone ? 'animate-pulse-soft' : ''} />
              </button>
            </div>
          </div>

          {/* Address */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                {t.address || (lang === 'ur' ? 'دکان / گودام کا پتہ' : 'Shop Address')}
              </label>
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
                placeholder={lang === 'ur' ? 'مثلاً: غلہ منڈی، گودام نمبر 5...' : 'e.g. Grain Market, Warehouse #5...'}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-light)',
                  padding: '0 46px 0 14px',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  background: '#ffffff',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                style={{
                  position: 'absolute',
                  right: '8px',
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isListeningAddress ? '#ef4444' : 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onClick={handleVoiceAddress}
                title="Speak Address"
              >
                <Mic size={17} className={isListeningAddress ? 'animate-pulse-soft' : ''} />
              </button>
            </div>
          </div>

          {/* Opening Balance */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              {lang === 'ur' ? 'سابقہ پرانا ادھار (اگر سپلائر کو پہلے سے دینا ہے)' : 'Starting Udhar you owe (Opening Balance)'}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0"
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '14px',
                border: '1px solid var(--border-light)',
                padding: '0 14px',
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--red-gave)',
                outline: 'none',
                background: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(5, 150, 105, 0.35)',
              marginTop: '6px'
            }}
          >
            <Check size={20} />
            <span>{t.save || (lang === 'ur' ? 'محفوظ کریں' : 'Save Supplier')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
