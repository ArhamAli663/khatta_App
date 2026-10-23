import React, { useState, useEffect } from 'react';
import { Lock, Fingerprint, Delete, ShieldCheck, Store, User, AlertCircle, Sparkles } from 'lucide-react';
import { sounds } from '../sound';
import { isBiometricAvailable, isBiometricEnabled, authenticateBiometric, registerBiometric } from '../biometric';

export default function AppLockScreen({
  shop,
  onUnlock,
  onUpdatePin,
  t,
  lang = 'ur'
}) {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [isBiometricPrompting, setIsBiometricPrompting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState(shop?.phone || '');
  const [newPinInput, setNewPinInput] = useState('');

  // Check hardware biometric availability on mount
  useEffect(() => {
    isBiometricAvailable().then((avail) => {
      setHasBiometric(avail);
      // If user has already enabled biometric, auto-prompt once on open
      if (avail && isBiometricEnabled()) {
        handleBiometricAuth();
      }
    });
  }, []);

  // Handle digit press on Keypad
  const handleDigit = (digit) => {
    if (pinInput.length >= 4) return;
    sounds.playTap();
    setErrorMsg('');
    const nextPin = pinInput + digit;
    setPinInput(nextPin);

    // Auto-verify when 4th digit is entered
    if (nextPin.length === 4) {
      verifyPin(nextPin);
    }
  };

  // Backspace / Delete last digit
  const handleDelete = () => {
    sounds.playTap();
    setErrorMsg('');
    setPinInput((prev) => prev.slice(0, -1));
  };

  // Verify PIN strictly against user's saved shop.pin
  const verifyPin = (enteredPin) => {
    const correctPin = (shop && shop.pin ? String(shop.pin) : '').trim();

    // Only unlock if entered PIN matches the user's actual chosen PIN
    if (correctPin && enteredPin.trim() === correctPin) {
      sounds.playCashChime();
      onUnlock();
    } else if (!correctPin && enteredPin === '1234') {
      // Fallback only if no PIN was ever configured
      sounds.playCashChime();
      onUnlock();
    } else {
      sounds.playDeleteTone();
      setErrorMsg(
        lang === 'ur'
          ? 'غلط پن کوڈ! دوبارہ کوشش کریں۔'
          : 'Ghalat PIN code! Dobara koshish karen.'
      );
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setPinInput('');
      }, 600);
    }
  };

  // Trigger Fingerprint / Face Unlock
  const handleBiometricAuth = async () => {
    sounds.playTap();
    setIsBiometricPrompting(true);
    setErrorMsg('');

    try {
      const res = await authenticateBiometric();
      if (res.success) {
        sounds.playSuccessFanfare();
        onUnlock();
        return;
      }
      // If credential not found, offer to register with current PIN
      if (res.error && res.error.includes('NotAllowedError')) {
        setErrorMsg(
          lang === 'ur'
            ? 'فنگر پرنٹ تصدیق کینسل ہو گئی۔'
            : 'Biometric verification cancelled.'
        );
      }
    } catch (e) {
      console.warn('Biometric auth error:', e);
    } finally {
      setIsBiometricPrompting(false);
    }
  };

  // Enable/Register Biometric using shop PIN
  const handleRegisterBiometric = async () => {
    sounds.playTap();
    try {
      await registerBiometric(shop.ownerName || 'Dukandar');
      sounds.playSuccessFanfare();
      onUnlock();
    } catch (e) {
      setErrorMsg(
        lang === 'ur'
          ? 'بایومیٹرک سیٹ نہیں ہو سکا۔ پن کوڈ سے کھولیں۔'
          : 'Biometric could not be setup. Enter PIN.'
      );
    }
  };

  // Send Current PIN via WhatsApp
  const handleSendWhatsAppPin = () => {
    sounds.playTap();
    const phone = (recoveryPhone || shop?.phone || '').trim();
    if (!phone) {
      setErrorMsg(lang === 'ur' ? 'براہ کرم اپنا موبائل نمبر درج کریں۔' : 'Please enter your phone number.');
      return;
    }
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '92' + clean.slice(1);
    if (clean.length === 10) clean = '92' + clean;

    const currentPin = (shop && shop.pin ? String(shop.pin) : '1234').trim();
    const msg = lang === 'ur'
      ? `السلام علیکم! آپ کی کھاتہ ایپ (${shop?.shopName || 'کھاتہ'}) کا سیکیورٹی پن کوڈ یہ ہے:\n\n🔑 پن کوڈ: *${currentPin}*\n\nاس پن کوڈ کو درج کر کے اپنا کھاتہ کھولیں۔`
      : `Assalam-o-Alaikum! Aap ki Khatta App (${shop?.shopName || 'Khatta'}) ka security PIN code ye hai:\n\n🔑 PIN: *${currentPin}*`;

    const waUrl = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  // Reset to New PIN directly from lock screen
  const handleResetToNewPin = () => {
    if (!newPinInput || newPinInput.trim().length !== 4) {
      setErrorMsg(lang === 'ur' ? 'براہ کرم 4 ہندسوں کا نیا پن درج کریں۔' : 'Please enter a 4-digit PIN.');
      return;
    }
    sounds.playSuccessFanfare();
    const finalPin = newPinInput.trim();
    if (onUpdatePin) {
      onUpdatePin(finalPin);
    }
    setShowForgotModal(false);
    onUnlock();

    // Also send confirmation message to WhatsApp
    const phone = (recoveryPhone || shop?.phone || '').trim();
    if (phone) {
      let clean = phone.replace(/\D/g, '');
      if (clean.startsWith('0')) clean = '92' + clean.slice(1);
      if (clean.length === 10) clean = '92' + clean;
      const msg = lang === 'ur'
        ? `السلام علیکم! آپ کی کھاتہ ایپ (${shop?.shopName || 'کھاتہ'}) کا نیا پن کوڈ کامیابی سے تبدیل ہو گیا ہے۔\n\n🔑 نیا پن کوڈ: *${finalPin}*`
        : `Assalam-o-Alaikum! Khatta App new PIN set successfully: *${finalPin}*`;
      window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  return (
    <div
      className="lock-screen-container animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '32px 20px 24px 20px',
        userSelect: 'none'
      }}
    >
      {/* Top Shop Branding & Lock Icon */}
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '22px',
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px auto',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
        }}>
          <Lock size={32} />
        </div>

        <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
          {shop.shopName || 'کھاتہ ایپ (Khatta App)'}
        </div>
        <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '3px' }}>
          <User size={13} color="#10b981" />
          <span>{shop.ownerName || 'محترم دکاندار'}</span>
        </div>

        <div style={{
          marginTop: '16px',
          fontSize: '15px',
          fontWeight: 700,
          color: '#38bdf8',
          lineHeight: 1.4
        }}>
          {lang === 'ur' ? 'سیکیورٹی پن (PIN) درج کریں' : 'Enter 4-Digit Security PIN'}
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
          {lang === 'ur' ? 'کھاتہ ایپ کھول کر حساب دیکھنے کے لیے' : 'To access shop ledger accounts'}
        </div>
      </div>

      {/* 4 PIN Dots Indicator */}
      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <div
          className={shake ? 'animate-shake' : ''}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '10px'
          }}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pinInput.length > index;
            return (
              <div
                key={index}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: isFilled ? '2px solid #10b981' : '2px solid #475569',
                  background: isFilled ? '#10b981' : 'transparent',
                  transform: isFilled ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: isFilled ? '0 0 12px rgba(16, 185, 129, 0.6)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#fb7185',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(225, 29, 72, 0.15)',
            padding: '4px 12px',
            borderRadius: '999px'
          }}>
            <AlertCircle size={13} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Large Easy Numeric Keypad */}
      <div style={{
        maxWidth: '320px',
        margin: '0 auto',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px'
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleDigit(num)}
            style={{
              height: '62px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.07)',
              color: '#ffffff',
              fontSize: '26px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.1s ease, background 0.15s ease'
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {num}
          </button>
        ))}

        {/* Biometric Fingerprint Button (Bottom Left) */}
        {hasBiometric ? (
          <button
            onClick={handleBiometricAuth}
            style={{
              height: '62px',
              borderRadius: '20px',
              border: '1.5px solid #10b981',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px'
            }}
            title={lang === 'ur' ? 'فنگر پرنٹ سے کھولیں' : 'Fingerprint Unlock'}
          >
            <Fingerprint size={24} />
            <span style={{ fontSize: '9px', fontWeight: 800 }}>
              {lang === 'ur' ? 'فنگر پرنٹ' : 'Fingerprint'}
            </span>
          </button>
        ) : (
          <div style={{ height: '62px' }} />
        )}

        {/* 0 Button (Center) */}
        <button
          onClick={() => handleDigit(0)}
          style={{
            height: '62px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.07)',
            color: '#ffffff',
            fontSize: '26px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          0
        </button>

        {/* Backspace Button (Bottom Right) */}
        <button
          onClick={handleDelete}
          style={{
            height: '62px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.07)',
            color: '#cbd5e1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={lang === 'ur' ? 'مٹائیں' : 'Delete'}
        >
          <Delete size={24} />
        </button>
      </div>

      {/* Bottom Hint / Forgot PIN Info */}
      <div style={{ textAlign: 'center', marginTop: '14px' }}>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: '#38bdf8',
            fontSize: '13px',
            fontWeight: 700,
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
          onClick={() => {
            sounds.playTap();
            setShowForgotModal(true);
          }}
        >
          {lang === 'ur' ? '🔑 پن کوڈ بھول گئے ہیں؟ (واٹس ایپ پر منگوائیں / نیا پن بنائیں)' : '🔑 Forgot PIN? (WhatsApp Recovery & Reset)'}
        </button>
      </div>

      {/* Forgot PIN / WhatsApp Recovery Modal */}
      {showForgotModal && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 999999, background: 'rgba(15, 23, 42, 0.85)' }}
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="modal-sheet animate-slide-up"
            style={{
              maxWidth: '400px',
              margin: 'auto',
              padding: '24px 20px',
              background: '#1e293b',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#059669',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800 }}>
                    {lang === 'ur' ? 'پن کوڈ ریکوری (واٹس ایپ)' : 'PIN Recovery (WhatsApp)'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {shop?.shopName || 'کھاتہ ایپ'}
                  </div>
                </div>
              </div>

              <button
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => setShowForgotModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Registered Phone Display / Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                {lang === 'ur' ? 'رجسٹرڈ موبائل نمبر (واٹس ایپ):' : 'Registered WhatsApp Mobile Number:'}
              </label>
              <input
                type="text"
                value={recoveryPhone}
                onChange={(e) => setRecoveryPhone(e.target.value)}
                placeholder="مثلاً: 03001234567"
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: 'white',
                  padding: '0 12px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            {/* WhatsApp Send Button */}
            <button
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '14px',
                border: 'none',
                background: '#16a34a',
                color: 'white',
                fontSize: '14px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)',
                marginBottom: '16px'
              }}
              onClick={handleSendWhatsAppPin}
            >
              <span>💬</span>
              <span>{lang === 'ur' ? 'واٹس ایپ پر پن کوڈ وصول کریں' : 'Send PIN to WhatsApp'}</span>
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0', color: '#64748b', fontSize: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
              <span>{lang === 'ur' ? 'یا نیا پن بنائیں' : 'OR Reset to New PIN'}</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
            </div>

            {/* Set New PIN directly */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  {lang === 'ur' ? 'نیا 4 ہندسوں کا پن درج کریں:' : 'Enter New 4-digit PIN:'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="مثلاً: 1234"
                  style={{
                    width: '100%',
                    height: '44px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: 'white',
                    padding: '0 12px',
                    fontSize: '16px',
                    letterSpacing: '4px',
                    outline: 'none',
                    textAlign: 'center'
                  }}
                />
              </div>

              <button
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
                onClick={handleResetToNewPin}
              >
                {lang === 'ur' ? 'نیا پن محفوظ کریں اور ایپ کھولیں' : 'Save New PIN & Unlock'}
              </button>

              <button
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  sounds.playCashChime();
                  onUnlock();
                }}
              >
                {lang === 'ur' ? '💡 ڈیفالٹ پن (1234) سے ایپ کھولیں' : '💡 Open with Default PIN (1234)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
