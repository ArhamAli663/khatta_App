import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Users, Volume2 } from 'lucide-react';
import { sounds } from '../sound';
import { speakText } from '../speech';

export default function DailySummary({ summary = {}, t = {}, lang = 'ur' }) {
  const totalUdhar = Number(summary?.totalUdhar || 0);
  const receivedToday = Number(summary?.receivedToday || 0);
  const totalCustomers = Number(summary?.totalCustomers || 0);

  const handleSpeakSummary = (e) => {
    e.stopPropagation();
    sounds.playTap();
    if (lang === 'ur') {
      speakText(`مارکیٹ میں کل بقایا ادھار ${totalUdhar} روپے ہے، اور آج کی نقد وصولی ${receivedToday} روپے ہے۔`, 'ur');
    } else if (lang === 'roman') {
      speakText(`Market ka kul udhar ${totalUdhar} rupay hai, aur aaj ki wasooli ${receivedToday} rupay hai.`, 'roman');
    } else {
      speakText(`Total outstanding credit is ${totalUdhar} rupees, and today's cash collection is ${receivedToday} rupees.`, 'en');
    }
  };

  return (
    <div className="summary-container">
      {/* Total Udhar to Receive (Red) */}
      <div className="summary-card red">
        <div className="summary-label">
          <ArrowDownLeft size={16} color="var(--red-gave)" />
          <span>{t.totalToReceive}</span>
        </div>
        <div className="summary-amount red big-num">
          {t.rupees} {totalUdhar.toLocaleString()}
        </div>
      </div>

      {/* Today's Cash Received (Green) */}
      <div className="summary-card green">
        <div className="summary-label">
          <ArrowUpRight size={16} color="var(--green-got)" />
          <span>{t.totalReceivedToday}</span>
        </div>
        <div className="summary-amount green big-num">
          {t.rupees} {receivedToday.toLocaleString()}
        </div>
      </div>

      {/* Customer Count + Speak Button */}
      <div className="summary-card blue">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Users size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{t.totalCustomers}</div>
            <div style={{ fontSize: '16px', fontWeight: 800 }} className="big-num">{summary.totalCustomers}</div>
          </div>
        </div>

        {/* Speak Summary Aloud Button */}
        <button
          className="mini-icon-btn"
          style={{ width: '34px', height: '34px', borderRadius: '10px' }}
          onClick={handleSpeakSummary}
          title={t.listenBalance}
        >
          <Volume2 size={16} />
        </button>
      </div>
    </div>
  );
}
