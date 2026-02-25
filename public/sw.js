const CACHE_NAME = 'tecnobit-audio-cache-v2';
const MASTER_PLAYLIST_URLS = [
  '/Audios/01 Reflected (Original Mix).mp3',
  '/Audios/01 The Pressure (Extended Mix).mp3',
  '/Audios/23 Hallelujah (Original Mix).mp3',
  '/Audios/Anupam (Original Mix).mp3',
  '/Audios/Vociferous (Club Mix).mp3'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache, downloading Master Playlist...');
      return cache.addAll(MASTER_PLAYLIST_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/Audios/') && url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request, { ignoreSearch: true });
        
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          // If not in cache, fetch full content to ensure caching works (bypass Range header)
          const networkResponse = await fetch(event.request);
          
          // Check if valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Cache the response
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          console.error("Fetch failed for audio:", error);
          throw error;
        }
      })
    );
  }
});
