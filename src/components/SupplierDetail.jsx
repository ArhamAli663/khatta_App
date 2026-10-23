import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  FileText,
  Volume2,
  CheckCircle2,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  Pencil,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getSupplierBalance, formatDateTime } from '../storage';
import { sounds } from '../sound';
import { speakText } from '../speech';

export default function SupplierDetail({
  supplier,
  onBack,
  onAddTransaction,
  onDeleteTransaction,
  onEditTransaction,
  onClearBalance,
  onResetTransactions,
  onDeleteSupplier,
  onWhatsApp,
  t,
  lang,
  shop
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteSupplier, setConfirmDeleteSupplier] = useState(false);
  const [txToDelete, setTxToDelete] = useState(null);
  const [txToEdit, setTxToEdit] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');

  const balance = getSupplierBalance(supplier);
  const initial = (supplier.name || 'س').trim().charAt(0);

  const handleClear = () => {
    sounds.playSuccessFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    onClearBalance(supplier.id);
    setConfirmClear(false);
  };

  const handleSpeak = () => {
    sounds.playTap();
    let text = '';
    if (balance > 0) {
      text = lang === 'ur'
        ? `سپلائر ${supplier.name} کو آپ نے ${balance.toLocaleString()} روپے دینے ہیں۔`
        : `Supplier ${supplier.name} ko aap ne ${balance.toLocaleString()} rupay dene hain.`;
    } else if (balance < 0) {
      text = lang === 'ur'
        ? `سپلائر ${supplier.name} کو آپ کے ${Math.abs(balance).toLocaleString()} روپے ایڈوانس دیے ہوئے ہیں۔`
        : `Supplier ${supplier.name} ko aap ke ${Math.abs(balance).toLocaleString()} rupay advance hain.`;
    } else {
      text = lang === 'ur'
        ? `سپلائر ${supplier.name} کا حساب بالکل بے باق اور برابر ہے، صفر روپے۔`
        : `Supplier ${supplier.name} ka hisab bilkul barabar hai, zero rupay.`;
    }
    speakText(text, lang);
  };

  const openEditModal = (tx) => {
    sounds.playTap();
    setTxToEdit(tx);
    setEditAmount(String(tx.amount || ''));
    try {
      const d = new Date(tx.date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setEditDate(`${yyyy}-${mm}-${dd}`);
    } catch { setEditDate(''); }
  };

  const handleSaveEdit = () => {
    if (!txToEdit) return;
    const newAmount = parseFloat(editAmount);
    if (!newAmount || isNaN(newAmount) || newAmount <= 0) {
      alert(lang === 'ur' ? 'درست رقم درج کریں' : 'Please enter a valid amount');
      return;
    }
    let newDate = txToEdit.date;
    if (editDate) {
      try {
        const existing = new Date(txToEdit.date);
        const [y, m, day] = editDate.split('-');
        existing.setFullYear(parseInt(y), parseInt(m) - 1, parseInt(day));
        newDate = existing.toISOString();
      } catch { newDate = txToEdit.date; }
    }
    const dt = formatDateTime(newDate, lang);
    onEditTransaction(txToEdit.id, {
      amount: newAmount,
      date: newDate,
      dateFormatted: dt.date,
      timeFormatted: dt.time
    });
    setTxToEdit(null);
  };

  return (
    <div className="detail-view animate-fade-in">
      {/* Top Header */}
      <div className="detail-header">
        <div className="detail-user-bar">
          <button
            className="icon-btn"
            onClick={() => { sounds.playTap(); onBack(); }}
            title={t.cancel}
          >
            <ArrowLeft size={18} />
          </button>

          {/* Supplier Initials Badge (Warm Red/Orange styling for Supplier) */}
          <div
            className="customer-avatar-box"
            style={{
              width: '42px',
              height: '42px',
              backgroundColor: '#fff1f2',
              color: '#e11d48',
              border: '1.5px solid #fecdd3',
              fontSize: '18px',
              fontWeight: 800
            }}
          >
            {initial}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {supplier.name}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'flex-start', marginTop: '2px' }}>
              {supplier.phone && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                  <Phone size={10} /> {supplier.phone}
                </div>
              )}
              {supplier.address && (
                <div style={{ fontSize: '11px', color: '#e11d48', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '3px', wordBreak: 'break-word', maxWidth: '100%' }}>
                  <MapPin size={10} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ wordBreak: 'break-word' }}>{supplier.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action icons: Delete, Call, WhatsApp */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {/* Delete Supplier Button */}
          <button
            className="icon-btn"
            style={{ color: '#e11d48', borderColor: '#fecdd3', background: '#fff1f2' }}
            onClick={() => { sounds.playTap(); setConfirmDeleteSupplier(true); }}
            title={lang === 'ur' ? 'سپلائر ڈیلیٹ کریں' : 'Delete Supplier'}
          >
            <Trash2 size={15} />
          </button>

          {supplier.phone && (
            <a
              href={`tel:${supplier.phone}`}
              className="icon-btn"
              onClick={() => sounds.playTap()}
              title="Call"
              style={{ textDecoration: 'none' }}
            >
              <Phone size={15} color="#e11d48" />
            </a>
          )}

          {supplier.phone && (
            <button
              className="icon-btn"
              style={{ color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}
              onClick={() => { sounds.playTap(); onWhatsApp(supplier, balance); }}
              title="WhatsApp"
            >
              <MessageCircle size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Big Balance Hero Card */}
      <div className={`big-balance-card ${balance > 0 ? 'due' : ''}`}>
        <div className="big-balance-title">
          {balance > 0
            ? (lang === 'ur' ? 'سپلائر کو آپ نے دینے ہیں (واجب الادا)' : 'Aap Ne Supplier Ko Dene Hain')
            : balance < 0
            ? (lang === 'ur' ? 'آپ نے ایڈوانس ادا کیے ہوئے ہیں' : 'Aap Ne Advance Diye Hain')
            : (lang === 'ur' ? 'حساب مکمل بے باق ہے' : 'Hisab Barabar (0 Rs)')}
        </div>

        <div
          className={`big-balance-val big-num ${balance > 0 ? 'text-red' : balance < 0 ? 'text-green' : ''}`}
          style={{ color: balance > 0 ? 'var(--red-gave)' : balance < 0 ? 'var(--green-got)' : 'var(--text-muted)' }}
        >
          {t.rupees} {Math.abs(balance).toLocaleString()}
          {balance < 0 && <span style={{ fontSize: '16px', color: 'var(--green-got)', marginLeft: '6px' }}>(Advance)</span>}
        </div>

        {/* Balance Action Pills */}
        <div className="big-balance-actions">
          {/* Audio Listen */}
          <button className="balance-action-pill" onClick={handleSpeak}>
            <Volume2 size={16} />
            <span>{t.listenBalance}</span>
          </button>

          {/* WhatsApp Message */}
          {supplier.phone && (
            <button
              className="balance-action-pill"
              style={{ color: '#16a34a' }}
              onClick={() => { sounds.playTap(); onWhatsApp(supplier, balance); }}
            >
              <MessageCircle size={16} />
              <span>{t.shareWhatsApp}</span>
            </button>
          )}

          {/* Hisab Barabar / Clear Hisab Button */}
          {(balance !== 0 || (supplier.transactions && supplier.transactions.length > 0)) && (
            <button
              className="balance-action-pill"
              style={{ color: '#059669', borderColor: '#bbf7d0', background: '#f0fdf4' }}
              onClick={() => { sounds.playTap(); setConfirmClear(true); }}
            >
              <CheckCircle2 size={16} />
              <span>{lang === 'ur' ? 'حساب بے باق' : 'Clear Hisab'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Transaction History Section Header */}
      <div style={{ padding: '0 16px 8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
          {lang === 'ur' ? 'لین دین کی تفصیل (مال و ادائیگی)' : 'Supplier Ledger History'}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
          {(supplier.transactions || []).length} {lang === 'ur' ? 'اندراجات' : 'entries'}
        </span>
      </div>

      {/* Transaction History List */}
      <div className="tx-history-box">
        {(!supplier.transactions || supplier.transactions.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
            {lang === 'ur' ? 'ابھی کوئی لین دین درج نہیں ہے۔ نیچے دیے گئے بٹن سے مال لینا یا رقم ادا کرنا درج کریں۔' : 'No transactions recorded yet. Tap buttons below.'}
          </div>
        ) : (
          [...supplier.transactions].reverse().map((tx) => {
            const isDebt = tx.type === 'took' || tx.type === 'gave';
            const dt = formatDateTime(tx.date, lang);
            return (
              <div key={tx.id} className={`tx-item-card ${isDebt ? 'gave' : 'got'}`}>
                <div className="tx-meta-info">
                  <span className={`tx-badge ${isDebt ? 'gave' : 'got'}`}>
                    {isDebt ? <Plus size={12} /> : <Minus size={12} />}
                    {isDebt
                      ? (lang === 'ur' ? 'مال ادھار لیا (دینا ہے)' : 'Maal Liya (Payable)')
                      : (lang === 'ur' ? 'رقم ادا کی (ادائیگی)' : 'Raqam Ada Ki (Paid)')}
                  </span>

                  <div className="tx-desc">
                    {tx.details || (isDebt ? (lang === 'ur' ? 'مال ادھار لیا' : 'Maal Liya') : (lang === 'ur' ? 'رقم ادا کی' : 'Raqam Ada Ki'))}
                  </div>

                  <div className="tx-date" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '11px', color: '#64748b' }}>
                    <Calendar size={11} />
                    <span>{dt.date || new Date(tx.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <Clock size={11} />
                    <span style={{ fontWeight: 600 }}>{dt.time || new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="tx-amount-side">
                  <div className={`tx-num ${isDebt ? 'gave' : 'got'} big-num`}>
                    {isDebt ? '+' : '-'}{t.rupees} {Number(tx.amount || 0).toLocaleString()}
                  </div>

                  {/* Edit Transaction Button */}
                  {onEditTransaction && (
                    <button
                      className="mini-icon-btn"
                      style={{ color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5', cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); openEditModal(tx); }}
                      title={lang === 'ur' ? 'رقم یا تاریخ تبدیل کریں' : 'Edit amount / date'}
                    >
                      <Pencil size={12} />
                    </button>
                  )}

                  {/* Delete Button for Transaction */}
                  <button
                    className="mini-icon-btn"
                    style={{ color: '#ef4444', borderColor: '#fecdd3', background: '#fff1f2', cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playTap();
                      setTxToDelete(tx);
                    }}
                    title={lang === 'ur' ? 'یہ رقم ڈیلیٹ کریں' : 'Delete transaction'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Delete Supplier Account Option at Bottom of History */}
        <div style={{ marginTop: '24px', padding: '16px', borderRadius: '16px', background: '#fff1f2', border: '1px dashed #fecdd3', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#be123c', marginBottom: '4px' }}>
            {lang === 'ur' ? 'اس سپلائر کا پورا کھاتہ ختم کریں؟' : 'Delete this entire supplier account?'}
          </div>
          <div style={{ fontSize: '11px', color: '#881337', marginBottom: '10px' }}>
            {lang === 'ur' ? 'اس سے یہ سپلائر اور تمام سابقہ مال کا ریکارڈ مکمل مٹ جائے گا۔' : 'This will permanently remove this supplier and all transaction history.'}
          </div>
          <button
            style={{
              padding: '8px 18px',
              borderRadius: '12px',
              border: 'none',
              background: '#e11d48',
              color: 'white',
              fontSize: '12px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(225, 29, 72, 0.25)'
            }}
            onClick={() => { sounds.playTap(); setConfirmDeleteSupplier(true); }}
          >
            <Trash2 size={14} />
            <span>{lang === 'ur' ? 'یہ سپلائر ڈیلیٹ کریں' : 'Delete Supplier Account'}</span>
          </button>
        </div>
      </div>

      {/* ── EDIT TRANSACTION MODAL ── */}
      {txToEdit && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)' }}
          onClick={() => setTxToEdit(null)}
        >
          <div
            className="modal-sheet animate-slide-up"
            style={{ maxWidth: '380px', margin: 'auto', padding: '24px 20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Pencil size={20} />
              </div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  {lang === 'ur' ? 'رقم / تاریخ تبدیل کریں' : 'Edit Transaction'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {(txToEdit.type === 'took' || txToEdit.type === 'gave')
                    ? (lang === 'ur' ? 'مال ادھار لیا (Payable)' : 'Goods Taken (Payable)')
                    : (lang === 'ur' ? 'رقم ادا کی' : 'Payment Made')}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                {lang === 'ur' ? 'نئی رقم (روپے)' : 'New Amount (Rs)'}
              </label>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                autoFocus
                style={{
                  width: '100%', height: '52px',
                  border: '2px solid var(--primary)',
                  borderRadius: '14px', padding: '0 14px',
                  fontSize: '22px', fontWeight: 800, outline: 'none',
                  background: '#f0fdf4',
                  color: (txToEdit.type === 'took' || txToEdit.type === 'gave') ? 'var(--red-gave)' : 'var(--green-got)'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                {lang === 'ur' ? 'تاریخ تبدیل کریں' : 'Change Date'}
              </label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                style={{
                  width: '100%', height: '48px',
                  border: '1.5px solid var(--border-light)',
                  borderRadius: '14px', padding: '0 14px',
                  fontSize: '15px', fontWeight: 600, outline: 'none', background: '#ffffff'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                style={{
                  height: '50px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: 'white', fontSize: '15px', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.3)'
                }}
                onClick={handleSaveEdit}
              >
                <Check size={18} />
                <span>{lang === 'ur' ? 'محفوظ کریں' : 'Save Changes'}</span>
              </button>
              <button
                style={{
                  height: '44px', borderRadius: '14px',
                  border: '1px solid #cbd5e1', background: 'white',
                  color: '#475569', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
                }}
                onClick={() => setTxToEdit(null)}
              >
                {t.cancel || 'کینسل'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP CONFIRM SUPPLIER TRANSACTION (AMOUNT) DELETE MODAL */}
      {txToDelete && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)' }}
          onClick={() => setTxToDelete(null)}
        >
          <div
            className="modal-sheet animate-slide-up"
            style={{ maxWidth: '380px', margin: 'auto', textAlign: 'center', padding: '24px 20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: '#ffe4e6',
              color: '#e11d48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <Trash2 size={26} />
            </div>

            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              {lang === 'ur' ? 'یہ رقم ڈیلیٹ کریں؟' : lang === 'roman' ? 'Yeh Amount Delete Karen?' : 'Delete this Amount?'}
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '12px 14px',
              margin: '12px 0 18px 0',
              textAlign: lang === 'ur' ? 'right' : 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: (txToDelete.type === 'took' || txToDelete.type === 'gave') ? 'var(--red-gave)' : 'var(--green-got)'
                }}>
                  {(txToDelete.type === 'took' || txToDelete.type === 'gave')
                    ? (lang === 'ur' ? 'مال ادھار لیا (دینا ہے)' : 'Maal Liya')
                    : (lang === 'ur' ? 'رقم ادا کی (ادائیگی)' : 'Raqam Ada Ki')}
                </span>
                <span style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: (txToDelete.type === 'took' || txToDelete.type === 'gave') ? 'var(--red-gave)' : 'var(--green-got)'
                }}>
                  {(txToDelete.type === 'took' || txToDelete.type === 'gave') ? '+' : '-'}{t.rupees} {Number(txToDelete.amount || 0).toLocaleString()}
                </span>
              </div>
              {txToDelete.details && (
                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                  {txToDelete.details}
                </div>
              )}
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {formatDateTime(txToDelete.date, lang).date} • {formatDateTime(txToDelete.date, lang).time}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                style={{
                  height: '46px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#e11d48',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)'
                }}
                onClick={() => {
                  sounds.playDeleteTone();
                  onDeleteTransaction(supplier.id, txToDelete.id);
                  setTxToDelete(null);
                }}
              >
                <Trash2 size={16} />
                <span>{lang === 'ur' ? 'ہاں، یہ رقم مٹائیں' : lang === 'roman' ? 'Haan, Delete Karen' : 'Yes, Delete Amount'}</span>
              </button>

              <button
                style={{
                  height: '42px',
                  borderRadius: '14px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                onClick={() => setTxToDelete(null)}
              >
                {t.cancel || 'کینسل'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP CLEAR HISAB MODAL */}
      {confirmClear && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)' }}
          onClick={() => setConfirmClear(false)}
        >
          <div
            className="modal-sheet animate-slide-up"
            style={{ maxWidth: '380px', margin: 'auto', textAlign: 'center', padding: '24px 20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <CheckCircle2 size={28} />
            </div>

            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
              {lang === 'ur' ? 'حساب بے باق کریں' : 'Clear Supplier Hisab'}
            </div>

            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
              {lang === 'ur'
                ? `سپلائر "${supplier.name}" کا موجودہ واجب الادا حساب ${t.rupees} ${balance.toLocaleString()} ہے۔ آپ کیا کرنا چاہتے ہیں؟`
                : `Current balance for supplier "${supplier.name}" is ${t.rupees} ${balance.toLocaleString()}. Select clear option:`}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Option 1: Settle Balance to 0 */}
              {balance !== 0 && (
                <button
                  style={{
                    height: '46px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                  }}
                  onClick={() => {
                    handleClear();
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>{lang === 'ur' ? 'حساب بے باق کریں (بیلنس 0 روپے کریں)' : 'Settle Balance to 0 Rs'}</span>
                </button>
              )}

              {/* Option 2: Wipe all transaction records */}
              {supplier.transactions && supplier.transactions.length > 0 && (
                <button
                  style={{
                    height: '46px',
                    borderRadius: '14px',
                    border: '1px solid #fecdd3',
                    background: '#fff1f2',
                    color: '#e11d48',
                    fontSize: '13px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    sounds.playDeleteTone();
                    if (onResetTransactions) {
                      onResetTransactions(supplier.id);
                    }
                    setConfirmClear(false);
                  }}
                >
                  <Trash2 size={16} />
                  <span>{lang === 'ur' ? 'مکمل کھاتہ صاف کریں (پرانا تمام ریکارڈ ختم)' : 'Wipe & Clear All Transactions (0 Rs)'}</span>
                </button>
              )}

              {/* Cancel Button */}
              <button
                style={{
                  height: '40px',
                  borderRadius: '14px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                onClick={() => setConfirmClear(false)}
              >
                {t.cancel || 'کینسل'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP CONFIRM DELETE SUPPLIER MODAL */}
      {confirmDeleteSupplier && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)' }}
          onClick={() => setConfirmDeleteSupplier(false)}
        >
          <div
            className="modal-sheet animate-slide-up"
            style={{ maxWidth: '380px', margin: 'auto', textAlign: 'center', padding: '24px 20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#ffe4e6',
              color: '#e11d48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto'
            }}>
              <AlertTriangle size={28} />
            </div>

            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              {lang === 'ur' ? 'سپلائر ڈیلیٹ کریں؟' : 'Delete Supplier Account?'}
            </div>

            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '20px' }}>
              {lang === 'ur'
                ? `کیا آپ واقعی "${supplier.name}" کا پورا کھاتہ مٹانا چاہتے ہیں؟ ان کا تمام حساب (${t.rupees} ${balance.toLocaleString()}) اور ریکارڈ مکمل ڈیلیٹ ہو جائے گا۔`
                : `Are you sure you want to permanently delete "${supplier.name}"? All balance (${t.rupees} ${balance.toLocaleString()}) and transaction records will be removed.`}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                style={{
                  height: '48px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#e11d48',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)'
                }}
                onClick={() => {
                  sounds.playDeleteTone();
                  if (onDeleteSupplier) {
                    onDeleteSupplier(supplier.id);
                  }
                  setConfirmDeleteSupplier(false);
                }}
              >
                <Trash2 size={18} />
                <span>{lang === 'ur' ? 'ہاں، مستقل ڈیلیٹ کریں' : 'Yes, Delete Supplier'}</span>
              </button>

              <button
                style={{
                  height: '44px',
                  borderRadius: '14px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                onClick={() => setConfirmDeleteSupplier(false)}
              >
                {t.cancel || 'نہیں، واپس جائیں'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Dock (Large, Easy-Touch Buttons) */}
      <div className="action-dock">
        {/* Took Udhar (Maal Liya / مال ادھار لیا) */}
        <button
          className="dock-btn gave"
          style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
          onClick={() => { sounds.playTap(); onAddTransaction('took'); }}
        >
          <Plus size={20} />
          <span>{lang === 'ur' ? 'مال ادھار لیا (دینا ہے)' : 'Maal Liya (Payable)'}</span>
        </button>

        {/* Paid Money (Raqam Ada Ki / رقم ادا کی) */}
        <button
          className="dock-btn got"
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          onClick={() => { sounds.playTap(); onAddTransaction('paid'); }}
        >
          <Minus size={20} />
          <span>{lang === 'ur' ? 'رقم ادا کی (ادائیگی)' : 'Raqam Di (Paid Cash)'}</span>
        </button>
      </div>
    </div>
  );
}
