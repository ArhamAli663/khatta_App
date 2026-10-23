import React, { useState } from 'react';
import {
  Store,
  Lock,
  Phone,
  User,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  KeyRound,
  MessageCircle,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Volume2,
  Download,
  AlertCircle
} from 'lucide-react';
import { sounds } from '../sound';
import {
  firebaseLogIn,
  firebaseSignUp,
  resetPinAndAuthenticate,
  normalizePhoneDigits
} from '../firebase';

export default function AuthWelcomeScreen({
  lang = 'roman',
  setLang,
  t,
  onLoginSuccess,
  onOpenGuide
}) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Sign up fields
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');

  // Forgot PIN fields
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPin, setForgotNewPin] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!phone.trim()) {
      setErrorMessage(lang === 'ur' ? 'برائے مہربانی موبائل نمبر درج کریں۔' : 'Please enter mobile number.');
      return;
    }
    if (!pin.trim() || pin.length !== 4) {
      setErrorMessage(lang === 'ur' ? 'برائے مہربانی 4 ہندسوں کا پن کوڈ درج کریں۔' : 'Please enter 4-digit PIN.');
      return;
    }

    setIsLoading(true);
    sounds.playTap();

    try {
      const result = await firebaseLogIn(phone.trim(), pin.trim());
      sounds.playSuccessFanfare();
      setSuccessMessage(lang === 'ur' ? 'لاگ ان کامیاب ہو گیا!' : 'Logged in successfully!');

      const cloudUser = result.cloudData;
      const loadedShop = {
        shopName: cloudUser?.profile?.shopName || 'میرا کھاتہ',
        ownerName: cloudUser?.profile?.ownerName || 'دکاندار',
        phone: cloudUser?.profile?.phone || phone.trim(),
        pin: pin.trim(),
        isLoggedIn: true,
        userId: result.user.uid,
        email: result.user.email,
        language: lang
      };

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess({
            shop: loadedShop,
            customers: Array.isArray(cloudUser?.customers) ? cloudUser.customers : [],
            suppliers: Array.isArray(cloudUser?.suppliers) ? cloudUser.suppliers : []
          });
        }
      }, 400);
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

  // Handle Sign Up (Naya Account)
  const handleSignUpSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!shopName.trim()) {
      setErrorMessage(lang === 'ur' ? 'دکان کا نام درج کرنا لازمی ہے۔' : 'Shop name is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage(lang === 'ur' ? 'موبائل نمبر درج کریں۔' : 'Mobile number is required.');
      return;
    }
    if (!pin.trim() || pin.length !== 4) {
      setErrorMessage(lang === 'ur' ? '4 ہندسوں کا سیکیورٹی پن درج کریں (جیسے 1234)۔' : 'Security PIN must be 4 digits.');
      return;
    }

    setIsLoading(true);
    sounds.playTap();

    try {
      const result = await firebaseSignUp(phone.trim(), pin.trim(), {
        shopName: shopName.trim(),
        ownerName: ownerName.trim() || 'دکاندار',
        phone: phone.trim(),
        pin: pin.trim(),
        customers: [],
        suppliers: []
      });

      sounds.playSuccessFanfare();
      setSuccessMessage(lang === 'ur' ? 'کھاتہ بن گیا! لاگ ان ہو رہا ہے...' : 'Account created! Logging in...');

      const newShop = {
        shopName: shopName.trim(),
        ownerName: ownerName.trim() || 'دکاندار',
        phone: phone.trim(),
        pin: pin.trim(),
        isLoggedIn: true,
        userId: result.user.uid,
        email: result.user.email,
        language: lang
      };

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess({
            shop: newShop,
            customers: [],
            suppliers: []
          });
        }
      }, 500);
    } catch (err) {
      console.error('Signup error:', err);
      let msg = err.message || 'Signup failed';
      if (msg.includes('email-already-in-use')) {
        msg = lang === 'ur' ? 'اس نمبر پر پہلے سے اکاؤنٹ موجود ہے۔ لاگ ان کریں۔' : 'Account already exists. Please log in.';
      }
      setErrorMessage(msg);
      sounds.playDeleteTone();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot PIN Reset & Instant Login
  const handleResetPinSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setForgotSuccess('');

    const targetPhone = (forgotPhone || phone).trim();
    if (!targetPhone) {
      setErrorMessage(lang === 'ur' ? 'برائے مہربانی موبائل نمبر درج کریں۔' : 'Please enter mobile number.');
      return;
    }
    if (!forgotNewPin.trim() || forgotNewPin.trim().length !== 4) {
      setErrorMessage(lang === 'ur' ? 'نیا پن ٹھیک 4 ہندسوں کا ہونا ضروری ہے۔' : 'New PIN must be 4 digits.');
      return;
    }

    setIsLoading(true);
    sounds.playTap();

    try {
      const res = await resetPinAndAuthenticate(targetPhone, forgotNewPin.trim(), {});
      sounds.playSuccessFanfare();
      setForgotSuccess(lang === 'ur' ? 'نیا پن محفوظ ہو گیا! لاگ ان کیا جا رہا ہے...' : 'New PIN saved! Logging in...');

      const loadedShop = {
        shopName: res.cloudData?.profile?.shopName || 'میرا کھاتہ',
        ownerName: res.cloudData?.profile?.ownerName || 'دکاندار',
        phone: targetPhone,
        pin: forgotNewPin.trim(),
        isLoggedIn: true,
        userId: res.userId,
        language: lang
      };

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess({
            shop: loadedShop,
            customers: Array.isArray(res.cloudData?.customers) ? res.cloudData.customers : [],
            suppliers: Array.isArray(res.cloudData?.suppliers) ? res.cloudData.suppliers : []
          });
        }
      }, 600);
    } catch (err) {
      console.warn('Reset pin err:', err);
      setErrorMessage(lang === 'ur' ? 'پن تبدیل نہ ہو سکا۔ برائے مہربانی دوبارہ کوشش کریں۔' : 'Failed to reset PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send Recovery via WhatsApp
  const handleSendWhatsAppRecovery = () => {
    sounds.playTap();
    const targetPhone = (forgotPhone || phone).trim();
    if (!targetPhone) {
      setErrorMessage(lang === 'ur' ? 'برائے مہربانی اپنا موبائل نمبر درج کریں۔' : 'Please enter mobile number.');
      return;
    }
    let clean = targetPhone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '92' + clean.slice(1);
    if (clean.length === 10) clean = '92' + clean;

    const msg = lang === 'ur'
      ? `السلام علیکم! کھاتہ ایپ کا پن کوڈ ری سیٹ کرنے کی درخواست۔\nموبائل نمبر: ${targetPhone}`
      : `Assalam-o-Alaikum! Khatta App PIN reset request for phone: ${targetPhone}`;

    window.location.href = `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(msg)}`;
  };

  // Send Recovery via SMS
  const handleSendSmsRecovery = () => {
    sounds.playTap();
    const targetPhone = (forgotPhone || phone).trim();
    if (!targetPhone) {
      setErrorMessage(lang === 'ur' ? 'برائے مہربانی اپنا موبائل نمبر درج کریں۔' : 'Please enter mobile number.');
      return;
    }
    const clean = targetPhone.replace(/[^0-9+]/g, '');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const msg = `Khatta App PIN reset for ${targetPhone}`;
    window.location.href = `sms:${clean}${isIOS ? '&' : '?'}body=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="auth-welcome-container">
      {/* Top Header Bar */}
      <div className="auth-welcome-topbar">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Store size={26} color="#ffffff" />
          </div>
          <div>
            <h1 className="auth-brand-title">ڈیجیٹل کھاتہ (Khatta App)</h1>
            <p className="auth-brand-subtitle">محفوظ • ذاتی • 100% پرائیویٹ لیجر</p>
          </div>
        </div>

        <div className="auth-top-actions">
          {/* Language Switcher */}
          <div className="auth-lang-pills">
            <button
              type="button"
              className={`auth-lang-pill ${lang === 'ur' ? 'active' : ''}`}
              onClick={() => { sounds.playTap(); setLang('ur'); }}
            >
              اردو
            </button>
            <button
              type="button"
              className={`auth-lang-pill ${lang === 'roman' ? 'active' : ''}`}
              onClick={() => { sounds.playTap(); setLang('roman'); }}
            >
              Roman
            </button>
            <button
              type="button"
              className={`auth-lang-pill ${lang === 'en' ? 'active' : ''}`}
              onClick={() => { sounds.playTap(); setLang('en'); }}
            >
              English
            </button>
          </div>

          {onOpenGuide && (
            <button
              type="button"
              className="auth-guide-btn"
              onClick={() => { sounds.playTap(); onOpenGuide(); }}
              title="آڈیو گائیڈ سنیں"
            >
              <Volume2 size={16} />
              <span>گائیڈ</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="auth-card-wrapper">
        <div className="auth-card">
          {/* Tab Switcher */}
          <div className="auth-mode-tabs">
            <button
              type="button"
              className={`auth-mode-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                sounds.playTap();
                setMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
            >
              <LogIn size={16} />
              <span>{lang === 'ur' ? 'لاگ ان کریں' : 'Log In'}</span>
            </button>
            <button
              type="button"
              className={`auth-mode-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                sounds.playTap();
                setMode('signup');
                setErrorMessage('');
                setSuccessMessage('');
              }}
            >
              <UserPlus size={16} />
              <span>{lang === 'ur' ? 'نیا کھاتہ بنائیں' : 'Naya Account'}</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="auth-alert error">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="auth-alert success">
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="auth-input-group">
                <label className="auth-label">
                  <Phone size={15} />
                  <span>{lang === 'ur' ? 'موبائل نمبر درج کریں:' : 'Mobile Number:'}</span>
                </label>
                <div className="auth-input-wrap">
                  <span className="auth-prefix">🇵🇰</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="0300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    autoFocus
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <div className="auth-label-row">
                  <label className="auth-label">
                    <KeyRound size={15} />
                    <span>{lang === 'ur' ? '4 ہندسوں کا سیکیورٹی پن (PIN):' : '4-Digit Security PIN:'}</span>
                  </label>
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={() => {
                      sounds.playTap();
                      setForgotPhone(phone);
                      setMode('forgot');
                      setErrorMessage('');
                    }}
                  >
                    {lang === 'ur' ? 'پن بھول گئے؟' : 'Forgot PIN?'}
                  </button>
                </div>
                <div className="auth-input-wrap">
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    className="auth-input pin"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPin(!showPin)}
                    tabIndex={-1}
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="auth-submit-btn green"
              >
                {isLoading ? (
                  <span className="auth-btn-spinner"></span>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>{lang === 'ur' ? 'لاگ ان کریں' : 'Log In'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="auth-form">
              <div className="auth-input-group">
                <label className="auth-label">
                  <Store size={15} />
                  <span>{lang === 'ur' ? 'دکان یا کاروبار کا نام:' : 'Shop / Business Name:'}</span>
                </label>
                <div className="auth-input-wrap">
                  <input
                    type="text"
                    placeholder={lang === 'ur' ? 'مثلاً: مدینہ سپر اسٹور' : 'e.g. Madina Super Store'}
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">
                  <User size={15} />
                  <span>{lang === 'ur' ? 'آپ کا نام (دکاندار):' : 'Owner / Your Name:'}</span>
                </label>
                <div className="auth-input-wrap">
                  <input
                    type="text"
                    placeholder={lang === 'ur' ? 'مثلاً: محمد احمد' : 'e.g. Muhammad Ahmad'}
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">
                  <Phone size={15} />
                  <span>{lang === 'ur' ? 'موبائل نمبر:' : 'Mobile Number:'}</span>
                </label>
                <div className="auth-input-wrap">
                  <span className="auth-prefix">🇵🇰</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="0300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">
                  <KeyRound size={15} />
                  <span>{lang === 'ur' ? '4 ہندسوں کا سیکیورٹی پن منتخب کریں:' : 'Set 4-Digit Security PIN:'}</span>
                </label>
                <div className="auth-input-wrap">
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="•••• (مثلاً 1234)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    className="auth-input pin"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPin(!showPin)}
                    tabIndex={-1}
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="auth-input-hint">
                  {lang === 'ur'
                    ? '💡 یہ 4 ہندسے یاد رکھیں، ہر بار ایپ کھولنے پر یہ پن درج کرنا ہوگا۔'
                    : 'Remember this 4-digit PIN to open your Khatta.'}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="auth-submit-btn green"
              >
                {isLoading ? (
                  <span className="auth-btn-spinner"></span>
                ) : (
                  <>
                    <UserPlus size={18} />
                    <span>{lang === 'ur' ? 'کھاتہ بنائیں اور شروع کریں' : 'Create Account & Open Khatta'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. FORGOT PIN RECOVERY PANEL */}
          {mode === 'forgot' && (
            <div className="auth-forgot-panel">
              <div className="auth-forgot-header">
                <div className="auth-forgot-icon">
                  <KeyRound size={22} color="#059669" />
                </div>
                <div>
                  <h3 className="auth-forgot-title">
                    {lang === 'ur' ? 'پن کوڈ ریکوری اور ری سیٹ' : 'PIN Recovery & Reset'}
                  </h3>
                  <p className="auth-forgot-sub">
                    {lang === 'ur' ? 'نیا 4 ہندسوں کا پن درج کر کے محفوظ کریں:' : 'Set your new 4-digit PIN:'}
                  </p>
                </div>
              </div>

              {forgotSuccess && (
                <div className="auth-alert success">
                  <CheckCircle2 size={16} />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              <form onSubmit={handleResetPinSubmit} className="auth-form">
                <div className="auth-input-group">
                  <label className="auth-label">
                    <Phone size={15} />
                    <span>{lang === 'ur' ? 'موبائل نمبر:' : 'Mobile Number:'}</span>
                  </label>
                  <div className="auth-input-wrap">
                    <span className="auth-prefix">🇵🇰</span>
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder="0300 1234567"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      required
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label className="auth-label">
                    <Lock size={15} />
                    <span>{lang === 'ur' ? 'نیا 4 ہندسوں کا پن (PIN):' : 'New 4-Digit PIN:'}</span>
                  </label>
                  <div className="auth-input-wrap">
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="••••"
                      value={forgotNewPin}
                      onChange={(e) => setForgotNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      required
                      className="auth-input pin"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="auth-submit-btn green"
                >
                  {isLoading ? (
                    <span className="auth-btn-spinner"></span>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>{lang === 'ur' ? 'نیا پن محفوظ کریں اور لاگ ان کریں' : 'Save New PIN & Log In'}</span>
                    </>
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <span>{lang === 'ur' ? 'یا پرانا پن میسج پر منگوائیں' : 'Or get existing PIN via SMS'}</span>
              </div>

              <div className="auth-recovery-buttons">
                <button
                  type="button"
                  className="auth-recovery-btn wa"
                  onClick={handleSendWhatsAppRecovery}
                >
                  <MessageCircle size={15} />
                  <span>{lang === 'ur' ? 'واٹس ایپ پر پن منگوائیں' : 'WhatsApp PIN'}</span>
                </button>
                <button
                  type="button"
                  className="auth-recovery-btn sms"
                  onClick={handleSendSmsRecovery}
                >
                  <Smartphone size={15} />
                  <span>{lang === 'ur' ? 'لوکل SMS پر پن منگوائیں' : 'Local SMS PIN'}</span>
                </button>
              </div>

              <button
                type="button"
                className="auth-back-link"
                onClick={() => {
                  sounds.playTap();
                  setMode('login');
                  setErrorMessage('');
                  setForgotSuccess('');
                }}
              >
                ← {lang === 'ur' ? 'واپس لاگ ان پر جائیں' : 'Back to Login'}
              </button>
            </div>
          )}

          {/* Privacy & Security Guarantee Banner */}
          <div className="auth-security-footer">
            <div className="auth-security-badge">
              <ShieldCheck size={16} color="#059669" />
              <span>
                {lang === 'ur'
                  ? 'آپ کا کھاتہ 100% پرائیویٹ ہے۔ بغیر پن کے کوئی دوسرا آپ کا ڈیٹا نہیں دیکھ سکتا۔'
                  : '100% Private Ledger. No one else can view your shop or transactions.'}
              </span>
            </div>
          </div>
        </div>

        {/* Direct APK Download Quick Card */}
        <div className="auth-apk-download-card">
          <div className="auth-apk-left">
            <div className="auth-apk-icon">
              <Download size={20} color="#059669" />
            </div>
            <div>
              <div className="auth-apk-title">موبائل ایپ ڈاؤن لوڈ کریں (Android APK)</div>
              <div className="auth-apk-sub">1-Click ڈائریکٹ ڈاؤن لوڈ • آف لائن چلائیں</div>
            </div>
          </div>
          <a
            href="/KhattaApp.bin"
            download="KhattaApp.apk"
            className="auth-apk-btn"
            onClick={() => sounds.playCashChime()}
          >
            <span>ڈاؤن لوڈ</span>
          </a>
        </div>
      </div>
    </div>
  );
}
