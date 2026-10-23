const CACHE = 'hanish-shell-v2';
const SHELL = ['icon-192.png', 'icon-512.png', 'manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

// امسح أي كاش قديم عشان النسخة الجديدة تشتغل فوراً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // الملفات الثابتة من الكاش
  if (SHELL.some((p) => url.pathname.endsWith(p))) {
    event.respondWith(caches.match(event.request).then((r) => r || fetch(event.request)));
    return;
  }

  // الصفحات والبيانات دايماً من السيرفر مباشرة، من غير أي كاش قديم
  const fresh = new Request(event.request, { cache: 'no-store' });
  event.respondWith(
    fetch(fresh).catch(() => new Response(
      '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"></head>' +
      '<body style="font-family:sans-serif;padding:2rem">أنت مش متصل بالإنترنت حالياً. حاول تاني لما الاتصال يرجع.</body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    ))
  );
});
