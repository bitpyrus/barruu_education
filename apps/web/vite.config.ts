import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Writes `offline-manifest.json`: every file the app needs to run with no network,
 * with its exact size and SHA-256, plus a build id. `public/sw.js` precaches it.
 * Runs in `writeBundle` (after files are on disk) so sizes and hashes match exactly
 * what is served. The whole app is small, so we precache all of it (ADR 0006).
 */
function offlineManifest(): Plugin {
  return {
    name: 'barruu-offline-manifest',
    apply: 'build',
    writeBundle(options, bundle) {
      const dir = options.dir ?? 'dist';
      const files = Object.keys(bundle)
        .filter((f) => !f.endsWith('.map') && f !== 'index.html')
        // Every browser with service workers supports WOFF2, so .woff/.ttf fallbacks are skipped.
        .filter((f) => !/\.(woff|ttf|eot)$/.test(f))
        .sort();
      // Unhashed public files the app uses (sw.js and this manifest are excluded on purpose).
      const publicFiles = fs.readdirSync(path.join(dir))
        .filter((f) => /\.(svg|png|ico|webmanifest)$/.test(f) && !files.includes(f));
      const list = [...files, ...publicFiles].map((f) => {
        const data = fs.readFileSync(path.join(dir, f));
        return { url: `/${f}`, bytes: data.byteLength, sha256: createHash('sha256').update(data).digest('hex') };
      });
      // The app shell is cached under '/', so hash index.html too: a new shell means a new build id.
      const shell = fs.readFileSync(path.join(dir, 'index.html'));
      const shellHash = createHash('sha256').update(shell).digest('hex');
      const buildId = createHash('sha256').update([shellHash, ...list.map((f) => f.sha256)].join()).digest('hex').slice(0, 12);
      fs.writeFileSync(path.join(dir, 'offline-manifest.json'), JSON.stringify({ buildId, shell: { url: '/', sha256: shellHash }, files: list }, null, 1));
    },
  };
}

// Workspace packages are consumed as TypeScript source via npm workspaces.
export default defineConfig({
  plugins: [react(), tailwindcss(), offlineManifest()],
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});
