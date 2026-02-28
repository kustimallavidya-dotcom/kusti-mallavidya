// service-worker.js

const CACHE_NAME = 'kusti-mallavidya-v5';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined',
    'https://cdn.tailwindcss.com'
];

self.addEventListener('install', event => {
    // Skip waiting to activate immediately
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[ServiceWorker] Pre-caching offline assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', event => {
    // Claim control of open clients immediately
    event.waitUntil(self.clients.claim());

    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== CACHE_NAME) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

self.addEventListener('fetch', event => {
    // Ignore non-GET requests and cross-origin video chunk requests if not cached
    if (event.request.method !== 'GET') return;

    // For video metadata (video.json), we *always* want the fresh state from the network.
    // So we use a "Network First" strategy here.
    if (event.request.url.includes('video.json')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // For other assets (HTML, CSS, JS), use a "Cache First" falling back to network strategy
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            // Fetch from network if not in cache
            return fetch(event.request).then(networkResponse => {
                // Don't cache third-party youtube iframes, adsense, or extensions
                if (event.request.url.startsWith('https://www.youtube.com/') ||
                    event.request.url.includes('google')) {
                    return networkResponse;
                }

                return caches.open(CACHE_NAME).then(cache => {
                    // Only cache valid OK responses
                    if (networkResponse.status === 200 && networkResponse.type === 'basic') {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                });
            }).catch(() => {
                // If network fails and request is for a navigation (html page)
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
