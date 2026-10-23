// AI Natural Language Parser for Urdu / Roman Urdu Khatta Commands
import { convertToUrduScript } from './urduTransliterate';
import { normalizeUrduDigitsAndWords } from './speech';

// List of conversational filler phrases to strip away from customer names
const FILLER_PHRASES = [
  // Conversational action verbs & prepositions
  /نے\s*مجھ\s*سے/gi,
  /ne\s*mujh\s*se/gi,
  /ne\s*hum\s*se/gi,
  /مجھ\s*سے/gi,
  /ہم\s*سے/gi,
  /mujh\s*se/gi,
  /hum\s*se/gi,
  /سے/gi,
  /se/gi,

  // Save / Record commands
  /سیو\s*کرو/gi,
  /سیو\s*کر\s*دو/gi,
  /سیو/gi,
  /save\s*karo/gi,
  /save\s*kar\s*do/gi,
  /save\s*kardo/gi,
  /save/gi,
  /لکھ\s*لو/gi,
  /لکھ\s*دو/gi,
  /لکھو/gi,
  /likh\s*lo/gi,
  /likh\s*do/gi,
  /likho/gi,
  /درج\s*کرو/gi,
  /darj\s*karo/gi,
  /کھاتے\s*میں\s*ڈالو/gi,
  /کھاتے\s*میں/gi,
  /khata\s*me/gi,
  /khate\s*me/gi,

  // Transaction phrases
  /ادھار\s*لیا\s*ہے/gi,
  /ادھار\s*لیا/gi,
  /udhar\s*liya\s*hai/gi,
  /udhar\s*liya/gi,
  /ادھار\s*دیا\s*ہے/gi,
  /ادھار\s*دیا/gi,
  /udhar\s*diya\s*hai/gi,
  /udhar\s*diya/gi,
  /ادھار/gi,
  /udhar/gi,
  /قرض/gi,
  /qarz/gi,
  /وصول\s*ہوئے/gi,
  /وصول\s*ہوا/gi,
  /وصول/gi,
  /wasool\s*huye/gi,
  /wasool\s*huwa/gi,
  /wasool/gi,
  /جمع\s*کروائے/gi,
  /جمع\s*کرائے/gi,
  /جمع/gi,
  /jama/gi,
  /واپس\s*دیے/gi,
  /واپس\s*کیا/gi,
  /wapas\s*diye/gi,

  // Phone number phrases
  /اس\s*کا\s*نمبر\s*ہے/gi,
  /اسکا\s*نمبر\s*ہے/gi,
  /نمبر\s*ہے/gi,
  /نمبر/gi,
  /فون\s*ہے/gi,
  /فون/gi,
  /موبائل/gi,
  /os\s*ka\s*number\s*hai/gi,
  /os\s*ka\s*nuber\s*ha/gi,
  /uska\s*number\s*hai/gi,
  /uska\s*nuber\s*ha/gi,
  /number\s*hai/gi,
  /nuber\s*ha/gi,
  /number/gi,
  /nuber/gi,
  /mobile\s*hai/gi,
  /mobile/gi,
  /phone\s*hai/gi,
  /phone/gi,

  // Suffixes / Articles
  /سامان\s*لیا\s*ہے/gi,
  /سامان\s*لیا/gi,
  /saman\s*liya/gi,
  /سامان/gi,
  /saman/gi,
  /روپے/gi,
  /rupay/gi,
  /rupees/gi,
  /rs/gi,
  /کا\s*کھاتہ/gi,
  /کا\s*حساب/gi,
  /کا\s*ادھار/gi,
  /کا/gi,
  /کی/gi,
  /کے/gi,
  /ka/gi,
  /ki/gi,
  /ke/gi,
  /نے/gi,
  /ne/gi,
  /na/gi,
  /کو/gi,
  /ko/gi,
  /لیا\s*ہے/gi,
  /لیا/gi,
  /liya\s*hai/gi,
  /liya\s*ha/gi,
  /liya/gi,
  /دیا\s*ہے/gi,
  /دیا/gi,
  /دیے/gi,
  /diya\s*hai/gi,
  /diya/gi,
  /diye/gi,
  /ہے/gi,
  /hai/gi,
  /ha/gi,
  /تھا/gi,
  /tha/gi
];

// Clean spoken text and extract structured intent: { name, amount, type, phone, entity }
export const parseAIConversationalSpeech = (rawSpoken = '') => {
  if (!rawSpoken || typeof rawSpoken !== 'string') {
    return { name: '', amount: null, type: 'gave', phone: '', entity: 'customer', raw: '' };
  }

  // 1. Normalize digits & words (convert Urdu numerals ۰-۹, number words to ASCII numbers)
  let normalized = normalizeUrduDigitsAndWords(rawSpoken);

  // 2. Extract Phone Number First (so large phone numbers aren't confused with amounts)
  let phone = '';
  // Pattern A: Explicitly preceded by number/phone/mobile keywords
  const phoneKeywordMatch = normalized.match(/(?:number|nuber|نمبر|phone|فون|mobile|موبائل|no)\s*(?:hai|ہوا|ہے|he|ha|da|is)?\s*[:=]?\s*([0-9\s-]{7,15})/i);
  if (phoneKeywordMatch) {
    const candidateDigits = phoneKeywordMatch[1].replace(/[^0-9]/g, '');
    if (candidateDigits.length >= 7) {
      phone = candidateDigits;
      normalized = normalized.replace(phoneKeywordMatch[0], ' ');
    }
  }

  // Pattern B: Pakistani mobile format 03XXXXXXXXX (11 digits) or 923XXXXXXXXX or any standalone 10-11 digit string
  if (!phone) {
    const pkMobileMatch = normalized.match(/(?:03\d{9}|923\d{9}|\b03\d{2}\s*\d{7}\b|\b\d{10,12}\b)/);
    if (pkMobileMatch) {
      const candidate = pkMobileMatch[0].replace(/[^0-9]/g, '');
      if (candidate.length >= 10) {
        phone = candidate;
        normalized = normalized.replace(pkMobileMatch[0], ' ');
      }
    }
  }

  // 3. Detect Amount (first remaining clean numeric token)
  const numberMatch = normalized.match(/\b\d+\b/);
  let amount = numberMatch ? parseInt(numberMatch[0], 10) : null;
  if (numberMatch) {
    normalized = normalized.replace(numberMatch[0], ' ');
  }

  // 4. Detect Target Entity (Customer vs Supplier)
  let entity = 'customer';
  const lower = normalized.toLowerCase();
  if (
    lower.includes('supplier') ||
    lower.includes('سپلائر') ||
    lower.includes('wholesaler') ||
    lower.includes('ہول سیلر') ||
    lower.includes('کمپنی') ||
    lower.includes('company') ||
    lower.includes('ڈسٹری بیوٹر') ||
    lower.includes('distributor')
  ) {
    entity = 'supplier';
  }

  // 5. Detect Transaction Type
  let type = 'gave';
  const gotKeywords = [
    'wasool', 'mila', 'mile', 'mil gaye', 'jama', 'wapas', 'ada',
    'وصول', 'ملا', 'ملے', 'جمع', 'واپس', 'نقد', 'ادا'
  ];
  if (gotKeywords.some((kw) => lower.includes(kw))) {
    type = 'got';
  }

  // 6. Strip all filler phrases
  let cleaned = normalized;
  for (const phrase of FILLER_PHRASES) {
    cleaned = cleaned.replace(phrase, ' ');
  }

  // 7. Clean extra spaces and punctuation
  cleaned = cleaned.replace(/[.,،!?;:\-_]/g, ' ').replace(/\s+/g, ' ').trim();

  // 8. Transliterate remaining words to Urdu script if in Roman
  let finalUrduName = convertToUrduScript(cleaned);

  // If name is too short or empty, provide a clean fallback
  if (!finalUrduName || finalUrduName.length < 2) {
    if (lower.includes('usman') || lower.includes('عثمان')) finalUrduName = 'عثمان';
    else if (lower.includes('ali') || lower.includes('علی')) finalUrduName = 'علی';
    else if (lower.includes('asad') || lower.includes('اسد')) finalUrduName = 'اسد';
    else if (lower.includes('rashid') || lower.includes('راشد')) finalUrduName = 'راشد';
    else if (lower.includes('bilal') || lower.includes('بلال')) finalUrduName = 'بلال';
    else finalUrduName = cleaned || 'نیا گاہک';
  }

  return {
    raw: rawSpoken,
    name: finalUrduName.trim(),
    amount,
    type,
    phone,
    entity
  };
};

// Check if a customer already exists in list
export const findExistingCustomer = (name = '', customers = []) => {
  if (!name || !customers || customers.length === 0) return null;
  
  // Normalize string: lowercase, remove Urdu diacritics (tashkeel/zer/zabar/pesh), collapse spaces
  const normalize = (s) => (s || '')
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
    .replace(/[يى]/g, 'ی') // normalize ya
    .replace(/[ك]/g, 'ک') // normalize kaf
    .replace(/\s+/g, ' ');

  const target = normalize(name);
  if (!target) return null;

  // 1. Exact normalized match ("عثمان علی" === "عثمان علی")
  const exact = customers.find((c) => normalize(c.name) === target);
  if (exact) return exact;

  return null;
};

// Check if a supplier already exists in list
export const findExistingSupplier = (name = '', suppliers = []) => {
  if (!name || !suppliers || suppliers.length === 0) return null;
  const normalize = (s) => (s || '')
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[يى]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/\s+/g, ' ');

  const target = normalize(name);
  if (!target) return null;

  return suppliers.find((s) => normalize(s.name) === target || normalize(s.name).includes(target) || target.includes(normalize(s.name))) || null;
};
