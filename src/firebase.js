// Firebase SDK Integration for Khatta App
// Connected to Firebase Project: khatta-app-907f8
// Supports Authentication, Realtime Database, Cloud Firestore, and Offline Fallbacks

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  getDatabase,
  ref as rtdbRef,
  set as rtdbSet,
  get as rtdbGet,
  onValue as rtdbOnValue
} from 'firebase/database';

const STORAGE_KEY_FIREBASE_CONFIG = 'khatta_firebase_config_v1';

// Default configuration from user's Firebase Project (khatta-app-907f8)
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCjK4lTNKksEMQKoOPbsvjLhrS4mPnEIEM",
  authDomain: "khatta-app-907f8.firebaseapp.com",
  databaseURL: "https://khatta-app-907f8-default-rtdb.firebaseio.com",
  projectId: "khatta-app-907f8",
  storageBucket: "khatta-app-907f8.firebasestorage.app",
  messagingSenderId: "1042979345232",
  appId: "1:1042979345232:web:24e60978101f985c65d255",
  measurementId: "G-026SZNB6CQ"
};

export const getActiveFirebaseConfig = () => {
  try {
    const custom = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed reading stored firebase config:', e);
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || DEFAULT_FIREBASE_CONFIG.databaseURL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId
  };
};

export const saveCustomFirebaseConfig = (config) => {
  try {
    if (!config) {
      localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
    } else {
      localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
    }
    return true;
  } catch (e) {
    console.error('Error saving firebase config:', e);
    return false;
  }
};

let app = null;
let auth = null;
let db = null;
let rtdb = null;

export const initFirebase = () => {
  const config = getActiveFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return { app: null, auth: null, db: null, rtdb: null, isConfigured: false };
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    auth = getAuth(app);

    try {
      db = getFirestore(app);
    } catch (e) {
      console.warn('Firestore notice:', e);
    }

    try {
      rtdb = getDatabase(app);
    } catch (e) {
      console.warn('Realtime Database notice:', e);
    }

    return { app, auth, db, rtdb, isConfigured: true };
  } catch (error) {
    console.warn('Firebase initialization error:', error.message);
    return { app: null, auth: null, db: null, rtdb: null, isConfigured: false, error: error.message };
  }
};

// Initialize on module load
const initialized = initFirebase();
app = initialized.app;
auth = initialized.auth;
db = initialized.db;
rtdb = initialized.rtdb;

export const isFirebaseReady = () => {
  return Boolean(app && auth);
};

// Pakistani phone number (e.g. 03001234567) or username to Firebase email format
export const normalizeAuthEmail = (input = '') => {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  const cleanPhone = trimmed.replace(/[^0-9]/g, '');
  if (cleanPhone.length >= 7) {
    return `${cleanPhone}@khatta.app`;
  }
  return `${trimmed}@khatta.app`;
};

// Ensure password satisfies Firebase 6-character requirement (e.g. 4-digit PINs)
export const normalizeAuthPassword = (pwd = '') => {
  const str = String(pwd || '').trim();
  if (str.length > 0 && str.length < 6) {
    return `${str}__khatta`;
  }
  return str;
};

// 1. Sign Up (Naya Dukandar Account) - Fast, non-blocking, never hangs
export const firebaseSignUp = async (emailOrPhone, password, shopDetails = {}) => {
  const email = normalizeAuthEmail(emailOrPhone);
  const normalizedPwd = normalizeAuthPassword(password);

  if (!isFirebaseReady()) {
    const fakeUid = `local-user-${Date.now()}`;
    return {
      user: {
        uid: fakeUid,
        email: email,
        displayName: shopDetails.shopName || 'Dukandar',
        isLocal: true
      },
      isLocal: true
    };
  }

  let userCredential;
  try {
    userCredential = await createUserWithEmailAndPassword(auth, email, normalizedPwd);
  } catch (authErr) {
    // Agar account pehle se bana hua hai (e.g. pichli baar click kia tha aur button ghoom raha tha):
    if (authErr?.code === 'auth/email-already-in-use' || authErr?.message?.includes('email-already-in-use')) {
      try {
        // Auto sign-in immediately so user is logged in directly without having to switch tabs!
        userCredential = await signInWithEmailAndPassword(auth, email, normalizedPwd);
      } catch (loginErr) {
        throw authErr;
      }
    } else {
      throw authErr;
    }
  }

  const user = userCredential.user;

  // Update profile in background (non-blocking)
  if (shopDetails.shopName || shopDetails.ownerName) {
    updateProfile(user, {
      displayName: shopDetails.shopName || shopDetails.ownerName
    }).catch((e) => console.warn('Profile name notice:', e));
  }

  // Initial cloud document save - background non-blocking so button NEVER spins forever
  const initialPayload = {
    profile: {
      shopName: shopDetails.shopName || '',
      ownerName: shopDetails.ownerName || '',
      phone: shopDetails.phone || emailOrPhone,
      email: email,
      createdAt: new Date().toISOString()
    },
    customers: shopDetails.customers || [],
    suppliers: shopDetails.suppliers || []
  };

  // Run in background without awaiting
  saveToCloud(user.uid, initialPayload).catch((e) => {
    console.warn('Initial cloud sync background notice:', e);
  });

  return { user, isLocal: false };
};

// Normalize phone digits to last 10 digits for foolproof cross-format matching
export const normalizePhoneDigits = (phone = '') => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
};

// 2. Log In (Purana Account) - with smart RTDB PIN fallback
export const firebaseLogIn = async (emailOrPhone, password) => {
  const email = normalizeAuthEmail(emailOrPhone);
  const normalizedPwd = normalizeAuthPassword(password);
  const cleanPin = String(password || '').trim();
  const normPhone = normalizePhoneDigits(emailOrPhone || '');

  if (!isFirebaseReady()) {
    const fakeUid = `local-user-${email.split('@')[0]}`;
    return {
      user: { uid: fakeUid, email, displayName: 'Dukandar', isLocal: true },
      isLocal: true,
      cloudData: null
    };
  }

  // 1. Try standard Firebase Auth first
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, normalizedPwd);
    let cloudData = null;
    if (rtdb) {
      try {
        const snap = await rtdbGet(rtdbRef(rtdb, `users/${userCredential.user.uid}`));
        if (snap && snap.exists()) cloudData = snap.val();
      } catch (e) {}
    }
    return { user: userCredential.user, isLocal: false, cloudData };
  } catch (authErr) {
    console.warn('Standard Firebase Auth login notice:', authErr?.message);

    // 2. Smart Fallback: Check if PIN matches what the user saved in Cloud Database (RTDB)
    if (rtdb && cleanPin && normPhone) {
      try {
        // Fast Check A: check phone_pins index
        const pinSnap = await rtdbGet(rtdbRef(rtdb, `phone_pins/${normPhone}`));
        if (pinSnap && pinSnap.exists()) {
          const pinData = pinSnap.val();
          if (String(pinData?.pin || '').trim() === cleanPin && pinData?.uid) {
            console.log('PIN verified from phone_pins index for uid:', pinData.uid);
            let cloudUser = null;
            try {
              const uSnap = await rtdbGet(rtdbRef(rtdb, `users/${pinData.uid}`));
              if (uSnap && uSnap.exists()) cloudUser = uSnap.val();
            } catch (e) {}
            return {
              user: {
                uid: pinData.uid,
                email,
                displayName: cloudUser?.profile?.shopName || 'Dukandar',
                isLocal: false
              },
              isLocal: false,
              cloudData: cloudUser
            };
          }
        }

        // Full Check B: scan all users in RTDB
        const snap = await rtdbGet(rtdbRef(rtdb, 'users'));
        if (snap && snap.exists()) {
          const allUsers = snap.val();
          for (const [uid, u] of Object.entries(allUsers)) {
            const uNorm = normalizePhoneDigits(u?.profile?.phone || '');
            const uPin = String(u?.profile?.pin || '').trim();

            if (normPhone === uNorm && uPin === cleanPin) {
              console.log('PIN verified successfully from RTDB cloud profile for uid:', uid);
              // Also update phone_pins index for even faster subsequent logins
              try {
                await rtdbSet(rtdbRef(rtdb, `phone_pins/${normPhone}`), {
                  pin: cleanPin,
                  uid,
                  updatedAt: new Date().toISOString()
                });
              } catch (e) {}

              return {
                user: {
                  uid,
                  email,
                  displayName: u?.profile?.shopName || u?.profile?.ownerName || 'Dukandar',
                  isLocal: false
                },
                isLocal: false,
                cloudData: u
              };
            }
          }
        }
      } catch (rtdbErr) {
        console.warn('RTDB login check error:', rtdbErr?.message);
      }
    }

    // Re-throw if not matched
    throw authErr;
  }
};

// 2b. Update Firebase Auth Password (keeps auth in sync with shop PIN changes)
export const firebaseUpdateAuthPassword = async (newPin) => {
  if (!newPin || !auth || !auth.currentUser) return false;
  try {
    const normalizedPwd = normalizeAuthPassword(newPin);
    await updatePassword(auth.currentUser, normalizedPwd);
    console.log('Firebase Auth password updated successfully to match new PIN');
    return true;
  } catch (err) {
    console.warn('Firebase updatePassword warning:', err?.message || err);
    return false;
  }
};

// 2c. Reset PIN on Cloud & Authenticate immediately
export const resetPinAndAuthenticate = async (phoneOrEmail, newPin, currentShop = {}) => {
  const cleanPin = String(newPin || '').trim();
  const normPhone = normalizePhoneDigits(phoneOrEmail || currentShop?.phone || '');
  const email = normalizeAuthEmail(phoneOrEmail || currentShop?.phone || 'user');
  const normalizedPwd = normalizeAuthPassword(cleanPin);

  let matchedUid = null;
  let cloudUserData = null;

  // 1. Search RTDB for user's existing account(s) matching phone
  if (rtdb && normPhone) {
    try {
      const snap = await rtdbGet(rtdbRef(rtdb, 'users'));
      if (snap && snap.exists()) {
        const allUsers = snap.val();
        for (const [uid, u] of Object.entries(allUsers)) {
          const uNorm = normalizePhoneDigits(u?.profile?.phone || '');
          if (normPhone === uNorm) {
            matchedUid = matchedUid || uid;
            cloudUserData = cloudUserData || u;
            // Update PIN on ALL matching account records for this phone
            try {
              await rtdbSet(rtdbRef(rtdb, `users/${uid}/profile/pin`), cleanPin);
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.warn('RTDB search notice:', e);
    }
  }

  const finalUid = matchedUid || currentShop?.userId || `user-${normPhone || Date.now()}`;

  // 2. Update PIN in RTDB profile & phone index
  if (rtdb && finalUid) {
    try {
      await rtdbSet(rtdbRef(rtdb, `users/${finalUid}/profile/pin`), cleanPin);
      if (phoneOrEmail) {
        await rtdbSet(rtdbRef(rtdb, `users/${finalUid}/profile/phone`), phoneOrEmail);
      }
      if (normPhone) {
        await rtdbSet(rtdbRef(rtdb, `phone_pins/${normPhone}`), {
          pin: cleanPin,
          uid: finalUid,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('RTDB pin update notice:', e);
    }
  }

  // 3. Try to sync Firebase Auth password
  if (auth) {
    if (auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, normalizedPwd);
      } catch (e) {}
    }
  }

  // 4. Update Firestore as well
  if (db && finalUid) {
    try {
      await setDoc(doc(db, 'users', finalUid), {
        profile: { pin: cleanPin, phone: phoneOrEmail, updatedAt: new Date().toISOString() }
      }, { merge: true });
    } catch (e) {}
  }

  return {
    userId: finalUid,
    pin: cleanPin,
    user: { uid: finalUid, email },
    cloudData: cloudUserData
  };
};


// 3. Log Out
export const firebaseLogOut = async () => {
  if (auth && isFirebaseReady()) {
    await signOut(auth);
  }
};

// 4. Auth State Listener
export const subscribeToAuth = (callback) => {
  if (!isFirebaseReady() || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// 5. Cloud Sync - Save state to Cloud (RTDB and/or Firestore) with strict timeout
export const saveToCloud = async (userId, data = {}) => {
  if (!userId) return false;

  const payload = {
    ...data,
    lastSyncedAt: new Date().toISOString()
  };

  let saved = false;

  const withTimeout = (promise, ms = 2200) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Cloud sync timeout')), ms))
    ]);
  };

  // Try Realtime Database (Faster, works directly with databaseURL)
  if (rtdb) {
    try {
      await withTimeout(rtdbSet(rtdbRef(rtdb, 'users/' + userId), payload));
      saved = true;
    } catch (rtdbErr) {
      console.warn('RTDB sync notice:', rtdbErr.message);
    }
  }

  // Also try Firestore
  if (db) {
    try {
      await withTimeout(setDoc(doc(db, 'users', userId), payload, { merge: true }));
      saved = true;
    } catch (fsErr) {
      console.warn('Firestore sync notice:', fsErr.message);
    }
  }

  return saved;
};

// 6. Cloud Fetch - Fetch user ledger data on login with strict timeout
export const fetchFromCloud = async (userId) => {
  if (!userId) return null;

  const withTimeout = (promise, ms = 2500) => {
    return Promise.race([
      promise,
      new Promise((resolve) => setTimeout(() => resolve(null), ms))
    ]);
  };

  // Try RTDB first
  if (rtdb) {
    try {
      const snap = await withTimeout(rtdbGet(rtdbRef(rtdb, 'users/' + userId)));
      if (snap && typeof snap.exists === 'function' && snap.exists()) {
        return snap.val();
      }
    } catch (e) {
      console.warn('RTDB fetch notice:', e.message);
    }
  }

  // Fallback to Firestore
  if (db) {
    try {
      const snap = await withTimeout(getDoc(doc(db, 'users', userId)));
      if (snap && typeof snap.exists === 'function' && snap.exists()) {
        return snap.data();
      }
    } catch (e) {
      console.warn('Firestore fetch notice:', e.message);
    }
  }

  return null;
};

// 7. Realtime Cloud Listener - Listen for live updates across devices
export const listenToCloud = (userId, onData) => {
  if (!userId) return () => {};

  // Subscribe via RTDB if available
  if (rtdb) {
    try {
      const userRef = rtdbRef(rtdb, 'users/' + userId);
      const unsub = rtdbOnValue(userRef, (snap) => {
        if (snap.exists()) {
          onData(snap.val());
        }
      }, (err) => {
        console.warn('RTDB onValue notice:', err.message);
      });
      return unsub;
    } catch (e) {
      // Fallback below
    }
  }

  // Subscribe via Firestore
  if (db) {
    try {
      const userRef = doc(db, 'users', userId);
      return onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          onData(snap.data());
        }
      }, (err) => {
        console.warn('Firestore onSnapshot notice:', err.message);
      });
    } catch (e) {
      return () => {};
    }
  }

  return () => {};
};
