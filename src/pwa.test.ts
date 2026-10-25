import { describe, expect, it } from 'vitest';
import { BASE, manifest } from '../pwa.config';

describe('PWA manifest', () => {
  it('lives under the GitHub Pages project path', () => {
    expect(BASE).toBe('/Simon/');
    expect(manifest.start_url).toBe(BASE);
    expect(manifest.scope).toBe(BASE);
    expect(manifest.id).toBe('/Simon/app');
  });

  it('is Hebrew, right-to-left and standalone', () => {
    expect(manifest.lang).toBe('he');
    expect(manifest.dir).toBe('rtl');
    expect(manifest.display).toBe('standalone');
    expect(manifest.name).toBe('Simon');
  });

  it('has install icons including a maskable one', () => {
    const icons = manifest.icons ?? [];
    expect(icons.some((i) => i.sizes === '192x192')).toBe(true);
    expect(icons.some((i) => i.sizes === '512x512' && !i.purpose)).toBe(true);
    expect(icons.some((i) => i.purpose === 'maskable')).toBe(true);
  });
});
