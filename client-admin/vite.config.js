import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const rootDir = dirname(fileURLToPath(import.meta.url));

const PRECACHE_EXT = /\.(?:js|css|html|ico|png|svg|webp|woff2|webmanifest)$/i;
const PRECACHE_SKIP = /^(?:sw\.js|registerSW\.js|workbox-.*\.js)$/;

/**
 * En este monorepo el disco del proyecto está montado como NTFS (fuseblk).
 * `glob`/`workbox-build` fallan ahí (directorios con nlink=1) y dejan el precache vacío.
 * Recorremos `dist/` con `readdirSync` y extendemos el manifiesto vía la API del plugin.
 */
const collectPrecacheEntries = (dir, base = dir) => {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      entries.push(...collectPrecacheEntries(full, base));
      continue;
    }
    const url = relative(base, full).split('\\').join('/');
    if (PRECACHE_SKIP.test(url) || !PRECACHE_EXT.test(url)) continue;
    entries.push({
      url,
      revision: createHash('md5').update(readFileSync(full)).digest('hex'),
    });
  }
  return entries;
};

const pwaPlugins = VitePWA({
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'sw.js',
  registerType: 'autoUpdate',
  injectRegister: 'auto',
  includeAssets: [
    'favicon-32x32.png',
    'apple-touch-icon.png',
    'pwa-192x192.png',
    'pwa-512x512.png',
    'pwa-512x512-maskable.png',
  ],
  manifest: {
    name: 'Kinal Sports Admin',
    short_name: 'KS Admin',
    description: 'Panel de administración de Kinal Sports',
    theme_color: '#08316d',
    background_color: '#f4f6fa',
    display: 'standalone',
    orientation: 'any',
    start_url: '/',
    scope: '/',
    lang: 'es',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  injectManifest: {
    // Desactiva el glob de Workbox (roto en NTFS/fuseblk)
    globPatterns: [],
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  },
  // El SW se genera en closeBundle 'post'; nosotros extendemos el manifiesto en 'pre'
  integration: {
    closeBundleOrder: 'post',
  },
  devOptions: {
    enabled: false,
  },
});

const fillPwaManifestFromFs = {
  name: 'fill-pwa-manifest-from-fs',
  apply: 'build',
  enforce: 'post',
  closeBundle: {
    sequential: true,
    order: 'pre',
    handler() {
      const api = pwaPlugins.find((plugin) => plugin.name === 'vite-plugin-pwa')?.api;
      if (!api?.extendManifestEntries) return;

      const fromFs = collectPrecacheEntries(resolve(rootDir, 'dist'));
      api.extendManifestEntries((entries) => {
        const existing = new Set(
          (entries ?? []).map((entry) => (typeof entry === 'string' ? entry : entry.url))
        );
        const merged = [...(entries ?? []), ...fromFs.filter((entry) => !existing.has(entry.url))];
        console.log(`\nPWA precache (readdirSync): ${merged.length} entradas\n`);
        return merged;
      });
    },
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), fillPwaManifestFromFs, ...pwaPlugins],
});
