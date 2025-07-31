/**
 * Service Worker for AQI Monitor PWA
 * Provides offline functionality, caching, and background sync
 */

/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'aqi-monitor-v1.1.0';
const STATIC_CACHE_NAME = 'aqi-monitor-static-v1.1.0';
const DYNAMIC_CACHE_NAME = 'aqi-monitor-dynamic-v1.1.0';

// Assets to cache immediately on install - optimized for performance
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  // Critical pages only - others load lazily
  '/dashboard',
  '/login',
  // Offline page
  '/offline'
];

// API endpoints to cache with network-first strategy - optimized patterns
const API_CACHE_PATTERNS = [
  /\/api\/aqi\/current/,
  /\/api\/forecast\/\w+/,
  /\/api\/alerts\/active/,
  /\/api\/history\/\w+/
];

// External resources to cache
const EXTERNAL_RESOURCES = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://cdnjs.cloudflare.com'
];

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE_NAME && 
                     cacheName !== DYNAMIC_CACHE_NAME &&
                     cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Take control of all pages
      self.clients.claim()
    ])
  );
});

/**
 * Fetch Event - Handle different caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isExternalResource(request)) {
    event.respondWith(handleExternalResource(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

/**
 * Handle static assets - Cache first strategy
 */
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Static asset fetch failed:', error);
    return new Response('Asset not available', { status: 404 });
  }
}

/**
 * Handle API requests - Network first with cache fallback
 */
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request.clone());
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API calls
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'No network connection available',
      cached: false,
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle external resources - Cache first with network fallback
 */
async function handleExternalResource(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request, {
      mode: 'cors',
      credentials: 'omit'
    });

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] External resource failed:', error);
    return new Response('Resource not available', { status: 404 });
  }
}

/**
 * Handle navigation requests - Network first with offline fallback
 */
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Navigation failed, serving offline page');
    
    // Try to serve cached page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Serve offline page
    const offlinePage = await caches.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Last resort - basic offline response
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AQI Monitor - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   text-align: center; padding: 50px; background: #f8fafc; }
            .offline-message { max-width: 400px; margin: 0 auto; }
            h1 { color: #1f2937; }
            p { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>🌬️ AQI Monitor</h1>
            <h2>You're offline</h2>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

/**
 * Handle generic requests - Network with cache fallback
 */
async function handleGenericRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Resource not available offline', { status: 404 });
  }
}

/**
 * Background Sync - Handle offline actions when back online
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-aqi') {
    event.waitUntil(syncAQIData());
  } else if (event.tag === 'background-sync-alerts') {
    event.waitUntil(syncAlertSettings());
  }
});

/**
 * Push Event - Handle push notifications
 */
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New air quality alert available',
    icon: '/logo192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: '/favicon.ico'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('AQI Monitor Alert', options)
  );
});

/**
 * Notification Click - Handle notification interactions
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

/**
 * Message Event - Handle messages from the app
 */
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  } else if (event.data && event.data.type === 'CACHE_AQI_DATA') {
    cacheAQIData(event.data.payload);
  }
});

// Helper functions
function isStaticAsset(request) {
  return request.url.includes('/static/') || 
         request.url.includes('.css') ||
         request.url.includes('.js') ||
         request.url.includes('.png') ||
         request.url.includes('.jpg') ||
         request.url.includes('.ico') ||
         request.url.includes('/manifest.json');
}

function isAPIRequest(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url)) ||
         request.url.includes('/api/');
}

function isExternalResource(request) {
  const url = new URL(request.url);
  return EXTERNAL_RESOURCES.some(domain => url.origin.includes(domain));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

async function syncAQIData() {
  try {
    console.log('[ServiceWorker] Syncing AQI data...');
    // Implement background sync logic here
    const response = await fetch('/api/aqi/current');
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put('/api/aqi/current', response.clone());
    }
  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error);
  }
}

async function syncAlertSettings() {
  try {
    console.log('[ServiceWorker] Syncing alert settings...');
    // Implement alert settings sync logic here
  } catch (error) {
    console.error('[ServiceWorker] Alert settings sync failed:', error);
  }
}

async function cacheAQIData(data) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const response = new Response(JSON.stringify(data));
    await cache.put(`/api/aqi/cached-${Date.now()}`, response);
  } catch (error) {
    console.error('[ServiceWorker] Failed to cache AQI data:', error);
  }
}

console.log('[ServiceWorker] Service Worker script loaded');
