// Real Gemini AI Service for Khatta App
import { parseAIConversationalSpeech } from './aiParser';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const MODEL_NAME = "gemini-2.5-flash";

// 1. Natural Language Voice Command Parsing via Gemini with Instant Offline Local Fallback
export const parseWithGeminiAI = async (spokenSentence) => {
  if (!spokenSentence || typeof spokenSentence !== 'string') {
    return { name: '', amount: null, type: 'gave', raw: '' };
  }

  // IF DEVICE IS OFFLINE (Bina Internet): Instantly use local AI parser in 0ms!
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return parseAIConversationalSpeech(spokenSentence);
  }

  // If no API key, fallback immediately to local AI parser
  if (!API_KEY) {
    return parseAIConversationalSpeech(spokenSentence);
  }

  try {
    const prompt = `
You are an expert Urdu & Roman Urdu accounting intelligence parser for a Pakistani dukandar/shopkeeper ledger app (کھاتہ ایپ).
The shopkeeper spoke the following voice sentence:
"${spokenSentence}"

Extract the transaction intent into strict JSON format with these exact keys:
1. "customerName": Clean person/customer/supplier name in proper Urdu script (e.g. "اسد", "عثمان علی", "حاجی سلیم", "راشد", "بلال").
   - Strip ALL conversational filler words: "نے مجھ سے", "نے ہم سے", "ادھار لیا ہے", "سامان لیا ہے", "واپس دیے", "روپے", "سیو کرو", "لکھو", "کا کھاتہ", "درج کرو", "اس کا نمبر ہے", "ne mujh se", "udhar liya", "save karo", "os ka nuber ha", "uska number hai", etc.
   - If spoken in Roman Urdu (e.g. "asad na 5000 udar liya ha os ka nuber ha 03678378901"), convert the name to beautiful clean Urdu: "اسد".
   - Output ONLY the clean person name.
2. "amount": The numeric amount in rupees as an integer number (e.g. 5000, 1000, 250). If no amount is mentioned, set to null.
3. "type": 
   - "gave" if customer took goods or loan on credit (ادھار لیا, سامان لیا, قرض).
   - "got" if customer paid money back or store received payment (وصول ہوئے, پیسے دیے, واپس کیے, نقد).
4. "phoneNumber": If user mentioned a mobile number (e.g. 03678378901, 03001234567), extract only digits; else null.
5. "address": If user mentioned a location or address (e.g. "مین مارکیٹ", "گلی 2"), extract in Urdu; else null.
6. "entity": "supplier" if the sentence is about a supplier, wholesaler, or vendor (سپلائر, ہول سیلر, کمپنی, مال منگوایا), otherwise "customer".

Output ONLY raw JSON, with no explanation and no markdown:
{"customerName": "اسد", "amount": 5000, "type": "gave", "phoneNumber": "03678378901", "address": null, "entity": "customer"}
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini HTTP error ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip code fences if any
    const cleanJsonStr = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const parsed = JSON.parse(cleanJsonStr);

    return {
      raw: spokenSentence,
      name: parsed.customerName ? parsed.customerName.trim() : '',
      amount: typeof parsed.amount === 'number' ? parsed.amount : (parseInt(parsed.amount, 10) || null),
      type: parsed.type === 'got' ? 'got' : 'gave',
      phone: parsed.phoneNumber ? String(parsed.phoneNumber).replace(/[^0-9]/g, '') : '',
      address: parsed.address || '',
      entity: parsed.entity === 'supplier' ? 'supplier' : 'customer',
      isAiParsed: true,
      model: MODEL_NAME
    };
  } catch (err) {
    console.warn('Gemini AI online parse fallback to local rules:', err);
    // 100% reliable local fallback
    return parseAIConversationalSpeech(spokenSentence);
  }
};

// 2. AI Munshi (Smart Business Advisor for Shopkeeper)
export const askAIMunshi = async (question, customers, shop) => {
  if (!API_KEY) {
    return 'Gemini AI سے رابطہ نہیں ہو سکا۔ انٹرنیٹ کنکشن چیک کریں۔';
  }

  try {
    const summaryData = {
      shopName: shop.shopName,
      ownerName: shop.ownerName,
      totalCustomers: customers.length,
      customers: customers.map((c) => ({
        name: c.name,
        phone: c.phone || 'کوئی نمبر نہیں',
        transactionsCount: c.transactions?.length || 0,
        netBalance: (c.transactions || []).reduce((sum, tx) => {
          return tx.type === 'gave' ? sum + tx.amount : sum - tx.amount;
        }, 0)
      }))
    };

    const prompt = `
آپ ایک دیسی دکاندار بھائی کے ذاتی مشیر اور ہوشیار "AI منشی" ہیں۔
دکان کا نام: ${shop.shopName}
مالک کا نام: ${shop.ownerName}

کھاتے کی تفصیلات (JSON):
${JSON.stringify(summaryData, null, 2)}

دکاندار کا سوال: "${question}"

ہدایات:
1. دکاندار کو آسان، شائستہ اور گرمجوش انداز میں خالص اردو یا سادہ رومن اردو میں جواب دیں۔
2. گاہکوں کے نام اور اعداد و شمار بالکل درست بتائیں۔
3. دکاندار کے فائدے اور ادھار کی فوری وصولی کے عملی مشورے دیں۔
4. جواب جامع اور 2 سے 4 جملوں میں رکھیں۔
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'کوئی جواب موصول نہیں ہوا۔';
  } catch (err) {
    console.error('AI Munshi error:', err);
    return 'اس وقت AI منشی دستیاب نہیں ہے، براہِ کرم تھوڑی دیر بعد کوشش کریں۔';
  }
};
