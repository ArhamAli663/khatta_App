import React, { useState } from 'react';
import {
  X,
  Store,
  Lock,
  User,
  Phone,
  Mail,
  Check,
  Zap,
  LogOut,
  Cloud,
  CloudCheck,
  CloudOff,
  Settings,
  AlertCircle,
  Loader2,
  Key,
  Sparkles
} from 'lucide-react';
import { sounds } from '../sound';
import {
  isFirebaseReady,
  firebaseLogIn,
  firebaseSignUp,
  firebaseLogOut,
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  fetchFromCloud,
  saveToCloud,
  resetPinAndAuthenticate
} from '../firebase';

export default function AuthModal({
  shop,
  onSaveShop,
  customers = [],
  suppliers = [],
  onRestoreData,
  onLogOut,
  onClose,
  t,
  lang
}) {
  const [tab, setTab] = useState(shop.isLoggedIn ? 'profile' : 'login'); // 'login' | 'signup' | 'profile' | 'config'
  const [identifier, setIdentifier] = useState(shop.phone || '');
  const [pin, setPin] = useState(shop.pin || '');
  const [shopName, setShopName] = useState(shop.shopName || '');
  const [ownerName, setOwnerName] = useState(shop.ownerName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [forgotPhone, setForgotPhone] = useState(shop.phone || '');
  const [forgotNewPin, setForgotNewPin] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleSendWhatsAppRecovery = () => {
    sounds.playTap();
    const phone = (forgotPhone || identifier || shop?.phone || '').trim();
    if (!phone) {
      setErrorMessage(lang === 'ur' ? 'برائے مہربانی اپنا موبائل نمبر درج کریں۔' : 'Please enter your phone number.');
      return;
    }
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '92' + clean.slice(1);
    if (clean.length === 10) clean = '92' + clean;

    const currentPin = (shop && shop.pin ? String(shop.pin) : '1234').trim();
    const msg = lang === 'ur'
      ? `السلام علیکم! کھاتہ ایپ (${shop?.shopName || 'کھاتہ'}) کا سیکیورٹی پن کوڈ یہ ہے:\n\n🔑 پن کوڈ: *${currentPin}*\n\nاس پن کوڈ کو درج کر کے لاگ ان کریں۔`
      : `Assalam-o-Alaikum! Khatta App (${shop?.shopName || 'Khatta'}) security PIN code:\n\n🔑 PIN: *${currentPin}*`;

    // Direct redirect to WhatsApp app intent without opening blank tab
    const waUrl = `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(msg)}`;
    window.location.href = waUrl;
  };

  const handleSendSmsRecovery = () => {
    sounds.playTap();
    const phone = (forgotPhone || identifier || shop?.phone || '').trim();
    if (!phone) {
      setErrorMessage(lang === 'ur' ? 'برائے مہربانی اپنا موبائل نمبر درج کریں۔' : 'Please enter your phone number.');
      return;
    }
    const clean = phone.replace(/[^0-9+]/g, '');
    const currentPin = (shop && shop.pin ? String(shop.pin) : '1234').trim();
    const msg = lang === 'ur'
      ? `کھاتہ ایپ سیکیورٹی پن کوڈ: ${currentPin}`
      : `Khatta App Security PIN: ${currentPin}`;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const smsUrl = `sms:${clean}${isIOS ? '&' : '?'}body=${encodeURIComponent(msg)}`;
    window.location.href = smsUrl;
  };

  const handleResetPinOnLogin = async () => {
    if (!forgotNewPin || forgotNewPin.length !== 4) {
      setErrorMessage(lang === 'ur' ? 'نیا پن ٹھیک 4 ہندسوں کا ہونا ضروری ہے۔' : 'PIN must be 4 digits.');
      return;
    }
    sounds.playTap();
    setIsLoading(true);
    setErrorMessage('');
    const cleanPin = forgotNewPin.trim();
    const phone = (forgotPhone || identifier || shop?.phone || '').trim();

    try {
      const res = await resetPinAndAuthenticate(phone, cleanPin, shop);
      sounds.playSuccessFanfare();
      setForgotSuccess(lang === 'ur' ? 'نیا پن محفوظ ہو گیا اور لاگ ان ہو گیا!' : 'New PIN saved & logged in!');

      const updatedShop = {
        shopName: res.cloudData?.profile?.shopName || 'میرا کھاتہ',
        ownerName: res.cloudData?.profile?.ownerName || 'دکاندار',
        pin: cleanPin,
        phone: phone || res.cloudData?.profile?.phone || '',
        isLoggedIn: true,
        userId: res.userId,
        language: lang
      };

      onSaveShop(updatedShop);
      setPin(cleanPin);

      // Restore data if available in cloud - NEVER fallback to previous user's in-memory data
      if (onRestoreData) {
        onRestoreData(
          Array.isArray(res.cloudData?.customers) ? res.cloudData.customers : [],
          updatedShop,
          Array.isArray(res.cloudData?.suppliers) ? res.cloudData.suppliers : []
        );
      }

      setTimeout(() => {
        setShowForgotPin(false);
        setForgotSuccess('');
        onClose();
      }, 800);
    } catch (err) {
      console.warn('Reset pin warning:', err);
      const updated = {
        shopName: 'میرا کھاتہ',
        ownerName: 'دکاندار',
        pin: cleanPin,
        phone: phone,
        isLoggedIn: true,
        userId: `user-${cleanPin}`,
        language: lang
      };
      onSaveShop(updated);
      setPin(cleanPin);
      if (onRestoreData) {
        onRestoreData([], updated, []);
      }
      setForgotSuccess(lang === 'ur' ? 'نیا پن محفوظ ہو گیا!' : 'New PIN set!');
      setTimeout(() => {
        setShowForgotPin(false);
        setForgotSuccess('');
        onClose();
      }, 800);
    } finally {
      setIsLoading(false);
    }
  };

  // Custom Firebase configuration fields (if user wants to paste their own from Firebase Console)
  const [showConfig, setShowConfig] = useState(false);
  const currentConfig = getActiveFirebaseConfig();
  const [configApiKey, setConfigApiKey] = useState(currentConfig.apiKey || '');
  const [configProjectId, setConfigProjectId] = useState(currentConfig.projectId || '');
  const [configAuthDomain, setConfigAuthDomain] = useState(currentConfig.authDomain || '');
  const [configAppId, setConfigAppId] = useState(currentConfig.appId || '');

  const hasFirebase = isFirebaseReady();

  // 1. Handle Login
  const handleLogin = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!identifier.trim()) {
      setErrorMessage(lang === 'ur' ? 'برائے مہربانی موبائل نمبر درج کریں۔' : 'Please enter mobile number.');
      return;
    }
    if (!pin.trim() || pin.length !== 4) {
      setErrorMessage(lang === 'ur' ? 'برائے مہربانی 4 ہندسوں کا پن کوڈ (PIN) درج کریں۔' : 'Please enter 4 digits PIN.');
      return;
    }

    setIsLoading(true);
    sounds.playTap();

    try {
      const result = await firebaseLogIn(identifier, pin);
      const user = result.user;

      sounds.playSuccessFanfare();
      setSuccessMessage(lang === 'ur' ? 'لاگ ان کامیاب ہو گیا!' : 'Logged in successfully!');

      // Attempt to load cloud data for this user - strictly isolated per account
      if (user && !result.isLocal) {
        try {
          const cloudData = result.cloudData || (await fetchFromCloud(user.uid));
          const loadedShop = {
            shopName: cloudData?.profile?.shopName || 'میرا کھاتہ',
            ownerName: cloudData?.profile?.ownerName || 'دکاندار',
            phone: cloudData?.profile?.phone || identifier,
            pin: pin,
            isLoggedIn: true,
            userId: user.uid,
            email: user.email,
            language: lang
          };

          onSaveShop(loadedShop);
          if (onRestoreData) {
            onRestoreData(
              Array.isArray(cloudData?.customers) ? cloudData.customers : [],
              loadedShop,
              Array.isArray(cloudData?.suppliers) ? cloudData.suppliers : []
            );
          }
        } catch (fetchErr) {
          console.warn('Cloud fetch on login error:', fetchErr);
        }
      } else {
        const localShop = {
          shopName: 'میرا کھاتہ',
          ownerName: 'دکاندار',
          phone: identifier,
          pin: pin,
          isLoggedIn: true,
          userId: user.uid,
          language: lang
        };
        onSaveShop(localShop);
        if (onRestoreData) {
          onRestoreData([], localShop, []);
        }
      }

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Login error:', err);
      let msg = err.message || 'Login failed';
      if (msg.includes('user-not-found') || msg.includes('invalid-credential') || msg.includes('wrong-password')) {
        msg = lang === 'ur' ? 'موبائل نمبر یا 4 ہندسوں کا پن درست نہیں ہے۔' : 'Invalid number or 4-digit PIN.';
      }
      setErrorMessage(msg);
      sounds.playDeleteTone();
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Sign Up
  const handleSignUp = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!shopName.trim()) {
      setErrorMessage(lang === 'ur' ? 'دکان کا نام درج کرنا لازمی ہے۔' : 'Shop name is required.');
      return;
    }
    if (!identifier.trim()) {
      setErrorMessage(lang === 'ur' ? 'موبائل نمبر یا ای میل درج کریں۔' : 'Mobile number or email is required.');
      return;
    }
    if (!pin.trim() || pin.length !== 4) {
      setErrorMessage(lang === 'ur' ? 'سیکیورٹی پن ٹھیک 4 ہندسوں کا ہونا ضروری ہے (جیسے 1234)۔' : 'Security PIN must be exactly 4 digits (e.g. 1234).');
      return;
    }

    setIsLoading(true);
    sounds.playTap();

    try {
      const result = await firebaseSignUp(identifier, pin, {
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        phone: identifier.trim(),
        pin: pin,
        customers,
        suppliers
      });

      const user = result.user;
      sounds.playSuccessFanfare();
      setSuccessMessage(lang === 'ur' ? 'اکاؤنٹ تیار ہو گیا اور لاگ ان ہو گیا!' : 'Account created & logged in!');

      onSaveShop({
        ...shop,
        shopName: shopName.trim(),
        ownerName: ownerName.trim() || 'دکاندار بھائی',
        phone: identifier.trim(),
        pin: pin,
        isLoggedIn: true,
        userId: user?.uid,
        email: user?.email
      });

      setIsLoading(false);

      setTimeout(() => {
        onClose();
      }, 350);
    } catch (err) {
      console.error('Sign up error:', err);
      let msg = err.message || 'Signup failed';
      if (msg.includes('email-already-in-use')) {
        msg = lang === 'ur' ? 'اس نمبر پر پہلے سے اکاؤنٹ ہے، براہ کرم لاگ ان کریں۔' : 'Account already exists. Please log in.';
      } else if (msg.includes('network-request-failed')) {
        msg = lang === 'ur' ? 'انٹرنیٹ کنکشن چیک کریں۔' : 'Network error. Please check your connection.';
      }
      setErrorMessage(msg);
      sounds.playDeleteTone();
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Logout
  const handleLogout = async () => {
    sounds.playTap();
    setIsLoading(true);
    try {
      await firebaseLogOut();
    } catch (e) {
      // Ignore
    }
    if (typeof onLogOut === 'function') {
      onLogOut();
    } else {
      onSaveShop({
        shopName: '',
        ownerName: '',
        phone: '',
        pin: '',
        isLoggedIn: false,
        userId: null,
        language: lang
      });
    }
    setIsLoading(false);
    onClose();
  };

  // 4. Save custom Firebase Web credentials
  const handleSaveConfig = () => {
    sounds.playCashChime();
    const conf = {
      apiKey: configApiKey.trim(),
      projectId: configProjectId.trim(),
      authDomain: configAuthDomain.trim() || `${configProjectId.trim()}.firebaseapp.com`,
      appId: configAppId.trim(),
      storageBucket: `${configProjectId.trim()}.appspot.com`
    };
    saveCustomFirebaseConfig(conf);
    setSuccessMessage(lang === 'ur' ? 'فائر بیس سیٹنگز محفوظ ہو گئیں! ایپ ریفریش ہو رہی ہے...' : 'Firebase configured! Reloading...');
    setTimeout(() => {
      window.location.reload();
    }, 900);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ color: 'var(--primary)' }}>
            <Store size={22} />
            <span>{shop.isLoggedIn ? (lang === 'ur' ? 'دکان کی پروفائل' : 'Shop Profile') : (tab === 'signup' ? t.signup : t.login)}</span>
          </div>

          <button
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            onClick={() => { sounds.playTap(); onClose(); }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cloud Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: '12px',
          background: hasFirebase ? '#f0fdf4' : '#fffbeb',
          border: `1px solid ${hasFirebase ? '#bbf7d0' : '#fef08a'}`,
          fontSize: '12px',
          fontWeight: 700,
          color: hasFirebase ? '#166534' : '#b45309'
        }}>
          {hasFirebase ? <Cloud size={18} color="#16a34a" /> : <CloudOff size={18} color="#d97706" />}
          <span>
            {hasFirebase
              ? (lang === 'ur' ? '☁️ فائر بیس آن لائن کنکٹڈ (تمام ڈیٹا لائف ٹائم محفوظ)' : '☁️ Firebase Cloud Connected (Auto-Sync Active)')
              : (lang === 'ur' ? '📱 موبائل لوکل موڈ (ڈیٹا فون میں محفوظ ہے)' : '📱 Local Storage Mode')}
          </span>
        </div>

        {/* Success or Error Feedback */}
        {errorMessage && (
          <div style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            color: '#be123c',
            borderRadius: '12px',
            padding: '10px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            borderRadius: '12px',
            padding: '10px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Check size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* LOGGED IN VIEW: Profile details and Logout */}
        {shop.isLoggedIn ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--primary-bg)',
                color: 'var(--primary)',
                border: '2px solid var(--primary-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 900,
                margin: '0 auto 8px auto'
              }}>
                {(shop.shopName || 'د').charAt(0)}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{shop.shopName}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>مالک: {shop.ownerName || 'دکاندار'}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>فون: {shop.phone}</div>

              <div style={{
                marginTop: '12px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#ecfdf5',
                color: '#059669',
                fontSize: '11px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Check size={13} />
                <span>{lang === 'ur' ? 'اکاؤنٹ آن لائن فعال ہے' : 'Account Active & Synced'}</span>
              </div>
            </div>

            <button
              style={{
                height: '46px',
                borderRadius: '14px',
                border: '1px solid #fecdd3',
                background: '#fff1f2',
                color: '#e11d48',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
              onClick={handleLogout}
              disabled={isLoading}
            >
              <LogOut size={16} />
              <span>{lang === 'ur' ? 'اکاؤنٹ لاگ آؤٹ کریں' : 'Log Out Account'}</span>
            </button>
          </div>
        ) : (
          /* NOT LOGGED IN: Login or Sign Up Tabs */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Tab Switcher */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '14px', padding: '4px', gap: '4px' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  height: '38px',
                  borderRadius: '10px',
                  border: 'none',
                  background: tab === 'login' ? 'white' : 'transparent',
                  color: tab === 'login' ? 'var(--primary)' : '#64748b',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: tab === 'login' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
                }}
                onClick={() => { sounds.playTap(); setTab('login'); setErrorMessage(''); }}
              >
                {t.login || 'لاگ ان (Login)'}
              </button>

              <button
                type="button"
                style={{
                  flex: 1,
                  height: '38px',
                  borderRadius: '10px',
                  border: 'none',
                  background: tab === 'signup' ? 'white' : 'transparent',
                  color: tab === 'signup' ? 'var(--primary)' : '#64748b',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: tab === 'signup' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
                }}
                onClick={() => { sounds.playTap(); setTab('signup'); setErrorMessage(''); }}
              >
                {t.signup || 'نیا اکاؤنٹ (Sign Up)'}
              </button>
            </div>

            {/* Form */}
            {tab === 'signup' ? (
              /* SIGN UP FORM */
              <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {t.shopName || 'دکان کا نام'} *
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="مثلاً: مدینہ کریانہ اسٹور"
                    required
                    style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '0 12px', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {t.ownerName || 'مالک کا نام'}
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="مثلاً: محمد اکرم"
                    style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '0 12px', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'ur' ? 'موبائل نمبر یا ای میل' : 'Mobile Number or Email'} *
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="03001234567 یا user@gmail.com"
                    required
                    style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '0 12px', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={13} color="var(--primary)" />
                      <span>{lang === 'ur' ? '4 ہندسوں کا سیکیورٹی پن (PIN)' : '4-Digit Security PIN'} *</span>
                    </label>
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                      {lang === 'ur' ? '(صرف 4 ہندسے)' : '(4 Digits)'}
                    </span>
                  </div>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="•••• (مثلاً 1234)"
                    required
                    style={{
                      width: '100%',
                      height: '46px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--border-light)',
                      padding: '0 12px',
                      fontSize: '20px',
                      fontWeight: 900,
                      letterSpacing: '6px',
                      textAlign: 'center',
                      outline: 'none',
                      background: '#f8fafc'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', textAlign: 'center' }}>
                    {lang === 'ur' ? 'یہ 4 ہندسوں کا پن ایپ کھولنے اور محفوظ لاگ ان کے لیے رہے گا' : 'Used for app lock and login'}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    height: '50px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
                    marginTop: '4px'
                  }}
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  <span>{lang === 'ur' ? 'اکاؤنٹ بنائیں اور ڈیٹا محفوظ کریں' : 'Create Account & Sync'}</span>
                </button>
              </form>
            ) : (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'ur' ? 'موبائل نمبر یا ای میل' : 'Mobile Number or Email'} *
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="03001234567 یا user@gmail.com"
                    required
                    style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '0 12px', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={13} color="var(--primary)" />
                      <span>{lang === 'ur' ? '4 ہندسوں کا پن کوڈ (PIN)' : '4-Digit PIN'} *</span>
                    </label>
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                      {lang === 'ur' ? '(صرف 4 ہندسے)' : '(4 Digits)'}
                    </span>
                  </div>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    required
                    style={{
                      width: '100%',
                      height: '46px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--border-light)',
                      padding: '0 12px',
                      fontSize: '20px',
                      fontWeight: 900,
                      letterSpacing: '6px',
                      textAlign: 'center',
                      outline: 'none',
                      background: '#f8fafc'
                    }}
                  />

                  {/* Forgot PIN Link */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => { sounds.playTap(); setShowForgotPin(!showForgotPin); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '2px 0',
                        textDecoration: 'underline'
                      }}
                    >
                      {showForgotPin
                        ? (lang === 'ur' ? '✕ واپس لاگ ان پر جائیں' : '✕ Back to Login')
                        : (lang === 'ur' ? '🔑 پن کوڈ بھول گئے؟ (Forgot PIN)' : '🔑 Forgot PIN?')}
                    </button>
                  </div>
                </div>

                {/* Forgot PIN Recovery Card */}
                {showForgotPin && (
                  <div style={{
                    background: '#ecfdf5',
                    border: '1.5px solid #a7f3d0',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    animation: 'fadeIn 0.2s ease-out'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={16} color="#059669" />
                      <span>{lang === 'ur' ? 'پن کوڈ ریکوری (Forgot PIN Recovery)' : 'PIN Recovery'}</span>
                    </div>

                    {/* Step 1: Ask for phone number */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#065f46', display: 'block', marginBottom: '4px' }}>
                        {lang === 'ur' ? 'اپنا موبائل نمبر درج کریں *' : 'Enter Your Mobile Number *'}
                      </label>
                      <input
                        type="tel"
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(e.target.value)}
                        placeholder="03001234567"
                        style={{
                          width: '100%',
                          height: '42px',
                          borderRadius: '10px',
                          border: '1.5px solid #a7f3d0',
                          padding: '0 12px',
                          fontSize: '14px',
                          fontWeight: 700,
                          background: 'white',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Step 2: Choose where to receive PIN */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#047857', display: 'block', marginBottom: '6px' }}>
                        {lang === 'ur' ? 'پن کوڈ کس پر منگوانا چاہتے ہیں؟' : 'Where to receive your PIN?'}
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {/* Option A: WhatsApp */}
                        <button
                          type="button"
                          onClick={handleSendWhatsAppRecovery}
                          style={{
                            height: '44px',
                            borderRadius: '10px',
                            border: 'none',
                            background: '#25D366',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(37, 211, 102, 0.35)',
                            padding: '0 8px'
                          }}
                        >
                          <Sparkles size={14} />
                          <span>{lang === 'ur' ? '📱 واٹس ایپ' : 'WhatsApp'}</span>
                        </button>

                        {/* Option B: Local SMS */}
                        <button
                          type="button"
                          onClick={handleSendSmsRecovery}
                          style={{
                            height: '44px',
                            borderRadius: '10px',
                            border: 'none',
                            background: '#0284c7',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                            padding: '0 8px'
                          }}
                        >
                          <span>✉️ لوکل SMS</span>
                        </button>
                      </div>
                    </div>

                    {/* Step 3: Direct Set New PIN */}
                    <div style={{ borderTop: '1px dashed #a7f3d0', paddingTop: '10px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', display: 'block', marginBottom: '4px' }}>
                        {lang === 'ur' ? 'یا نیا 4 ہندسوں کا پن سیٹ کریں:' : 'Or set a new 4-digit PIN:'}
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          value={forgotNewPin}
                          onChange={(e) => setForgotNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="نیا پن (1234)"
                          style={{
                            flex: 1,
                            height: '40px',
                            borderRadius: '10px',
                            border: '1.5px solid #a7f3d0',
                            padding: '0 10px',
                            fontSize: '16px',
                            fontWeight: 800,
                            textAlign: 'center',
                            letterSpacing: '4px',
                            background: 'white'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleResetPinOnLogin}
                          style={{
                            height: '40px',
                            padding: '0 14px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'var(--primary)',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {lang === 'ur' ? 'محفوظ کریں' : 'Save'}
                        </button>
                      </div>
                    </div>

                    {forgotSuccess && (
                      <div style={{ fontSize: '12px', color: '#059669', fontWeight: 800, textAlign: 'center' }}>
                        ✓ {forgotSuccess}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    height: '50px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
                    marginTop: '4px'
                  }}
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  <span>{lang === 'ur' ? 'لاگ ان کریں اور ڈیٹا ڈاؤنلوڈ کریں' : 'Log In & Load Data'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
