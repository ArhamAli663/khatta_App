import React, { useState } from 'react';
import { X, Mic, Plus, Minus, Check, ArrowRight, Sparkles } from 'lucide-react';
import { sounds } from '../sound';
import { getCustomerBalance } from '../storage';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../speech';

export default function AddTransactionModal({
  customer,
  type, // 'gave' or 'got'
  onClose,
  onSave,
  t,
  lang
}) {
  const [amountStr, setAmountStr] = useState('');
  const [details, setDetails] = useState('');
  const [isListening, setIsListening] = useState(false);

  const prevBalance = getCustomerBalance(customer);
  const currentAmount = parseFloat(amountStr) || 0;
  
  // Calculate new projected balance
  const projectedBalance = type === 'gave'
    ? prevBalance + currentAmount
    : prevBalance - currentAmount;

  const isGave = type === 'gave';

  // Numpad key tap
  const handleKeyTap = (key) => {
    sounds.playTap();
    if (key === 'C') {
      setAmountStr('');
    } else if (key === 'BACK') {
      setAmountStr((prev) => prev.slice(0, -1));
    } else {
      if (amountStr.length >= 7) return; // limit max digits
      setAmountStr((prev) => prev + key);
    }
  };

  // Preset amount chip tap (adds to current amount)
  const handlePresetTap = (presetVal) => {
    sounds.playTap();
    const cur = parseFloat(amountStr) || 0;
    setAmountStr((cur + presetVal).toString());
  };

  // Quick item chip tap
  const handleItemTap = (item) => {
    sounds.playTap();
    setDetails((prev) => (prev ? `${prev}, ${item}` : item));
  };

  // Voice Input for amount / items
  const handleVoiceInput = () => {
    if (!isSpeechRecognitionSupported()) {
      alert(t.notSupportedVoice);
      return;
    }
    sounds.playTap();
    setIsListening(true);

    const speechLang = lang === 'ur' ? 'ur-PK' : lang === 'roman' ? 'hi-IN' : 'en-US';
    const recognizer = createSpeechRecognizer({
      lang: speechLang,
      onResult: (spoken) => {
        setIsListening(false);
        // Find numbers
        const match = spoken.match(/\d+/);
        if (match) {
          setAmountStr(match[0]);
        }
        // Spoken note
        const cleanNote = spoken.replace(/\d+/g, '').replace(/(udhar|wasool|diya|mila|روپے|ادھار|وصول)/gi, '').trim();
        if (cleanNote) {
          setDetails((prev) => (prev ? `${prev} ${cleanNote}` : cleanNote));
        }
      },
      onError: () => setIsListening(false),
      onEnd: () => setIsListening(false)
    });

    if (recognizer) {
      try {
        recognizer.start();
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const handleSave = () => {
    if (currentAmount <= 0) return;
    if (isGave) {
      sounds.playUdharAlert();
    } else {
      sounds.playCashChime();
    }
    onSave({
      amount: currentAmount,
      type,
      details: details.trim(),
      date: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ color: isGave ? 'var(--red-gave)' : 'var(--green-got)' }}>
            {isGave ? <Plus size={22} /> : <Minus size={22} />}
            <span>{isGave ? t.youGave : t.youGot}</span>
          </div>

          <button
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            onClick={() => { sounds.playTap(); onClose(); }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Big Amount Display Box */}
        <div style={{
          background: isGave ? '#fff1f2' : '#f0fdf4',
          border: `2px solid ${isGave ? '#fecdd3' : '#bbf7d0'}`,
          borderRadius: '20px',
          padding: '16px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: isGave ? 'var(--red-gave)' : 'var(--green-got)', marginBottom: '4px' }}>
            {isGave ? (lang === 'ur' ? 'کتنے روپے کا سامان ادھار دیا؟' : 'Kitne rupay ka udhar diya?') : (lang === 'ur' ? 'کتنے روپے وصول ہوئے؟' : 'Kitne rupay wasool huwe?')}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-muted)' }}>{t.rupees}</span>
            <span className="big-num" style={{
              fontSize: '42px',
              fontWeight: 900,
              color: isGave ? 'var(--red-gave)' : 'var(--green-got)',
              minHeight: '52px'
            }}>
              {amountStr || '0'}
            </span>
          </div>

          {/* Voice Mic inside amount box */}
          <button
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              border: 'none',
              background: isListening ? '#ef4444' : 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)'
            }}
            onClick={handleVoiceInput}
            title={t.voiceAssistant}
          >
            <Mic size={20} className={isListening ? 'animate-pulse-soft' : ''} />
          </button>
        </div>

        {/* Live Calculation Preview Banner */}
        {currentAmount > 0 && (
          <div className="calc-preview-banner">
            <div className="calc-step">
              <span className="calc-step-label">{t.previousBalance}</span>
              <span className="calc-step-val">{t.rupees} {prevBalance}</span>
            </div>

            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-muted)' }}>
              {isGave ? '+' : '-'}
            </div>

            <div className="calc-step">
              <span className="calc-step-label">{t.newAmount}</span>
              <span className="calc-step-val" style={{ color: isGave ? 'var(--red-gave)' : 'var(--green-got)' }}>
                {t.rupees} {currentAmount}
              </span>
            </div>

            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-muted)' }}>=</div>

            <div className="calc-step">
              <span className="calc-step-label">{t.newTotal}</span>
              <span className="calc-step-val" style={{ color: projectedBalance > 0 ? 'var(--red-gave)' : 'var(--green-got)' }}>
                {t.rupees} {projectedBalance}
              </span>
            </div>
          </div>
        )}

        {/* Preset Quick Amount Chips */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
            {t.quickAdd} (ایک ٹچ میں رقم بڑھائیں):
          </div>
          <div className="preset-chips">
            {t.presetAmounts.map((val) => (
              <button
                key={val}
                className="preset-chip"
                onClick={() => handlePresetTap(val)}
              >
                +{val}
              </button>
            ))}
          </div>
        </div>

        {/* Big Numeric Keypad */}
        <div>
          <div className="numpad-container">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'BACK'].map((key) => (
              <button
                key={key}
                className={`numpad-key ${key === 'C' || key === 'BACK' ? 'action' : ''}`}
                onClick={() => handleKeyTap(key)}
              >
                {key === 'BACK' ? '⌫' : key}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Item Tags (Atta, Cheeni, Ghee, etc.) */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
            {t.itemDetails}:
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {t.commonItems.map((item) => (
              <button
                key={item}
                style={{
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-subtle)',
                  padding: '5px 10px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => handleItemTap(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={lang === 'ur' ? 'سامان کی تفصیل لکھیں یا بولیں...' : 'Saman ki detail likhen...'}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>

        {/* Big Save Button */}
        <button
          style={{
            height: '52px',
            borderRadius: '16px',
            border: 'none',
            background: isGave
              ? 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)'
              : 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: currentAmount > 0 ? 'pointer' : 'not-allowed',
            opacity: currentAmount > 0 ? 1 : 0.6,
            boxShadow: 'var(--shadow-md)',
            marginTop: '4px'
          }}
          disabled={currentAmount <= 0}
          onClick={handleSave}
        >
          <Check size={20} />
          <span>{lang === 'ur' ? 'محفوظ کریں اور کھاتہ اپڈیٹ کریں' : `${t.save} (Rs. ${currentAmount || 0})`}</span>
        </button>
      </div>
    </div>
  );
}
