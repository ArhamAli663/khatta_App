import React, { useState } from 'react';
import { ArrowLeft, Phone, MessageCircle, FileText, Volume2, CheckCircle2, Trash2, Plus, Minus, Share2, Edit3, MapPin, Calendar, Clock, AlertTriangle, Pencil, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getCustomerBalance, formatDateTime } from '../storage';
import { sounds } from '../sound';
import { speakCustomerBalance } from '../speech';

export default function CustomerDetail({
  customer,
  onBack,
  onAddTransaction,
  onDeleteTransaction,
  onEditTransaction,
  onClearBalance,
  onResetTransactions,
  onOpenSlip,
  onWhatsApp,
  onEditCustomer,
  onDeleteCustomer,
  t,
  lang,
  shop
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteCustomer, setConfirmDeleteCustomer] = useState(false);
  const [txToDelete, setTxToDelete] = useState(null);
  const [txToEdit, setTxToEdit] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');

  const balance = getCustomerBalance(customer);
  const initial = (customer.name || 'گ').trim().charAt(0);

  const handleClear = () => {
    sounds.playSuccessFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    onClearBalance(customer.id);
    setConfirmClear(false);
  };

  const handleSpeak = () => {
    sounds.playTap();
    speakCustomerBalance(customer.name, balance, lang);
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
      {/* Detail Top Header */}
      <div className="detail-header">
        <div className="detail-user-bar">
          <button
            className="icon-btn"
            onClick={() => { sounds.playTap(); onBack(); }}
            title={t.cancel}
          >
            <ArrowLeft size={18} />
          </button>

          <div
            className="customer-avatar-box"
            style={{
              width: '42px',
              height: '42px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              border: '1.5px solid #a7f3d0',
              fontSize: '18px',
              fontWeight: 800
            }}
          >
            {initial}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.name}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'flex-start', marginTop: '2px' }}>
              {customer.phone && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                  <Phone size={10} /> {customer.phone}
                </div>
              )}
              {customer.address && (
                <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '3px', wordBreak: 'break-word', maxWidth: '100%' }}>
                  <MapPin size={10} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ wordBreak: 'break-word' }}>{customer.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action icons (Edit, Delete, Phone call & Slip) */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {/* Edit Customer Info Button */}
          <button
            className="icon-btn"
            style={{ color: 'var(--primary)', borderColor: 'var(--primary-border)', background: 'var(--primary-bg)' }}
            onClick={() => { sounds.playTap(); onEditCustomer(customer); }}
            title={lang === 'ur' ? 'معلومات تبدیل کریں' : 'Edit Info'}
          >
            <Edit3 size={15} />
          </button>

          {/* Direct Delete Customer Button */}
          <button
            className="icon-btn"
            style={{ color: '#e11d48', borderColor: '#fecdd3', background: '#fff1f2' }}
            onClick={() => { sounds.playTap(); setConfirmDeleteCustomer(true); }}
            title={lang === 'ur' ? 'کھاتہ ڈیلیٹ کریں' : 'Delete Customer'}
          >
            <Trash2 size={15} />
          </button>

          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="icon-btn"
              onClick={() => sounds.playTap()}
              title="Call"
              style={{ textDecoration: 'none' }}
            >
              <Phone size={15} color="var(--primary)" />
            </a>
          )}
          <button
            className="icon-btn"
            onClick={() => { sounds.playTap(); onOpenSlip(customer); }}
            title={t.viewSlip}
          >
            <FileText size={15} color="#6366f1" />
          </button>
        </div>
      </div>

      {/* Big Balance Card */}
      <div className={`big-balance-card ${balance > 0 ? 'due' : ''}`}>
        <div className="big-balance-title">{t.balance}</div>
        <div className={`big-balance-val big-num ${balance > 0 ? 'text-red' : balance < 0 ? 'text-green' : ''}`}
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

          {/* WhatsApp Reminder */}
          {customer.phone && balance > 0 && (
            <button
              className="balance-action-pill"
              style={{ color: '#16a34a' }}
              onClick={() => { sounds.playTap(); onWhatsApp(customer, balance); }}
            >
              <MessageCircle size={16} />
              <span>{t.shareWhatsApp}</span>
            </button>
          )}

          {/* Hisab Barabar / Clear Khata Button */}
          {(balance !== 0 || (customer.transactions && customer.transactions.length > 0)) && (
            <button
              className="balance-action-pill"
              style={{ color: '#059669', borderColor: 'var(--primary-border)', background: 'var(--primary-bg)' }}
              onClick={() => { sounds.playTap(); setConfirmClear(true); }}
            >
              <CheckCircle2 size={16} />
              <span>{t.clearKhata}</span>
            </button>
          )}
        </div>
      </div>

      {/* Transaction History Section */}
      <div style={{ padding: '0 16px 8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
          {lang === 'ur' ? 'تفصیلاتِ لین دین' : lang === 'roman' ? 'Pichla Hisab Kitab' : 'Transaction History'}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
          {(customer.transactions || []).length} {lang === 'ur' ? 'اندراجات' : 'entries'}
        </span>
      </div>

      <div className="tx-history-box">
        {(!customer.transactions || customer.transactions.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
            {lang === 'ur' ? 'ابھی کوئی لین دین درج نہیں ہے۔ نیچے دیے گئے بٹن سے نیا حساب جوڑیں۔' : 'No transactions recorded yet. Tap below to add.'}
          </div>
        ) : (
          [...customer.transactions].reverse().map((tx) => {
            const isGave = tx.type === 'gave';
            return (
              <div key={tx.id} className={`tx-item-card ${isGave ? 'gave' : 'got'}`}>
                <div className="tx-meta-info" style={{ flex: 1, minWidth: 0 }}>
                  <span className={`tx-badge ${isGave ? 'gave' : 'got'}`}>
                    {isGave ? <Plus size={12} /> : <Minus size={12} />}
                    {isGave ? t.youGave : t.youGot}
                  </span>

                  <div className="tx-desc" style={{ wordBreak: 'break-word' }}>
                    {tx.details || (isGave ? (lang === 'ur' ? 'سامان دیا' : 'Udhar Diya') : (lang === 'ur' ? 'پیسے وصول' : 'Wasooli'))}
                  </div>

                  <div className="tx-date" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '11px', color: '#64748b', flexWrap: 'wrap' }}>
                    <Calendar size={11} />
                    <span>{formatDateTime(tx.date, lang).date || new Date(tx.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <Clock size={11} />
                    <span style={{ fontWeight: 600 }}>{formatDateTime(tx.date, lang).time || new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="tx-amount-side">
                  <div className={`tx-num ${isGave ? 'gave' : 'got'} big-num`}>
                    {isGave ? '+' : '-'}{t.rupees} {Number(tx.amount || 0).toLocaleString()}
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

        {/* Delete Customer Account Option at Bottom of History */}
        <div style={{ marginTop: '24px', padding: '16px', borderRadius: '16px', background: '#fff1f2', border: '1px dashed #fecdd3', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#be123c', marginBottom: '4px' }}>
            {lang === 'ur' ? 'اس گاہک کا پورا کھاتہ ختم کریں؟' : 'Delete this entire customer account?'}
          </div>
          <div style={{ fontSize: '11px', color: '#881337', marginBottom: '10px' }}>
            {lang === 'ur' ? 'یہ کھاتہ ڈیلیٹ ہو کر ہسٹری (ری سائیکل بن) میں محفوظ رہے گا اور بعد میں بھی بحال کیا جا سکے گا۔' : 'This customer will be safely moved to History / Recycle Bin and can be restored anytime.'}
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
            onClick={() => { sounds.playTap(); setConfirmDeleteCustomer(true); }}
          >
            <Trash2 size={14} />
            <span>{lang === 'ur' ? 'یہ کھاتہ ڈیلیٹ کریں' : 'Delete Customer Account'}</span>
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
                  {txToEdit.type === 'gave' ? (lang === 'ur' ? 'دیا گیا (Udhar)' : 'Amount Given') : (lang === 'ur' ? 'وصول ہوا' : 'Amount Received')}
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
                  color: txToEdit.type === 'gave' ? 'var(--red-gave)' : 'var(--green-got)'
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

      {/* IN-APP CONFIRM TRANSACTION (AMOUNT) DELETE MODAL */}
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
                <span style={{ fontSize: '12px', fontWeight: 700, color: txToDelete.type === 'gave' ? 'var(--red-gave)' : 'var(--green-got)' }}>
                  {txToDelete.type === 'gave' ? t.youGave : t.youGot}
                </span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: txToDelete.type === 'gave' ? 'var(--red-gave)' : 'var(--green-got)' }}>
                  {txToDelete.type === 'gave' ? '+' : '-'}{t.rupees} {Number(txToDelete.amount || 0).toLocaleString()}
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
                  onDeleteTransaction(customer.id, txToDelete.id);
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

      {/* IN-APP CLEAR KHATA MODAL */}
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
              {t.clearKhata || 'حساب برابر کریں'}
            </div>

            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
              {lang === 'ur'
                ? `گاہک "${customer.name}" کا موجودہ بقایا حساب ${t.rupees} ${balance.toLocaleString()} ہے۔ آپ کیا کرنا چاہتے ہیں؟`
                : `Current balance for "${customer.name}" is ${t.rupees} ${balance.toLocaleString()}. Select clear option:`}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Option 1: Settle Balance to 0 */}
              {balance !== 0 && (
                <button
                  style={{
                    height: '48px',
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

              {/* Option 2: Complete Khata Wipe / Reset (Clears all records to 0) */}
              {customer.transactions && customer.transactions.length > 0 && (
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
                      onResetTransactions(customer.id);
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
                  height: '42px',
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

      {/* IN-APP CONFIRM DELETE MODAL (Safely moves to Recycle Bin) */}
      {confirmDeleteCustomer && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)' }}
          onClick={() => setConfirmDeleteCustomer(false)}
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
              {lang === 'ur' ? 'کھاتہ ڈیلیٹ کریں؟' : 'Delete Customer Account?'}
            </div>

            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '20px' }}>
              {lang === 'ur'
                ? `کیا آپ "${customer.name}" کا کھاتہ ڈیلیٹ کرنا چاہتے ہیں؟ یہ کھاتہ اور تمام پرانا ریکارڈ ہسٹری (ری سائیکل بن) میں محفوظ رہیں گے، اور بعد میں بھی ایک کلک پر بحال کیے جا سکیں گے۔`
                : `"${customer.name}" and all transaction history will be safely preserved in Recycle Bin, and can be restored anytime.`}
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
                  if (onDeleteCustomer) {
                    onDeleteCustomer(customer.id);
                  }
                  setConfirmDeleteCustomer(false);
                }}
              >
                <Trash2 size={16} />
                <span>{lang === 'ur' ? 'ہاں، ہسٹری میں منتقل کریں' : 'Move to Recycle Bin'}</span>
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
                onClick={() => setConfirmDeleteCustomer(false)}
              >
                {t.cancel || 'نہیں، واپس جائیں'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Dock */}
      <div className="action-dock">
        {/* You Gave (Maine Diye / سامان دیا) */}
        <button
          className="dock-btn gave"
          onClick={() => { sounds.playTap(); onAddTransaction('gave'); }}
        >
          <Plus size={20} />
          <span>{t.youGave}</span>
        </button>

        {/* You Got (Mujhe Mile / پیسے ملے) */}
        <button
          className="dock-btn got"
          onClick={() => { sounds.playTap(); onAddTransaction('got'); }}
        >
          <Minus size={20} />
          <span>{t.youGot}</span>
        </button>
      </div>
    </div>
  );
}
