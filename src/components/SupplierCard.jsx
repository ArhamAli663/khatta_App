import React, { useState } from 'react';
import { Phone, MapPin, MessageCircle, Clock, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import { getSupplierBalance } from '../storage';
import { sounds } from '../sound';

// Clean initial letters generator
const getSupplierInitial = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] || '') + (parts[1][0] || '');
  }
  return (name[0] || 'س').toUpperCase();
};

const getSupplierColor = (name = '') => {
  const colors = [
    { bg: '#fee2e2', text: '#b91c1c', border: '#fecdd3' }, // red
    { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' }, // orange
    { bg: '#fef3c7', text: '#b45309', border: '#fde68a' }, // amber
    { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' }, // purple
    { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' }, // indigo
    { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' }  // sky
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
};

export default function SupplierCard({
  supplier,
  onClick,
  onWhatsApp,
  onDeleteSupplier,
  t,
  lang,
  shopName
}) {
  const balance = getSupplierBalance(supplier);
  const color = getSupplierColor(supplier.name);
  const initials = getSupplierInitial(supplier.name);

  // Last transaction date
  const lastTx = supplier.transactions && supplier.transactions.length > 0
    ? supplier.transactions[supplier.transactions.length - 1]
    : null;

  return (
    <div
      className="customer-card clickable animate-fade-in"
      onClick={() => {
        sounds.playTap();
        onClick(supplier);
      }}
    >
      <div className="customer-left">
        {/* Supplier Initials Badge */}
        <div
          className="customer-avatar-box"
          style={{
            backgroundColor: color.bg,
            color: color.text,
            border: `1.5px solid ${color.border}`,
            fontSize: '18px',
            fontWeight: 800
          }}
        >
          {initials}
        </div>

        {/* Info Middle */}
        <div>
          <div className="customer-name">{supplier.name}</div>
          <div className="customer-meta">
            {supplier.phone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Phone size={11} /> {supplier.phone}
              </span>
            )}
            {supplier.address && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#e11d48', fontWeight: 600 }}>
                <MapPin size={11} /> {supplier.address}
              </span>
            )}
            {lastTx && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={11} /> {new Date(lastTx.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Balance & Actions Right Side */}
      <div className="customer-right">
        {balance > 0 ? (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--red-gave)', fontWeight: 700 }}>
              {lang === 'ur' ? 'دینے ہیں' : 'Dene Hain'}
            </div>
            <div className="customer-balance-badge due big-num">
              <span>{t.rupees}</span>
              <span>{balance.toLocaleString()}</span>
            </div>
          </div>
        ) : balance < 0 ? (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--green-got)', fontWeight: 700 }}>
              {lang === 'ur' ? 'ایڈوانس دیا' : 'Advance'}
            </div>
            <div className="customer-balance-badge advance big-num">
              <span>+{t.rupees}</span>
              <span>{Math.abs(balance).toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="customer-balance-badge zero">
            <CheckCircle2 size={13} color="#94a3b8" />
            <span>{t.hisabBarabar}</span>
          </div>
        )}

        {/* Actions bar on card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* WhatsApp Button */}
          {supplier.phone && (
            <button
              className="mini-icon-btn"
              style={{ color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4', width: 'auto', padding: '0 8px', gap: '4px' }}
              onClick={(e) => {
                e.stopPropagation();
                sounds.playTap();
                onWhatsApp(supplier, balance);
              }}
              title={t.shareWhatsApp}
            >
              <MessageCircle size={12} />
              <span style={{ fontSize: '10px', fontWeight: 700 }}>WhatsApp</span>
            </button>
          )}

          {/* Delete Supplier Button */}
          {onDeleteSupplier && (
            <button
              className="mini-icon-btn"
              style={{
                color: '#e11d48',
                borderColor: '#fecdd3',
                background: '#fff1f2',
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                sounds.playTap();
                onDeleteSupplier(supplier);
              }}
              title={lang === 'ur' ? 'سپلائر ڈیلیٹ کریں' : 'Delete Supplier'}
              aria-label="Delete Supplier"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
