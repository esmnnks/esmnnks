// Profile README visuals: navy, minimal section cards, buttons, diagram and tech icons.
// GitHub strips CSS and web fonts from READMEs, so text is drawn as Lekton outlines
// (no font loading) and the rounded corners live in the SVGs themselves.
// Run: npm install && npm run build   (writes ../assets/*.svg)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.resolve(here, '..', 'assets');

// Generated files only; banner.jpg stays.
for (const file of fs.readdirSync(assets)) {
  if (file.endsWith('.svg')) fs.rmSync(path.join(assets, file));
}
fs.rmSync(path.join(assets, 'icons'), { recursive: true, force: true });

const regular = opentype.loadSync(path.join(here, 'fonts', 'Lekton-Regular.ttf'));
const bold = opentype.loadSync(path.join(here, 'fonts', 'Lekton-Bold.ttf'));

// Single navy palette: one surface, one accent, grays for text.
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

/* ---------------------------------------------------------------- text */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function assertGlyphs(str, font) {
  for (const ch of str) {
    if (ch.trim() && font.charToGlyphIndex(ch) === 0) throw new Error(`Lekton has no glyph for "${ch}" in "${str}"`);
  }
}

// No ligatures: Lekton's fi/fl ligatures are narrower than the letters they replace,
// which left gaps after words; measuring and drawing use the same glyph run.
const GLYPH_OPTIONS = { kerning: false, features: { liga: false, rlig: false } };
const glyphRun = (str, font) => font.stringToGlyphs(str, GLYPH_OPTIONS);

const measure = (str, size, font = regular, tracking = 0) =>
  (glyphRun(str, font).reduce((sum, glyph) => sum + glyph.advanceWidth, 0) * size) / font.unitsPerEm +
  tracking * Math.max(0, [...str].length - 1);

/** Baseline that vertically centers capitals on `centerY`. */
function baseline(centerY, size, font = bold) {
  const cap = (font.tables.os2.sCapHeight || font.unitsPerEm * 0.7) / font.unitsPerEm;
  return centerY + (cap * size) / 2;
}

// Each glyph outline is defined once per SVG and placed with <use>: keeps files small.
let glyphs = new Map();

function glyphRef(font, glyph) {
  const key = `${font === bold ? 'b' : 'r'}${glyph.index}`;
  if (!glyphs.has(key)) glyphs.set(key, glyph.getPath(0, 0, font.unitsPerEm).toPathData(0));
  return key;
}

function text(str, x, y, { size = 16, font = regular, fill = C.body, anchor = 'start', tracking = 0 } = {}) {
  assertGlyphs(str, font);
  const w = measure(str, size, font, tracking);
  const scale = size / font.unitsPerEm;
  let cx = x + (anchor === 'middle' ? -w / 2 : anchor === 'end' ? -w : 0);
  let out = '';
  for (const glyph of glyphRun(str, font)) {
    if (glyph.path.commands.length) {
      out += `<use xlink:href="#${glyphRef(font, glyph)}" transform="translate(${cx.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(5)})"/>`;
    }
    cx += glyph.advanceWidth * scale + tracking;
  }
  return `<g fill="${fill}">${out}</g>`;
}

/** Greedy word wrap for rich runs: [{ text, bold? }]. */
function wrap(runs, maxWidth, size) {
  const words = [];
  for (const run of typeof runs === 'string' ? [{ text: runs }] : runs) {
    for (const part of run.text.split(/(\s+)/)) {
      if (!part) continue;
      words.push({
        text: part,
        font: run.bold ? bold : regular,
        color: run.bold ? C.title : C.body,
        space: /^\s+$/.test(part),
      });
    }
  }
  const lines = [[]];
  let width = 0;
  for (const word of words) {
    const w = measure(word.text, size, word.font);
    const line = lines.at(-1);
    if (word.space && line.length === 0) continue;
    if (!word.space && line.length && width + w > maxWidth) {
      while (line.length && line.at(-1).space) line.pop();
      lines.push([]);
      width = 0;
    }
    lines.at(-1).push({ ...word, width: w });
    width += w;
  }
  return lines;
}

function drawLines(lines, x, y, size, lineHeight) {
  let out = '';
  lines.forEach((line, index) => {
    let cx = x;
    for (const word of line) {
      if (!word.space) out += text(word.text, cx, y + index * lineHeight, { size, font: word.font, fill: word.color });
      cx += word.width;
    }
  });
  return out;
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

function write(name, content) {
  fs.writeFileSync(path.join(assets, name), content);
  console.log(`${name.padEnd(18)} ${(content.length / 1024).toFixed(1)} KB`);
}

const rect = (x, y, w, h, r, fill, stroke = C.border) =>
  `<rect x="${x + 0.75}" y="${y + 0.75}" width="${w - 1.5}" height="${h - 1.5}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;

/** Section card: small uppercase label, then content drawn at (PAD, PAD + LABEL_H). */
function section(name, label, contentH, draw, alt) {
  const h = PAD + LABEL_H + contentH + PAD;
  const body =
    rect(0, 0, W, h, 20, C.surface) +
    `<rect x="${PAD}" y="${PAD + 7}" width="18" height="2" rx="1" fill="${C.accent}"/>` +
    text(label.toUpperCase(), PAD + 28, PAD + 12, { size: 13, font: bold, fill: C.label, tracking: 2.2 }) +
    draw(PAD, PAD + LABEL_H);
  write(name, svg(W, h, body, alt));
}

/* ------------------------------------------------------------- buttons */

function button(name, label, icon) {
  const size = 15;
  const h = 44;
  const padX = 20;
  const iconSize = 18;
  const gap = 10;
  const w = Math.ceil(padX + iconSize + gap + measure(label, size, bold) + padX);
  const body =
    `<rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="${(h - 1.5) / 2}" fill="${C.surface}" stroke="${C.borderStrong}" stroke-width="1.5"/>` +
    icon(padX, (h - iconSize) / 2, iconSize) +
    text(label, padX + iconSize + gap, baseline(h / 2, size), { size, font: bold, fill: C.title });
  write(name, svg(w, h, body, label));
}

button('btn-website.svg', 'eraymenekse.com', (x, y, s) => lucide('globe', x, y, s));
button('btn-linkedin.svg', 'LinkedIn', (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s / 24})" d="${LINKEDIN_PATH}" fill="${C.accent}"/>`);
button('btn-location.svg', 'Bursa, Türkiye', (x, y, s) => lucide('map-pin', x, y, s));

/* --------------------------------------------------------------- about */

{
  const size = 16.5;
  const lineHeight = 28;
  const runs = [
    { text: 'I design and build business software end to end, from the database and APIs to the web and mobile screens people use every day. My work sits where sales, production and warehouse operations meet: ' },
    { text: 'CRM, ERP, MES and WMS systems', bold: true },
    { text: ', the integrations that keep them in sync, and ' },
    { text: 'AI-powered tools', bold: true },
    { text: " that take repetitive work off people's plates." },
  ];
  const lines = wrap(runs, W - PAD * 2, size);
  const contentH = lineHeight * (lines.length - 1) + size;
  section('about.svg', 'About', contentH, (x, y) => drawLines(lines, x, y + size * 0.8, size, lineHeight), runs.map((r) => r.text).join(''));
}

/* ------------------------------------------------------- what I build */

function itemGrid(name, label, items, { panels = true } = {}) {
  const inner = W - PAD * 2;
  const gap = 14;
  const itemW = (inner - gap) / 2;
  const pad = panels ? 20 : 0;
  const iconSize = 22;
  const textX = pad + iconSize + 16;
  const textW = itemW - textX - pad;
  const titleSize = 17;
  const bodySize = 14;
  const lineHeight = 22;

  const laid = items.map((item) => ({ ...item, lines: wrap(item.text, textW, bodySize) }));
  const itemH = pad * 2 + Math.max(...laid.map((i) => titleSize + 10 + lineHeight * (i.lines.length - 1) + bodySize));
  const rows = Math.ceil(items.length / 2);
  const rowGap = panels ? gap : 22;
  const contentH = rows * itemH + (rows - 1) * rowGap;

  section(
    name,
    label,
    contentH,
    (ox, oy) =>
      laid
        .map((item, index) => {
          const x = ox + (index % 2) * (itemW + gap);
          const y = oy + Math.floor(index / 2) * (itemH + rowGap);
          return (
            (panels ? rect(x, y, itemW, itemH, 14, C.panel) : '') +
            lucide(item.icon, x + pad, y + pad + 1, iconSize) +
            text(item.title, x + textX, y + pad + titleSize * 0.82, { size: titleSize, font: bold, fill: C.title }) +
            drawLines(item.lines, x + textX, y + pad + titleSize + 10 + bodySize * 0.8, bodySize, lineHeight)
          );
        })
        .join(''),
    `${label}: ${items.map((i) => `${i.title}: ${i.text}`).join(' ')}`,
  );
}

itemGrid('build.svg', 'What I build', [
  { icon: 'handshake', title: 'CRM', text: 'Customer 360, sales pipeline, quotes and dealer networks, with role-based access and a full audit trail.' },
  { icon: 'factory', title: 'MES', text: 'Work orders, shop-floor data capture and real-time production tracking and reporting.' },
  { icon: 'package', title: 'WMS', text: 'Receiving, put-away, picking and shipping, driven by barcode-based mobile workflows.' },
  { icon: 'cable', title: 'ERP integrations', text: 'Reliable two-way sync of customers, products, orders and invoices across companies.' },
  { icon: 'bot', title: 'AI & automation', text: 'LLM-powered assistants and AI agents that automate sales and back-office workflows.' },
  { icon: 'target', title: 'Customer discovery', text: 'Lead generation pipelines that find potential customers, enrich data and score leads.' },
  { icon: 'smartphone', title: 'Mobile apps', text: 'iOS and Android apps and installable PWAs for sales, field and shop-floor teams.' },
  { icon: 'messages-square', title: 'Real-time collaboration', text: 'Live messaging, notifications and video meetings built into business apps.' },
]);

itemGrid(
  'principles.svg',
  'Principles',
  [
    { icon: 'shield-check', title: 'Secure by default', text: 'Authentication, authorization, encryption and audit trails from day one.' },
    { icon: 'zap', title: 'Fast', text: 'Screens and actions designed to respond in under a second.' },
    { icon: 'flask-conical', title: 'Tested', text: 'Unit, integration and end-to-end tests on every change.' },
    { icon: 'languages', title: 'Global-ready', text: 'Multi-language interfaces with accessibility built in.' },
  ],
  { panels: false },
);

/* ------------------------------------------------------------- diagram */

{
  const nodeW = 170;
  const nodeH = 70;
  const contentH = 380;

  const draw = (ox, oy) => {
    const n = {
      ai: { x: 25, y: 46, title: 'AI agents', sub: 'lead discovery', fill: C.nodeStrong },
      crm: { x: 25, y: 200, title: 'CRM', sub: 'customers · pipeline', fill: C.node },
      erp: { x: 300, y: 123, title: 'ERP', sub: 'finance · stock', fill: C.node },
      mes: { x: 589, y: 46, title: 'MES', sub: 'production tracking', fill: C.node },
      wms: { x: 589, y: 200, title: 'WMS', sub: 'receiving · shipping', fill: C.node },
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
      text(label, X(x + 16), Y(24), { size: 11, font: bold, fill: C.label, tracking: 1.6 });

    const node = (k) =>
      rect(X(n[k].x), Y(n[k].y), nodeW, nodeH, 14, n[k].fill, C.borderStrong) +
      text(n[k].title, cx(k), Y(n[k].y + 30), { size: 18, font: bold, fill: C.title, anchor: 'middle' }) +
      text(n[k].sub, cx(k), Y(n[k].y + 52), { size: 12.5, fill: '#C9D6EA', anchor: 'middle' });

    const edge = (d, both = false, dashed = false) =>
      `<path d="${d}" fill="none" stroke="${C.line}" stroke-width="1.6"${dashed ? ' stroke-dasharray="4 6"' : ''} marker-end="url(#arrow)"${both ? ' marker-start="url(#arrow)"' : ''}/>`;

    const tag = (str, x, y) => {
      const size = 12;
      const w = measure(str, size) + 16;
      return (
        `<rect x="${X(x) - w / 2}" y="${Y(y) - 11}" width="${w}" height="21" rx="10.5" fill="${C.surface}" stroke="${C.border}"/>` +
        text(str, X(x), Y(y) + 4, { size, fill: C.body, anchor: 'middle' })
      );
    };

    const appsY = 330;
    let out = group(0, 220, 'FRONT OFFICE') + group(260, 524, 'BACK OFFICE');
    out += edge(`M${cx('ai')} ${bottom('ai')} V${top('crm') - 4}`);
    out += edge(`M${right('crm')} ${cy('crm')} C ${X(235)} ${cy('crm')}, ${X(260)} ${cy('erp')}, ${left('erp') - 4} ${cy('erp')}`);
    out += edge(`M${right('erp') + 4} ${cy('erp') - 13} C ${X(530)} ${cy('erp') - 13}, ${X(540)} ${cy('mes')}, ${left('mes') - 4} ${cy('mes')}`, true);
    out += edge(`M${right('erp') + 4} ${cy('erp') + 13} C ${X(530)} ${cy('erp') + 13}, ${X(540)} ${cy('wms')}, ${left('wms') - 4} ${cy('wms')}`, true);
    out += edge(`M${cx('mes')} ${bottom('mes')} V${top('wms') - 4}`);
    for (const k of ['crm', 'erp', 'wms']) out += edge(`M${cx(k)} ${Y(appsY)} V${bottom(k) + 4}`, false, true);

    out += Object.keys(n).map(node).join('');
    out += tag('qualified leads', 110, 158);
    out += tag('orders', 240, 198);
    out += tag('work orders', 530, 110);
    out += tag('stock levels', 530, 206);
    out += tag('finished goods', 674, 158);

    out += rect(X(25), Y(appsY), 734, 50, 14, C.panel, C.borderStrong);
    out += lucide('smartphone', X(45), Y(appsY + 14), 22);
    out += text('Web & mobile apps · PWA, iOS, Android', X(80), baseline(Y(appsY + 25), 16), { size: 16, font: bold, fill: C.title });
    return out;
  };

  section(
    'flow.svg',
    'How it fits together',
    contentH,
    draw,
    'How it fits together: AI agents feed qualified leads to CRM; CRM sends orders to ERP; ERP exchanges work orders with MES and stock levels with WMS; MES sends finished goods to WMS; web and mobile apps sit on top of CRM, ERP and WMS.',
  );
}

/* ---------------------------------------------------------- tech stack */

{
  const stack = [
    ['dv-csharp', 'C#'], ['dotnet', '.NET'], ['dv-entityframeworkcore', 'Entity Framework Core'],
    ['dv-microsoftsqlserver', 'SQL Server'], ['oracle', 'Oracle'], ['typescript', 'TypeScript'], ['react', 'React'],
    ['nextdotjs', 'Next.js'], ['tailwindcss', 'Tailwind CSS'], ['pwa', 'PWA'], ['windows', 'Windows'],
    ['apple', 'macOS and iOS'], ['linux', 'Linux'], ['android', 'Android'],
    ['git', 'Git'], ['githubactions', 'GitHub Actions'], ['dv-visualstudio', 'Visual Studio'], ['dv-vscode', 'VS Code'],
    ['dv-powershell', 'PowerShell'], ['dv-playwright', 'Playwright'], ['vitest', 'Vitest'],
  ];
  const perRow = 7;
  const tile = 72;
  const gap = 16;
  const rows = Math.ceil(stack.length / perRow);
  const rowW = perRow * tile + (perRow - 1) * gap;
  const contentH = rows * tile + (rows - 1) * gap;

  section(
    'stack.svg',
    'Tech stack',
    contentH,
    (ox, oy) =>
      stack
        .map(([file], index) => {
          const x = ox + (W - PAD * 2 - rowW) / 2 + (index % perRow) * (tile + gap);
          const y = oy + Math.floor(index / perRow) * (tile + gap);
          const size = 34;
          return rect(x, y, tile, tile, 16, C.panel) + mark(file, x + (tile - size) / 2, y + (tile - size) / 2, size);
        })
        .join(''),
    `Tech stack: ${stack.map(([, name]) => name).join(', ')}`,
  );
}
