import React from 'react';
import { X, Printer, MessageCircle, Share2, Check, Calendar, Clock } from 'lucide-react';
import { sounds } from '../sound';
import { getCustomerBalance, formatDateTime } from '../storage';

export default function SlipModal({ customer, shop, onClose, onWhatsApp, t, lang }) {
  const balance = getCustomerBalance(customer);

  const handlePrint = () => {
    sounds.playTap();
    window.print();
  };

  const handleWhatsAppReceipt = () => {
    sounds.playTap();
    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');
    const recentTxs = (customer.transactions || []).slice(-5);
    
    const txLines = recentTxs.map((t) => {
      const dt = formatDateTime(t.date, lang);
      const isGave = t.type === 'gave';
      const label = isGave ? (lang === 'ur' ? 'ادھار لیا' : 'Udhar') : (lang === 'ur' ? 'رقم ادا کی' : 'Wasool');
      return `• ${dt.date} (${dt.time}): Rs ${Number(t.amount).toLocaleString()} - ${label} ${t.details ? `[${t.details}]` : ''}`;
    }).join('\n');

    let msg = '';
    if (lang === 'ur') {
      msg = `السلام علیکم ${customer.name} صاحب!\n` +
        `*${shop.shopName}* کی طرف سے آپ کے کھاتے کی تفصیل رسید:\n\n` +
        `تاریخ: ${new Date().toLocaleDateString('en-GB')} | وقت: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
        `------------------------------------\n` +
        `*لین دین کا ریکارڈ:*\n${txLines || 'کوئی لین دین درج نہیں۔'}\n` +
        `------------------------------------\n` +
        `*کل واجب الادا رقم: Rs ${balance.toLocaleString()}*\n\n` +
        `برائے مہربانی اپنا بقایا حساب کلیئر فرما لیں۔ جزاک اللہ!`;
    } else {
      msg = `Assalam-o-Alaikum ${customer.name} sb!\n` +
        `*${shop.shopName}* ki taraf se apke khate ki slip:\n\n` +
        `Tareekh: ${new Date().toLocaleDateString('en-GB')} | Waqt: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
        `------------------------------------\n` +
        `*Transactions:*\n${txLines || 'No entries.'}\n` +
        `------------------------------------\n` +
        `*Kul Baqaya Balance: Rs ${balance.toLocaleString()}*\n\n` +
        `Meherbani farma kar hisab barabar karwayen. Shukriya!`;
    }

    const internationalPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
    window.open(`https://wa.me/${internationalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ color: 'var(--primary)' }}>
            <Printer size={20} />
            <span>{t.viewSlip}</span>
          </div>

          <button
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            onClick={() => { sounds.playTap(); onClose(); }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Thermal Slip Content */}
        <div className="receipt-paper" id="printable-slip">
          {/* Slip Header */}
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #94a3b8', paddingBottom: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{shop.shopName}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>پروپرائٹر: {shop.ownerName}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>فون: {shop.phone}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              تاریخ: {new Date().toLocaleDateString('en-GB')} • وقت: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Customer Info */}
          <div style={{ borderBottom: '1px dashed #94a3b8', paddingBottom: '10px', marginBottom: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>گاہک کا نام: {customer.name}</div>
            {customer.phone && <div style={{ fontSize: '12px', color: '#64748b' }}>موبائل: {customer.phone}</div>}
          </div>

          {/* Transactions List with Date & Time on each entry */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
              <span>تفصیل سامان / تاریخ و وقت</span>
              <span>رقم ({t.rupees})</span>
            </div>

            {(customer.transactions || []).slice(-8).map((tx) => {
              const dt = formatDateTime(tx.date, lang);
              const isGave = tx.type === 'gave';
              return (
                <div key={tx.id} style={{ padding: '6px 0', borderBottom: '1px dotted #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: isGave ? 'var(--red-gave)' : 'var(--green-got)', fontWeight: 700 }}>
                      {isGave ? '🔴 ادھار: ' : '🟢 وصول: '}
                      {tx.details || (isGave ? 'سامان' : 'کیش')}
                    </span>
                    <span style={{ fontWeight: 800 }}>
                      {isGave ? '+' : '-'}{t.rupees} {Number(tx.amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Calendar size={10} />
                    <span>{dt.date || new Date(tx.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <Clock size={10} />
                    <span style={{ fontWeight: 600 }}>{dt.time || new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Slip Total Balance */}
          <div style={{
            background: balance > 0 ? '#fff1f2' : '#f0fdf4',
            border: `1px solid ${balance > 0 ? '#fecdd3' : '#bbf7d0'}`,
            borderRadius: '10px',
            padding: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: 800 }}>کل بقایا ادھار:</span>
            <span style={{ fontSize: '20px', fontWeight: 900, color: balance > 0 ? 'var(--red-gave)' : 'var(--green-got)' }}>
              {t.rupees} {balance.toLocaleString()}
            </span>
          </div>

          <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
            شکریہ! دوبارہ تشریف لائیں۔
            <br />
            Powered by Khatta App
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            style={{
              height: '46px',
              borderRadius: '14px',
              border: '1px solid var(--border-light)',
              background: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            onClick={handlePrint}
          >
            <Printer size={16} />
            <span>پرنٹ / Print</span>
          </button>

          {customer.phone && (
            <button
              style={{
                height: '46px',
                borderRadius: '14px',
                border: 'none',
                background: '#16a34a',
                color: 'white',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              onClick={handleWhatsAppReceipt}
            >
              <MessageCircle size={16} />
              <span>واٹس ایپ رسید بھیجیں</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
