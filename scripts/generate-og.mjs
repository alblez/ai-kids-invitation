/**
 * Generate static OG image (1200x630) for WhatsApp preview.
 * Uses Satori (JSX -> SVG) + resvg (SVG -> PNG) + sips (PNG -> JPEG).
 * Run: pnpm og
 * // ponytail: macOS-only (sips); swap for sharp if run elsewhere
 */
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { writeFile, unlink, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { invitation } from '../src/invitation.config.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const { name, age } = invitation.child;
const { venue } = invitation.party;
const ogDateTime = invitation.party.ogDateTime;
const col = invitation.theme.colors;
const fonts = invitation.theme.fonts;

// Fetch Google Fonts
async function fetchFont(family, weight) {
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`;
  const css = await fetch(url).then(r => r.text());
  const fontUrl = css.match(/src: url\((.+?)\)/)?.[1];
  if (!fontUrl) throw new Error(`Font URL not found for ${family}`);
  return fetch(fontUrl).then(r => r.arrayBuffer());
}

const [displayData, bodyData] = await Promise.all([
  fetchFont(fonts.display.name, fonts.display.weights[0]),
  fetchFont(fonts.body.name, 700),
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
      background: `linear-gradient(135deg, ${col.nightSky} 0%, ${col.heroDark} 50%, ${col.nightSky} 100%)`,
      fontFamily: fonts.body.name,
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
        background: `linear-gradient(90deg, ${col.powerBlue}, ${col.heroRed}, ${col.powerGreen}, ${col.powerRed}, ${col.starYellow})`,
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
        background: `linear-gradient(90deg, ${col.starYellow}, ${col.powerRed}, ${col.powerGreen}, ${col.heroRed}, ${col.powerBlue})`,
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
        color: col.starYellow,
        letterSpacing: '6px',
        textTransform: 'uppercase',
        marginBottom: '4px',
        fontFamily: fonts.body.name,
      },
    }, "You're invited!"),
    // Name
    h('div', {
      style: {
        fontSize: '140px',
        color: col.heroRed,
        fontFamily: fonts.display.name,
        lineHeight: 1,
        textShadow: `4px 4px 0 ${col.heroDark}`,
        marginBottom: '0px',
      },
    }, name),
    // Age
    h('div', {
      style: {
        fontSize: '90px',
        color: col.powerBlue,
        fontFamily: fonts.display.name,
        lineHeight: 1,
        textShadow: `3px 3px 0 ${col.heroDark}`,
        marginBottom: '16px',
      },
    }, `is turning ${age}!`),
    // Colour dots
    h('div', {
      style: {
        display: 'flex',
        gap: '16px',
        marginBottom: '16px',
      },
    },
      h('div', { style: { width: '28px', height: '28px', borderRadius: '50%', background: col.powerBlue } }),
      h('div', { style: { width: '28px', height: '28px', borderRadius: '50%', background: col.powerGreen } }),
      h('div', { style: { width: '28px', height: '28px', borderRadius: '50%', background: col.powerRed } }),
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
      h('span', {}, ogDateTime),
      h('span', {}, venue),
    ),
  ),
  {
    width,
    height,
    fonts: [
      { name: fonts.display.name, data: displayData, weight: fonts.display.weights[0], style: 'normal' },
      { name: fonts.body.name, data: bodyData, weight: 700, style: 'normal' },
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
