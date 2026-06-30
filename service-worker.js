const CACHE_NAME = 'coding-sticker-v7';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/sound.js',
  './js/puzzle.js',
  './js/sticker.js',
  './js/child.js',
  './js/parent.js',
  './js/firebase.js',
  './missions/fox.json',
  './missions/rabbit.json',
  './icons/icon.svg',
  './icons/icon-maskable.svg',
  './icons/fox.svg',
  './icons/rabbit.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Google Fonts & CDN은 네트워크 우선
  if (url.hostname.includes('fonts.') || url.hostname.includes('jsdelivr')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // 로컬 파일은 캐시 우선
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        