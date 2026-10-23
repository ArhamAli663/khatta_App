import React, { useState } from 'react';
import { Phone, MessageCircle, Volume2, ChevronRight, Clock, MapPin, Trash2, AlertTriangle } from 'lucide-react';
import { getCustomerBalance } from '../storage';
import { sounds } from '../sound';
import { speakCustomerBalance } from '../speech';

const INITIAL_COLORS = [
  { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  { bg: '#fdf2f8', color: '#db2777', border: '#fbcfe8' },
  { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
  { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  { bg: '#f0fdfa', color: '#0d9488', border: '#99f6e4' },
];

const getInitialStyle = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i);
  }
  return INITIAL_COLORS[hash % INITIAL_COLORS.length];
};

export default function CustomerCard({ customer, onClick, onWhatsApp, onDeleteCustomer, t, lang, shopName }) {
  const balance = getCustomerBalance(customer);
  const initial = (customer.name || 'گ').trim().charAt(0);
  const colorStyle = getInitialStyle(customer.name);

  // Last transaction
  const lastTx = customer.transactions && customer.transactions.length > 0
    ? customer.transactions[customer.transactions.length - 1]
    : null;

  const handleSpeak = (e) => {
    e.stopPropagation();
    sounds.playTap();
    speakCustomerBalance(customer.name, balance, lang);
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    sounds.playTap();
    if (onWhatsApp) onWhatsApp(customer, balance);
  };

  return (
    <div className="customer-card clickable" onClick={onClick}>
      <div className="customer-left">
        {/* Clean Professional Initial Badge */}
        <div
          className="customer-avatar-box"
          style={{
            backgroundColor: colorStyle.bg,
            color: colorStyle.color,
            border: `1.5px solid ${colorStyle.border}`,
            fontSize: '20px',
            fontWeight: 800
          }}
        >
          {initial}
        </div>

        {/* Customer Info */}
        <div>
          <div className="customer-name">{customer.name}</div>
          <div className="customer-meta">
            {customer.phone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Phone size={11} /> {customer.phone}
              </span>
            )}
            {customer.address && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--primary)', fontWeight: 600 }}>
                <MapPin size={11} /> {customer.address}
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

      {/* Customer Balance & Quick Actions */}
      <div className="customer-right">
        {balance > 0 ? (
          <div className="customer-balance-badge due big-num">
            <span>{t.rupees}</span>
            <span>{balance.toLocaleString()}</span>
          </div>
        ) : balance < 0 ? (
          <div className="customer-balance-badge advance big-num">
            <span>+{t.rupees}</span>
            <span>{Math.abs(balance).toLocaleString()}</span>
          </div>
        ) : (
          <div className="customer-balance-badge zero">
            <span>{t.hisabBarabar}</span>
          </div>
        )}

        <div className="card-quick-actions">
          {/* Voice Readout Button */}
          <button
            className="mini-icon-btn"
            onClick={handleSpeak}
            title={t.listenBalance}
            aria-label={t.listenBalance}
          >
            <Volume2 size={14} />
          </button>

          {/* WhatsApp Reminder Button */}
          {customer.phone && balance > 0 && (
            <button
              className="mini-icon-btn"
              style={{ color: '#16a34a' }}
              onClick={handleWhatsApp}
              title={t.shareWhatsApp}
              aria-label={t.shareWhatsApp}
            >
              <MessageCircle size={14} />
            </button>
          )}

          {/* Direct Delete Button on Card */}
          {onDeleteCustomer && (
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
                onDeleteCustomer(customer);
              }}
              title={lang === 'ur' ? 'کھاتہ ڈیلیٹ کریں' : 'Delete Customer'}
              aria-label="Delete Customer"
            >
              <Trash2 size={15} />
            </button>
          )}

          <ChevronRight size={14} color="#94a3b8" />
        </div>
      </div>
    </div>
  );
}
