// Web Speech Recognition & Synthesis for Khatta App

import { convertToUrduScript } from './urduTransliterate';

export const isSpeechRecognitionSupported = () => {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
};

export const isSpeechSynthesisSupported = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

// Text to speech in Urdu / Hindi / English
export const speakText = (text, lang = 'roman') => {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    let selectedVoice = null;
    if (lang === 'ur') {
      utterance.lang = 'ur-PK';
      selectedVoice = voices.find((v) => v.lang.startsWith('ur') || v.lang.startsWith('hi'));
    } else if (lang === 'roman') {
      utterance.lang = 'hi-IN';
      selectedVoice = voices.find((v) => v.lang.startsWith('hi') || v.lang.startsWith('ur'));
    } else {
      utterance.lang = 'en-US';
      selectedVoice = voices.find((v) => v.lang.startsWith('en'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
};

// Speak balance aloud for illiterate shopkeepers
export const speakCustomerBalance = (customerName, balance, lang = 'roman') => {
  if (balance === 0) {
    if (lang === 'ur') {
      speakText(`${customerName} کا سارا حساب بے باق ہو چکا ہے، بقایا صفر روپے ہے۔`, 'ur');
    } else if (lang === 'roman') {
      speakText(`${customerName} ka hisab barabar ho chuka hai, baqi zero rupay hai.`, 'roman');
    } else {
      speakText(`${customerName}'s account is all cleared, zero balance.`, 'en');
    }
  } else if (balance > 0) {
    if (lang === 'ur') {
      speakText(`${customerName} کا کل بقایا ادھار ${balance} روپے ہے۔`, 'ur');
    } else if (lang === 'roman') {
      speakText(`${customerName} ka kul udhar ${balance} rupay hai.`, 'roman');
    } else {
      speakText(`${customerName} owes you ${balance} rupees.`, 'en');
    }
  } else {
    const adv = Math.abs(balance);
    if (lang === 'ur') {
      speakText(`${customerName} کے پاس آپ کے ایڈوانس ${adv} روپے جمع ہیں۔`, 'ur');
    } else if (lang === 'roman') {
      speakText(`${customerName} ka advance jama ${adv} rupay hai.`, 'roman');
    } else {
      speakText(`${customerName} has an advance credit of ${adv} rupees.`, 'en');
    }
  }
};

// Convert Eastern Urdu & Arabic digits (۰-۹, ٠-٩) and Urdu words to ASCII digits
export const normalizeUrduDigitsAndWords = (input = '') => {
  if (!input) return '';
  let s = input;

  // Urdu & Arabic digits to ASCII
  const urduDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];

  for (let i = 0; i < 10; i++) {
    s = s.replaceAll(urduDigits[i], i.toString());
    s = s.replaceAll(arabicDigits[i], i.toString());
  }

  // Common Urdu words for numbers
  const wordMap = [
    [/پانچ\s*ہزار|panch\s*hazar|5\s*hazar/gi, '5000'],
    [/دو\s*ہزار|do\s*hazar|2\s*hazar/gi, '2000'],
    [/ایک\s*ہزار|ek\s*hazar|hazar|hazaar|1\s*hazar/gi, '1000'],
    [/پانچ\s*سو|panch\s*sau|5\s*sau/gi, '500'],
    [/چار\s*سو|chaar\s*sau|char\s*sau|4\s*sau/gi, '400'],
    [/تین\s*سو|teen\s*sau|3\s*sau/gi, '300'],
    [/دو\s*سو|do\s*sau|2\s*sau/gi, '200'],
    [/ایک\s*سو|ek\s*sau|sau|1\s*sau/gi, '100'],
    [/پچاس|pachaas|pachas/gi, '50']
  ];

  for (const [pattern, num] of wordMap) {
    s = s.replace(pattern, num);
  }

  return s;
};

// Create Speech Recognition instance with interim support and fallbacks
export const createSpeechRecognizer = ({
  onResult,
  onInterim,
  onError,
  onEnd,
  lang = 'ur-PK',
  autoConvertToUrdu = false
}) => {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = true; // Enables live text streaming!
  recognition.lang = lang;

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (interimTranscript && onInterim) {
      const normalizedInterim = normalizeUrduDigitsAndWords(interimTranscript);
      onInterim(autoConvertToUrdu ? convertToUrduScript(normalizedInterim) : normalizedInterim);
    }

    if (finalTranscript) {
      const normalizedFinal = normalizeUrduDigitsAndWords(finalTranscript);
      const finalText = autoConvertToUrdu ? convertToUrduScript(normalizedFinal) : normalizedFinal;
      onResult(finalText, finalTranscript);
    }
  };

  recognition.onerror = (err) => {
    console.warn('Speech Recognition error:', err);
    if (onError) onError(err);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
};

// Robust Parser for voice entry
export const parseSpokenKhata = (spoken = '') => {
  if (!spoken) {
    return { raw: '', amount: null, type: 'gave', name: '' };
  }

  // Normalize all digits (Urdu digits, number words)
  const normalized = normalizeUrduDigitsAndWords(spoken);
  const text = normalized.toLowerCase();

  // Extract numbers
  const numberMatch = text.match(/\d+/);
  let amount = numberMatch ? parseInt(numberMatch[0], 10) : null;

  // Detect type (Wasool vs Udhar)
  let type = 'gave'; // Default udhar
  const gotKeywords = [
    'wasool', 'mila', 'mile', 'mil gye', 'mil gaye', 'jama', 'diye usne',
    'وصول', 'ملا', 'ملے', 'جمع', 'نقد', 'ادا', 'ادائیگی', 'received', 'got'
  ];
  if (gotKeywords.some((kw) => text.includes(kw))) {
    type = 'got';
  }

  // Remove numbers and trigger words to extract customer name
  const cleanName = text
    .replace(/\d+/g, '')
    .replace(/(udhar|wasool|mila|mile|jama|diya|diye|liya|rupay|rupees|ka|ki|ko|se|ne|ادھار|وصول|روپے|کا|کو|کی|نے|سے|ملا|ملے|جمع|دیا|دئیے|سامان)/gi, '')
    .trim();

  // Convert name to clean Urdu script
  const urduName = convertToUrduScript(cleanName);

  return {
    raw: spoken,
    amount,
    type,
    name: urduName || cleanName
  };
};
