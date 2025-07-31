/**
 * Service Worker Registration and Management
 * Handles PWA installation, updates, and service worker lifecycle
 */

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

/**
 * Register the service worker
 */
export function registerSW() {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    
    if (publicUrl.origin !== window.location.origin) {
      console.log('Service worker not registered: different origins');
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl);
        console.log('Running in localhost - Service Worker registered for development');
      } else {
        registerValidSW(swUrl);
      }
    });
  } else {
    console.log('Service workers not supported in this browser');
  }
}

/**
 * Register a valid service worker
 */
function registerValidSW(swUrl) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('✅ Service Worker registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content available, show update notification
                showUpdateAvailableNotification(registration);
                console.log('🔄 New content available - refresh to update');
              } else {
                console.log('✨ Content cached for offline use');
                showOfflineReadyNotification();
              }
            }
          });
        }
      });
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        handleServiceWorkerMessage(event);
      });
      
    })
    .catch((error) => {
      console.error('❌ Service Worker registration failed:', error);
    });
}

/**
 * Check if service worker exists and is valid
 */
function checkValidServiceWorker(swUrl) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' }
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl);
      }
    })
    .catch(() => {
      console.log('No internet connection - running in offline mode');
    });
}

/**
 * Unregister service worker
 */
export function unregisterSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('Service Worker unregistered');
      })
      .catch((error) => {
        console.error('Service Worker unregistration failed:', error);
      });
  }
}

/**
 * Show update available notification
 */
function showUpdateAvailableNotification(registration) {
  // Create custom update notification
  const updateNotification = document.createElement('div');
  updateNotification.id = 'pwa-update-notification';
  updateNotification.className = 'fixed top-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm';
  updateNotification.innerHTML = `
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0">
        <svg class="w-5 h-5 text-blue-100" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
      </div>
      <div class="flex-1">
        <h4 class="text-sm font-medium">Update Available</h4>
        <p class="text-sm text-blue-100 mt-1">A new version of AQI Monitor is ready to install.</p>
        <div class="mt-3 flex space-x-2">
          <button id="update-app-btn" class="bg-blue-500 hover:bg-blue-400 text-white px-3 py-1 rounded text-xs font-medium transition-colors">
            Update Now
          </button>
          <button id="dismiss-update-btn" class="bg-transparent hover:bg-blue-500 text-blue-100 px-3 py-1 rounded text-xs font-medium transition-colors border border-blue-400">
            Later
          </button>
        </div>
      </div>
      <button id="close-update-btn" class="flex-shrink-0 text-blue-100 hover:text-white transition-colors">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(updateNotification);

  // Handle update button
  document.getElementById('update-app-btn').addEventListener('click', () => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  });

  // Handle dismiss and close buttons
  const dismissButtons = ['dismiss-update-btn', 'close-update-btn'];
  dismissButtons.forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      updateNotification.remove();
    });
  });

  // Auto-dismiss after 30 seconds
  setTimeout(() => {
    if (document.getElementById('pwa-update-notification')) {
      updateNotification.remove();
    }
  }, 30000);
}

/**
 * Show offline ready notification
 */
function showOfflineReadyNotification() {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 z-50 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm';
  notification.innerHTML = `
    <div class="flex items-center space-x-3">
      <svg class="w-5 h-5 text-green-100" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>
      <div>
        <h4 class="text-sm font-medium">Ready for Offline Use</h4>
        <p class="text-sm text-green-100">AQI Monitor is now available offline!</p>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

/**
 * Handle messages from service worker
 */
function handleServiceWorkerMessage(event) {
  const { data } = event;
  
  if (data && data.type === 'SW_UPDATE_READY') {
    showUpdateAvailableNotification();
  } else if (data && data.type === 'SW_OFFLINE_READY') {
    showOfflineReadyNotification();
  }
  
  console.log('Message from service worker:', data);
}

/**
 * Check for service worker updates manually
 */
export function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }
}

/**
 * Send message to service worker
 */
export function sendMessageToSW(message) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

/**
 * Get service worker version
 */
export function getSWVersion() {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version);
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );
    } else {
      resolve(null);
    }
  });
}

/**
 * Cache AQI data for offline use
 */
export function cacheAQIData(data) {
  sendMessageToSW({
    type: 'CACHE_AQI_DATA',
    payload: data
  });
}

/**
 * PWA Install Prompt Management
 */
let deferredPrompt = null;

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (event) => {
  console.log('💾 PWA install prompt available');
  
  // Prevent the default mini-infobar from appearing
  event.preventDefault();
  
  // Store the event for later use
  deferredPrompt = event;
  
  // Show custom install button
  showInstallPrompt();
});

/**
 * Show custom install prompt
 */
function showInstallPrompt() {
  const installPrompt = document.createElement('div');
  installPrompt.id = 'pwa-install-prompt';
  installPrompt.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4';
  installPrompt.innerHTML = `
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0">
        <img src="/logo192.png" alt="AQI Monitor" class="w-8 h-8 rounded">
      </div>
      <div class="flex-1">
        <h4 class="text-sm font-medium text-gray-900">Install AQI Monitor</h4>
        <p class="text-sm text-gray-600 mt-1">Get faster access and offline support.</p>
        <div class="mt-3 flex space-x-2">
          <button id="install-pwa-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors">
            Install
          </button>
          <button id="dismiss-install-btn" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-medium transition-colors">
            Not Now
          </button>
        </div>
      </div>
      <button id="close-install-btn" class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(installPrompt);

  // Handle install button
  document.getElementById('install-pwa-btn').addEventListener('click', installPWA);

  // Handle dismiss and close buttons
  const dismissButtons = ['dismiss-install-btn', 'close-install-btn'];
  dismissButtons.forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      installPrompt.remove();
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    });
  });
}

/**
 * Install PWA
 */
export function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ PWA installation accepted');
      } else {
        console.log('❌ PWA installation dismissed');
      }
      
      deferredPrompt = null;
      
      // Remove install prompt
      const installPrompt = document.getElementById('pwa-install-prompt');
      if (installPrompt) {
        installPrompt.remove();
      }
    });
  }
}

/**
 * Check if app is installed as PWA
 */
export function isPWAInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

/**
 * Get PWA display mode
 */
export function getPWADisplayMode() {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  } else if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  } else {
    return 'browser';
  }
}

// Listen for app installation
window.addEventListener('appinstalled', (event) => {
  console.log('✅ PWA installed successfully');
  
  // Hide install prompt if still showing
  const installPrompt = document.getElementById('pwa-install-prompt');
  if (installPrompt) {
    installPrompt.remove();
  }
  
  // Show installation success message
  const successNotification = document.createElement('div');
  successNotification.className = 'fixed top-4 right-4 z-50 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm';
  successNotification.innerHTML = `
    <div class="flex items-center space-x-3">
      <svg class="w-5 h-5 text-green-100" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>
      <div>
        <h4 class="text-sm font-medium">App Installed!</h4>
        <p class="text-sm text-green-100">AQI Monitor is now on your home screen.</p>
      </div>
    </div>
  `;

  document.body.appendChild(successNotification);

  setTimeout(() => {
    successNotification.remove();
  }, 5000);
});

console.log('📱 PWA Service Worker registration module loaded');
