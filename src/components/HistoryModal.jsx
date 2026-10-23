import React, { useState } from 'react';
import { X, History, RotateCcw, Trash2, CheckCircle2, ChevronDown, ChevronUp, Calendar, Clock, MapPin, Phone, AlertCircle, FileText } from 'lucide-react';
import { sounds } from '../sound';
import { getCustomerTotals, formatDateTime } from '../storage';

export default function HistoryModal({
  customers = [],
  deletedCustomers = [],
  onRestoreCustomer,
  onPermanentDeleteCustomer,
  onOpenCustomer,
  onClose,
  lang = 'roman'
}) {
  const [activeTab, setActiveTab] = useState('cleared'); // 'cleared' | 'deleted'
  const [expandedId, setExpandedId] = useState(null);

  // Cleared customers: balance is 0 and they have transactions
  const clearedCustomers = customers.filter((c) => {
    const totals = getCustomerTotals(c);
    return totals.balance === 0 && (c.transactions || []).length > 0;
  });

  const toggleExpand = (id) => {
    sounds.playTap();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleRestore = (customer) => {
    sounds.playSuccessFanfare();
    onRestoreCustomer(customer);
  };

  const handlePermanentDelete = (customerId) => {
    const confirmMsg = lang === 'ur'
      ? 'کیا آپ واقعی اس کھاتے کو ہمیشہ کے لیے مکمل ڈیلیٹ کرنا چاہتے ہیں؟ یہ ڈیٹا دوبارہ واپس نہیں آئے گا!'
      : 'Kya aap waqai is khate ko hamesha ke liye permanently delete karna chahte hain? Yeh wapas nahi aayega!';
    if (window.confirm(confirmMsg)) {
      sounds.playDeleteTone();
      onPermanentDeleteCustomer(customerId);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-sheet animate-slide-up"
        style={{ maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: '10px' }}>
          <div className="modal-title" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={22} />
            <span>{lang === 'ur' ? 'کھاتہ ہسٹری اور ری سائیکل بن' : 'Khata History & Recycle Bin'}</span>
          </div>

          <button
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            onClick={() => { sounds.playTap(); onClose(); }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 4px 12px 4px' }}>
          <button
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: '12px',
              border: activeTab === 'cleared' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
              background: activeTab === 'cleared' ? 'var(--primary-bg)' : '#ffffff',
              color: activeTab === 'cleared' ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => { sounds.playTap(); setActiveTab('cleared'); }}
          >
            <CheckCircle2 size={15} />
            <span>{lang === 'ur' ? `بے باق کھاتے (${clearedCustomers.length})` : `Cleared (${clearedCustomers.length})`}</span>
          </button>

          <button
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: '12px',
              border: activeTab === 'deleted' ? '2px solid #ef4444' : '1px solid var(--border-light)',
              background: activeTab === 'deleted' ? '#fff1f2' : '#ffffff',
              color: activeTab === 'deleted' ? '#be123c' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => { sounds.playTap(); setActiveTab('deleted'); }}
          >
            <Trash2 size={15} />
            <span>{lang === 'ur' ? `ڈیلیٹ شدہ (${deletedCustomers.length})` : `Recycle Bin (${deletedCustomers.length})`}</span>
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '2px' }}>
          {activeTab === 'cleared' && (
            <>
              {clearedCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  {lang === 'ur' ? 'ابھی کوئی بے باق کھاتہ موجود نہیں ہے۔' : 'Abhi koi cleared hisab nahi hai.'}
                </div>
              ) : (
                clearedCustomers.map((cust) => {
                  const totals = getCustomerTotals(cust);
                  const isExpanded = expandedId === cust.id;
                  return (
                    <div
                      key={cust.id}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #bbf7d0',
                        borderRadius: '14px',
                        padding: '12px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>{cust.name}</div>
                          {cust.phone && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Phone size={10} /> {cust.phone}
                            </div>
                          )}
                          {cust.address && (
                            <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <MapPin size={10} /> {cust.address}
                            </div>
                          )}
                        </div>

                        <span style={{ padding: '3px 8px', borderRadius: '8px', background: '#ecfdf5', color: '#047857', fontSize: '11px', fontWeight: 800, border: '1px solid #a7f3d0' }}>
                          بے باق (Rs 0) ✅
                        </span>
                      </div>

                      {/* Financial Totals Breakdown */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', background: '#f8fafc', borderRadius: '10px', padding: '8px', margin: '8px 0', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>{lang === 'ur' ? 'کتنا ہوا (کل ادھار)' : 'Kitna Howa'}</div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#e11d48' }}>Rs {totals.totalGave.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>{lang === 'ur' ? 'کتنا دیا (وصول ہوا)' : 'Kitna Diya'}</div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#059669' }}>Rs {totals.totalGot.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>{lang === 'ur' ? 'کتنا رہا (بقایا)' : 'Baqi Raha'}</div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>Rs 0</div>
                        </div>
                      </div>

                      {/* Expand / Collapse Transaction History */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            padding: '4px 0'
                          }}
                          onClick={() => toggleExpand(cust.id)}
                        >
                          <span>{(cust.transactions || []).length} {lang === 'ur' ? 'تفصیلی لین دین دیکھیں' : 'Transactions dekhein'}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        <button
                          style={{
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            sounds.playTap();
                            onOpenCustomer(cust.id);
                            onClose();
                          }}
                        >
                          {lang === 'ur' ? 'کھاتہ کھولیں' : 'Open Khata'}
                        </button>
                      </div>

                      {/* Detailed Transaction List */}
                      {isExpanded && (
                        <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(cust.transactions || []).map((tx) => {
                            const isGave = tx.type === 'gave';
                            const dt = formatDateTime(tx.date, lang);
                            return (
                              <div
                                key={tx.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '5px 8px',
                                  borderRadius: '8px',
                                  background: isGave ? '#fff1f2' : '#f0fdf4',
                                  fontSize: '11px'
                                }}
                              >
                                <div>
                                  <span style={{ fontWeight: 800, color: isGave ? '#e11d48' : '#059669', marginRight: '6px' }}>
                                    {isGave ? '+ ادھار دیا' : '- وصول ہوا'}
                                  </span>
                                  <span style={{ color: '#475569' }}>{tx.details || ''}</span>
                                  <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', gap: '4px', marginTop: '2px' }}>
                                    <span>{dt.date || new Date(tx.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{dt.time || new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: '12px', color: isGave ? '#e11d48' : '#059669' }}>
                                  Rs {Number(tx.amount || 0).toLocaleString()}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'deleted' && (
            <>
              {deletedCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  {lang === 'ur' ? 'ری سائیکل بن میں کوئی ڈیلیٹ شدہ کھاتہ نہیں ہے۔' : 'Recycle bin khali hai.'}
                </div>
              ) : (
                deletedCustomers.map((cust) => {
                  const totals = getCustomerTotals(cust);
                  const isExpanded = expandedId === cust.id;
                  return (
                    <div
                      key={cust.id}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #fecdd3',
                        borderRadius: '14px',
                        padding: '12px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>{cust.name}</div>
                          {cust.phone && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Phone size={10} /> {cust.phone}
                            </div>
                          )}
                          {cust.address && (
                            <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <MapPin size={10} /> {cust.address}
                            </div>
                          )}
                          {cust.deletedAt && (
                            <div style={{ fontSize: '10px', color: '#be123c', marginTop: '3px', fontWeight: 600 }}>
                              ڈیلیٹ تاریخ: {formatDateTime(cust.deletedAt, lang).full}
                            </div>
                          )}
                        </div>

                        <span style={{ padding: '3px 8px', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', fontSize: '11px', fontWeight: 800 }}>
                          ڈیلیٹ شدہ 🗑️
                        </span>
                      </div>

                      {/* Totals */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', background: '#fff1f2', borderRadius: '10px', padding: '8px', margin: '8px 0', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#881337', fontWeight: 700 }}>{lang === 'ur' ? 'کل ادھار' : 'Total Udhar'}</div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#e11d48' }}>Rs {totals.totalGave.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#881337', fontWeight: 700 }}>{lang === 'ur' ? 'کل وصولی' : 'Total Wasool'}</div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#059669' }}>Rs {totals.totalGot.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#881337', fontWeight: 700 }}>{lang === 'ur' ? 'بقایا کھاتہ' : 'Baqi Balance'}</div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#be123c' }}>Rs {totals.balance.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Action Buttons: Restore & Permanent Delete */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleExpand(cust.id)}
                        >
                          <span>{(cust.transactions || []).length} {lang === 'ur' ? 'اندراجات' : 'entries'}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {/* Restore Button */}
                          <button
                            style={{
                              background: '#ecfdf5',
                              border: '1.5px solid #10b981',
                              color: '#065f46',
                              borderRadius: '8px',
                              padding: '5px 12px',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onClick={() => handleRestore(cust)}
                            title="Restore Customer"
                          >
                            <RotateCcw size={13} />
                            <span>{lang === 'ur' ? 'بحال کریں' : 'Restore'}</span>
                          </button>

                          {/* Permanent Delete Button */}
                          <button
                            style={{
                              background: '#fee2e2',
                              border: '1.5px solid #ef4444',
                              color: '#b91c1c',
                              borderRadius: '8px',
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onClick={() => handlePermanentDelete(cust.id)}
                            title="Permanent Delete"
                          >
                            <Trash2 size={13} />
                            <span>{lang === 'ur' ? 'مکمل ڈیلیٹ' : 'Delete'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Expandable Transactions */}
                      {isExpanded && (
                        <div style={{ marginTop: '8px', borderTop: '1px solid #fed7aa', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(cust.transactions || []).map((tx) => {
                            const isGave = tx.type === 'gave';
                            const dt = formatDateTime(tx.date, lang);
                            return (
                              <div
                                key={tx.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '5px 8px',
                                  borderRadius: '8px',
                                  background: isGave ? '#fff1f2' : '#f0fdf4',
                                  fontSize: '11px'
                                }}
                              >
                                <div>
                                  <span style={{ fontWeight: 800, color: isGave ? '#e11d48' : '#059669', marginRight: '6px' }}>
                                    {isGave ? '+ ادھار دیا' : '- وصول ہوا'}
                                  </span>
                                  <span style={{ color: '#475569' }}>{tx.details || ''}</span>
                                  <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', gap: '4px', marginTop: '2px' }}>
                                    <span>{dt.date || new Date(tx.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{dt.time || new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: '12px', color: isGave ? '#e11d48' : '#059669' }}>
                                  Rs {Number(tx.amount || 0).toLocaleString()}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
