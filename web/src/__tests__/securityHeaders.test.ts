/**
 * The CSP allows exactly one inline script — the pre-paint theme script in
 * index.html — by hash. Editing that script without updating vercel.json
 * would silently break theming in production, so the two are checked here.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const vercel = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8')) as {
  headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};

const csp =
  vercel.headers
    .find((rule) => rule.source === '/(.*)')
    ?.headers.find((header) => header.key === 'Content-Security-Policy')?.value ?? '';

function directive(name: string): string[] {
  const part = csp.split(';').map((p) => p.trim()).find((p) => p.startsWith(`${name} `));
  return part ? part.split(/\s+/).slice(1) : [];
}

describe('Content-Security-Policy', () => {
  it('allows the inline theme script by its exact hash', () => {
    const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    expect(inline).toHaveLength(1);
    const hash = createHash('sha256').update(inline[0]).digest('base64');
    expect(directive('script-src')).toContain(`'sha256-${hash}'`);
  });

  it('never allows arbitrary inline or eval’d script', () => {
    expect(directive('script-src')).not.toContain("'unsafe-inline'");
    expect(directive('script-src')).not.toContain("'unsafe-eval'");
  });

  it('can reach every service the app calls', () => {
    const connect = directive('connect-src');
    for (const origin of [
      'https://data.gov.il',
      'https://en.wikipedia.org',
      'https://he.wikipedia.org',
      'https://cdn.jsdelivr.net', // OCR engine and language data
    ]) {
      expect(connect).toContain(origin);
    }
    // Wikipedia serves thumbnails from both hosts.
    expect(directive('img-src')).toContain('https://upload.wikimedia.org');
    expect(directive('img-src')).toContain('https://thumb.wikimedia.org');
  });

  it('forbids framing', () => {
    expect(directive('frame-ancestors')).toEqual(["'none'"]);
  });
});
