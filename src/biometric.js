// Biometric Authentication Module (WebAuthn / Fingerprint / Face Unlock)

const STORAGE_KEY_BIOMETRIC_ID = 'khatta_biometric_cred_id_v1';
const STORAGE_KEY_BIOMETRIC_ENABLED = 'khatta_biometric_enabled_v1';

/**
 * Checks whether the current device supports hardware biometric authentication
 * (e.g., Fingerprint sensor on Android, Touch ID / Face ID on iPhone/Mac, Windows Hello)
 */
export async function isBiometricAvailable() {
  try {
    if (!window.PublicKeyCredential) return false;
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
      return false;
    }
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return Boolean(available);
  } catch (e) {
    console.warn('Biometric check error:', e);
    return false;
  }
}

/**
 * Checks if the user has enabled biometric unlock in the app
 */
export function isBiometricEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY_BIOMETRIC_ENABLED) === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Enables or disables biometric unlock in app settings
 */
export function setBiometricEnabled(enabled) {
  try {
    if (enabled) {
      localStorage.setItem(STORAGE_KEY_BIOMETRIC_ENABLED, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY_BIOMETRIC_ENABLED);
      localStorage.removeItem(STORAGE_KEY_BIOMETRIC_ID);
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Registers biometric credentials on the user's phone / device
 */
export async function registerBiometric(userName = 'Dukandar') {
  if (!window.PublicKeyCredential) {
    throw new Error('Biometric not supported on this browser');
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const userId = new Uint8Array(16);
  window.crypto.getRandomValues(userId);

  const createOptions = {
    challenge,
    rp: {
      name: 'Khatta App Dukandar Ledger',
      id: window.location.hostname
    },
    user: {
      id: userId,
      name: userName || 'khatta_user',
      displayName: userName || 'Dukandar'
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },  // ES256
      { alg: -257, type: 'public-key' } // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Phone fingerprint or Face ID
      userVerification: 'preferred'
    },
    timeout: 60000
  };

  try {
    const credential = await navigator.credentials.create({ publicKey: createOptions });
    if (credential && credential.id) {
      localStorage.setItem(STORAGE_KEY_BIOMETRIC_ID, credential.id);
      localStorage.setItem(STORAGE_KEY_BIOMETRIC_ENABLED, 'true');
      return { success: true, credentialId: credential.id };
    }
    return { success: false, error: 'Registration failed' };
  } catch (err) {
    console.warn('Biometric registration notice:', err.message);
    throw err;
  }
}

/**
 * Authenticates with Fingerprint / Face ID to unlock the app
 */
export async function authenticateBiometric() {
  if (!window.PublicKeyCredential) {
    return { success: false, error: 'Not supported' };
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const savedCredId = localStorage.getItem(STORAGE_KEY_BIOMETRIC_ID);

  const getOptions = {
    challenge,
    timeout: 60000,
    userVerification: 'preferred',
    rpId: window.location.hostname
  };

  if (savedCredId) {
    try {
      // Decode base64 or string credId to raw buffer if needed
      const rawId = new TextEncoder().encode(savedCredId);
      getOptions.allowCredentials = [{
        id: rawId,
        type: 'public-key',
        transports: ['internal']
      }];
    } catch (e) {
      // If conversion fails, continue with default allowCredentials
    }
  }

  try {
    const assertion = await navigator.credentials.get({ publicKey: getOptions });
    if (assertion) {
      return { success: true };
    }
    return { success: false, error: 'Biometric verification failed' };
  } catch (err) {
    // If user cancelled or failed, return clean error
    return { success: false, error: err.name || err.message };
  }
}
