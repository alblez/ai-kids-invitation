#!/usr/bin/env node

/**
 * Preflight check for AI Kids Invitation.
 * Verifies tools, config, and photos before you start.
 * Run: pnpm preflight
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = false;

function pass(msg) { console.log(`  \u2713 ${msg}`); }
function warn(msg) { console.log(`  ! ${msg}`); }
function fail(msg) { console.log(`  \u2717 ${msg}`); failed = true; }

function which(cmd) {
  try {
    return execFileSync('which', [cmd], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch { return null; }
}

function run(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch { return null; }
}

// ── Required ────────────────────────────────────────────────────────────────

console.log('\nRequired:\n');

// Node version
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const required = pkg.engines?.node?.replace(/[>=^~\s]/g, '') || '0';
const current = process.versions.node;
if (current.localeCompare(required, undefined, { numeric: true }) >= 0) {
  pass(`Node ${current} (need >=${required})`);
} else {
  fail(`Node ${current} is below required >=${required}`);
}

// pnpm
if (which('pnpm')) {
  pass(`pnpm ${run('pnpm', ['--version']) || '(unknown version)'}`);
} else {
  fail('pnpm not found');
}

// node_modules
try {
  readdirSync(join(root, 'node_modules', 'astro'));
  pass('node_modules installed');
} catch {
  fail('node_modules missing — run: pnpm install');
}

// git
if (which('git')) {
  pass(`git ${run('git', ['--version'])?.replace('git version ', '') || ''}`);
} else {
  fail('git not found');
}

// gh + auth
if (which('gh')) {
  const auth = run('gh', ['auth', 'status']);
  if (auth !== null) {
    pass('gh installed and authenticated');
  } else {
    fail('gh installed but not authenticated — run: gh auth login');
  }
} else {
  fail('gh not found — install: https://cli.github.com');
}

// ── Recommended ─────────────────────────────────────────────────────────────

console.log('\nRecommended:\n');

// Vercel CLI
if (which('vercel')) {
  const whoami = run('vercel', ['whoami']);
  if (whoami) {
    pass(`Vercel CLI logged in as ${whoami}`);
  } else {
    warn('Vercel CLI installed but not logged in (also works via Git integration)');
  }
} else {
  warn('Vercel CLI not found (you can deploy via the Git integration instead)');
}

// macOS sips (needed by pnpm og)
if (which('sips')) {
  pass('sips available (macOS — needed by pnpm og)');
} else {
  warn('sips not found — pnpm og requires macOS');
}

// ── Config ──────────────────────────────────────────────────────────────────

console.log('\nConfig:\n');

try {
  const configText = readFileSync(join(root, 'src', 'invitation.config.ts'), 'utf8');
  const demoWarnings = [];
  if (/name:\s*['"]Gael['"]/.test(configText)) demoWarnings.push('child name is still "Gael"');
  if (/['"]15555550123['"]/.test(configText)) demoWarnings.push('WhatsApp number is the demo placeholder');
  if (demoWarnings.length) {
    warn(`Demo config detected: ${demoWarnings.join('; ')}. Edit src/invitation.config.ts.`);
  } else {
    pass('Config has been customised');
  }
} catch {
  fail('Could not read src/invitation.config.ts');
}

// ── Photos ──────────────────────────────────────────────────────────────────

console.log('\nPhotos:\n');

try {
  const photos = readdirSync(join(root, 'photos')).filter(
    f => !f.startsWith('.') && f !== 'README.md'
  );
  if (photos.length > 0) {
    pass(`${photos.length} file(s) in photos/`);
  } else {
    warn('No photos in photos/ — the site will use demo images until you add your child\'s photos');
  }
} catch {
  warn('photos/ directory not found — create it and add your child\'s reference photos');
}

// ── Optional image tools ────────────────────────────────────────────────────

console.log('\nOptional image tools:\n');

// ImageMagick
if (which('magick')) {
  pass(`ImageMagick: magick available`);
} else {
  console.log('  - ImageMagick (magick) not found — needed for contact sheets and overlays');
}

// Swift (face landmarks)
if (which('swift')) {
  pass('swift available (for face-landmarks.swift)');
} else {
  console.log('  - swift not found — needed for face landmark checks on macOS');
}

// Qwen wrapper venv
try {
  const wrapper = join(root, 'tools', 'qwen-image-2.1');
  readFileSync(wrapper);
  const helpOut = run(wrapper, ['--help']);
  if (helpOut) {
    pass('tools/qwen-image-2.1 wrapper responds to --help');
  } else {
    console.log('  - tools/qwen-image-2.1 exists but --help failed (Python venv may need setup)');
  }
} catch {
  console.log('  - tools/qwen-image-2.1 not found');
}

// ── Result ──────────────────────────────────────────────────────────────────

console.log('');
if (failed) {
  console.log('Some required checks failed. Fix the items marked with \u2717 above.\n');
  process.exit(1);
} else {
  console.log('All required checks passed. Items marked with ! are optional warnings.\n');
}
