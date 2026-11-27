/**
 * Barruu service worker — whole-app precache (docs/adr/0006-whole-app-precache.md).
 *
 * install:  fetch /offline-manifest.json, download the shell ('/') and every listed file,
 *           verify each against its size and SHA-256, and store them in one cache per build.
 *           If anything fails, that cache is deleted and installation fails, so a learner
 *           never ends up with half an app (the previous build keeps working).
 * activate: delete caches of older builds only (names starting with APP_PREFIX).
 * fetch:    same-origin GET only. Navigations are network-first and fall back to the
 *           cached shell (every route is a client-side route). Everything else is
 *           cache-first, then network.
 *
 * Cache lookups use `ignoreVary`: the server sends `Vary: Origin`, and the browser's own
 * script/style/font requests carry different headers from our install-time fetches.
 */
const APP_PREFIX = 'barruu-app-';
let currentCache = null;

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function fetchVerified(url, expected) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const body = await res.clone().arrayBuffer();
  if (expected.bytes !== undefined && body.byteLength !== expected.bytes) throw new Error(`${url}: size mismatch`);
  if (expected.sha256 && (await sha256Hex(body)) !== expected.sha256) throw new Error(`${url}: hash mismatch`);
  return res;
}

async function precache() {
  const manifest = await (await fetch('/offline-manifest.json', { cache: 'no-store' })).json();
  const name = APP_PREFIX + manifest.buildId;
  if (await caches.has(name)) return name;
  const staging = name + '-staging';
  await caches.delete(staging);
  const cache = await caches.open(staging);
  try {
    const entries = [manifest.shell, ...manifest.files];
    // A few downloads at a time keeps memory use low on small devices.
    for (let i = 0; i < entries.length; i += 6) {
      await Promise.all(entries.slice(i, i + 6).map(async (f) => cache.put(f.url, await fetchVerified(f.url, f))));
    }
    // Copy into the final cache only once everything verified (an atomic swap as far as fetch is concerned).
    const final = await caches.open(name);
    for (const req of await cache.keys()) await final.put(req, await cache.match(req));
  } finally {
    await caches.delete(staging);
  }
  return name;
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then((name) => { currentCache = name; return self.skipWaiting(); }));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const builds = keys.filter((k) => k.startsWith(APP_PREFIX) && !k.endsWith('-staging'));
    // Keep the newest complete build (the one just installed); remove the rest.
    const keep = currentCache ?? builds[builds.length - 1];
    await Promise.all(builds.filter((k) => k !== keep).map((k) => caches.delete(k)));
    currentCache = keep ?? null;
    await self.clients.claim();
  })());
});

async function appCache() {
  if (currentCache) return caches.open(currentCache);
  // The worker may have been restarted: find the build cache again.
  const keys = (await caches.keys()).filter((k) => k.startsWith(APP_PREFIX) && !k.endsWith('-staging'));
  if (!keys.length) return null;
  currentCache = keys[keys.length - 1];
  return caches.open(currentCache);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname === '/sw.js' || url.pathname === '/offline-manifest.json') return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        const cache = await appCache();
        const shell = cache && (await cache.match('/', { ignoreVary: true }));
        return shell || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await appCache();
    const hit = cache && (await cache.match(request, { ignoreVary: true, ignoreSearch: true }));
    return hit || fetch(request);
  })());
});
