import React, { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';
import { Search, Plus, Filter, Mic, Sparkles, UserPlus, Users, Building2, X, Trash2, History } from 'lucide-react';
import {
  loadShopData,
  saveShopData,
  loadCustomersData,
  saveCustomersData,
  loadSuppliersData,
  saveSuppliersData,
  loadDeletedCustomers,
  saveDeletedCustomers,
  getLedgerSummary,
  getCustomerBalance,
  getSupplierBalance,
  getSuppliersSummary,
  formatDateTime,
  DEFAULT_LOGGED_OUT_SHOP,
  clearActiveUserSession
} from './storage';
import { saveToCloud, listenToCloud, firebaseUpdateAuthPassword, firebaseLogOut } from './firebase';
import { translations } from './translations';
import { sounds } from './sound';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from './speech';
import { convertToUrduScript } from './urduTransliterate';
import Header from './components/Header';
import DailySummary from './components/DailySummary';
import CustomerCard from './components/CustomerCard';
import CustomerDetail from './components/CustomerDetail';
import SupplierCard from './components/SupplierCard';
import SupplierDetail from './components/SupplierDetail';
import AddTransactionModal from './components/AddTransactionModal';
import AddCustomerModal from './components/AddCustomerModal';
import EditCustomerModal from './components/EditCustomerModal';
import AddSupplierModal from './components/AddSupplierModal';
import AddSupplierTransactionModal from './components/AddSupplierTransactionModal';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import SlipModal from './components/SlipModal';
import AuthModal from './components/AuthModal';
import AuthWelcomeScreen from './components/AuthWelcomeScreen';
import BackupModal from './components/BackupModal';
import AppLockScreen from './components/AppLockScreen';
import AudioGuideModal from './components/AudioGuideModal';
import InstallPromptBanner from './components/InstallPromptBanner';
import DirectInstallScreen from './components/DirectInstallScreen';
import HistoryModal from './components/HistoryModal';

const STORAGE_KEY_NAV = 'khatta_nav_route_v1';

const checkShouldShowInstall = () => {
  try {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      localStorage.getItem('khatta_app_installed_v1') === 'true';
    if (isStandalone) return false;

    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return path.includes('install') || hash.includes('install') || search.includes('install');
  } catch (e) {
    return false;
  }
};

const getInitialNav = () => {
  try {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash.startsWith('cust-')) {
      return { tab: 'customers', custId: hash, supId: null };
    }
    if (hash.startsWith('sup-')) {
      return { tab: 'suppliers', custId: null, supId: hash };
    }
    if (hash === 'suppliers') {
      return { tab: 'suppliers', custId: null, supId: null };
    }
    const saved = localStorage.getItem(STORAGE_KEY_NAV);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        tab: parsed.tab || 'customers',
        custId: parsed.custId || null,
        supId: parsed.supId || null
      };
    }
  } catch (e) {}
  return { tab: 'customers', custId: null, supId: null };
};

export default function App() {
  const [shop, setShop] = useState(loadShopData);
  const [customers, setCustomers] = useState(loadCustomersData);
  const [suppliers, setSuppliers] = useState(loadSuppliersData);
  const [deletedCustomers, setDeletedCustomers] = useState(loadDeletedCustomers);
  const [lang, setLang] = useState(shop.language || 'roman');
  const lastLocalEditTime = useRef(Date.now());

  // Direct 1-Click Install Landing Route
  const [showInstallLanding, setShowInstallLanding] = useState(checkShouldShowInstall);

  // Navigation State Persistence (stays on exact page on refresh/reload)
  const [initialNav] = useState(getInitialNav);
  const [activeTab, setActiveTab] = useState(initialNav.tab);
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialNav.custId);
  const [selectedSupplierId, setSelectedSupplierId] = useState(initialNav.supId);

  // App PIN / Biometric Lock State (Prompts ONLY if shop is logged in with active PIN)
  const [isLocked, setIsLocked] = useState(() => {
    try {
      const isUnlocked = sessionStorage.getItem('khatta_app_unlocked') === 'true';
      return !isUnlocked && Boolean(shop && shop.pin && shop.isLoggedIn);
    } catch (e) {
      return false;
    }
  });

  const handleUnlockApp = () => {
    try {
      sessionStorage.setItem('khatta_app_unlocked', 'true');
    } catch (e) {}
    setIsLocked(false);
  };

  const handleLockApp = () => {
    try {
      sessionStorage.removeItem('khatta_app_unlocked');
    } catch (e) {}
    setIsLocked(true);
  };

  const handleLoginSuccess = ({ shop: loadedShop, customers: loadedCustomers = [], suppliers: loadedSuppliers = [] }) => {
    setShop(loadedShop);
    setCustomers(loadedCustomers);
    setSuppliers(loadedSuppliers);
    saveShopData(loadedShop);
    saveCustomersData(loadedCustomers);
    saveSuppliersData(loadedSuppliers);
    sessionStorage.setItem('khatta_app_unlocked', 'true');
    setIsLocked(false);
  };

  const handleLogout = async () => {
    sounds.playTap();
    try {
      await firebaseLogOut();
    } catch (e) {}
    clearActiveUserSession();
    setShop(DEFAULT_LOGGED_OUT_SHOP);
    setCustomers([]);
    setSuppliers([]);
    setDeletedCustomers([]);
    setIsLocked(false);
    setSelectedCustomerId(null);
    setSelectedSupplierId(null);
    setActiveModal(null);
  };

  const handleUpdateShopPin = async (newPin) => {
    const cleanPin = String(newPin).trim();
    const updated = { ...shop, pin: cleanPin };
    setShop(updated);
    saveShopData(updated);

    try {
      await firebaseUpdateAuthPassword(cleanPin);
    } catch (e) {
      console.warn('Firebase auth password sync warning:', e);
    }

    if (shop.isLoggedIn && shop.userId) {
      saveToCloud(shop.userId, { profile: updated, customers, suppliers });
    }
  };

  // Direct card delete confirmation states
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  // Persist navigation route to localStorage & URL hash so refresh never loses page
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NAV, JSON.stringify({
        tab: activeTab,
        custId: selectedCustomerId,
        supId: selectedSupplierId
      }));
      if (selectedCustomerId) {
        window.location.hash = selectedCustomerId;
      } else if (selectedSupplierId) {
        window.location.hash = selectedSupplierId;
      } else if (activeTab === 'suppliers') {
        window.location.hash = 'suppliers';
      } else {
        window.location.hash = '';
      }
    } catch (e) {}
  }, [activeTab, selectedCustomerId, selectedSupplierId]);

  // Handle browser back button via hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) {
        setSelectedCustomerId(null);
        setSelectedSupplierId(null);
      } else if (hash.startsWith('cust-')) {
        setSelectedCustomerId(hash);
        setSelectedSupplierId(null);
      } else if (hash.startsWith('sup-')) {
        setSelectedSupplierId(hash);
        setSelectedCustomerId(null);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [isListeningSearch, setIsListeningSearch] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'cleared'
  const [sortMode, setSortMode] = useState('recent'); // 'recent' | 'highest'

  // Modals
  const [activeModal, setActiveModal] = useState(null); // 'addTx' | 'addCust' | 'editCust' | 'addSup' | 'addSupTx' | 'voice' | 'slip' | 'auth' | 'backup' | 'guide'
  const [txType, setTxType] = useState('gave');
  const [supTxType, setSupTxType] = useState('took');
  const [slipCustomer, setSlipCustomer] = useState(null);

  // Sync shop, customers, and suppliers to localStorage
  useEffect(() => {
    saveShopData({ ...shop, language: lang });
  }, [shop, lang]);

  useEffect(() => {
    saveCustomersData(customers);
  }, [customers]);

  useEffect(() => {
    saveSuppliersData(suppliers);
  }, [suppliers]);

  // Auto-sync to Firebase Cloud Firestore when user is logged in
  useEffect(() => {
    if (shop.isLoggedIn && shop.userId) {
      const timer = setTimeout(() => {
        saveToCloud(shop.userId, {
          profile: shop,
          customers,
          suppliers
        });
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [shop, customers, suppliers]);

  // Real-time synchronization from Firebase Cloud Firestore
  useEffect(() => {
    if (shop.isLoggedIn && shop.userId) {
      const unsubscribe = listenToCloud(shop.userId, (cloudData) => {
        if (!cloudData) return;
        // Ignore cloud snapshot if a local edit occurred within the last 3 seconds
        if (Date.now() - lastLocalEditTime.current < 3000) {
          return;
        }
        if (Array.isArray(cloudData.customers)) {
          setCustomers(cloudData.customers);
          saveCustomersData(cloudData.customers);
        }
        if (Array.isArray(cloudData.suppliers)) {
          setSuppliers(cloudData.suppliers);
          saveSuppliersData(cloudData.suppliers);
        }
      });
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, [shop.userId, shop.isLoggedIn]);

  // Current translation dictionary
  const t = translations[lang] || translations.roman;

  // Selected Customer / Supplier objects
  const selectedCustomer = useMemo(() => {
    if (!Array.isArray(customers)) return null;
    return customers.find((c) => c && c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const selectedSupplier = useMemo(() => {
    if (!Array.isArray(suppliers)) return null;
    return suppliers.find((s) => s && s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  // Metrics summaries
  const customerSummary = useMemo(() => {
    try {
      return getLedgerSummary(customers || []);
    } catch (e) {
      return { totalUdhar: 0, totalAdvance: 0, receivedToday: 0, totalCustomers: 0 };
    }
  }, [customers]);

  const suppliersSummary = useMemo(() => {
    try {
      return getSuppliersSummary(suppliers || []);
    } catch (e) {
      return { totalPayable: 0, paidToday: 0, totalSuppliers: 0 };
    }
  }, [suppliers]);

  // Voice Search Handler for Search Bar
  const handleVoiceSearch = () => {
    if (!isSpeechRecognitionSupported()) {
      alert(lang === 'ur' ? 'آپ کا براؤزر مائیک سرچ سپورٹ نہیں کرتا۔' : 'Voice search not supported');
      return;
    }
    sounds.playTap();
    setIsListeningSearch(true);

    const recognizer = createSpeechRecognizer({
      lang: 'ur-PK',
      autoConvertToUrdu: false,
      onResult: (spoken) => {
        setIsListeningSearch(false);
        if (!spoken || !spoken.trim()) return;
        const clean = spoken.trim();
        // Try Urdu transliteration for Roman Urdu names, or keep numeric/Urdu query
        const urduCandidate = convertToUrduScript(clean);
        setSearchQuery(urduCandidate || clean);
        sounds.playCashChime();
      },
      onError: () => setIsListeningSearch(false),
      onEnd: () => setIsListeningSearch(false)
    });

    if (recognizer) {
      try { recognizer.start(); } catch (e) { setIsListeningSearch(false); }
    }
  };

  // Filtered & Sorted Customer list
  const filteredCustomers = useMemo(() => {
    if (!Array.isArray(customers)) return [];
    return customers
      .filter((c) => {
        if (!c) return false;
        const q = (searchQuery || '').toLowerCase().trim();
        const matchesQuery = !q || (c.name || '').toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
        if (!matchesQuery) return false;

        const bal = getCustomerBalance(c);
        if (filter === 'pending') return bal > 0;
        if (filter === 'cleared') return bal === 0;
        return true;
      })
      .sort((a, b) => {
        if (!a || !b) return 0;
        if (sortMode === 'highest') {
          return getCustomerBalance(b) - getCustomerBalance(a);
        }
        const aDate = a.transactions && a.transactions.length > 0 ? new Date(a.transactions[a.transactions.length - 1].date) : new Date(a.createdAt || 0);
        const bDate = b.transactions && b.transactions.length > 0 ? new Date(b.transactions[b.transactions.length - 1].date) : new Date(b.createdAt || 0);
        return bDate - aDate;
      });
  }, [customers, searchQuery, filter, sortMode]);

  // Filtered & Sorted Supplier list
  const filteredSuppliers = useMemo(() => {
    if (!Array.isArray(suppliers)) return [];
    return suppliers
      .filter((s) => {
        if (!s) return false;
        const q = (searchQuery || '').toLowerCase().trim();
        const matchesQuery = !q || (s.name || '').toLowerCase().includes(q) || (s.phone && s.phone.includes(q));
        if (!matchesQuery) return false;

        const bal = getSupplierBalance(s);
        if (filter === 'pending') return bal > 0;
        if (filter === 'cleared') return bal === 0;
        return true;
      })
      .sort((a, b) => {
        if (!a || !b) return 0;
        if (sortMode === 'highest') {
          return getSupplierBalance(b) - getSupplierBalance(a);
        }
        const aDate = a.transactions && a.transactions.length > 0 ? new Date(a.transactions[a.transactions.length - 1].date) : new Date(a.createdAt || 0);
        const bDate = b.transactions && b.transactions.length > 0 ? new Date(b.transactions[b.transactions.length - 1].date) : new Date(b.createdAt || 0);
        return bDate - aDate;
      });
  }, [suppliers, searchQuery, filter, sortMode]);

  // WhatsApp reminder message (Customer)
  const handleSendWhatsAppCustomer = (customer, balance) => {
    sounds.playTap();
    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');
    let msg = '';
    if (lang === 'ur') {
      msg = `السلام علیکم ${customer.name} صاحب! ${shop.shopName} کی طرف سے یاد دہانی کہ آپ کا بقایا ادھار ${t.rupees} ${balance.toLocaleString()} ہے۔ برائے مہربانی تشریف لا کر حساب بے باق فرما لیں۔ شکریہ!`;
    } else if (lang === 'roman') {
      msg = `Assalam-o-Alaikum ${customer.name} sb! ${shop.shopName} ki taraf se yad-dehani k apka baqi udhar ${t.rupees} ${balance.toLocaleString()} hai. Meherbani farma kar hisab barabar karwayen. Shukriya!`;
    } else {
      msg = `Hello ${customer.name}, friendly reminder from ${shop.shopName}. Your outstanding balance is ${t.rupees} ${balance.toLocaleString()}. Please clear at your convenience. Thank you!`;
    }

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith('92') ? cleanPhone : '92' + cleanPhone.replace(/^0/, '')}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  // WhatsApp reminder / payment details (Supplier)
  const handleSendWhatsAppSupplier = (supplier, balance) => {
    sounds.playTap();
    const cleanPhone = (supplier.phone || '').replace(/[^0-9]/g, '');
    let msg = '';
    if (lang === 'ur') {
      msg = `السلام علیکم ${supplier.name} صاحب! ${shop.shopName} کی طرف سے آپ کے کھاتے کی تفصیل۔ ہمارا واجب الادا ادھار ${t.rupees} ${balance.toLocaleString()} ہے۔ شکریہ!`;
    } else {
      msg = `Assalam-o-Alaikum ${supplier.name} sb! ${shop.shopName} ki taraf se khate ki tafseel. Hamara wajib-ul-ada udhar ${t.rupees} ${balance.toLocaleString()} hai. Shukriya!`;
    }

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith('92') ? cleanPhone : '92' + cleanPhone.replace(/^0/, '')}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  // Customer Transaction Handlers
  const handleSaveTransaction = (tx) => {
    if (!selectedCustomerId) return;
    const now = new Date();
    const dt = formatDateTime(now.toISOString(), lang);
    const newTx = {
      ...tx,
      id: `tx-${Date.now()}`,
      date: tx.date || now.toISOString(),
      dateFormatted: dt.date,
      timeFormatted: dt.time
    };
    setCustomers((prev) =>
      prev.map((c) => (c.id === selectedCustomerId ? { ...c, transactions: [...(c.transactions || []), newTx] } : c))
    );
  };

  const handleDeleteTransaction = (customerId, txId) => {
    sounds.playDeleteTone();
    lastLocalEditTime.current = Date.now();
    setCustomers((prev) => {
      const updated = prev.map((c) =>
        c.id === customerId
          ? { ...c, transactions: (c.transactions || []).filter((tx) => tx.id !== txId) }
          : c
      );
      saveCustomersData(updated);
      if (shop.isLoggedIn && shop.userId) {
        saveToCloud(shop.userId, { profile: shop, customers: updated, suppliers });
      }
      return updated;
    });
  };

  const handleClearBalance = (customerId) => {
    sounds.playSuccessFanfare();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    lastLocalEditTime.current = Date.now();
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;
    const curBal = getCustomerBalance(cust);
    if (curBal === 0) return;

    const now = new Date();
    const dt = formatDateTime(now.toISOString(), lang);
    const settleTx = {
      id: `tx-settle-${Date.now()}`,
      type: curBal > 0 ? 'got' : 'gave',
      amount: Math.abs(curBal),
      details: lang === 'ur' ? 'حساب بے باق کیا گیا (مکمل ادائیگی)' : 'Hisab Barabar / Full Settlement',
      date: now.toISOString(),
      dateFormatted: dt.date,
      timeFormatted: dt.time
    };

    setCustomers((prev) => {
      const updated = prev.map((c) =>
        c.id === customerId ? { ...c, transactions: [...(c.transactions || []), settleTx] } : c
      );
      saveCustomersData(updated);
      if (shop.isLoggedIn && shop.userId) {
        saveToCloud(shop.userId, { profile: shop, customers: updated, suppliers });
      }
      return updated;
    });
  };

  const handleResetCustomerTransactions = (customerId) => {
    sounds.playDeleteTone();
    lastLocalEditTime.current = Date.now();
    setCustomers((prev) => {
      const updated = prev.map((c) => (c.id === customerId ? { ...c, transactions: [] } : c));
      saveCustomersData(updated);
      if (shop.isLoggedIn && shop.userId) {
        saveToCloud(shop.userId, { profile: shop, customers: updated, suppliers });
      }
      return updated;
    });
  };

  const handleSaveCustomer = (newCustomer) => {
    lastLocalEditTime.current = Date.now();
    setCustomers((prev) => {
      const updated = [newCustomer, ...prev];
      saveCustomersData(updated);
      if (shop.isLoggedIn && shop.userId) {
        saveToCloud(shop.userId, { profile: shop, customers: updated, suppliers });
      }
      return updated;
    });
    setSelectedCustomerId(newCustomer.id);
  };

  const handleUpdateCustomer = (updatedCustomer) => {
    lastLocalEditTime.current = Date.now();
    setCustomers((prev) => {
      const updated = prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c));
      saveCustomersData(updated);
      if (shop.isLoggedIn && shop.userId) {
        saveToCloud(shop.userId, { profile: shop, customers: updated, suppliers });
      }
      return updated;
    });
  };

  const handleDeleteCustomer = (customerId) => {
    sounds.playDeleteTone();
    lastLocalEditTime.current = Date.now();
    const custToDelete = customers.find((c) => c.id === customerId);
    if (!custToDelete) return;

    const recordWithDeletedAt = {
      ...custToDelete,
      deletedAt: new Date().toISOString()
    };

    const newDeleted = [recordWithDeletedAt, ...deletedCustomers.filter((c) => c.id !== customerId)];
    setDeletedCustomers(newDeleted);
    saveDeletedCustomers(newDeleted);

    setCustomers((prev) => {
      const updated = prev.filter((c) => c.id !== customerId);
      saveCustomersData(updated);
      if (shop.isLoggedIn && shop.userId) {
        saveToCloud(shop.userId, {
          profile: shop,
          customers: updated,
          suppliers,
          deletedCustomers: newDeleted
        });
      }
      return updated;
    });
    setSelectedCustomerId(null);
  };

  const handleRestoreCustomer = (customer) => {
    sounds.playSuccessFanfare();
    lastLocalEditTime.current = Date.now();
    const newDeleted = deletedCustomers.filter((c) => c.id !== customer.id);
    setDeletedCustomers(newDeleted);
    saveDeletedCustomers(newDeleted);

    const { deletedAt, ...restored } = customer;
    setCustomers((prev) => {
      const updated = [restored, ...prev];
      saveCustomersData(updated);
      if (shop.isLoggedIn && shop.userId) {
        saveToCloud(shop.userId, {
          profile: shop,
          customers: updated,
          suppliers,
          deletedCustomers: newDeleted
        });
      }
      return updated;
    });
    setSelectedCustomerId(restored.id);
  };

  const handlePermanentDeleteCustomer = (customerId) => {
    lastLocalEditTime.current = Date.now();
    const newDeleted = deletedCustomers.filter((c) => c.id !== customerId);
    setDeletedCustomers(newDeleted);
    saveDeletedCustomers(newDeleted);
    if (shop.isLoggedIn && shop.userId) {
      saveToCloud(shop.userId, {
        profile: shop,
        customers,
        suppliers,
        deletedCustomers: newDeleted
      });
    }
  };

  // Supplier Handlers
  const handleSaveSupplier = (newSupplier) => {
    lastLocalEditTime.current = Date.now();
    setSuppliers((prev) => {
      const updated = [newSupplier, ...prev];
      saveSuppliersData(updated);
      if (shop.isLoggedIn && shop.userId) {
        saveToCloud(shop.userId, { profile: shop, customers, suppliers: updated });
      }
      return updated;
    });
    setSelectedSupplierId(newSupplier.id);
  };

  const handleSaveSupplierTransaction = (tx) => {
    if (!selectedSupplierId) return;
    lastLocalEditTime.current = Date.now();
    const now = new Date();
    const dt = formatDateTime(now.toISOString(), lang);
    const newTx = {
      ...tx,
      id: `sup-tx-${Date.now()}`,
      date: tx.date || now.toISOString(),
      dateFormatted: dt.date,
      timeFormatted: dt.time
    };
    setSuppliers((prev) => {
      const updated = prev.map((s) => (s.id === selectedSupplierId ? { ...s, transactions: [...(s.transactions || []), newTx] } : s));
      saveSuppliersData(updated);
      if (shop.isLoggedIn && shop.userId) {
        saveToCloud(shop.userId, { profile: shop, customers, suppliers: updated });
      }
      return updated;
    });
  };

  const handleDeleteSupplierTransaction = (supplierId, txId) => {
    sounds.playDeleteTone();
    lastLocalEditTime.current = Date.now();
    setSuppliers((prev) => {
      const updated = prev.map((s) => (s.id === supplierId ? { ...s, transactions: (s.transactions || []).filter((tx) => tx.id !== txId) } : s));
      saveSuppliersData(updated);
      if (shop.isLoggedIn && shop.userId) {
        saveToCloud(shop.userId, { profile: shop, customers, suppliers: updated });
      }
      return updated;
    });
  };

  const handleEditTransaction = (customerId, txId, updatedFields) => {
    sounds.playTap();
    lastLocalEditTime.current = Date.now();
    setCustomers((prev) => {
      const updated = prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              transactions: (c.transactions || []).map((tx) =>
                tx.id === txId ? { ...tx, ...updatedFields } : tx
              )
            }
          : c
      );
      saveCustomersData(updated);
      if (shop.isLoggedIn && shop.userId) {
        saveToCloud(shop.userId, { profile: shop, customers: updated, suppliers });
      }
      return updated;
    });
  };

  const handleEditSupplierTransaction = (supplierId, txId, updatedFields) => {
    sounds.playTap();
    lastLocalEditTime.current = Date.now();
    setSuppliers((prev) => {
      const updated = prev.map((s) =>
        s.id === supplierId
          ? {
              ...s,
              transactions: (s.transactions || []).map((tx) =>
                tx.id === txId ? { ...tx, ...updatedFields } : tx
              )
            }
          : s
      );
      saveSuppliersData(updated);
      if (shop.isLoggedIn && shop.userId) {
        saveToCloud(shop.userId, { profile: shop, customers, suppliers: updated });
      }
      return updated;
    });
  };

  const handleClearSupplierBalance = (supplierId) => {
    sounds.playSuccessFanfare();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    lastLocalEditTime.current = Date.now();
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return;
    const curBal = getSupplierBalance(sup);
    if (curBal === 0) return;

    const now = new Date();
    const dt = formatDateTime(now.toISOString(), lang);
    const settleTx = {
      id: `sup-settle-${Date.now()}`,
      type: curBal > 0 ? 'paid' : 'took',
      amount: Math.abs(curBal),
      details: lang === 'ur' ? 'حساب بے باق کیا گیا (مکمل ادائیگی)' : 'Full Settlement',
      date: now.toISOString(),
      dateFormatted: dt.date,
      timeFormatted: dt.time
    };

    setSuppliers((prev) => {
      const updated = prev.map((s) => (s.id === supplierId ? { ...s, transactions: [...(s.transactions || []), settleTx] } : s));
      saveSuppliersData(updated);
      if (shop.isLoggedIn && shop.userId) {
        saveToCloud(shop.userId, { profile: shop, customers, suppliers: updated });
      }
      return updated;
    });
  };

  const handleResetSupplierTransactions = (supplierId) => {
    sounds.playDeleteTone();
    lastLocalEditTime.current = Date.now();
    setSuppliers((prev) => {
      const updated = prev.map((s) => (s.id === supplierId ? { ...s, transactions: [] } : s));
      saveSuppliersData(updated);
      if (shop.isLoggedIn && shop.userId) {
        saveToCloud(shop.userId, { profile: shop, customers, suppliers: updated });
      }
      return updated;
    });
  };

  const handleDeleteSupplier = (supplierId) => {
    sounds.playDeleteTone();
    lastLocalEditTime.current = Date.now();
    setSuppliers((prev) => {
      const updated = prev.filter((s) => s.id !== supplierId);
      saveSuppliersData(updated);
      if (shop.isLoggedIn && shop.userId) {
        saveToCloud(shop.userId, { profile: shop, customers, suppliers: updated });
      }
      return updated;
    });
    setSelectedSupplierId(null);
  };

  // Apply Voice Transaction (Handles both Customer and Supplier)
  const handleApplyVoiceTransaction = ({
    entity = 'customer',
    record,
    fallbackName,
    phone,
    address,
    amount,
    type,
    details
  }) => {
    const now = new Date();
    const dt = formatDateTime(now.toISOString(), lang);

    if (entity === 'supplier') {
      let targetSup = record;
      if (!targetSup) {
        targetSup = {
          id: `sup-voice-${Date.now()}`,
          name: fallbackName,
          phone: phone || '',
          address: address || '',
          createdAt: now.toISOString(),
          transactions: []
        };
        setSuppliers((prev) => [targetSup, ...prev]);
      }

      const tx = {
        id: `sup-tx-${Date.now()}`,
        type,
        amount,
        details,
        date: now.toISOString(),
        dateFormatted: dt.date,
        timeFormatted: dt.time
      };

      setSuppliers((prev) =>
        prev.map((s) => (s.id === targetSup.id ? { ...s, transactions: [...(s.transactions || []), tx] } : s))
      );

      setActiveTab('suppliers');
      setSelectedSupplierId(targetSup.id);
    } else {
      let targetCust = record;
      if (!targetCust) {
        targetCust = {
          id: `cust-voice-${Date.now()}`,
          name: fallbackName,
          phone: phone || '',
          address: address || '',
          createdAt: now.toISOString(),
          transactions: []
        };
        setCustomers((prev) => [targetCust, ...prev]);
      }

      const tx = {
        id: `tx-voice-${Date.now()}`,
        type,
        amount,
        details,
        date: now.toISOString(),
        dateFormatted: dt.date,
        timeFormatted: dt.time
      };

      setCustomers((prev) =>
        prev.map((c) => (c.id === targetCust.id ? { ...c, transactions: [...(c.transactions || []), tx] } : c))
      );

      setActiveTab('customers');
      setSelectedCustomerId(targetCust.id);
    }
  };

  // If user opened dedicated install link (/install or ?install=1), show DirectInstallScreen
  if (showInstallLanding) {
    return (
      <DirectInstallScreen
        lang={lang}
        onOpenApp={() => {
          setShowInstallLanding(false);
          try {
            history.replaceState(null, '', '/');
          } catch (e) {}
        }}
      />
    );
  }

  return (
    <div className="app-container">
      <div className={`phone-shell lang-${lang}`}>
        {/* 1-Click Install App Banner for Mobile Chrome PWA */}
        <InstallPromptBanner lang={lang} />

        {/* Without login, NO KHATTA IS SHOWN - Pure Auth Welcome & Gate Screen */}
        {!shop.isLoggedIn ? (
          <AuthWelcomeScreen
            lang={lang}
            setLang={setLang}
            t={t}
            onLoginSuccess={handleLoginSuccess}
            onOpenGuide={() => setActiveModal('guide')}
          />
        ) : selectedCustomer ? (
          <CustomerDetail
            customer={selectedCustomer}
            onBack={() => setSelectedCustomerId(null)}
            onAddTransaction={(type) => {
              setTxType(type);
              setActiveModal('addTx');
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={(txId, fields) => handleEditTransaction(selectedCustomer.id, txId, fields)}
            onClearBalance={handleClearBalance}
            onResetTransactions={handleResetCustomerTransactions}
            onOpenSlip={(cust) => {
              setSlipCustomer(cust);
              setActiveModal('slip');
            }}
            onWhatsApp={handleSendWhatsAppCustomer}
            onEditCustomer={() => setActiveModal('editCust')}
            onDeleteCustomer={handleDeleteCustomer}
            t={t}
            lang={lang}
            shop={shop}
          />
        ) : selectedSupplier ? (
          /* If Supplier selected, show Supplier Detail Screen */
          <SupplierDetail
            supplier={selectedSupplier}
            onBack={() => setSelectedSupplierId(null)}
            onAddTransaction={(type) => {
              setSupTxType(type);
              setActiveModal('addSupTx');
            }}
            onDeleteTransaction={handleDeleteSupplierTransaction}
            onEditTransaction={(txId, fields) => handleEditSupplierTransaction(selectedSupplier.id, txId, fields)}
            onClearBalance={handleClearSupplierBalance}
            onResetTransactions={handleResetSupplierTransactions}
            onDeleteSupplier={handleDeleteSupplier}
            onWhatsApp={handleSendWhatsAppSupplier}
            t={t}
            lang={lang}
            shop={shop}
          />
        ) : (
          /* Main Dashboard: Tabs, Search, List */
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, position: 'relative' }}>
            {/* Header */}
            <Header
              shop={shop}
              lang={lang}
              setLang={setLang}
              t={t}
              onOpenVoice={() => setActiveModal('voice')}
              onOpenBackup={() => setActiveModal('backup')}
              onOpenAuth={() => setActiveModal('auth')}
              onLockApp={handleLockApp}
              onOpenGuide={() => setActiveModal('guide')}
              onOpenHistory={() => setActiveModal('history')}
            />

            {/* Main Tabs Switcher: Customers (لینے ہیں) vs Suppliers (دینے ہیں) */}
            <div className="main-tab-switcher">
              <button
                className={`main-tab-btn customers ${activeTab === 'customers' ? 'active' : ''}`}
                onClick={() => {
                  sounds.playTap();
                  setActiveTab('customers');
                  setSearchQuery('');
                }}
              >
                <Users size={15} />
                <span>{t.customersTab || 'گاہک (لینے ہیں)'}</span>
                <span className="tab-badge green">Rs {customerSummary.totalUdhar.toLocaleString()}</span>
              </button>

              <button
                className={`main-tab-btn suppliers ${activeTab === 'suppliers' ? 'active' : ''}`}
                onClick={() => {
                  sounds.playTap();
                  setActiveTab('suppliers');
                  setSearchQuery('');
                }}
              >
                <Building2 size={15} />
                <span>{t.suppliersTab || 'سپلائرز (دینے ہیں)'}</span>
                <span className="tab-badge red">Rs {suppliersSummary.totalPayable.toLocaleString()}</span>
              </button>
            </div>

            {/* Daily Summary Metric Cards */}
            {activeTab === 'customers' ? (
              <DailySummary summary={customerSummary} t={t} lang={lang} />
            ) : (
              <div className="daily-summary-grid">
                <div className="summary-card gave">
                  <div className="summary-label">{lang === 'ur' ? 'سپلائرز کو دینا ہے' : 'Dena Hai (Payable)'}</div>
                  <div className="summary-amount">
                    <span className="rs-symbol">{t.rupees}</span>
                    <span>{suppliersSummary.totalPayable.toLocaleString()}</span>
                  </div>
                </div>
                <div className="summary-card got">
                  <div className="summary-label">{lang === 'ur' ? 'آج ادا کیے' : 'Paid Today'}</div>
                  <div className="summary-amount">
                    <span className="rs-symbol">{t.rupees}</span>
                    <span>{suppliersSummary.paidToday.toLocaleString()}</span>
                  </div>
                </div>
                <div className="summary-card neutral">
                  <div className="summary-label">{t.totalSuppliers || 'کل سپلائرز'}</div>
                  <div className="summary-amount">
                    <span>{suppliersSummary.totalSuppliers}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Voice Khata Banner */}
            <div
              className="voice-banner clickable"
              onClick={() => { sounds.playTap(); setActiveModal('voice'); }}
            >
              <div className="voice-banner-info">
                <div className="mic-circle-pulse">
                  <Mic size={20} />
                </div>
                <div>
                  <div className="voice-banner-title">{t.voiceAssistant} (AI منشی)</div>
                  <div className="voice-banner-sub">
                    {activeTab === 'customers'
                      ? (lang === 'ur' ? 'بولیں: "اسد 5000 ادھار نمبر 0300..."' : 'Bolen: Asad 5000 udhar number 0300...')
                      : (lang === 'ur' ? 'بولیں: "سپلائر حاجی سلیم 5000 مال لیا"' : 'Bolen: Haji Salim 5000 maal liya')}
                  </div>
                </div>
              </div>
              <Sparkles size={18} />
            </div>

            {/* Search and Filters with Dedicated Voice Search */}
            <div className="search-filter-box">
              <div className="search-input-wrapper">
                <Search size={18} color="#94a3b8" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isListeningSearch
                      ? (lang === 'ur' ? '🎙️ نام بولیں... سن رہا ہے' : 'Listening... speak name')
                      : (activeTab === 'customers' ? t.searchPlaceholder : 'سپلائر کا نام یا فون تلاش کریں...')
                  }
                  style={{
                    background: isListeningSearch ? '#fff1f2' : 'transparent',
                    color: isListeningSearch ? '#be123c' : undefined
                  }}
                />

                {/* Clear search query button */}
                {searchQuery && (
                  <button
                    className="icon-btn"
                    style={{ width: '24px', height: '24px', marginRight: '4px' }}
                    onClick={() => { sounds.playTap(); setSearchQuery(''); }}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}

                {/* Voice Search Mic Button */}
                <button
                  className={`mini-icon-btn ${isListeningSearch ? 'listening' : ''}`}
                  onClick={handleVoiceSearch}
                  title={t.voiceSearch}
                  style={{
                    background: isListeningSearch ? '#ef4444' : undefined,
                    color: isListeningSearch ? 'white' : undefined
                  }}
                >
                  <Mic size={15} className={isListeningSearch ? 'animate-pulse-soft' : ''} />
                </button>
              </div>

              {/* Filter Pills */}
              <div className="filter-pills">
                <button
                  className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => { sounds.playTap(); setFilter('all'); }}
                >
                  {t.all} ({activeTab === 'customers' ? customers.length : suppliers.length})
                </button>
                <button
                  className={`filter-pill ${filter === 'pending' ? 'active' : ''}`}
                  onClick={() => { sounds.playTap(); setFilter('pending'); }}
                >
                  {t.pending} ({activeTab === 'customers'
                    ? customers.filter((c) => getCustomerBalance(c) > 0).length
                    : suppliers.filter((s) => getSupplierBalance(s) > 0).length})
                </button>
                <button
                  className={`filter-pill ${filter === 'cleared' ? 'active' : ''}`}
                  onClick={() => { sounds.playTap(); setFilter('cleared'); }}
                >
                  {t.cleared} ({activeTab === 'customers'
                    ? customers.filter((c) => getCustomerBalance(c) === 0).length
                    : suppliers.filter((s) => getSupplierBalance(s) === 0).length})
                </button>
                <button
                  className="filter-pill"
                  style={{
                    color: '#4f46e5',
                    borderColor: '#c7d2fe',
                    background: '#eef2ff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 800
                  }}
                  onClick={() => { sounds.playTap(); setActiveModal('history'); }}
                >
                  <History size={13} />
                  <span>{lang === 'ur' ? 'کھاتہ ہسٹری' : 'History'} ({deletedCustomers.length})</span>
                </button>
              </div>
            </div>

            {/* List: Customers or Suppliers */}
            <div className="customer-list">
              {activeTab === 'customers' ? (
                filteredCustomers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {t.noCustomers}
                  </div>
                ) : (
                  filteredCustomers.map((cust) => (
                    <CustomerCard
                      key={cust.id}
                      customer={cust}
                      onClick={() => { sounds.playTap(); setSelectedCustomerId(cust.id); }}
                      onWhatsApp={handleSendWhatsAppCustomer}
                      onDeleteCustomer={(target) => setCustomerToDelete(target)}
                      t={t}
                      lang={lang}
                      shopName={shop.shopName}
                    />
                  ))
                )
              ) : (
                filteredSuppliers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {t.noSuppliers || 'کوئی سپلائر موجود نہیں۔ نیا سپلائر درج کرنے کے لیے نیچے بٹن دبائیں۔'}
                  </div>
                ) : (
                  filteredSuppliers.map((sup) => (
                    <SupplierCard
                      key={sup.id}
                      supplier={sup}
                      onClick={() => { sounds.playTap(); setSelectedSupplierId(sup.id); }}
                      onWhatsApp={handleSendWhatsAppSupplier}
                      onDeleteSupplier={(target) => setSupplierToDelete(target)}
                      t={t}
                      lang={lang}
                      shopName={shop.shopName}
                    />
                  ))
                )
              )}
            </div>

            {/* Floating Action Button */}
            <button
              className="fab-add"
              style={{
                background: activeTab === 'suppliers' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : undefined
              }}
              onClick={() => {
                sounds.playTap();
                if (activeTab === 'suppliers') {
                  setActiveModal('addSup');
                } else {
                  setActiveModal('addCust');
                }
              }}
            >
              <UserPlus size={18} />
              <span>{activeTab === 'suppliers' ? (t.addSupplier || 'نیا سپلائر') : t.addCustomer}</span>
            </button>
          </div>
        )}

        {/* MODALS */}
        {activeModal === 'addTx' && selectedCustomer && (
          <AddTransactionModal
            customer={selectedCustomer}
            type={txType}
            onClose={() => setActiveModal(null)}
            onSave={handleSaveTransaction}
            t={t}
            lang={lang}
          />
        )}

        {activeModal === 'addSupTx' && selectedSupplier && (
          <AddSupplierTransactionModal
            supplier={selectedSupplier}
            type={supTxType}
            onClose={() => setActiveModal(null)}
            onSave={handleSaveSupplierTransaction}
            t={t}
            lang={lang}
          />
        )}

        {activeModal === 'addCust' && (
          <AddCustomerModal
            onClose={() => setActiveModal(null)}
            onSave={handleSaveCustomer}
            t={t}
            lang={lang}
          />
        )}

        {activeModal === 'addSup' && (
          <AddSupplierModal
            onClose={() => setActiveModal(null)}
            onSave={handleSaveSupplier}
            t={t}
            lang={lang}
          />
        )}

        {activeModal === 'editCust' && selectedCustomer && (
          <EditCustomerModal
            customer={selectedCustomer}
            onClose={() => setActiveModal(null)}
            onSave={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            t={t}
            lang={lang}
          />
        )}

        {activeModal === 'voice' && (
          <VoiceAssistantModal
            customers={customers}
            suppliers={suppliers}
            defaultEntity={activeTab === 'suppliers' ? 'supplier' : 'customer'}
            onApplyVoiceTransaction={handleApplyVoiceTransaction}
            onClose={() => setActiveModal(null)}
            t={t}
            lang={lang}
          />
        )}

        {activeModal === 'slip' && (slipCustomer || selectedCustomer) && (
          <SlipModal
            customer={slipCustomer || selectedCustomer}
            shop={shop}
            onClose={() => setActiveModal(null)}
            onWhatsApp={handleSendWhatsAppCustomer}
            t={t}
            lang={lang}
          />
        )}

        {activeModal === 'auth' && (
          <AuthModal
            shop={shop}
            onSaveShop={(updatedShop) => {
              setShop(updatedShop);
              saveShopData(updatedShop);
            }}
            customers={customers}
            suppliers={suppliers}
            onRestoreData={(newCusts, newShop, newSups) => {
              if (newCusts) {
                setCustomers(newCusts);
                saveCustomersData(newCusts);
              }
              if (newSups) {
                setSuppliers(newSups);
                saveSuppliersData(newSups);
              }
              if (newShop) {
                setShop(newShop);
                saveShopData(newShop);
              }
            }}
            onLogOut={handleLogout}
            onClose={() => setActiveModal(null)}
            t={t}
            lang={lang}
          />
        )}

        {activeModal === 'backup' && (
          <BackupModal
            customers={customers}
            suppliers={suppliers}
            shop={shop}
            onRestoreData={(newCusts, newShop, newSups) => {
              setCustomers(newCusts);
              if (newSups) setSuppliers(newSups);
              setShop(newShop);
            }}
            onClose={() => setActiveModal(null)}
            t={t}
            lang={lang}
          />
        )}

        {/* Khata History & Recycle Bin Modal */}
        {activeModal === 'history' && (
          <HistoryModal
            customers={customers}
            deletedCustomers={deletedCustomers}
            onRestoreCustomer={handleRestoreCustomer}
            onPermanentDeleteCustomer={handlePermanentDeleteCustomer}
            onOpenCustomer={(id) => {
              setSelectedCustomerId(id);
              setActiveModal(null);
            }}
            onClose={() => setActiveModal(null)}
            lang={lang}
          />
        )}

        {/* Audio & Visual Guide for low-literacy dukandars */}
        {activeModal === 'guide' && (
          <AudioGuideModal
            onClose={() => setActiveModal(null)}
            lang={lang}
          />
        )}

        {/* Customer Direct Delete Confirmation Modal */}
        {customerToDelete && (
          <div
            className="modal-backdrop"
            style={{ zIndex: 99999, background: 'rgba(15, 23, 42, 0.75)' }}
            onClick={() => setCustomerToDelete(null)}
          >
            <div
              className="modal-sheet animate-slide-up"
              style={{ maxWidth: '380px', margin: 'auto', textAlign: 'center', padding: '24px 20px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#ffe4e6',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                <Trash2 size={26} />
              </div>

              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                {lang === 'ur' ? 'گاہک کا کھاتہ ڈیلیٹ کریں؟' : 'Delete Customer Account?'}
              </div>

              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '20px' }}>
                {lang === 'ur'
                  ? `کیا آپ واقعی "${customerToDelete.name}" کا پورا کھاتہ مٹانا چاہتے ہیں؟ ان کا تمام حساب کتاب اور ریکارڈز مکمل طور پر ختم ہو جائیں گے۔`
                  : `Are you sure you want to delete "${customerToDelete.name}"? All balance and transactions will be deleted permanently.`}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  style={{
                    height: '46px',
                    borderRadius: '14px',
                    border: 'none',
                    background: '#e11d48',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)'
                  }}
                  onClick={() => {
                    handleDeleteCustomer(customerToDelete.id);
                    setCustomerToDelete(null);
                  }}
                >
                  <Trash2 size={16} />
                  <span>{lang === 'ur' ? 'ہاں، مستقل ڈیلیٹ کریں' : 'Yes, Delete Account'}</span>
                </button>

                <button
                  style={{
                    height: '42px',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  onClick={() => setCustomerToDelete(null)}
                >
                  {t.cancel || 'کینسل'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Supplier Direct Delete Confirmation Modal */}
        {supplierToDelete && (
          <div
            className="modal-backdrop"
            style={{ zIndex: 99999, background: 'rgba(15, 23, 42, 0.75)' }}
            onClick={() => setSupplierToDelete(null)}
          >
            <div
              className="modal-sheet animate-slide-up"
              style={{ maxWidth: '380px', margin: 'auto', textAlign: 'center', padding: '24px 20px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#ffe4e6',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                <Trash2 size={26} />
              </div>

              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                {lang === 'ur' ? 'سپلائر کا کھاتہ ڈیلیٹ کریں؟' : 'Delete Supplier Account?'}
              </div>

              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '20px' }}>
                {lang === 'ur'
                  ? `کیا آپ واقعی "${supplierToDelete.name}" کا پورا کھاتہ مٹانا چاہتے ہیں؟ ان کا تمام حساب اور مال کا ریکارڈ مستقل طور پر ڈیلیٹ ہو جائے گا۔`
                  : `Are you sure you want to delete supplier "${supplierToDelete.name}"? All transaction records will be removed.`}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  style={{
                    height: '46px',
                    borderRadius: '14px',
                    border: 'none',
                    background: '#e11d48',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)'
                  }}
                  onClick={() => {
                    handleDeleteSupplier(supplierToDelete.id);
                    setSupplierToDelete(null);
                  }}
                >
                  <Trash2 size={16} />
                  <span>{lang === 'ur' ? 'ہاں، مستقل ڈیلیٹ کریں' : 'Yes, Delete Supplier'}</span>
                </button>

                <button
                  style={{
                    height: '42px',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  onClick={() => setSupplierToDelete(null)}
                >
                  {t.cancel || 'کینسل'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* App Lock Screen (Full PIN & Biometric Screen) */}
        {isLocked && (
          <AppLockScreen
            shop={shop}
            onUnlock={handleUnlockApp}
            onUpdatePin={handleUpdateShopPin}
            t={t}
            lang={lang}
          />
        )}
      </div>
    </div>
  );
}
