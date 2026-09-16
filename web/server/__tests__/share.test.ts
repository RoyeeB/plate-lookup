/**
 * Link previews: bot detection, meta injection, the registry lookup behind the
 * title, and the share image itself (rendered for real, fonts from /og).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import middleware, { isPreviewBot } from '../../middleware';
import { GET as renderShareImage } from '../../api/og';
import { injectMeta } from '../injectMeta';
import { fetchVehicleMeta, previewTitle } from '../vehicleMeta';
import { rtlTokens } from '../rtlTokens';

vi.mock('@vercel/functions', () => ({ next: () => new Response(null, { headers: { 'x-next': '1' } }) }));

const SHELL = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

/** A fake network: the registry, the SPA shell, and the /og fonts. */
function fakeFetch(record: Record<string, unknown> | null) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.hostname === 'data.gov.il') {
      return Response.json({ success: true, result: { records: record ? [record] : [] } });
    }
    if (url.pathname === '/index.html') return new Response(SHELL);
    if (url.pathname.startsWith('/og/')) {
      return new Response(readFileSync(new URL(`../../public${url.pathname}`, import.meta.url)));
    }
    return new Response('not found', { status: 404 });
  }) as unknown as typeof fetch;
}

const HYUNDAI = { tozeret_cd: 845, tozeret_nm: 'יונדאי טורקיה', kinuy_mishari: 'I10', shnat_yitzur: 2016 };

describe('isPreviewBot', () => {
  it('recognises preview crawlers and lets browsers through', () => {
    expect(isPreviewBot('WhatsApp/2.23.20.0')).toBe(true);
    expect(isPreviewBot('TelegramBot (like TwitterBot)')).toBe(true);
    expect(isPreviewBot('facebookexternalhit/1.1')).toBe(true);
    expect(isPreviewBot('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Safari/604.1')).toBe(false);
    expect(isPreviewBot(null)).toBe(false);
  });
});

describe('fetchVehicleMeta', () => {
  it('names the car with the clean brand', async () => {
    const meta = await fetchVehicleMeta('8491639', fakeFetch(HYUNDAI));
    expect(meta).toMatchObject({ name: 'יונדאי I10', year: '2016', formattedPlate: '84-916-39' });
    expect(previewTitle(meta)).toBe('יונדאי I10 2016 · 84-916-39');
  });

  it('falls back to a plate-only title when nothing is found', async () => {
    const meta = await fetchVehicleMeta('1234567', fakeFetch(null));
    expect(previewTitle(meta)).toBe('פרטי רכב 12-345-67');
  });

  it('never throws when the registry is down', async () => {
    const failing = vi.fn(async () => {
      throw new Error('down');
    }) as unknown as typeof fetch;
    await expect(fetchVehicleMeta('1234567', failing)).resolves.toMatchObject({ name: null });
  });
});

describe('injectMeta', () => {
  it('sets the title and one set of preview tags, escaped', () => {
    const html = injectMeta(SHELL, {
      title: 'A "quoted" <car>',
      description: 'd',
      url: 'https://x.test/vehicle/1',
      image: 'https://x.test/api/og?plate=1',
    });
    expect(html).toContain('<title>A &quot;quoted&quot; &lt;car&gt;</title>');
    expect(html.match(/property="og:title"/g)).toHaveLength(1);
    expect(html).toContain('content="https://x.test/api/og?plate=1"');
    // The CSP-hashed theme script must survive untouched.
    expect(html).toContain(SHELL.match(/<script>[\s\S]*?<\/script>/)![0]);
  });
});

describe('middleware', () => {
  it('passes people straight through without touching the registry', async () => {
    const fetchImpl = fakeFetch(HYUNDAI);
    const response = await middleware(
      new Request('https://x.test/vehicle/8491639', { headers: { 'user-agent': 'Mozilla/5.0 Chrome' } }),
      fetchImpl
    );
    expect(response.headers.get('x-next')).toBe('1');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('serves bots the shell with this vehicle’s preview tags', async () => {
    const response = await middleware(
      new Request('https://x.test/vehicle/8491639', { headers: { 'user-agent': 'WhatsApp/2.0' } }),
      fakeFetch(HYUNDAI)
    );
    const html = await response.text();
    expect(html).toContain('<title>יונדאי I10 2016 · 84-916-39</title>');
    expect(html).toContain('content="https://x.test/api/og?plate=8491639"');
  });

  it('ignores an invalid plate', async () => {
    const response = await middleware(
      new Request('https://x.test/vehicle/12', { headers: { 'user-agent': 'WhatsApp/2.0' } }),
      fakeFetch(HYUNDAI)
    );
    expect(response.headers.get('x-next')).toBe('1');
  });
});

describe('rtlTokens', () => {
  it('splits Hebrew into words and keeps Latin/number runs together', () => {
    expect(rtlTokens('יונדאי I10 2016')).toEqual(['יונדאי', 'I10 2016']);
    expect(rtlTokens('איתור לוחית · נתוני')).toEqual(['איתור', 'לוחית', '·', 'נתוני']);
    expect(rtlTokens('MG ZS EV')).toEqual(['MG ZS EV']);
  });
});

describe('share image', () => {
  it('renders a 1200×630 PNG', async () => {
    const response = await renderShareImage(new Request('https://x.test/api/og?plate=8491639'), fakeFetch(HYUNDAI));
    expect(response.headers.get('content-type')).toBe('image/png');
    const png = Buffer.from(await response.arrayBuffer());
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    if (process.env.OG_PREVIEW_OUT) writeFileSync(process.env.OG_PREVIEW_OUT, png);
  }, 30_000);

  it('rejects an invalid plate', async () => {
    const response = await renderShareImage(new Request('https://x.test/api/og?plate=abc'), fakeFetch(HYUNDAI));
    expect(response.status).toBe(400);
  });
});
