// Profile README in 10 languages: navy, minimal section cards, buttons, diagram and
// tech icons, plus one README file per language (README.md is English, the default).
//
// GitHub strips CSS, fonts and scripts from READMEs: text is drawn as glyph outlines
// (no font loading), rounded corners live in the SVGs, and the language buttons are
// plain links to README.<code>.md.
//
// Fonts: Lekton (Latin), IBM Plex Mono (Cyrillic), IBM Plex Sans Arabic (Arabic, RTL),
// Noto Sans SC / JP (fetched from Google Fonts as subsets of the characters used).
// Run: npm install && npm run build
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

import { BUILD_ICONS, LANGS, PRINCIPLE_ICONS } from './content.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const assets = path.join(root, 'assets');

// Generated files only; banner.jpg stays.
for (const entry of fs.readdirSync(assets, { withFileTypes: true })) {
  if (entry.isDirectory() || entry.name.endsWith('.svg')) fs.rmSync(path.join(assets, entry.name), { recursive: true });
}
for (const file of fs.readdirSync(root)) {
  if (/^README(\.[a-z]{2})?\.md$/.test(file)) fs.rmSync(path.join(root, file));
}

/* --------------------------------------------------------------- theme */

const C = {
  surface: '#0B1B33',
  panel: '#10233F',
  border: '#1C3050',
  borderStrong: '#2A4470',
  label: '#7F97BD',
  title: '#F1F5FB',
  body: '#B9C6D8',
  accent: '#9DB4DA',
  mark: '#DCE6F5',
  node: '#16325C',
  nodeStrong: '#1E4178',
  line: '#5B7196',
};
const W = 840;
const PAD = 28;
const LABEL_H = 46;

/* --------------------------------------------------------------- fonts */

const LATIN = { kerning: false, features: { liga: false, rlig: false } };
const load = (file) => opentype.loadSync(path.join(here, 'fonts', file));
// `options` undefined = opentype defaults, which keep Arabic joining (init/medi/fina/rlig).
const face = (id, font, { options = LATIN, scale = 1, rtl = false } = {}) => ({ id, font, options, scale, rtl });

const FACES = {
  lekton: { regular: face('lr', load('Lekton-Regular.ttf')), bold: face('lb', load('Lekton-Bold.ttf')) },
  mono: {
    regular: face('mr', load('IBMPlexMono-Regular.ttf'), { scale: 0.9 }),
    bold: face('mb', load('IBMPlexMono-Bold.ttf'), { scale: 0.9 }),
  },
  arabic: {
    regular: face('ar', load('IBMPlexSansArabic-Regular.ttf'), { options: undefined, scale: 1.05, rtl: true }),
    bold: face('ab', load('IBMPlexSansArabic-Bold.ttf'), { options: undefined, scale: 1.05, rtl: true }),
  },
};

const LANG_FACES = {
  en: ['lekton'], tr: ['lekton'], de: ['lekton'], fr: ['lekton'], es: ['lekton'], it: ['lekton'],
  ru: ['mono'], ar: ['lekton', 'arabic'], zh: ['lekton', 'sc'], ja: ['lekton', 'jp'],
};

/** Every string a language renders (for CJK subsets and glyph checks). */
function stringsOf(lang) {
  return [
    lang.location,
    ...Object.values(lang.labels),
    ...lang.about.map((r) => r.text),
    ...lang.build.flat(),
    ...lang.principles.flat(),
    lang.flow.front,
    lang.flow.back,
    ...Object.values(lang.flow.nodes).flat(),
    ...Object.values(lang.flow.tags),
    lang.flow.apps,
  ];
}

const OLD_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.59.8 (KHTML, like Gecko) Version/5.1.9 Safari/534.59.8';

/** Google Fonts subset (only the characters used) as WOFF, regular and bold. */
async function loadSubset(id, family, lang) {
  const lekton = FACES.lekton.regular.font;
  const chars = [...new Set(stringsOf(lang).join(''))].filter((ch) => ch.trim() && lekton.charToGlyphIndex(ch) === 0).join('');
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@400;700&text=${encodeURIComponent(chars)}`;
  const css = await (await fetch(url, { headers: { 'User-Agent': OLD_SAFARI } })).text();
  const weights = {};
  for (const block of css.split('@font-face').slice(1)) {
    const weight = block.match(/font-weight:\s*(\d+)/)[1];
    const src = block.match(/url\((https:[^)]+)\)/)[1];
    const buffer = Buffer.from(await (await fetch(src)).arrayBuffer());
    weights[weight] = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  }
  return {
    regular: face(`${id}r`, weights['400'], { scale: 0.94 }),
    bold: face(`${id}b`, weights['700'], { scale: 0.94 }),
  };
}

FACES.sc = await loadSubset('s', 'Noto+Sans+SC', LANGS.find((l) => l.code === 'zh'));
FACES.jp = await loadSubset('j', 'Noto+Sans+JP', LANGS.find((l) => l.code === 'ja'));

/* ---------------------------------------------------------- text engine */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function faceFor(ch, code, weight) {
  for (const id of LANG_FACES[code]) {
    const candidate = FACES[id][weight];
    if (/\s/.test(ch) || candidate.font.charToGlyphIndex(ch) > 0) return candidate;
  }
  throw new Error(`No glyph for "${ch}" (${code})`);
}

/** Splits a string into runs of one font face, shaped (Arabic joins inside its run). */
function runsOf(str, code, weight) {
  const runs = [];
  for (const ch of str) {
    const f = faceFor(ch, code, weight);
    if (runs.at(-1)?.face === f) runs.at(-1).text += ch;
    else runs.push({ face: f, text: ch });
  }
  for (const run of runs) {
    run.glyphs = run.face.font.stringToGlyphs(run.text, run.face.options);
    run.units = run.glyphs.reduce((sum, glyph) => sum + glyph.advanceWidth, 0);
  }
  return runs;
}

const runScale = (run, size) => (size * run.face.scale) / run.face.font.unitsPerEm;
const runWidth = (run, size, tracking = 0) => run.units * runScale(run, size) + tracking * run.glyphs.length;

// Each glyph outline is defined once per SVG and placed with <use>: keeps files small.
let glyphs = new Map();

function use(f, glyph, x, y, scale) {
  const key = `${f.id}${glyph.index}`;
  if (!glyphs.has(key)) glyphs.set(key, glyph.getPath(0, 0, f.font.unitsPerEm).toPathData(0));
  return `<use xlink:href="#${key}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(5)})"/>`;
}

/**
 * Draws one run with its left edge at x. opentype.js already returns Arabic glyphs
 * joined and in visual (left-to-right) order; only token order is mirrored for RTL.
 */
function drawRun(run, x, y, size, tracking = 0) {
  const scale = runScale(run, size);
  let out = '';
  let cx = x;
  for (const glyph of run.glyphs) {
    if (glyph.path.commands.length) out += use(run.face, glyph, cx, y, scale);
    cx += glyph.advanceWidth * scale + tracking;
  }
  return out;
}

const CJK = /[　-ヿ㐀-鿿豈-﫿＀-￯]/;
const NO_LINE_START = /[、。，．：；！？）」』・／]/;

/** Words (and single CJK characters) that line breaking may separate. */
function tokenize(str, code) {
  const tokens = [];
  for (const part of str.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      tokens.push({ text: part, space: true });
    } else if (code === 'zh' || code === 'ja') {
      let latin = '';
      for (const ch of part) {
        if (!CJK.test(ch)) {
          latin += ch;
          continue;
        }
        if (latin) tokens.push({ text: latin });
        latin = '';
        // Closing punctuation never starts a line: it sticks to the previous token.
        if (NO_LINE_START.test(ch) && tokens.length && !tokens.at(-1).space) tokens.at(-1).text += ch;
        else tokens.push({ text: ch });
      }
      if (latin) tokens.push({ text: latin });
    } else {
      tokens.push({ text: part });
    }
  }
  return tokens;
}

function measureTokens(rich, size, code) {
  const tokens = [];
  for (const piece of rich) {
    const weight = piece.bold ? 'bold' : 'regular';
    for (const token of tokenize(piece.text, code)) {
      const runs = runsOf(token.text, code, weight);
      tokens.push({
        ...token,
        runs,
        color: piece.color ?? (piece.bold ? C.title : C.body),
        width: runs.reduce((sum, run) => sum + runWidth(run, size), 0),
      });
    }
  }
  return tokens;
}

function drawToken(token, x, y, size, rtl) {
  let out = '';
  if (rtl && token.runs.some((run) => run.face.rtl)) {
    let right = x + token.width;
    for (const run of token.runs) {
      right -= runWidth(run, size);
      out += drawRun(run, right, y, size);
    }
  } else {
    let cx = x;
    for (const run of token.runs) {
      out += drawRun(run, cx, y, size);
      cx += runWidth(run, size);
    }
  }
  return out;
}

/** Tokens of one line, placed left-to-right, or right-to-left from `x + width`. */
function drawTokenLine(tokens, x, y, size, rtl, width) {
  let out = '';
  let cx = rtl ? x + width : x;
  for (const token of tokens) {
    if (rtl) cx -= token.width;
    if (!token.space) out += `<g fill="${token.color}">${drawToken(token, cx, y, size, rtl)}</g>`;
    if (!rtl) cx += token.width;
  }
  return out;
}

function wrap(rich, maxWidth, size, code) {
  const lines = [[]];
  let width = 0;
  for (const token of measureTokens(rich, size, code)) {
    const line = lines.at(-1);
    if (token.space && line.length === 0) continue;
    if (!token.space && line.length && width + token.width > maxWidth) {
      while (line.at(-1)?.space) line.pop();
      lines.push([]);
      width = 0;
    }
    lines.at(-1).push(token);
    width += token.width;
  }
  return lines;
}

function drawParagraph(lines, x, y, size, lineHeight, rtl, width) {
  return lines.map((line, index) => drawTokenLine(line, x, y + index * lineHeight, size, rtl, width)).join('');
}

function measure(str, size, code, weight = 'regular', tracking = 0) {
  if (tracking) return runsOf(str, code, weight).reduce((sum, run) => sum + runWidth(run, size, tracking), 0) - tracking;
  return measureTokens([{ text: str, bold: weight === 'bold' }], size, code).reduce((sum, t) => sum + t.width, 0);
}

/** Single line of text. `anchor` works on the measured box, in any direction. */
function text(str, x, y, { size = 16, code = 'en', weight = 'regular', fill = C.body, anchor = 'start', tracking = 0 } = {}) {
  const rtl = LANGS.find((l) => l.code === code)?.rtl ?? false;
  const width = measure(str, size, code, weight, tracking);
  const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  if (tracking) {
    let cx = left;
    let out = '';
    for (const run of runsOf(str, code, weight)) {
      out += drawRun(run, cx, y, size, tracking);
      cx += runWidth(run, size, tracking);
    }
    return `<g fill="${fill}">${out}</g>`;
  }
  const tokens = measureTokens([{ text: str, bold: weight === 'bold', color: fill }], size, code);
  return drawTokenLine(tokens, left, y, size, rtl, width);
}

/** Largest size (down to `min`) at which `str` fits in `maxWidth`. */
function fit(str, maxWidth, size, code, weight = 'regular', min = 9) {
  let s = size;
  while (s > min && measure(str, s, code, weight) > maxWidth) s -= 0.5;
  return s;
}

/* --------------------------------------------------------------- icons */

function lucide(name, x, y, size = 24, color = C.accent) {
  const src = fs.readFileSync(path.join(here, 'icons', `${name}.svg`), 'utf8');
  const inner = src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
}

const LINKEDIN_PATH =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z';

/** Single-color brand mark (Simple Icons / Devicon plain), recolored. */
function mark(file, x, y, size, color = C.mark) {
  if (file === 'windows') {
    // Four squares; no single-color Windows mark is published.
    const s = size * 0.46;
    const g = size - s * 2;
    return [0, 1].flatMap((r) => [0, 1].map((c) => `<rect x="${x + c * (s + g)}" y="${y + r * (s + g)}" width="${s}" height="${s}" rx="1" fill="${color}"/>`)).join('');
  }
  const src = fs.readFileSync(path.join(here, 'sources', 'mono', `${file}.svg`), 'utf8');
  const viewBox = src.match(/viewBox="([^"]+)"/)[1];
  const inner = src
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/\sfill="(?!none)[^"]*"/g, '');
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${viewBox}" fill="${color}">${inner}</svg>`;
}

/* ----------------------------------------------------------------- svg */

const DEFS =
  `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
  `<path d="M0 0L10 5L0 10z" fill="${C.line}"/></marker></defs>`;

function svg(width, height, body, label) {
  const glyphDefs = [...glyphs].map(([id, d]) => `<path id="${id}" d="${d}"/>`).join('');
  glyphs = new Map();
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">` +
    `<title>${esc(label)}</title>${DEFS}<defs>${glyphDefs}</defs>${body}</svg>\n`
  );
}

let written = 0;
function write(file, content) {
  const full = path.join(assets, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  written += content.length;
}

const rect = (x, y, w, h, r, fill, stroke = C.border) =>
  `<rect x="${x + 0.75}" y="${y + 0.75}" width="${w - 1.5}" height="${h - 1.5}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;

const upper = (str, code) => (['ar', 'zh', 'ja'].includes(code) ? str : str.toLocaleUpperCase(code));
const trackingOf = (code) => (['ar', 'zh', 'ja'].includes(code) ? 0 : 2.2);

/** Section card: small label (mirrored for RTL), then content at (PAD, PAD + LABEL_H). */
function section(file, lang, label, contentH, draw, alt) {
  const h = PAD + LABEL_H + contentH + PAD;
  const labelText = upper(label, lang.code);
  const labelOptions = { size: 13, code: lang.code, weight: 'bold', fill: C.label, tracking: trackingOf(lang.code) };
  const body =
    rect(0, 0, W, h, 20, C.surface) +
    (lang.rtl
      ? `<rect x="${W - PAD - 18}" y="${PAD + 7}" width="18" height="2" rx="1" fill="${C.accent}"/>` +
        text(labelText, W - PAD - 28, PAD + 12, { ...labelOptions, anchor: 'end' })
      : `<rect x="${PAD}" y="${PAD + 7}" width="18" height="2" rx="1" fill="${C.accent}"/>` +
        text(labelText, PAD + 28, PAD + 12, labelOptions)) +
    draw(PAD, PAD + LABEL_H);
  write(file, svg(W, h, body, alt));
}

/* ------------------------------------------------------------- buttons */

function button(file, label, icon, { code = 'en', active, height = 44, size = 15, padX = 20 } = {}) {
  const iconSize = icon ? 18 : 0;
  const gap = icon ? 10 : 0;
  const w = Math.ceil(padX + iconSize + gap + measure(label, size, code, 'bold') + padX);
  const fill = active ? C.mark : C.surface;
  const body =
    `<rect x="0.75" y="0.75" width="${w - 1.5}" height="${height - 1.5}" rx="${(height - 1.5) / 2}" fill="${fill}" stroke="${active ? C.mark : C.borderStrong}" stroke-width="1.5"/>` +
    (icon ? icon(padX, (height - iconSize) / 2, iconSize) : '') +
    text(label, padX + iconSize + gap, height / 2 + size * 0.34, { size, code, weight: 'bold', fill: active ? C.surface : C.title });
  write(file, svg(w, height, body, label));
}

button('btn-website.svg', 'eraymenekse.com', (x, y, s) => lucide('globe', x, y, s));
button('btn-linkedin.svg', 'LinkedIn', (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s / 24})" d="${LINKEDIN_PATH}" fill="${C.accent}"/>`);

for (const lang of LANGS) {
  const label = lang.code.toUpperCase();
  button(`lang/${lang.code}.svg`, label, null, { height: 30, size: 13, padX: 13 });
  button(`lang/${lang.code}-on.svg`, label, null, { height: 30, size: 13, padX: 13, active: true });
}

/* ----------------------------------------------------------- per language */

const STACK = [
  ['dv-csharp', 'C#'], ['dotnet', '.NET'], ['dv-entityframeworkcore', 'Entity Framework Core'],
  ['dv-microsoftsqlserver', 'SQL Server'], ['oracle', 'Oracle'], ['typescript', 'TypeScript'], ['react', 'React'],
  ['nextdotjs', 'Next.js'], ['tailwindcss', 'Tailwind CSS'], ['pwa', 'PWA'], ['windows', 'Windows'],
  ['apple', 'macOS / iOS'], ['linux', 'Linux'], ['android', 'Android'],
  ['git', 'Git'], ['githubactions', 'GitHub Actions'], ['dv-visualstudio', 'Visual Studio'], ['dv-vscode', 'VS Code'],
  ['dv-powershell', 'PowerShell'], ['dv-playwright', 'Playwright'], ['vitest', 'Vitest'],
];

function itemGrid(file, lang, label, items, icons, { panels = true } = {}) {
  const code = lang.code;
  const rtl = Boolean(lang.rtl);
  const inner = W - PAD * 2;
  const gap = 14;
  const itemW = (inner - gap) / 2;
  const pad = panels ? 20 : 0;
  const iconSize = 22;
  const textOffset = pad + iconSize + 16;
  const textW = itemW - textOffset - pad;
  const titleSize = 17;
  const bodySize = 14;
  const lineHeight = ['zh', 'ja', 'ar'].includes(code) ? 25 : 22;

  const laid = items.map(([title, body], index) => ({
    title,
    icon: icons[index],
    titleSize: fit(title, textW, titleSize, code, 'bold', 13),
    lines: wrap([{ text: body }], textW, bodySize, code),
  }));
  const itemH = pad * 2 + Math.max(...laid.map((i) => titleSize + 10 + lineHeight * (i.lines.length - 1) + bodySize));
  const rows = Math.ceil(items.length / 2);
  const rowGap = panels ? gap : 22;
  const contentH = rows * itemH + (rows - 1) * rowGap;

  section(
    file,
    lang,
    label,
    contentH,
    (ox, oy) =>
      laid
        .map((item, index) => {
          const column = rtl ? 1 - (index % 2) : index % 2;
          const x = ox + column * (itemW + gap);
          const y = oy + Math.floor(index / 2) * (itemH + rowGap);
          const iconX = rtl ? x + itemW - pad - iconSize : x + pad;
          const textX = rtl ? x + pad : x + textOffset;
          return (
            (panels ? rect(x, y, itemW, itemH, 14, C.panel) : '') +
            lucide(item.icon, iconX, y + pad + 1, iconSize) +
            text(item.title, rtl ? textX + textW : textX, y + pad + titleSize * 0.82, {
              size: item.titleSize,
              code,
              weight: 'bold',
              fill: C.title,
              anchor: rtl ? 'end' : 'start',
            }) +
            drawParagraph(item.lines, textX, y + pad + titleSize + 10 + bodySize * 0.8, bodySize, lineHeight, rtl, textW)
          );
        })
        .join(''),
    `${label}: ${items.map(([title]) => title).join(', ')}`,
  );
}

function diagram(lang) {
  const code = lang.code;
  const rtl = Boolean(lang.rtl);
  const f = lang.flow;
  const nodeW = 170;
  const nodeH = 70;
  const contentH = 380;

  const draw = (ox, oy) => {
    const n = {
      ai: { x: 25, y: 46, fill: C.nodeStrong },
      crm: { x: 25, y: 200, fill: C.node },
      erp: { x: 300, y: 123, fill: C.node },
      mes: { x: 589, y: 46, fill: C.node },
      wms: { x: 589, y: 200, fill: C.node },
    };
    const X = (v) => ox + v;
    const Y = (v) => oy + v;
    const cx = (k) => X(n[k].x + nodeW / 2);
    const cy = (k) => Y(n[k].y + nodeH / 2);
    const top = (k) => Y(n[k].y);
    const bottom = (k) => Y(n[k].y + nodeH);
    const left = (k) => X(n[k].x);
    const right = (k) => X(n[k].x + nodeW);

    const group = (x, w, label) =>
      `<rect x="${X(x)}" y="${Y(0)}" width="${w}" height="300" rx="16" fill="none" stroke="${C.border}" stroke-width="1.5" stroke-dasharray="5 6"/>` +
      text(upper(label, code), rtl ? X(x + w - 16) : X(x + 16), Y(24), {
        size: fit(upper(label, code), w - 32, 11, code, 'bold'),
        code,
        weight: 'bold',
        fill: C.label,
        tracking: trackingOf(code) ? 1.6 : 0,
        anchor: rtl ? 'end' : 'start',
      });

    const node = (k) => {
      const [title, sub] = f.nodes[k];
      return (
        rect(X(n[k].x), Y(n[k].y), nodeW, nodeH, 14, n[k].fill, C.borderStrong) +
        text(title, cx(k), Y(n[k].y + 30), { size: fit(title, nodeW - 20, 18, code, 'bold', 11), code, weight: 'bold', fill: C.title, anchor: 'middle' }) +
        text(sub, cx(k), Y(n[k].y + 52), { size: fit(sub, nodeW - 20, 12.5, code), code, fill: '#C9D6EA', anchor: 'middle' })
      );
    };

    const edge = (d, both = false, dashed = false) =>
      `<path d="${d}" fill="none" stroke="${C.line}" stroke-width="1.6"${dashed ? ' stroke-dasharray="4 6"' : ''} marker-end="url(#arrow)"${both ? ' marker-start="url(#arrow)"' : ''}/>`;

    const tag = (str, x, y, maxWidth) => {
      const size = fit(str, maxWidth - 16, 12, code);
      const w = measure(str, size, code) + 16;
      return (
        `<rect x="${X(x) - w / 2}" y="${Y(y) - 11}" width="${w}" height="21" rx="10.5" fill="${C.surface}" stroke="${C.border}"/>` +
        text(str, X(x), Y(y) + size * 0.34, { size, code, fill: C.body, anchor: 'middle' })
      );
    };

    const appsY = 330;
    let out = group(0, 220, f.front) + group(260, 524, f.back);
    out += edge(`M${cx('ai')} ${bottom('ai')} V${top('crm') - 4}`);
    out += edge(`M${right('crm')} ${cy('crm')} C ${X(235)} ${cy('crm')}, ${X(260)} ${cy('erp')}, ${left('erp') - 4} ${cy('erp')}`);
    out += edge(`M${right('erp') + 4} ${cy('erp') - 13} C ${X(530)} ${cy('erp') - 13}, ${X(540)} ${cy('mes')}, ${left('mes') - 4} ${cy('mes')}`, true);
    out += edge(`M${right('erp') + 4} ${cy('erp') + 13} C ${X(530)} ${cy('erp') + 13}, ${X(540)} ${cy('wms')}, ${left('wms') - 4} ${cy('wms')}`, true);
    out += edge(`M${cx('mes')} ${bottom('mes')} V${top('wms') - 4}`);
    for (const k of ['crm', 'erp', 'wms']) out += edge(`M${cx(k)} ${Y(appsY)} V${bottom(k) + 4}`, false, true);

    out += Object.keys(n).map(node).join('');
    out += tag(f.tags.leads, 110, 158, 200);
    out += tag(f.tags.orders, 245, 198, 96);
    out += tag(f.tags.work, 530, 110, 110);
    out += tag(f.tags.stock, 530, 206, 110);
    out += tag(f.tags.goods, 674, 158, 166);

    out += rect(X(25), Y(appsY), 734, 50, 14, C.panel, C.borderStrong);
    const appsSize = fit(f.apps, 640, 16, code, 'bold', 12);
    out += rtl
      ? lucide('smartphone', X(25 + 734 - 20 - 22), Y(appsY + 14), 22) +
        text(f.apps, X(25 + 734 - 20 - 22 - 14), Y(appsY + 25) + appsSize * 0.34, { size: appsSize, code, weight: 'bold', fill: C.title, anchor: 'end' })
      : lucide('smartphone', X(45), Y(appsY + 14), 22) +
        text(f.apps, X(80), Y(appsY + 25) + appsSize * 0.34, { size: appsSize, code, weight: 'bold', fill: C.title });
    return out;
  };

  section(
    `${code}/flow.svg`,
    lang,
    lang.labels.flow,
    contentH,
    draw,
    `${lang.labels.flow}: ${Object.values(f.nodes).map(([title]) => title).join(', ')}`,
  );
}

function stack(lang) {
  const perRow = 7;
  const tile = 72;
  const gap = 16;
  const rows = Math.ceil(STACK.length / perRow);
  const rowW = perRow * tile + (perRow - 1) * gap;
  const contentH = rows * tile + (rows - 1) * gap;
  section(
    `${lang.code}/stack.svg`,
    lang,
    lang.labels.stack,
    contentH,
    (ox, oy) =>
      STACK.map(([file], index) => {
        const x = ox + (W - PAD * 2 - rowW) / 2 + (index % perRow) * (tile + gap);
        const y = oy + Math.floor(index / perRow) * (tile + gap);
        const size = 34;
        return rect(x, y, tile, tile, 16, C.panel) + mark(file, x + (tile - size) / 2, y + (tile - size) / 2, size);
      }).join(''),
    `${lang.labels.stack}: ${STACK.map(([, name]) => name).join(', ')}`,
  );
}

function about(lang) {
  const size = ['zh', 'ja'].includes(lang.code) ? 16 : 16.5;
  const lineHeight = ['zh', 'ja', 'ar'].includes(lang.code) ? 31 : 28;
  const lines = wrap(lang.about, W - PAD * 2, size, lang.code);
  const contentH = lineHeight * (lines.length - 1) + size;
  const plain = lang.about.map((r) => r.text).join('');
  section(
    `${lang.code}/about.svg`,
    lang,
    lang.labels.about,
    contentH,
    (x, y) => drawParagraph(lines, x, y + size * 0.8, size, lineHeight, Boolean(lang.rtl), W - PAD * 2),
    plain,
  );
  return plain;
}

/* -------------------------------------------------------------- readmes */

const PROFILE = 'https://github.com/esmnnks';
const REPO_FILE = 'https://github.com/esmnnks/esmnnks/blob/master';
const readmeName = (code) => (code === 'en' ? 'README.md' : `README.${code}.md`);
const langLink = (code) => (code === 'en' ? PROFILE : `${REPO_FILE}/${readmeName(code)}`);

function readme(lang, aboutText) {
  const a = `assets/${lang.code}`;
  const img = (src, alt) => `<img src="${src}" width="100%" alt="${esc(alt)}" />`;
  const switcher = LANGS.map((l) => {
    const on = l.code === lang.code;
    return `<a href="${langLink(l.code)}"><img src="assets/lang/${l.code}${on ? '-on' : ''}.svg" height="30" alt="${l.code.toUpperCase()}" /></a>`;
  }).join('\n');

  return `<p align="right">
${switcher}
</p>

<div align="center">

<a href="https://eraymenekse.com/"><img src="assets/banner.jpg" width="100%" alt="Eray Menekşe · Software Development Specialist · eraymenekse.com" /></a>

<a href="https://eraymenekse.com/"><img src="assets/btn-website.svg" height="44" alt="eraymenekse.com" /></a>&nbsp;
<a href="https://www.linkedin.com/in/eraymenekse"><img src="assets/btn-linkedin.svg" height="44" alt="LinkedIn" /></a>&nbsp;
<img src="${a}/btn-location.svg" height="44" alt="${esc(lang.location)}" />

</div>

<br />

${img(`${a}/about.svg`, `${lang.labels.about}: ${aboutText}`)}

${img(`${a}/build.svg`, `${lang.labels.build}: ${lang.build.map(([t]) => t).join(', ')}`)}

${img(`${a}/flow.svg`, lang.labels.flow)}

${img(`${a}/stack.svg`, `${lang.labels.stack}: ${STACK.map(([, name]) => name).join(', ')}`)}

${img(`${a}/principles.svg`, `${lang.labels.principles}: ${lang.principles.map(([t]) => t).join(', ')}`)}

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0B1B33,100:1E3A8A&height=110&section=footer" width="100%" alt="" />
`;
}

for (const lang of LANGS) {
  const before = written;
  button(`${lang.code}/btn-location.svg`, lang.location, (x, y, s) => lucide('map-pin', x, y, s), { code: lang.code });
  const aboutText = about(lang);
  itemGrid(`${lang.code}/build.svg`, lang, lang.labels.build, lang.build, BUILD_ICONS);
  diagram(lang);
  stack(lang);
  itemGrid(`${lang.code}/principles.svg`, lang, lang.labels.principles, lang.principles, PRINCIPLE_ICONS, { panels: false });
  fs.writeFileSync(path.join(root, readmeName(lang.code)), readme(lang, aboutText));
  console.log(`${lang.code}  ${((written - before) / 1024).toFixed(0)} KB`);
}
console.log(`toplam ${(written / 1024).toFixed(0)} KB`);
