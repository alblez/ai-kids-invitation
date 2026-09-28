// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { invitation } from './src/invitation.config.ts';

// Inject @theme colour tokens from the config into global.css before Tailwind processes it.
// The CSS file has a `/* theme:colors */` marker that this plugin replaces with concrete values.
function invitationTheme() {
  const colors = Object.entries(invitation.theme.colors)
    .map(([key, hex]) => `  --color-${key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}: ${hex};`)
    .join('\n');
  return {
    name: 'invitation-theme',
    enforce: /** @type {const} */ ('pre'),
    transform(/** @type {string} */ code, /** @type {string} */ id) {
      if (!id.endsWith('global.css')) return;
      return code.replace('/* theme:colors */', colors);
    },
  };
}

const { fonts } = invitation.theme;

// https://astro.build/config
export default defineConfig({
  site: invitation.site.url,
  vite: {
    plugins: [invitationTheme(), tailwindcss()],
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: fonts.display.name,
      cssVariable: '--font-inv-display',
      weights: /** @type {[number, ...number[]]} */ (fonts.display.weights),
      subsets: ['latin'],
      fallbacks: ['cursive'],
    },
    {
      provider: fontProviders.google(),
      name: fonts.body.name,
      cssVariable: '--font-inv-body',
      weights: /** @type {[number, ...number[]]} */ (fonts.body.weights),
      styles: /** @type {["normal" | "italic" | "oblique", ...("normal" | "italic" | "oblique")[]]} */ (fonts.body.styles ?? ['normal']),
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
  ],
});
