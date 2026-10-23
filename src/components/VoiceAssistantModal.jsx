import React, { useState, useRef } from 'react';
import {
  X,
  Mic,
  Volume2,
  Sparkles,
  Check,
  Plus,
  Minus,
  AlertCircle,
  UserCheck,
  UserPlus,
  Phone,
  MapPin,
  Zap,
  Building2,
  Users
} from 'lucide-react';
import { sounds } from '../sound';
import { createSpeechRecognizer, isSpeechRecognitionSupported, speakText } from '../speech';
import { parseAIConversationalSpeech, findExistingCustomer, findExistingSupplier } from '../aiParser';
import { parseWithGeminiAI } from '../geminiService';
import { getCustomerBalance, getSupplierBalance } from '../storage';

export default function VoiceAssistantModal({
  customers = [],
  suppliers = [],
  defaultEntity = 'customer', // 'customer' | 'supplier'
  onApplyVoiceTransaction,
  onClose,
  t,
  lang
}) {
  const [entity, setEntity] = useState(defaultEntity); // 'customer' | 'supplier'
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [spokenSentence, setSpokenSentence] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [aiModelUsed, setAiModelUsed] = useState('Gemini 3.5 Flash Lite');

  // Parsed AI fields
  const [entityName, setEntityName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('gave'); // for cust: 'gave'/'got'. for sup: 'took'/'paid'
  const [matchedRecord, setMatchedRecord] = useState(null);

  // Additional fields for new entry
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isListeningPhone, setIsListeningPhone] = useState(false);
  const [isListeningAddress, setIsListeningAddress] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const recognizerRef = useRef(null);
  const offlineInputRef = useRef(null);

  // Trigger Immediate Auto-Save when data is ready
  const triggerAutoSave = (overrides = {}) => {
    const finalAmount = parseFloat(overrides.amount !== undefined ? overrides.amount : amount);
    const finalName = (overrides.name !== undefined ? overrides.name : entityName).trim();
    const finalPhone = (overrides.phone !== undefined ? overrides.phone : phoneNumber).trim();
    const finalType = overrides.type || type;
    const finalEntity = overrides.entity || entity;
    const finalAddress = (overrides.address !== undefined ? overrides.address : address).trim();
    const currentMatched = overrides.matchedRecord !== undefined ? overrides.matchedRecord : matchedRecord;

    if (!finalAmount || !finalName) return;
    if (finalEntity === 'customer' && !currentMatched && !finalPhone) return;

    setAutoSaving(true);
    sounds.playSuccessFanfare();
    speakText(
      lang === 'ur'
        ? `${finalName} کا کھاتہ محفوظ ہو گیا`
        : `${finalName} ka hisab mehfooz ho gaya`,
      lang
    );

    setTimeout(() => {
      onApplyVoiceTransaction({
        entity: finalEntity,
        record: currentMatched || null,
        fallbackName: finalName,
        phone: finalPhone,
        address: finalAddress,
        amount: finalAmount,
        type: finalType,
        details: lang === 'ur' ? 'آواز سے درج شدہ کھاتہ' : 'Voice transaction'
      });
      onClose();
    }, 600);
  };

  // Process and analyze spoken text with Gemini AI (fallback to local AI)
  const processSpokenSentence = async (sentence) => {
    if (!sentence || !sentence.trim()) return;
    setSpokenSentence(sentence);
    setIsAiProcessing(true);
    setErrorMessage('');

    try {
      const parsed = await parseWithGeminiAI(sentence);

      const targetEntity = parsed.entity === 'supplier' ? 'supplier' : entity;
      if (parsed.entity) setEntity(targetEntity);

      const detectedName = parsed.name || '';
      setEntityName(detectedName);

      if (parsed.amount) {
        setAmount(parsed.amount.toString());
      }

      // Determine transaction type
      let detectedType = parsed.type;
      if (targetEntity === 'supplier') {
        detectedType = parsed.type === 'got' ? 'paid' : 'took';
      } else {
        detectedType = parsed.type === 'got' ? 'got' : 'gave';
      }
      setType(detectedType);

      if (parsed.phone) {
        setPhoneNumber(parsed.phone);
      }
      if (parsed.address) {
        setAddress(parsed.address);
      }
      if (parsed.isAiParsed) {
        setAiModelUsed(parsed.model || 'Gemini 3.5 Flash Lite');
      }

      // Check existing in list
      let matched = null;
      if (targetEntity === 'supplier') {
        matched = findExistingSupplier(detectedName, suppliers);
      } else {
        matched = findExistingCustomer(detectedName, customers);
      }
      setMatchedRecord(matched);

      // AUTO-SAVE RULE:
      // If name & amount > 0 are present:
      if (detectedName && parsed.amount > 0) {
        if (matched) {
          // Existing customer or supplier -> auto-save immediately!
          triggerAutoSave({
            name: detectedName,
            amount: parsed.amount,
            type: detectedType,
            matchedRecord: matched,
            entity: targetEntity
          });
          return;
        } else if (parsed.phone && parsed.phone.length >= 7) {
          // New entity WITH phone number spoken in sentence -> auto-save immediately!
          triggerAutoSave({
            name: detectedName,
            amount: parsed.amount,
            phone: parsed.phone,
            type: detectedType,
            matchedRecord: null,
            entity: targetEntity
          });
          return;
        } else {
          // New customer without phone number:
          sounds.playTap();
          speakText(
            lang === 'ur' ? 'موبائل نمبر بتائیں' : 'Mobile number batayein',
            lang
          );
        }
      }
    } catch (err) {
      console.error('AI voice process error:', err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Start Main Voice Assistant Listening
  const startListening = () => {
    sounds.playTap();

    if (!isSpeechRecognitionSupported()) {
      setErrorMessage(lang === 'ur' ? 'آپ کا براؤزر مائیک سپورٹ نہیں کرتا۔ نیچے براہِ راست درج کریں۔' : 'Speech recognition not supported in this browser.');
      return;
    }

    setErrorMessage('');
    setInterimText('');
    setIsListening(true);

    try {
      if (recognizerRef.current) {
        try { recognizerRef.current.abort(); } catch (e) {}
      }

      const recognizer = createSpeechRecognizer({
        lang: 'ur-PK',
        autoConvertToUrdu: false,
        onInterim: (interim) => {
          setInterimText(interim);
        },
        onResult: (finalText) => {
          setIsListening(false);
          setInterimText('');
          processSpokenSentence(finalText);
        },
        onError: (err) => {
          setIsListening(false);
          if (err?.error === 'not-allowed') {
            setErrorMessage(lang === 'ur' ? 'مائیک کی اجازت (Permission) بند ہے۔ براؤزر کی سیٹنگز سے Allow کریں۔' : 'Microphone permission blocked. Please allow mic.');
          } else if (err?.error === 'no-speech') {
            setErrorMessage(lang === 'ur' ? 'کوئی آواز نہیں سنی گئی۔ دوبارہ مائیک دبا کر بولیں۔' : 'No speech heard. Please tap mic and speak again.');
          } else {
            setErrorMessage(lang === 'ur' ? 'مائیک فعال ہے، براہِ کرم واضح بولیں یا نیچے لکھ کر محفوظ کریں۔' : 'Mic is active, please speak clearly or type below.');
          }
        },
        onEnd: () => {
          setIsListening(false);
        }
      });

      recognizerRef.current = recognizer;
      recognizer.start();
    } catch (e) {
      setIsListening(false);
      setErrorMessage(e.message || 'Error starting speech');
    }
  };

  const stopListening = () => {
    if (recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
  };

  // Voice input for phone number (Auto-saves when valid number is heard!)
  const handleVoicePhone = () => {
    if (!isSpeechRecognitionSupported()) return;
    sounds.playTap();
    setIsListeningPhone(true);
    const recognizer = createSpeechRecognizer({
      lang: 'ur-PK',
      onResult: (spoken) => {
        setIsListeningPhone(false);
        const digits = spoken.replace(/[^0-9]/g, '');
        if (digits) {
          setPhoneNumber(digits);
          // Auto-save if name and amount already entered
          if (digits.length >= 7 && amount && entityName) {
            triggerAutoSave({ phone: digits });
          }
        }
      },
      onError: () => setIsListeningPhone(false),
      onEnd: () => setIsListeningPhone(false)
    });
    if (recognizer) {
      try { recognizer.start(); } catch (e) { setIsListeningPhone(false); }
    }
  };

  // Voice input for address
  const handleVoiceAddress = () => {
    if (!isSpeechRecognitionSupported()) return;
    sounds.playTap();
    setIsListeningAddress(true);
    const recognizer = createSpeechRecognizer({
      lang: 'ur-PK',
      onResult: (spoken) => {
        setIsListeningAddress(false);
        setAddress(spoken);
      },
      onError: () => setIsListeningAddress(false),
      onEnd: () => setIsListeningAddress(false)
    });
    if (recognizer) {
      try { recognizer.start(); } catch (e) { setIsListeningAddress(false); }
    }
  };

  // Typing phone number auto-saves when 10-11 digits reached
  const handlePhoneChange = (val) => {
    setPhoneNumber(val);
    const cleanDigits = val.replace(/[^0-9]/g, '');
    if (cleanDigits.length >= 10 && amount && entityName && !matchedRecord) {
      triggerAutoSave({ phone: cleanDigits });
    }
  };

  // Quick Preset Sample Tap
  const handleQuickSample = (sampleSentence) => {
    sounds.playTap();
    processSpokenSentence(sampleSentence);
  };

  // Manual Confirm Button
  const handleConfirm = () => {
    triggerAutoSave();
  };

  // Balance calculation preview
  const prevBal = matchedRecord
    ? (entity === 'supplier' ? getSupplierBalance(matchedRecord) : getCustomerBalance(matchedRecord))
    : 0;
  const numAmount = parseFloat(amount) || 0;
  const isAddition = entity === 'supplier' ? (type === 'took') : (type === 'gave');
  const projectedBal = isAddition ? prevBal + numAmount : prevBal - numAmount;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet animate-slide-up" style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ color: 'var(--primary)', width: '100%', justifyContent: 'center', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={20} />
              <span>{t.voiceAssistant} (AI اسسٹنٹ)</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 12px', borderRadius: '20px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #86efac', fontSize: '11px', fontWeight: 800, color: '#15803d' }}>
              <Zap size={12} color="#16a34a" />
              <span>{typeof navigator !== 'undefined' && !navigator.onLine ? '⚡ 24 گھنٹے آف لائن منشی AI ایکٹو ہے' : '✨ Gemini 3.5 AI ایکٹو ہے'}</span>
            </div>
          </div>
          <button
            className="icon-btn"
            style={{ width: '32px', height: '32px', position: 'absolute', right: '16px', top: '16px' }}
            onClick={() => { sounds.playTap(); onClose(); }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Entity Selector: Customer (Lene Hain) vs Supplier (Dene Hain) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '4px 0 10px 0' }}>
          <button
            type="button"
            style={{
              padding: '8px 10px',
              borderRadius: '12px',
              border: entity === 'customer' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
              background: entity === 'customer' ? 'var(--primary-bg)' : 'var(--bg-subtle)',
              color: entity === 'customer' ? 'var(--primary-dark)' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            onClick={() => {
              sounds.playTap();
              setEntity('customer');
              setType('gave');
              setMatchedRecord(findExistingCustomer(entityName, customers));
            }}
          >
            <Users size={15} />
            <span>گاہک (لینے ہیں)</span>
          </button>

          <button
            type="button"
            style={{
              padding: '8px 10px',
              borderRadius: '12px',
              border: entity === 'supplier' ? '2px solid #ef4444' : '1px solid var(--border-light)',
              background: entity === 'supplier' ? '#fff1f2' : 'var(--bg-subtle)',
              color: entity === 'supplier' ? '#b91c1c' : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            onClick={() => {
              sounds.playTap();
              setEntity('supplier');
              setType('took');
              setMatchedRecord(findExistingSupplier(entityName, suppliers));
            }}
          >
            <Building2 size={15} />
            <span>سپلائر (دینے ہیں)</span>
          </button>
        </div>

        {/* Big Mic Button with Active Pulsing Ring */}
        <div style={{ padding: '6px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: 'none',
              background: isListening
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isListening ? '0 0 0 16px rgba(239, 68, 68, 0.25)' : '0 10px 24px rgba(5, 150, 105, 0.35)',
              transition: 'all 0.2s ease'
            }}
            onClick={isListening ? stopListening : startListening}
          >
            <Mic size={36} className={isListening ? 'animate-pulse-soft' : ''} />
          </button>

          {/* Status Label */}
          <div style={{ fontSize: '14px', fontWeight: 800, color: isListening ? '#ef4444' : 'var(--text-main)' }}>
            {isListening
              ? (lang === 'ur' ? '🎙️ سن رہا ہے... بولیں!' : 'Listening... speak now!')
              : (lang === 'ur' ? 'پورے جملے میں بولیں، بولتے ہی خود سیو ہوگا' : 'Speak naturally, auto-saves instantly')}
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, maxWidth: '320px' }}>
            {lang === 'ur'
              ? 'مثلاً: "اسد نے 5000 ادھار لیا نمبر 03001234567"'
              : 'E.g.: "Asad ne 5000 udhar liya number 03001234567"'}
          </div>

          {/* Direct Offline Voice & Text Input Box */}
          <div style={{ width: '100%', maxWidth: '340px', margin: '4px 0 2px 0' }}>
            <input
              ref={offlineInputRef}
              type="text"
              placeholder={lang === 'ur' ? 'یہاں بولیں یا لکھیں (مثلاً: اسد 5000 ادھار)...' : 'Bol kar ya likh kar darj karein...'}
              value={spokenSentence}
              onChange={(e) => {
                const val = e.target.value;
                setSpokenSentence(val);
                if (val.trim().length > 3) {
                  processSpokenSentence(val);
                }
              }}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '14px',
                border: '1.5px solid var(--border-light)',
                padding: '0 14px',
                fontSize: '13px',
                fontWeight: 600,
                background: '#ffffff',
                outline: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                textAlign: 'center'
              }}
            />
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
              {lang === 'ur' ? '⚡ 24 گھنٹے آف لائن منشی AI ایکٹو ہے' : '⚡ 24/7 Offline AI Munshi Active'}
            </div>
          </div>

          {/* Sound wave visualizer when listening */}
          {isListening && (
            <div className="waveform-box">
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
            </div>
          )}

          {/* Live transcript feedback as you speak */}
          {interimText && (
            <div style={{
              background: '#f0fdf4',
              border: '1px dashed #10b981',
              borderRadius: '12px',
              padding: '6px 12px',
              fontSize: '12px',
              color: '#047857',
              fontWeight: 700
            }}>
              "{interimText}..."
            </div>
          )}

          {/* AI Processing Banner */}
          {isAiProcessing && (
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              border: '1.5px solid #10b981',
              borderRadius: '12px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: '#065f46',
              fontWeight: 800,
              fontSize: '12px',
              width: '100%'
            }}>
              <Sparkles size={16} className="animate-pulse-soft" />
              <span>Gemini 3.5 AI جملے کا تجزیہ کر رہا ہے...</span>
            </div>
          )}

          {/* Auto Saving Animation */}
          {autoSaving && (
            <div style={{
              background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
              border: '2px solid #16a34a',
              borderRadius: '12px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: '#15803d',
              fontWeight: 900,
              fontSize: '13px',
              width: '100%'
            }}>
              <Check size={18} />
              <span>⚡ خود بخود محفوظ ہو رہا ہے...</span>
            </div>
          )}

          {/* Spoken sentence display */}
          {spokenSentence && !isListening && !isAiProcessing && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '5px 10px',
              fontSize: '11px',
              color: '#475569',
              width: '100%'
            }}>
              <span style={{ fontWeight: 700, color: '#64748b' }}>سنا گیا: </span>
              "{spokenSentence}"
            </div>
          )}
        </div>

        {/* Error notification if mic fails */}
        {errorMessage && (
          <div style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '10px',
            padding: '8px 10px',
            fontSize: '11px',
            color: '#be123c',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '6px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* AI Analysis Result Card */}
        <div style={{
          background: isAddition ? '#fff1f2' : '#f0fdf4',
          border: `1.5px solid ${isAddition ? '#fecdd3' : '#bbf7d0'}`,
          borderRadius: '16px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          textAlign: 'left'
        }}>
          {/* Status Header: Existing vs New */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {matchedRecord ? (
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <UserCheck size={15} />
                <span>موجودہ کھاتہ مل گیا ({matchedRecord.name}) ✅</span>
              </span>
            ) : (
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <UserPlus size={15} />
                <span>نیا کھاتہ درج ہو رہا ہے 🆕</span>
              </span>
            )}

            {/* Type badge */}
            <span style={{
              padding: '3px 8px',
              borderRadius: '8px',
              background: isAddition ? '#e11d48' : '#15803d',
              color: 'white',
              fontSize: '11px',
              fontWeight: 700
            }}>
              {entity === 'supplier'
                ? (type === 'took' ? '🔴 مال ادھار لیا (دینا ہے)' : '🟢 رقم ادا کی')
                : (type === 'gave' ? '🔴 ادھار دیا' : '🟢 وصول ہوا')}
            </span>
          </div>

          {/* Name Field */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
              {entity === 'supplier' ? 'سپلائر کا نام:' : 'گاہک کا نام (صاف ستھرا):'}
            </label>
            <input
              type="text"
              value={entityName}
              onChange={(e) => {
                setEntityName(e.target.value);
                if (entity === 'supplier') {
                  setMatchedRecord(findExistingSupplier(e.target.value, suppliers));
                } else {
                  setMatchedRecord(findExistingCustomer(e.target.value, customers));
                }
              }}
              placeholder={entity === 'supplier' ? 'سپلائر کا نام' : 'گاہک کا نام'}
              style={{
                width: '100%',
                height: '40px',
                borderRadius: '10px',
                border: '1px solid var(--border-light)',
                padding: '0 10px',
                fontSize: '14px',
                fontWeight: 700,
                background: 'white',
                outline: 'none'
              }}
            />
          </div>

          {/* Amount Field */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
              رقم ({t.rupees}):
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="رقم (مثلاً: 5000)"
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '10px',
                border: '1px solid var(--border-light)',
                padding: '0 10px',
                fontSize: '17px',
                fontWeight: 800,
                background: 'white',
                color: isAddition ? 'var(--red-gave)' : 'var(--green-got)',
                outline: 'none'
              }}
            />
          </div>

          {/* Existing Balance Preview */}
          {matchedRecord && numAmount > 0 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.85)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '11px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px dashed #94a3b8'
            }}>
              <span>سابقہ: {prevBal.toLocaleString()}</span>
              <span>{isAddition ? '+' : '-'} {numAmount.toLocaleString()}</span>
              <span style={{ fontWeight: 800, color: projectedBal > 0 ? '#b91c1c' : '#15803d' }}>
                = نیا کل: {projectedBal.toLocaleString()} روپے
              </span>
            </div>
          )}

          {/* If NEW ENTRY: Prompt for Phone & Optional Address */}
          {!matchedRecord && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: !phoneNumber.trim() ? '#b91c1c' : 'var(--text-main)' }}>
                    * موبائل نمبر (لکھیں یا بولیں، خود سیو ہو جائے گا):
                  </label>
                  <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 700 }}>
                    🎙️ بولیں
                  </span>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="0300-1234567"
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '10px',
                      border: !phoneNumber.trim() ? '2px solid #ef4444' : '1px solid var(--border-light)',
                      padding: '0 40px 0 10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      background: !phoneNumber.trim() ? '#fff5f5' : 'white',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      right: '5px',
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isListeningPhone ? '#ef4444' : 'var(--primary-bg)',
                      color: isListeningPhone ? 'white' : 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={handleVoicePhone}
                    title="Speak Phone Number"
                  >
                    <Mic size={14} className={isListeningPhone ? 'animate-pulse-soft' : ''} />
                  </button>
                </div>
              </div>

              {!phoneNumber.trim() && entity === 'customer' && (
                <div style={{
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: '#be123c',
                  fontSize: '10px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <AlertCircle size={13} />
                  <span>نیا گاہک درج کرنے کے لیے موبائل نمبر لکھیں یا بولیں۔</span>
                </div>
              )}

              {/* Address (Optional) */}
              <div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="پتہ یا نشانی (اختیاری)..."
                    style={{
                      width: '100%',
                      height: '36px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light)',
                      padding: '0 40px 0 10px',
                      fontSize: '12px',
                      background: 'white',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      right: '5px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: 'none',
                      background: isListeningAddress ? '#ef4444' : 'var(--bg-subtle)',
                      color: isListeningAddress ? 'white' : 'var(--text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={handleVoiceAddress}
                    title="Speak Address"
                  >
                    <Mic size={13} className={isListeningAddress ? 'animate-pulse-soft' : ''} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <button
            type="button"
            style={{
              height: '46px',
              borderRadius: '12px',
              border: 'none',
              background: (!amount || !entityName || (!matchedRecord && entity === 'customer' && !phoneNumber.trim()))
                ? '#94a3b8'
                : (isAddition ? '#e11d48' : '#15803d'),
              color: 'white',
              fontWeight: 800,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: (!amount || !entityName || (!matchedRecord && entity === 'customer' && !phoneNumber.trim())) ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-md)',
              marginTop: '4px'
            }}
            disabled={!amount || !entityName || (!matchedRecord && entity === 'customer' && !phoneNumber.trim())}
            onClick={handleConfirm}
          >
            <Check size={18} />
            <span>
              {!matchedRecord && entity === 'customer' && !phoneNumber.trim()
                ? 'موبائل نمبر لکھیں یا بولیں'
                : (matchedRecord
                    ? `${matchedRecord.name} کے کھاتے میں ${amount || 0} روپے شامل کریں`
                    : `نیا کھاتہ بنائیں اور ${amount || 0} ادھار محفوظ کریں`)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
