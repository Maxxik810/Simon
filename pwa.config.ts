import type { ManifestOptions } from 'vite-plugin-pwa';

// The site is served from https://<user>.github.io/Simon/ (see ADR-8).
// Vite's base, the manifest start_url and the scope all use this one value.
export const BASE = '/Simon/';

export const BACKGROUND = '#0A1628';

export const manifest: Partial<ManifestOptions> = {
  // Never change this id, or existing installs become a different app (ADR-9).
  id: `${BASE}app`,
  name: 'Simon',
  short_name: 'Simon',
  description: 'משחק זיכרון של צבעים וצלילים',
  lang: 'he',
  dir: 'rtl',
  start_url: BASE,
  scope: BASE,
  display: 'standalone',
  orientation: 'portrait',
  background_color: BACKGROUND,
  theme_color: BACKGROUND,
  icons: [
    { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
