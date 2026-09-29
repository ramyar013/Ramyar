/* Realm Academy service worker — offline shell, always-fresh pages */
const CACHE = 'ra-v36';
const SHELL = ['/', '/index.html', '/assets/style.css?v=22', '/assets/i18n.js?v=22', '/assets/core.js?v=22', '/assets/store.js?v=22', '/assets/vendor/supabase.js', '/assets/img/logo.svg', '/assets/img/icon-any-192.png', '/assets/img/icon-any-512.png', '/favicon.svg', '/manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;           // never touch API / Supabase calls
  if (url.pathname.startsWith('/admin')) return;
  if (req.mode === 'navigate') {                                                 // pages: network first, offline fallback
    e.respondWith(fetch(req).then(r => { if(url.pathname === '/' && r.ok){ const c = r.clone(); caches.open(CACHE).then(x => x.put('/', c)); } return r; }).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {                                   // assets: cache, refresh in background
    const net = fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/admin.html';
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
    for(const c of list){ if(c.url.includes('/admin')){ c.focus(); if('navigate' in c) c.navigate(url); return; } }
    return self.clients.openWindow(url);
  }));
});
