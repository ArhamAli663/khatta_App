import React, { useState } from 'react';
import { X, Mic, Check, Plus, Minus } from 'lucide-react';
import { getSupplierBalance } from '../storage';
import { sounds } from '../sound';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../speech';

export default function AddSupplierTransactionModal({
  supplier,
  type = 'took', // 'took' (maal udhar liya - owes more) | 'paid' (adaeegi ki - owes less)
  onClose,
  onSave,
  t,
  lang
}) {
  const [currentType, setCurrentType] = useState(type);
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [isListeningDetails, setIsListeningDetails] = useState(false);

  const prevBal = getSupplierBalance(supplier);
  const numAmount = parseFloat(amount) || 0;
  // If 'took', shopkeeper owes more (+). If 'paid', shopkeeper owes less (-).
  const newBal = currentType === 'took' ? prevBal + numAmount : prevBal - numAmount;

  const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000];

  const handleVoiceDetails = () => {
    if (!isSpeechRecognitionSupported()) return;
    sounds.playTap();
    setIsListeningDetails(true);
    const recognizer = createSpeechRecognizer({
      lang: 'ur-PK',
      onResult: (spoken) => {
        setIsListeningDetails(false);
        setDetails(spoken);
      },
      onError: () => setIsListeningDetails(false),
      onEnd: () => setIsListeningDetails(false)
    });
    if (recognizer) {
      try { recognizer.start(); } catch (e) { setIsListeningDetails(false); }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) {
      alert(lang === 'ur' ? 'برائے مہربانی رقم درج کریں۔' : 'Please enter amount.');
      return;
    }

    if (currentType === 'took') {
      sounds.playCashChime();
    } else {
      sounds.playSuccessFanfare();
    }

    onSave({
      type: currentType,
      amount: numAmount,
      details: details.trim() || (currentType === 'took' ? (lang === 'ur' ? 'مال ادھار لیا' : 'Goods on credit') : (lang === 'ur' ? 'رقم ادا کی' : 'Paid cash')),
      date: new Date().toISOString()
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ color: currentType === 'took' ? 'var(--red-gave)' : 'var(--green-got)' }}>
            {currentType === 'took' ? <Plus size={20} /> : <Minus size={20} />}
            <span>
              {currentType === 'took'
                ? (lang === 'ur' ? 'مال ادھار لیا (دینا ہے)' : 'Took Goods on Credit')
                : (lang === 'ur' ? 'رقم ادا کی (ادائیگی)' : 'Paid Cash to Supplier')}
            </span>
          </div>
          <button
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            onClick={() => { sounds.playTap(); onClose(); }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Supplier Info Bar */}
        <div style={{
          background: 'var(--bg-subtle)',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px',
          fontWeight: 700
        }}>
          <span>{supplier.name}</span>
          <span style={{ color: prevBal > 0 ? '#b91c1c' : '#15803d' }}>
            {lang === 'ur' ? 'سابقہ واجب الادا:' : 'Owe:'} {t.rupees} {prevBal.toLocaleString()}
          </span>
        </div>

        {/* Type Toggle Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            style={{
              padding: '10px',
              borderRadius: '12px',
              border: 'none',
              background: currentType === 'took' ? '#ef4444' : 'var(--bg-subtle)',
              color: currentType === 'took' ? 'white' : 'var(--text-main)',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer'
            }}
            onClick={() => { sounds.playTap(); setCurrentType('took'); }}
          >
            🔴 مال ادھار لیا (دینا ہے)
          </button>
          <button
            type="button"
            style={{
              padding: '10px',
              borderRadius: '12px',
              border: 'none',
              background: currentType === 'paid' ? '#10b981' : 'var(--bg-subtle)',
              color: currentType === 'paid' ? 'white' : 'var(--text-main)',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer'
            }}
            onClick={() => { sounds.playTap(); setCurrentType('paid'); }}
          >
            🟢 رقم ادا کی (ادائیگی)
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Big Amount Input */}
          <div className="input-field-group">
            <label className="field-label">
              <span>{t.enterAmount} ({t.rupees}) *</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              style={{
                height: '56px',
                borderRadius: '16px',
                border: `2px solid ${currentType === 'took' ? 'var(--red-gave)' : 'var(--green-got)'}`,
                padding: '0 16px',
                fontSize: '26px',
                fontWeight: 900,
                textAlign: 'center',
                color: currentType === 'took' ? 'var(--red-gave)' : 'var(--green-got)',
                outline: 'none',
                background: currentType === 'took' ? '#fff1f2' : '#f0fdf4'
              }}
              required
              autoFocus
            />
          </div>

          {/* Quick Preset Amount Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {quickAmounts.map((q) => (
              <button
                key={q}
                type="button"
                className="chip-btn"
                onClick={() => { sounds.playTap(); setAmount(q.toString()); }}
              >
                +{q.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Details / Items Input with Voice */}
          <div className="input-field-group">
            <label className="field-label">
              <span>{lang === 'ur' ? 'تفصیل (مثلاً 5 ڈبے گھی، بل نمبر...)' : 'Details / Bill No (Optional)'}</span>
              <span className="field-hint">🎙️ بولیں</span>
            </label>
            <div className="input-with-mic">
              <input
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={lang === 'ur' ? 'سامان یا بل کی تفصیل...' : 'Enter details...'}
              />
              <button
                type="button"
                className={`mic-inline-btn ${isListeningDetails ? 'active' : ''}`}
                onClick={handleVoiceDetails}
                title="Speak Details"
              >
                <Mic size={16} />
              </button>
            </div>
          </div>

          {/* Live Balance Calculation Preview */}
          {numAmount > 0 && (
            <div style={{
              background: '#f8fafc',
              border: '1.5px dashed #cbd5e1',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px'
            }}>
              <span>سابقہ دینا: {prevBal.toLocaleString()}</span>
              <span>{currentType === 'took' ? '+' : '-'} {numAmount.toLocaleString()}</span>
              <span style={{ fontWeight: 900, color: newBal > 0 ? '#b91c1c' : '#15803d' }}>
                = نیا کل: {newBal.toLocaleString()} روپے
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="save-btn"
            style={{
              background: currentType === 'took' ? '#ef4444' : '#10b981',
              marginTop: '4px'
            }}
          >
            <Check size={18} />
            <span>
              {currentType === 'took'
                ? `سپلائر کے کھاتے میں ${numAmount || 0} روپے ادھار شامل کریں`
                : `سپلائر کو ${numAmount || 0} روپے ادائیگی محفوظ کریں`}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
