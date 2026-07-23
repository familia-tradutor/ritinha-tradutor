self.addEventListener('install', e=>{
  e.waitUntil(caches.open('ritinha-v1.4').then(c=>c.addAll(['/','/manifest.webmanifest','/globo-passaporte.png'])))
})
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)))
})
