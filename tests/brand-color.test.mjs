import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import sharp from 'sharp';
const source = fs.readFileSync(new URL('../src/lib/brand-color.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
const moduleExports = {};
new Function('exports', compiled)(moduleExports);
const { brandTokens, contrastOnWhite, dominantLogoColor, validBrandColor, DEFAULT_BRAND_COLOR } = moduleExports;

test('only six-digit hex colors are accepted', () => {
  for (const value of [null, undefined, '', '#abc', 'red', '#abcdef; color:red', '#GGGGGG']) assert.equal(validBrandColor(value), false);
  assert.equal(validBrandColor('#C62828'), true);
});

test('all colors have readable white text and readable links on white and soft backgrounds', () => {
  for (let r = 0; r <= 255; r += 17) for (let g = 0; g <= 255; g += 17) for (let b = 0; b <= 255; b += 17) {
    const input = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    const tokens = brandTokens(input);
    const contrast = contrastOnWhite(tokens['--accent']);
    assert.ok(contrast >= 5, input);
    assert.ok(contrast / contrastOnWhite(tokens['--accent-soft']) >= 4.5, input);
    assert.ok(contrastOnWhite(tokens['--accent-hover']) >= contrast, input);
    assert.equal(tokens['--accent-foreground'], '#ffffff');
  }
});

test('invalid/missing brand has a deterministic neutral fallback', () => {
  assert.deepEqual(brandTokens(null), brandTokens(DEFAULT_BRAND_COLOR));
});

test('Motocenter manual red remains red', () => {
  assert.equal(brandTokens('#C62828')['--accent'], '#c62828');
});

test('yellow stays yellow-hued while becoming readable', () => {
  const color = brandTokens('#FFFF00')['--accent'];
  assert.equal(color.slice(1, 3), color.slice(3, 5));
  assert.equal(color.slice(5), '00');
});

test('transparent backgrounds and monochrome logos do not choose a brand hue', () => {
  assert.equal(dominantLogoColor(Uint8Array.from([255, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 255, 120, 120, 120, 255])), null);
});

test('dominant cluster wins, ignoring a white background', () => {
  const pixels = [...Array(100).fill([255, 255, 255, 255]), ...Array(20).fill([200, 25, 25, 255]), ...Array(10).fill([0, 0, 230, 255])].flat();
  assert.equal(dominantLogoColor(Uint8Array.from(pixels)), '#c81919');
});

test('separate clients do not share mutable theme state', () => {
  const red = brandTokens('#C62828');
  brandTokens('#0000FF');
  assert.equal(red['--accent'], '#c62828');
});

test('server extraction, URL isolation, manual precedence and failure fallback', async () => {
  const serverSource = fs.readFileSync(new URL('../src/lib/brand-color-server.ts', import.meta.url), 'utf8');
  const serverCompiled = ts.transpileModule(serverSource, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, esModuleInterop: true,
  } }).outputText;
  const serverExports = {};
  new Function('exports', 'require', serverCompiled)(serverExports, (name) => {
    if (name === 'server-only') return {};
    if (name === 'sharp') return sharp;
    if (name === 'next/cache') return { unstable_cache: (fn) => fn };
    if (name === './brand-color') return moduleExports;
    throw new Error(`Unexpected import: ${name}`);
  });
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const png = await sharp({ create: { width: 20, height: 20, channels: 4, background: '#C62828' } }).png().toBuffer();
  let calls = 0;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://brand-test.supabase.co';
  globalThis.fetch = async (_url, options) => {
    calls++;
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal);
    return new Response(png, { headers: { 'content-type': 'image/png' } });
  };
  try {
    const get = serverExports.getClientBrandTokens;
    const client = { id: 'test-client', logo_url: 'https://brand-test.supabase.co/storage/v1/object/public/client-logos/test-client/logo?v=1' };
    assert.deepEqual(await get(client), brandTokens('#C62828'));
    assert.equal(calls, 1);
    assert.deepEqual(await get({ ...client, brand_color: '#0000ff' }), brandTokens('#0000ff'));
    assert.equal(calls, 1, 'manual mode must not fetch');
    for (const logo_url of ['http://127.0.0.1/logo', 'https://evil.example/logo', client.logo_url.replace('test-client/logo', 'other-client/logo')]) {
      assert.deepEqual(await get({ ...client, logo_url }), brandTokens(null));
    }
    assert.equal(calls, 1, 'foreign origins and client paths must not be fetched');
    globalThis.fetch = async () => { throw new Error('Storage unavailable'); };
    assert.deepEqual(await get(client), brandTokens(null));
    globalThis.fetch = async () => new Response('not an image');
    assert.deepEqual(await get(client), brandTokens(null));
    globalThis.fetch = async () => new Response('large', { headers: { 'content-length': '6000000' } });
    assert.deepEqual(await get(client), brandTokens(null));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  }
});
