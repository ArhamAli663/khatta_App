// Khatta Professional PDF / Printable Ledger Report Generator
import { getCustomerTotals, getSupplierTotals, formatDateTime } from './storage';

export const generateLedgerHTML = ({ shop = {}, customers = [], suppliers = [], lang = 'roman' }) => {
  const now = new Date();
  const dt = formatDateTime(now.toISOString(), lang);

  let totalMarketGave = 0; // Total Udhar (Kitna howa)
  let totalMarketGot = 0;  // Total Wasool (Kitna diya)
  let totalMarketBalance = 0; // Baqi (Kitna raha)

  const customerRows = (customers || []).map((c, index) => {
    const totals = getCustomerTotals(c);
    totalMarketGave += totals.totalGave;
    totalMarketGot += totals.totalGot;
    totalMarketBalance += totals.balance;

    const recentTx = (c.transactions || []).slice(-3).map((tx) => {
      const isGave = tx.type === 'gave';
      const txDt = formatDateTime(tx.date, lang);
      return `<div style="font-size: 11px; color: ${isGave ? '#dc2626' : '#16a34a'};">
        ${isGave ? '+ ادھار' : '- وصول'}: Rs ${Number(tx.amount || 0).toLocaleString()} 
        <span style="color: #64748b;">(${txDt.date || ''})</span>
      </div>`;
    }).join('');

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; ${index % 2 === 0 ? 'background-color: #f8fafc;' : ''}">
        <td style="padding: 10px 8px; font-weight: 700; color: #0f172a;">${index + 1}</td>
        <td style="padding: 10px 8px;">
          <div style="font-weight: 800; font-size: 14px; color: #0f172a;">${c.name || 'نامعلوم'}</div>
          ${c.phone ? `<div style="font-size: 11px; color: #64748b;">📞 ${c.phone}</div>` : ''}
          ${c.address ? `<div style="font-size: 11px; color: #059669; font-weight: 600;">📍 ${c.address}</div>` : ''}
        </td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #dc2626;">
          Rs ${totals.totalGave.toLocaleString()}
        </td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #16a34a;">
          Rs ${totals.totalGot.toLocaleString()}
        </td>
        <td style="padding: 10px 8px; text-align: right;">
          <span style="display: inline-block; padding: 4px 8px; border-radius: 6px; font-weight: 800; font-size: 13px; background-color: ${totals.balance > 0 ? '#fee2e2' : totals.balance < 0 ? '#ecfdf5' : '#f1f5f9'}; color: ${totals.balance > 0 ? '#b91c1c' : totals.balance < 0 ? '#047857' : '#475569'};">
            Rs ${totals.balance.toLocaleString()}
          </span>
        </td>
        <td style="padding: 10px 8px;">
          ${recentTx || '<span style="color: #94a3b8; font-size: 11px;">کوئی اندراج نہیں</span>'}
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="ur" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${shop.shopName || 'کھاتہ رپورٹ'} - مکمل لیجر</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
    }
    .header-box {
      border-bottom: 2px solid #059669;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .shop-title {
      font-size: 24px;
      font-weight: 900;
      color: #059669;
      margin: 0;
    }
    .shop-meta {
      font-size: 13px;
      color: #475569;
      margin-top: 4px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .summary-card {
      border-radius: 12px;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      text-align: center;
    }
    .table-container {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th {
      background-color: #059669;
      color: #ffffff;
      padding: 10px 8px;
      font-size: 13px;
      font-weight: 800;
      text-align: right;
    }
    @media print {
      body { padding: 10px; }
      .no-print { display: none !important; }
      @page { margin: 1cm; size: A4 portrait; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; background: #ecfdf5; border: 1.5px solid #10b981; padding: 12px 16px; border-radius: 12px;">
    <div>
      <strong style="color: #065f46; font-size: 15px;">📄 کھاتہ رپورٹ (PDF پرنٹ تیار ہے)</strong>
      <div style="font-size: 12px; color: #047857; margin-top: 2px;">اپنے موبائل میں "Save as PDF" منتخب کر کے محفوظ کریں۔</div>
    </div>
    <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 800; font-size: 14px; cursor: pointer;">
      🖨️ PDF محفوظ کریں / پرنٹ
    </button>
  </div>

  <div class="header-box">
    <div>
      <h1 class="shop-title">${shop.shopName || 'میرا کھاتہ (Mera Khatta)'}</h1>
      <div class="shop-meta">مالک / پروپرائٹر: <strong>${shop.ownerName || 'دکاندار'}</strong></div>
      ${shop.phone ? `<div class="shop-meta">فون نمبر: <strong>${shop.phone}</strong></div>` : ''}
    </div>
    <div style="text-align: left;" dir="ltr">
      <div style="font-size: 12px; color: #64748b;">Report Date & Time:</div>
      <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${dt.full || now.toLocaleString()}</div>
      <div style="font-size: 11px; color: #059669; font-weight: 700; margin-top: 4px;">Khatta Ledger System</div>
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="summary-grid">
    <div class="summary-card" style="background-color: #fff1f2; border-color: #fecdd3;">
      <div style="font-size: 12px; color: #881337; font-weight: 700;">کتنا ہوا (مارکیٹ کل ادھار)</div>
      <div style="font-size: 20px; font-weight: 900; color: #e11d48; margin-top: 4px;">Rs ${totalMarketGave.toLocaleString()}</div>
    </div>
    <div class="summary-card" style="background-color: #f0fdf4; border-color: #bbf7d0;">
      <div style="font-size: 12px; color: #14532d; font-weight: 700;">کتنا دیا (کل وصول شدہ رقم)</div>
      <div style="font-size: 20px; font-weight: 900; color: #16a34a; margin-top: 4px;">Rs ${totalMarketGot.toLocaleString()}</div>
    </div>
    <div class="summary-card" style="background-color: #f8fafc; border-color: #cbd5e1;">
      <div style="font-size: 12px; color: #334155; font-weight: 700;">کتنا رہا گیا (کل واجب الوصول بقایا)</div>
      <div style="font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 4px;">Rs ${totalMarketBalance.toLocaleString()}</div>
    </div>
  </div>

  <!-- Detailed Ledger Table -->
  <h2 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 16px 0 8px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
    گاہکوں کے کھاتوں کی مکمل تفصیل (${(customers || []).length} گاہک)
  </h2>

  <table class="table-container">
    <thead>
      <tr>
        <th style="width: 30px;">#</th>
        <th>گاہک کا نام، پتہ و فون</th>
        <th style="text-align: right;">کتنا ہوا (ادھار)</th>
        <th style="text-align: right;">کتنا دیا (وصولی)</th>
        <th style="text-align: right;">کتنا رہا (بقایا)</th>
        <th>حالیہ لین دین (تاریخ و وقت)</th>
      </tr>
    </thead>
    <tbody>
      ${customerRows || '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">کوئی کھاتہ درج نہیں ہے۔</td></tr>'}
    </tbody>
  </table>

  <div style="margin-top: 32px; border-top: 1px dashed #cbd5e1; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center;">
    یہ رپورٹ کھاتہ ایپ (Khatta App) کے ذریعے تیار کی گئی ہے۔ 24 گھنٹے آف لائن اور محفوظ۔
  </div>
</body>
</html>
  `;
};

// Open printable PDF preview in a new window / trigger print
export const printLedgerReport = (data) => {
  const html = generateLedgerHTML(data);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch (e) {}
    }, 500);
  } else {
    // If popup blocked on mobile, download as HTML file that can be opened and printed
    downloadLedgerHTMLFile(data);
  }
};

// Download formatted HTML file
export const downloadLedgerHTMLFile = (data) => {
  const html = generateLedgerHTML(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Khatta_Report_${new Date().toISOString().slice(0, 10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
};
