// Khatta App Auto-Updater
// Automatically checks for new versions, updates service worker, and reloads without losing data

export const initAutoUpdater = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Prevent multiple reload loops
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Only reload to apply updates if device is currently online
    if (!refreshing && navigator.onLine) {
      refreshing = true;
      // Seamlessly reload to apply the new update
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    // Only register in non-localhost or if explicitly enabled
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // In production or PWA standalone / Play Store webview:
    if (!isLocalhost || window.matchMedia('(display-mode: standalone)').matches) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Check for update periodically every 15 minutes
          setInterval(() => {
            registration.update().catch(() => {});
          }, 15 * 60 * 1000);

          // Check for update when app becomes active or device comes back online
          window.addEventListener('focus', () => {
            registration.update().catch(() => {});
          });
          window.addEventListener('online', () => {
            registration.update().catch(() => {});
          });

          // If a new worker is found waiting, tell it to activate immediately
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update ready! Tell it to take over
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
    }
  });
};
