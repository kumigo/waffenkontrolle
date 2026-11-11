/* Prüfbogen Ortsbesichtigung – Offline-Zwischenspeicher.
   Speichert nur die Programmdateien. Eingaben, Fotos und Unterschriften liegen
   ausschließlich im Browser-Speicher des Geräts und werden nie übertragen. */
const CACHE = "pruefbogen-v4";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./apple-touch-icon.png", "./icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("pruefbogen-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // Netz zuerst (für Aktualisierungen), sonst offline aus dem Zwischenspeicher
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; }
      // Seite nicht erreichbar (z. B. GitHub Pages abgeschaltet): gespeicherte Fassung verwenden
      return caches.match(req, { ignoreSearch: true }).then(r => r || res);
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./index.html")))
  );
});
