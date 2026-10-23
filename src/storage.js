// LocalStorage state management and calculations

const STORAGE_KEY_SHOP = 'khatta_shop_data_v1';
const STORAGE_KEY_CUSTOMERS = 'khatta_customers_data_v1';

// Initial default logged-out shop (no data visible until logged in)
export const DEFAULT_LOGGED_OUT_SHOP = {
  shopName: "",
  ownerName: "",
  phone: "",
  pin: "",
  isLoggedIn: false,
  userId: null,
  language: "roman",
};

export const DEFAULT_SHOP = DEFAULT_LOGGED_OUT_SHOP;
export const DEFAULT_CUSTOMERS = [];
export const DEFAULT_SUPPLIERS = [];


// Helper to compute net balance for a customer
// positive = customer owes shopkeeper (udhar)
// negative = shopkeeper owes customer (advance deposit)
// zero = hisab barabar
export const getCustomerBalance = (customer) => {
  if (!customer || !Array.isArray(customer.transactions)) return 0;
  return customer.transactions.reduce((sum, tx) => {
    if (!tx) return sum;
    if (tx.type === 'gave') return sum + Number(tx.amount || 0);
    if (tx.type === 'got') return sum - Number(tx.amount || 0);
    return sum;
  }, 0);
};

// Calculate total Udhar (Kitna Howa), total Wasooli (Kitna Diya), and net balance (Kitna Raha Gaya)
export const getCustomerTotals = (customer) => {
  if (!customer || !Array.isArray(customer.transactions)) {
    return { totalGave: 0, totalGot: 0, balance: 0 };
  }
  let totalGave = 0;
  let totalGot = 0;
  customer.transactions.forEach((tx) => {
    if (!tx) return;
    if (tx.type === 'gave') totalGave += Number(tx.amount || 0);
    if (tx.type === 'got') totalGot += Number(tx.amount || 0);
  });
  return {
    totalGave, // Kitna Howa (Total Udhar)
    totalGot,  // Kitna Diya (Total Wasool)
    balance: totalGave - totalGot // Kitna Raha Gaya (Baqi Balance)
  };
};

export const getSupplierTotals = (supplier) => {
  if (!supplier || !Array.isArray(supplier.transactions)) {
    return { totalTook: 0, totalPaid: 0, balance: 0 };
  }
  let totalTook = 0;
  let totalPaid = 0;
  supplier.transactions.forEach((tx) => {
    if (!tx) return;
    if (tx.type === 'took' || tx.type === 'gave') totalTook += Number(tx.amount || 0);
    if (tx.type === 'paid' || tx.type === 'got') totalPaid += Number(tx.amount || 0);
  });
  return {
    totalTook,
    totalPaid,
    balance: totalTook - totalPaid
  };
};

// Compute total summary metrics for customers
export const getLedgerSummary = (customers = []) => {
  let totalUdhar = 0; // Total money to collect from market
  let totalAdvance = 0;
  let receivedToday = 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  (Array.isArray(customers) ? customers : []).forEach((c) => {
    if (!c) return;
    const bal = getCustomerBalance(c);
    if (bal > 0) totalUdhar += bal;
    if (bal < 0) totalAdvance += Math.abs(bal);

    (Array.isArray(c.transactions) ? c.transactions : []).forEach((tx) => {
      if (!tx) return;
      if (tx.type === 'got') {
        const txDate = new Date(tx.date);
        if (txDate >= todayStart) {
          receivedToday += Number(tx.amount || 0);
        }
      }
    });
  });

  return {
    totalUdhar,
    totalAdvance,
    receivedToday,
    totalCustomers: Array.isArray(customers) ? customers.length : 0
  };
};

const STORAGE_KEY_SUPPLIERS = 'khatta_suppliers_data_v1';


// Helper to compute net balance for a supplier
export const getSupplierBalance = (supplier) => {
  if (!supplier || !Array.isArray(supplier.transactions)) return 0;
  return supplier.transactions.reduce((sum, tx) => {
    if (!tx) return sum;
    if (tx.type === 'took' || tx.type === 'gave') return sum + Number(tx.amount || 0);
    if (tx.type === 'paid' || tx.type === 'got') return sum - Number(tx.amount || 0);
    return sum;
  }, 0);
};

// Compute summary for suppliers (Dene Hain)
export const getSuppliersSummary = (suppliers = []) => {
  let totalPayable = 0;
  let paidToday = 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  (Array.isArray(suppliers) ? suppliers : []).forEach((s) => {
    if (!s) return;
    const bal = getSupplierBalance(s);
    if (bal > 0) totalPayable += bal;

    (Array.isArray(s.transactions) ? s.transactions : []).forEach((tx) => {
      if (!tx) return;
      if (tx.type === 'paid' || tx.type === 'got') {
        const txDate = new Date(tx.date);
        if (txDate >= todayStart) {
          paidToday += Number(tx.amount || 0);
        }
      }
    });
  });

  return {
    totalPayable,
    paidToday,
    totalSuppliers: Array.isArray(suppliers) ? suppliers.length : 0
  };
};

export const getActiveUserId = () => {
  try {
    return localStorage.getItem('khatta_active_uid') || null;
  } catch (e) {
    return null;
  }
};

export const setActiveUserId = (uid) => {
  try {
    if (uid) {
      localStorage.setItem('khatta_active_uid', String(uid));
    } else {
      localStorage.removeItem('khatta_active_uid');
    }
  } catch (e) {}
};

export const clearActiveUserSession = () => {
  try {
    localStorage.removeItem('khatta_active_uid');
    localStorage.removeItem(STORAGE_KEY_SHOP);
    localStorage.removeItem(STORAGE_KEY_CUSTOMERS);
    localStorage.removeItem(STORAGE_KEY_SUPPLIERS);
    sessionStorage.removeItem('khatta_app_unlocked');
  } catch (e) {}
};

export const loadShopData = () => {
  try {
    const activeUid = getActiveUserId();
    if (activeUid) {
      const uKey = `khatta_user_${activeUid}_shop`;
      const uData = localStorage.getItem(uKey);
      if (uData) {
        const parsed = JSON.parse(uData);
        if (parsed && parsed.isLoggedIn) {
          return { ...DEFAULT_LOGGED_OUT_SHOP, ...parsed, isLoggedIn: true };
        }
      }
    }

    const data = localStorage.getItem(STORAGE_KEY_SHOP);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        if (parsed.isLoggedIn && parsed.userId) {
          setActiveUserId(parsed.userId);
          localStorage.setItem(`khatta_user_${parsed.userId}_shop`, JSON.stringify(parsed));
          return { ...DEFAULT_LOGGED_OUT_SHOP, ...parsed, isLoggedIn: true };
        }
      }
    }
    return DEFAULT_LOGGED_OUT_SHOP;
  } catch (e) {
    return DEFAULT_LOGGED_OUT_SHOP;
  }
};

const STORAGE_KEY_VAULT = 'khatta_safe_vault_snapshot_v1';
const STORAGE_KEY_DELETED_CUSTOMERS = 'khatta_deleted_customers_v1';

// Automatically captures safe snapshots to guarantee zero data loss
export const createSafetyVaultSnapshot = () => {
  try {
    const activeUid = getActiveUserId();
    const backup = {
      timestamp: new Date().toISOString(),
      activeUid,
      shop: activeUid ? localStorage.getItem(`khatta_user_${activeUid}_shop`) : null,
      customers: activeUid ? localStorage.getItem(`khatta_user_${activeUid}_customers`) : null,
      suppliers: activeUid ? localStorage.getItem(`khatta_user_${activeUid}_suppliers`) : null,
      deletedCustomers: activeUid ? localStorage.getItem(`khatta_user_${activeUid}_deleted`) : null
    };
    localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(backup));
  } catch (e) {}
};

export const loadDeletedCustomers = () => {
  try {
    const activeUid = getActiveUserId();
    if (!activeUid) return [];
    const data = localStorage.getItem(`khatta_user_${activeUid}_deleted`) || localStorage.getItem(STORAGE_KEY_DELETED_CUSTOMERS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveDeletedCustomers = (deletedList = []) => {
  try {
    const activeUid = getActiveUserId();
    if (activeUid) {
      localStorage.setItem(`khatta_user_${activeUid}_deleted`, JSON.stringify(deletedList));
    }
    localStorage.setItem(STORAGE_KEY_DELETED_CUSTOMERS, JSON.stringify(deletedList));
    createSafetyVaultSnapshot();
  } catch (e) {
    console.error('Failed to save deleted customers', e);
  }
};

export const saveShopData = (shop) => {
  try {
    if (shop && shop.isLoggedIn && shop.userId) {
      setActiveUserId(shop.userId);
      localStorage.setItem(`khatta_user_${shop.userId}_shop`, JSON.stringify(shop));
      localStorage.setItem(STORAGE_KEY_SHOP, JSON.stringify(shop));
    } else {
      clearActiveUserSession();
    }
    createSafetyVaultSnapshot();
  } catch (e) {
    console.error('Failed to save shop data', e);
  }
};

export const loadCustomersData = () => {
  try {
    const activeUid = getActiveUserId();
    if (!activeUid) {
      return []; // WITHOUT LOGIN, NO CUSTOMER DATA SHOWN
    }
    const uKey = `khatta_user_${activeUid}_customers`;
    const uData = localStorage.getItem(uKey);
    if (uData) {
      const parsed = JSON.parse(uData);
      if (Array.isArray(parsed)) return parsed;
    }
    const data = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        localStorage.setItem(uKey, JSON.stringify(parsed));
        return parsed;
      }
    }
    return DEFAULT_CUSTOMERS;
  } catch (e) {
    return DEFAULT_CUSTOMERS;
  }
};

export const saveCustomersData = (customers) => {
  try {
    const activeUid = getActiveUserId();
    if (activeUid) {
      localStorage.setItem(`khatta_user_${activeUid}_customers`, JSON.stringify(customers));
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
      createSafetyVaultSnapshot();
    }
  } catch (e) {
    console.error('Failed to save customers data', e);
  }
};

export const loadSuppliersData = () => {
  try {
    const activeUid = getActiveUserId();
    if (!activeUid) {
      return []; // WITHOUT LOGIN, NO SUPPLIER DATA SHOWN
    }
    const uKey = `khatta_user_${activeUid}_suppliers`;
    const uData = localStorage.getItem(uKey);
    if (uData) {
      const parsed = JSON.parse(uData);
      if (Array.isArray(parsed)) return parsed;
    }
    const data = localStorage.getItem(STORAGE_KEY_SUPPLIERS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        localStorage.setItem(uKey, JSON.stringify(parsed));
        return parsed;
      }
    }
    return DEFAULT_SUPPLIERS;
  } catch (e) {
    return DEFAULT_SUPPLIERS;
  }
};

export const saveSuppliersData = (suppliers) => {
  try {
    const activeUid = getActiveUserId();
    if (activeUid) {
      localStorage.setItem(`khatta_user_${activeUid}_suppliers`, JSON.stringify(suppliers));
      localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(suppliers));
      createSafetyVaultSnapshot();
    }
  } catch (e) {
    console.error('Failed to save suppliers data', e);
  }
};


// Format Date and Time for receipts, transaction lists, and WhatsApp messages
export const formatDateTime = (isoString, lang = 'roman') => {
  if (!isoString) {
    return { date: '', time: '', full: '' };
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: '', time: '', full: '' };

    const dateStr = d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }); // e.g. 22 Oct 2026

    const timeStr = d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }); // e.g. 08:15 PM

    return {
      date: dateStr,
      time: timeStr,
      full: `${dateStr} • ${timeStr}`
    };
  } catch (e) {
    return { date: '', time: '', full: '' };
  }
};

// Factory to create transaction with date and time guarantees
export const buildTransaction = ({ type, amount, details = '', customDate = null }) => {
  const now = customDate ? new Date(customDate) : new Date();
  const iso = now.toISOString();
  const dt = formatDateTime(iso);

  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: type || 'gave',
    amount: Number(amount) || 0,
    details: details.trim(),
    date: iso,
    dateFormatted: dt.date,
    timeFormatted: dt.time
  };
};

