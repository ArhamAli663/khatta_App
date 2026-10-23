// Comprehensive Urdu Transliteration Engine & Name Dictionary

const URDU_NAME_MAP = {
  // Asad and variants
  'asad': 'اسد',
  'asaad': 'اسد',
  'asade': 'اسد',
  'assad': 'اسد',
  'saad': 'سعد',
  'saade': 'سعد',
  'fahad': 'فہد',
  'fahade': 'فہد',
  'samad': 'صمد',
  'jawad': 'جواد',
  'hamad': 'حماد',
  'hammad': 'حماد',
  'amad': 'حماد',

  // Common Pakistani & Islamic Names
  'ali': 'علی',
  'aali': 'علی',
  'muhammad': 'محمد',
  'mohammad': 'محمد',
  'mohd': 'محمد',
  'md': 'محمد',
  'ahmed': 'احمد',
  'ahmad': 'احمد',
  'rashid': 'راشد',
  'rasheed': 'رشید',
  'akram': 'اکرم',
  'aslam': 'اسلم',
  'tariq': 'طارق',
  'tarik': 'طارق',
  'umer': 'عمر',
  'umar': 'عمر',
  'omer': 'عمر',
  'usman': 'عثمان',
  'osman': 'عثمان',
  'othman': 'عثمان',
  'bilal': 'بلال',
  'hamza': 'حمزہ',
  'imran': 'عمران',
  'kamran': 'کامران',
  'kashif': 'کاشف',
  'waqas': 'وقاص',
  'vakas': 'وقاص',
  'waqar': 'وقار',
  'vakar': 'وقار',
  'sajid': 'ساجد',
  'shahid': 'شاہد',
  'arshad': 'ارشد',
  'babar': 'بابر',
  'rizwan': 'رضوان',
  'naveed': 'نوید',
  'navid': 'نوید',
  'jameel': 'جمیل',
  'jamil': 'جمیل',
  'nadeem': 'ندیم',
  'shabbir': 'شبیر',
  'hassan': 'حسن',
  'hasan': 'حسن',
  'hussain': 'حسین',
  'abid': 'عابد',
  'zahid': 'زاہد',
  'majid': 'ماجد',
  'irfan': 'عرفان',
  'adnan': 'عدنان',
  'farhan': 'فرحان',
  'zubair': 'زبیر',
  'saqib': 'ثاقب',
  'sakib': 'ثاقب',
  'waheed': 'وحید',
  'shafiq': 'شفیق',
  'shfeeq': 'شفیق',
  'nasir': 'ناصر',
  'naseer': 'نصیر',
  'munir': 'منیر',
  'muneer': 'منیر',
  'bashir': 'بشیر',
  'basheer': 'بشیر',
  'zia': 'ضیاء',
  'tahir': 'طاہر',
  'tanveer': 'تنویر',
  'tanvir': 'تنویر',
  'sohail': 'سہیل',
  'suhail': 'سہیل',
  'faheem': 'فہیم',
  'saleem': 'سلیم',
  'salim': 'سلیم',
  'naeem': 'نعیم',
  'mustafa': 'مصطفیٰ',
  'murtaza': 'مرتضیٰ',
  'mujtaba': 'مجتبیٰ',
  'amjad': 'امجد',
  'asghar': 'اصغر',
  'akbar': 'اکبر',
  'altaf': 'الطاف',
  'iqbal': 'اقبال',
  'nawaz': 'نواز',
  'rehman': 'رحمٰن',
  'abdul': 'عبدال',
  'abdullah': 'عبداللہ',
  'karim': 'کریم',
  'kareem': 'کریم',
  'razzaq': 'رزاق',
  'sattar': 'ستار',
  'ghafoor': 'غفور',
  'khalid': 'خالد',
  'qasim': 'قاسم',
  'salman': 'سلمان',
  'faisal': 'فیصل',
  'zeeshan': 'ذیشان',
  'mohsin': 'محسن',
  'hamid': 'حامد',
  'shoaib': 'شعیب',
  'yasir': 'یاسر',
  'ayaz': 'ایاز',
  'sajjad': 'سجاد',
  'zulfiqar': 'ذوالفقار',
  'liaquat': 'لیاقت',
  'shaukat': 'شوکت',
  'anwar': 'انور',
  'afzal': 'افضل',
  'azhar': 'اظہر',
  'ashraf': 'اشرف',
  'ayub': 'ایوب',
  'idrees': 'ادریس',
  'haroon': 'ہارون',
  'dawood': 'داؤد',
  'suleman': 'سلیمان',
  'sulaiman': 'سلیمان',
  'ibrar': 'ابرار',
  'ibrahim': 'ابراہیم',
  'ismail': 'اسماعیل',
  'yousuf': 'یوسف',
  'yousaf': 'یوسف',
  'yaqoob': 'یعقوب',
  'mushtaq': 'مشتاق',
  'maqsood': 'مقصود',
  'manzoor': 'منظور',
  'mahmood': 'محمود',
  'masood': 'مسعود',
  'zafar': 'ظفر',
  'asif': 'عاصف',
  'atif': 'عاطف',
  'aatif': 'عاطف',
  'amir': 'عامر',
  'aamir': 'عامر',
  'shahzaib': 'شاہزیب',
  'shehbaz': 'شہباز',
  'shahbaz': 'شہباز',
  'junaid': 'جنید',
  'daniyal': 'دانیال',
  'fawad': 'فواد',
  'haris': 'حارث',
  'zain': 'زین',
  'zaid': 'زید',
  'haider': 'حیدر',
  'subhan': 'سبحان',
  'luqman': 'لقمان',
  'arsalan': 'ارسلان',
  'rehan': 'ریحان',
  'faizan': 'فیضان',
  'ahsan': 'احسن',
  'mudassar': 'مدثر',
  'muzammil': 'مزمل',
  'munawwar': 'منور',
  'muzaffar': 'مظفر',
  'shakir': 'شاکر',
  'sabir': 'صابر',
  'tahir': 'طاہر',
  'tayyab': 'طیب',
  'saeed': 'سعید',
  'safeer': 'سفیر',
  'rafeeq': 'رفیق',
  'shakeel': 'شکیل',
  'aqeel': 'عقیل',
  'khalil': 'خلیل',
  'jaleel': 'جلیل',
  'raheem': 'رحیم',
  'azeem': 'عظیم',
  'hakeem': 'حکیم',
  'haleem': 'حلیم',
  'hashim': 'ہاشم',
  'rameez': 'رمیض',
  'danish': 'دانش',
  'talha': 'طلحہ',
  'shayan': 'شایان',
  'rayan': 'ریان',

  // Castes & Surnames
  'khan': 'خان',
  'butt': 'بٹ',
  'bhatti': 'بھٹی',
  'cheema': 'چیمہ',
  'chatha': 'چٹھہ',
  'warraich': 'وڑائچ',
  'gujjar': 'گجر',
  'chaudhry': 'چوہدری',
  'chaudhary': 'چوہدری',
  'chaudry': 'چوہدری',
  'ch': 'چوہدری',
  'malik': 'ملک',
  'sheikh': 'شیخ',
  'ansari': 'انصاری',
  'qureshi': 'قریشی',
  'syed': 'سید',
  'shah': 'شاہ',
  'mirza': 'مرزا',
  'mughal': 'مغل',
  'rathore': 'راٹھور',
  'abbasi': 'عباسی',
  'jutt': 'جٹ',
  'awan': 'اعوان',
  'raja': 'راجہ',
  'memon': 'میمن',
  'tiwana': 'ٹوانہ',
  'sethi': 'سیٹھی',

  // Female Names
  'zainab': 'زینب',
  'fatima': 'فاطمہ',
  'ayesha': 'عائشہ',
  'maryam': 'مریم',
  'amna': 'آمنہ',
  'khadija': 'خدیجہ',
  'sana': 'ثناء',
  'sara': 'سارہ',
  'sarah': 'سارہ',
  'hira': 'حرا',
  'sidra': 'سدرہ',
  'rabia': 'رابعہ',
  'saima': 'صائمہ',
  'shazia': 'شازیہ',
  'bushra': 'بشریٰ',
  'samina': 'ثمینہ',
  'nasreen': 'نسرین',
  'parveen': 'پروین',
  'yasmin': 'یاسمین',
  'uzma': 'عظمیٰ',
  'nadia': 'نادیہ',
  'farzana': 'فرزانہ',
  'rubina': 'روبینہ',
  'kousar': 'کوثر',
  'asma': 'اسماء',
  'tahira': 'طاہرہ',
  'rukhsana': 'رخسانہ',

  // Titles, Relations & Professions
  'baji': 'باجی',
  'bhabi': 'بھابھی',
  'amma': 'اماں',
  'bhai': 'بھائی',
  'chacha': 'چچا',
  'mama': 'ماموں',
  'sahib': 'صاحب',
  'sb': 'صاحب',
  'janab': 'جناب',
  'haji': 'حاجی',
  'hafiz': 'حافظ',
  'qari': 'قاری',
  'doctor': 'ڈاکٹر',
  'dr': 'ڈاکٹر',
  'master': 'ماسٹر',
  'mechanic': 'مکینک',
  'mistri': 'مستری',
  'darzi': 'درزی',
  'tailor': 'درزی',
  'driver': 'ڈرائیور',

  // Address Terms
  'gali': 'گلی',
  'street': 'اسٹریٹ',
  'road': 'روڈ',
  'mohallah': 'محلہ',
  'mohalla': 'محلہ',
  'chowk': 'چوک',
  'bazaar': 'بازار',
  'bazar': 'بازار',
  'pull': 'پل',
  'pul': 'پل',
  'mor': 'موڑ',
  'adda': 'اڈا',
  'stop': 'اسٹاپ',
  'masjid': 'مسجد',
  'school': 'اسکول',
  'dukan': 'دکان',
  'market': 'مارکیٹ',
  'makan': 'مکان',
  'house': 'مکان',
  'haveli': 'حویلی',
  'dera': 'ڈیرہ',
  'chak': 'چک',
  'sector': 'سیکٹر',
  'block': 'بلاک',
  'colony': 'کالونی',
  'town': 'ٹاؤن',
  'near': 'نزدیک',
  'samne': 'سامنے',
  'peela': 'پیلا',
  'safed': 'سفید',
  'lal': 'لال',
  'number': 'نمبر',
  'no': 'نمبر'
};

// Check if string contains Urdu / Arabic characters
export const isUrduScript = (str) => {
  return /[\u0600-\u06FF]/.test(str);
};

// Smart phonetic transliteration for unknown words
// In Urdu/Arabic names:
// - 'd' is 'د' (Dal) by default, not 'ڈ'
// - 't' is 'ت' (Te) by default
// - short 'a' in middle is omitted (Zabar), not 'ا'
const phoneticTransliterateWord = (word) => {
  let w = word.toLowerCase();

  // Known patterns like "asad" -> "اسد"
  if (w.startsWith('asa')) {
    return 'اسد';
  }
  if (w === 'ali' || w === 'aali') return 'علی';
  if (w === 'ahmed' || w === 'ahmad') return 'احمد';
  if (w === 'saad' || w === 'saade') return 'سعد';
  if (w === 'fahad' || w === 'fahade') return 'فہد';

  // Digraphs & sound patterns
  w = w.replace(/kh/g, 'خ')
       .replace(/gh/g, 'غ')
       .replace(/sh/g, 'ش')
       .replace(/ch/g, 'چ')
       .replace(/zh/g, 'ژ')
       .replace(/th/g, 'تھ')
       .replace(/ph/g, 'پھ')
       .replace(/bh/g, 'بھ')
       .replace(/dh/g, 'دھ')
       .replace(/jh/g, 'جھ')
       .replace(/aa/g, 'ا')
       .replace(/ee/g, 'ی')
       .replace(/oo/g, 'و');

  // Initial letter
  let result = '';
  for (let i = 0; i < w.length; i++) {
    const char = w[i];
    const isStart = i === 0;

    switch (char) {
      case 'a':
        if (isStart) result += 'ا';
        // Medial 'a' is suppressed in Urdu names (e.g. Asad -> ا س د)
        break;
      case 'b': result += 'ب'; break;
      case 'p': result += 'پ'; break;
      case 't': result += 'ت'; break;
      case 'j': result += 'ج'; break;
      case 'c': result += 'ک'; break;
      case 'k': result += 'ک'; break;
      case 'q': result += 'ق'; break;
      case 'd': result += 'د'; break; // 'د' (Dal) by default for names!
      case 'r': result += 'ر'; break;
      case 'z': result += 'ز'; break;
      case 's': result += 'س'; break;
      case 'f': result += 'ف'; break;
      case 'l': result += 'ل'; break;
      case 'm': result += 'م'; break;
      case 'n': result += 'ن'; break;
      case 'w':
      case 'v':
      case 'o':
      case 'u': result += 'و'; break;
      case 'h': result += 'ہ'; break;
      case 'y':
      case 'e':
      case 'i': result += 'ی'; break;
      case 'g': result += 'گ'; break;
      default:
        result += char;
    }
  }

  return result;
};

// Main converter: Converts Roman Urdu / English words to exact Urdu script
export const convertToUrduScript = (input) => {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // If already heavily in Urdu script, return directly
  if (isUrduScript(trimmed)) {
    return trimmed;
  }

  // Split into tokens
  const tokens = trimmed.split(/\s+/);
  const urduWords = tokens.map((token) => {
    // Preserve pure numbers
    if (/^\d+$/.test(token)) {
      return token;
    }

    const cleanToken = token.toLowerCase().replace(/[^a-z]/g, '');
    if (!cleanToken) return token;

    // Check direct dictionary match
    if (URDU_NAME_MAP[cleanToken]) {
      return URDU_NAME_MAP[cleanToken];
    }

    // Phonetic fallback
    return phoneticTransliterateWord(cleanToken);
  });

  return urduWords.join(' ');
};
