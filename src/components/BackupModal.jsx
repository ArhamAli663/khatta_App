import React, { useRef } from 'react';
import { X, FileText, Download, Upload, ShieldCheck, Printer, CheckCircle2 } from 'lucide-react';
import { sounds } from '../sound';
import { printLedgerReport, downloadLedgerHTMLFile } from '../pdfReport';

export default function BackupModal({
  customers = [],
  suppliers = [],
  shop = {},
  onRestoreData,
  onClose,
  t,
  lang = 'roman'
}) {
  const fileInputRef = useRef(null);

  // 1. Export as Professional Printable PDF / HTML Statement
  const handlePrintPDF = () => {
    sounds.playTap();
    printLedgerReport({ shop, customers, suppliers, lang });
  };

  const handleDownloadReportFile = () => {
    sounds.playTap();
    downloadLedgerHTMLFile({ shop, customers, suppliers, lang });
  };

  // 2. Export Raw JSON Backup file
  const handleExportJSON = () => {
    sounds.playTap();
    const backupPayload = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      shop,
      customers,
      suppliers
    };
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khatta_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 3. Import JSON backup file
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed && (Array.isArray(parsed.customers) || parsed.shop)) {
          sounds.playSuccessFanfare();
          onRestoreData(parsed.customers || [], parsed.shop || shop, parsed.suppliers || []);
          alert(lang === 'ur' ? 'ڈیٹا کامیابی سے بحال ہو گیا ہے!' : 'Data restored successfully!');
          onClose();
        } else {
          alert('Invalid backup file format');
        }
      } catch (err) {
        alert('Could not read file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={22} />
            <span>{lang === 'ur' ? 'کھاتہ رپورٹ و ڈیٹا بیک اپ' : 'Khata Report & Backup'}</span>
          </div>

          <button
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
            onClick={() => { sounds.playTap(); onClose(); }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '6px 0 12px 0' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {lang === 'ur'
              ? 'اپنے تمام گاہکوں کے نام، پتے، فون اور ادھار/وصولی کی مکمل رپورٹ PDF میں محفوظ کریں تاکہ موبائل بدلنے پر بھی کھاتہ 100% محفوظ رہے۔'
              : 'Apne tamam grahakon ke naam, address, phone aur hisab kitab ki mukammal PDF report download karein.'}
          </div>
        </div>

        {/* 1. Primary Button: PDF Report & Print */}
        <button
          style={{
            height: '52px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            color: 'white',
            fontSize: '14px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
          }}
          onClick={handlePrintPDF}
        >
          <Printer size={19} />
          <span>{lang === 'ur' ? '📄 کھاتہ رپورٹ پرنٹ / PDF محفوظ کریں' : '📄 Print / Save Khata PDF'}</span>
        </button>

        {/* 2. Download HTML Report Document Button */}
        <button
          style={{
            height: '46px',
            borderRadius: '14px',
            border: '1.5px solid #10b981',
            background: '#ecfdf5',
            color: '#065f46',
            fontSize: '13px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
          onClick={handleDownloadReportFile}
        >
          <FileText size={17} />
          <span>{lang === 'ur' ? '📥 مکمل کھاتہ فائل ڈاؤنلوڈ کریں' : '📥 Download Khata Report File'}</span>
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
            {lang === 'ur' ? 'تکنیکی بیک اپ (Data File)' : 'Technical Backup'}
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
        </div>

        {/* 3. JSON Export */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={{
              flex: 1,
              height: '44px',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            onClick={handleExportJSON}
          >
            <Download size={15} />
            <span>{lang === 'ur' ? 'JSON بیک اپ' : 'Export JSON'}</span>
          </button>

          {/* 4. JSON Import */}
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            style={{
              flex: 1,
              height: '44px',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            onClick={() => { sounds.playTap(); fileInputRef.current && fileInputRef.current.click(); }}
          >
            <Upload size={15} />
            <span>{lang === 'ur' ? 'بیک اپ بحال کریں' : 'Restore JSON'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
