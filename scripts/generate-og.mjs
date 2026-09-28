/**
 * Generate static OG image (1200x630) for WhatsApp preview.
 * Uses Satori (JSX -> SVG) + resvg (SVG -> PNG) + sips (PNG -> JPEG).
 * Run: node scripts/generate-og.mjs
 * // ponytail: macOS-only (sips); swap for sharp if run elsewhere
 */
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { writeFile, unlink, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Fetch Google Fonts
async function fetchFont(family, weight) {
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`;
  const css = await fetch(url).then(r => r.text());
  const fontUrl = css.match(/src: url\((.+?)\)/)?.[1];
  if (!fontUrl) throw new Error(`Font URL not found for ${family}`);
  return fetch(fontUrl).then(r => r.arrayBuffer());
}

const [bangersData, nunitoData] = await Promise.all([
  fetchFont('Bangers', 400),
  fetchFont('Nunito', 700),
]);

const width = 1200;
const height = 630;

// Satori uses React-like JSX objects (no JSX transform needed)
const h = (type, props, ...children) => ({
  type,
  props: {
    ...props,
    children: children.length === 1 ? children[0] : children.length ? children : undefined,
  },
});

const svg = await satori(
  h('div', {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1a1a2e 50%, #0f172a 100%)',
      fontFamily: 'Nunito',
      position: 'relative',
      overflow: 'hidden',
    },
  },
    // Top gradient bar
    h('div', {
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '6px',
        background: 'linear-gradient(90deg, #3b82f6, #e23636, #22c55e, #ef4444, #fbbf24)',
      },
    }),
    // Bottom gradient bar
    h('div', {
      style: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '6px',
        background: 'linear-gradient(90deg, #fbbf24, #ef4444, #22c55e, #e23636, #3b82f6)',
      },
    }),
    // Decorative circles (web pattern)
    ...[80, 160, 260, 380].map(r =>
      h('div', {
        style: {
          position: 'absolute',
          width: `${r * 2}px`,
          height: `${r * 2}px`,
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '50%',
          top: `${315 - r}px`,
          left: `${600 - r}px`,
        },
      })
    ),
    // Subtitle
    h('div', {
      style: {
        fontSize: '28px',
        color: '#fbbf24',
        letterSpacing: '6px',
        textTransform: 'uppercase',
        marginBottom: '4px',
        fontFamily: 'Nunito',
      },
    }, "You're invited!"),
    // Name
    h('div', {
      style: {
        fontSize: '140px',
        color: '#e23636',
        fontFamily: 'Bangers',
        lineHeight: 1,
        textShadow: '4px 4px 0 #1a1a2e',
        marginBottom: '0px',
      },
    }, 'Gael'),
    // Age
    h('div', {
      style: {
        fontSize: '90px',
        color: '#3b82f6',
        fontFamily: 'Bangers',
        lineHeight: 1,
        textShadow: '3px 3px 0 #1a1a2e',
        marginBottom: '16px',
      },
    }, 'is turning 4!'),
    // Colour dots
    h('div', {
      style: {
        display: 'flex',
        gap: '16px',
        marginBottom: '16px',
      },
    },
      h('div', { style: { width: '28px', height: '28px', borderRadius: '50%', background: '#3b82f6' } }),
      h('div', { style: { width: '28px', height: '28px', borderRadius: '50%', background: '#22c55e' } }),
      h('div', { style: { width: '28px', height: '28px', borderRadius: '50%', background: '#ef4444' } }),
    ),
    // Details
    h('div', {
      style: {
        fontSize: '26px',
        color: 'rgba(248,250,252,0.8)',
        textAlign: 'center',
        lineHeight: 1.5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      },
    },
      h('span', {}, 'Saturday, June 13 \u00b7 3:00 p.m.'),
      h('span', {}, 'The Beverly Hills Hotel'),
    ),
  ),
  {
    width,
    height,
    fonts: [
      { name: 'Bangers', data: bangersData, weight: 400, style: 'normal' },
      { name: 'Nunito', data: nunitoData, weight: 700, style: 'normal' },
    ],
  }
);

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: width },
});
const png = resvg.render().asPng();

const tmpPng = join(tmpdir(), 'og-tmp.png');
await writeFile(tmpPng, png);
const outJpg = join(root, 'public', 'og.jpg');
execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '72', tmpPng, '--out', outJpg]);
await unlink(tmpPng);

const { size } = await stat(outJpg);
console.log(`Generated public/og.jpg (${(size / 1024).toFixed(1)} KB)`);
