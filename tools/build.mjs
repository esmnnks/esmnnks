// Profile README visuals: cards, buttons, headings and diagram as SVG.
// GitHub strips CSS and web fonts from READMEs, so text is drawn as Lekton
// outlines (no font loading) and cards get their radius from the SVG itself.
// Run: npm install && npm run build   (outputs to ../assets)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.resolve(here, '..', 'assets');
fs.mkdirSync(path.join(assets, 'icons'), { recursive: true });

const regular = opentype.loadSync(path.join(here, 'fonts', 'Lekton-Regular.ttf'));
const bold = opentype.loadSync(path.join(here, 'fonts', 'Lekton-Bold.ttf'));

const C = {
  card: '#111827',
  border: '#1F2937',
  title: '#F9FAFB',
  body: '#DCE3EC',
  muted: '#94A3B8',
  purple: '#512BD4',
  blue: '#2563EB',
  teal: '#0F766E',
  line: '#475569',
};
const W = 840;

/* ---------------------------------------------------------------- text */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const measure = (str, size, font = regular) => font.getAdvanceWidth(str, size);

function assertGlyphs(str, font) {
  for (const ch of str) {
    if (ch.trim() && font.charToGlyphIndex(ch) === 0) {
      throw new Error(`Lekton has no glyph for "${ch}" in "${str}"`);
    }
  }
}

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

function text(str, x, y, { size = 16, font = regular, fill = C.body, anchor = 'start' } = {}) {
  assertGlyphs(str, font);
  const w = measure(str, size, font);
  const scale = size / font.unitsPerEm;
  let cx = x + (anchor === 'middle' ? -w / 2 : anchor === 'end' ? -w : 0);
  let out = '';
  for (const glyph of font.stringToGlyphs(str)) {
    if (glyph.path.commands.length) {
      out += `<use xlink:href="#${glyphRef(font, glyph)}" transform="translate(${cx.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(5)})"/>`;
    }
    cx += glyph.advanceWidth * scale;
  }
  return `<g fill="${fill}">${out}</g>`;
}

/** Greedy word wrap for rich runs: [{ text, bold?, color? }]. */
function wrap(runs, maxWidth, size) {
  const words = [];
  for (const run of typeof runs === 'string' ? [{ text: runs }] : runs) {
    for (const part of run.text.split(/(\s+)/)) {
      if (!part) continue;
      const font = run.bold ? bold : regular;
      words.push({ text: part, font, color: run.color ?? (run.bold ? C.title : C.body), space: /^\s+$/.test(part) });
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

function lucide(name, x, y, size = 24, color = '#FFFFFF') {
  const src = fs.readFileSync(path.join(here, 'icons', `${name}.svg`), 'utf8');
  const inner = src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
}

const LINKEDIN_PATH =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z';

const linkedin = (x, y, size) =>
  `<path transform="translate(${x} ${y}) scale(${size / 24})" d="${LINKEDIN_PATH}" fill="#FFFFFF"/>`;

/* ----------------------------------------------------------------- svg */

const DEFS =
  `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
  `<stop offset="0" stop-color="${C.purple}"/><stop offset="1" stop-color="${C.blue}"/></linearGradient>` +
  `<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
  `<path d="M0 0L10 5L0 10z" fill="${C.muted}"/></marker></defs>`;

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
  console.log(`${name.padEnd(26)} ${(content.length / 1024).toFixed(1)} KB`);
}

const card = (x, y, w, h, r = 18) =>
  `<rect x="${x + 0.75}" y="${y + 0.75}" width="${w - 1.5}" height="${h - 1.5}" rx="${r}" fill="${C.card}" stroke="${C.border}" stroke-width="1.5"/>`;

/* ------------------------------------------------------------- buttons */

function button(name, { label, icon, fill, stroke }) {
  const size = 17;
  const h = 48;
  const padX = 22;
  const iconSize = 20;
  const gap = 10;
  const w = Math.ceil(padX + iconSize + gap + measure(label, size, bold) + padX);
  const body =
    `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${(h - 2) / 2}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="1.5"` : ''}/>` +
    icon(padX, (h - iconSize) / 2, iconSize) +
    text(label, padX + iconSize + gap, baseline(h / 2, size), { size, font: bold, fill: '#FFFFFF' });
  write(name, svg(w, h, body, label));
}

button('btn-website.svg', { label: 'eraymenekse.com', icon: (x, y, s) => lucide('globe', x, y, s), fill: 'url(#g)' });
button('btn-linkedin.svg', { label: 'LinkedIn', icon: linkedin, fill: '#0A66C2' });
button('btn-location.svg', {
  label: 'Bursa, Türkiye',
  icon: (x, y, s) => lucide('map-pin', x, y, s),
  fill: C.card,
  stroke: '#374151',
});

/* ------------------------------------------------------------ headings */

function heading(name, label) {
  const size = 24;
  const h = 54;
  const w = Math.ceil(30 + measure(label, size, bold) + 26);
  const body =
    `<rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="14" fill="${C.card}" stroke="${C.border}" stroke-width="1.5"/>` +
    `<rect x="13" y="15" width="5" height="${h - 30}" rx="2.5" fill="url(#g)"/>` +
    text(label, 30, baseline(h / 2, size), { size, font: bold, fill: C.title });
  write(name, svg(w, h, body, label));
}

heading('h-about.svg', 'About me');
heading('h-build.svg', 'What I build');
heading('h-flow.svg', 'How the pieces fit together');
heading('h-stack.svg', 'Tech stack');
heading('h-principles.svg', 'Engineering principles');
heading('h-connect.svg', "Let's connect");

/* --------------------------------------------------------------- about */

{
  const size = 17;
  const lineHeight = 29;
  const pad = 30;
  const runs = [
    { text: 'I design and build business software end to end, from the database and APIs to the web and mobile screens people use every day. My work sits where sales, production and warehouse operations meet: ' },
    { text: 'CRM, ERP, MES and WMS systems', bold: true },
    { text: ', the integrations that keep them in sync, and ' },
    { text: 'AI-powered tools', bold: true },
    { text: " that take repetitive work off people's plates." },
  ];
  const lines = wrap(runs, W - pad * 2, size);
  const h = pad * 2 + lineHeight * (lines.length - 1) + size;
  const body = card(0, 0, W, h, 20) + drawLines(lines, pad, pad + size * 0.8, size, lineHeight);
  write('about.svg', svg(W, h, body, runs.map((r) => r.text).join('')));
}

/* ------------------------------------------------------- feature cards */

function featureGrid(name, items, label) {
  const cols = 2;
  const gap = 20;
  const cardW = (W - gap) / cols;
  const pad = 22;
  const badge = 48;
  const titleSize = 20;
  const bodySize = 15;
  const lineHeight = 23;
  const textX = pad + badge + 16;
  const textW = cardW - textX - pad;

  const laid = items.map((item) => ({ ...item, lines: wrap(item.text, textW, bodySize) }));
  const contentH = Math.max(...laid.map((item) => titleSize + 12 + lineHeight * (item.lines.length - 1) + bodySize));
  const cardH = Math.max(badge, contentH) + pad * 2;
  const rows = Math.ceil(items.length / cols);
  const h = rows * cardH + (rows - 1) * gap;

  let body = '';
  laid.forEach((item, index) => {
    const x = (index % cols) * (cardW + gap);
    const y = Math.floor(index / cols) * (cardH + gap);
    body +=
      card(x, y, cardW, cardH) +
      `<rect x="${x + pad}" y="${y + pad}" width="${badge}" height="${badge}" rx="14" fill="url(#g)"/>` +
      lucide(item.icon, x + pad + 12, y + pad + 12, 24) +
      text(item.title, x + textX, y + pad + titleSize * 0.85, { size: titleSize, font: bold, fill: C.title }) +
      drawLines(item.lines, x + textX, y + pad + titleSize + 12 + bodySize * 0.8, bodySize, lineHeight);
  });
  write(name, svg(W, h, body, label ?? items.map((i) => `${i.title}: ${i.text}`).join(' ')));
}

featureGrid('build.svg', [
  { icon: 'handshake', title: 'CRM', text: 'Customer 360, sales pipeline, quotes and dealer networks, with role-based access control and a complete audit trail.' },
  { icon: 'factory', title: 'MES', text: 'Work orders, shop-floor data capture and real-time production tracking and reporting.' },
  { icon: 'package', title: 'WMS', text: 'Receiving, put-away, picking and shipping, driven by barcode-based mobile workflows.' },
  { icon: 'cable', title: 'ERP integrations', text: 'Reliable two-way sync of customers, products, orders and invoices, including multi-company setups.' },
  { icon: 'bot', title: 'AI & automation', text: 'LLM-powered assistants and AI agents that automate sales and back-office workflows.' },
  { icon: 'target', title: 'Customer discovery', text: 'Lead generation pipelines that find potential customers, enrich company data and score leads.' },
  { icon: 'smartphone', title: 'Mobile apps', text: 'iOS and Android apps and installable PWAs for sales, field and shop-floor teams.' },
  { icon: 'messages-square', title: 'Real-time collaboration', text: 'Live messaging, notifications and video meetings built into business apps.' },
]);

featureGrid('principles.svg', [
  { icon: 'shield-check', title: 'Secure by default', text: 'Authentication, authorization, encryption and audit trails from day one.' },
  { icon: 'zap', title: 'Fast', text: 'Screens and actions designed to respond in under a second.' },
  { icon: 'flask-conical', title: 'Tested', text: 'Unit, integration and end-to-end tests on every change.' },
  { icon: 'languages', title: 'Global-ready', text: 'Multi-language interfaces with accessibility built in.' },
]);

/* ------------------------------------------------------------- diagram */

{
  // Three columns with wide gutters so edge labels never cover a node.
  const h = 462;
  const nodeW = 180;
  const nodeH = 74;
  const nodes = {
    ai: { x: 45, y: 70, title: 'AI agents', sub: 'lead discovery', fill: C.blue },
    crm: { x: 45, y: 236, title: 'CRM', sub: 'customers · pipeline', fill: C.purple },
    erp: { x: 330, y: 153, title: 'ERP', sub: 'finance · stock', fill: C.purple },
    mes: { x: 615, y: 70, title: 'MES', sub: 'production tracking', fill: C.purple },
    wms: { x: 615, y: 236, title: 'WMS', sub: 'receiving · shipping', fill: C.purple },
  };
  const cx = (n) => n.x + nodeW / 2;
  const cy = (n) => n.y + nodeH / 2;

  const group = (x, y, w, gh, label) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${gh}" rx="18" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="6 6"/>` +
    text(label, x + 18, y + 26, { size: 12, font: bold, fill: C.muted });

  const node = (n) =>
    `<rect x="${n.x}" y="${n.y}" width="${nodeW}" height="${nodeH}" rx="16" fill="${n.fill}"/>` +
    text(n.title, cx(n), n.y + 32, { size: 20, font: bold, fill: '#FFFFFF', anchor: 'middle' }) +
    text(n.sub, cx(n), n.y + 55, { size: 13, fill: '#E0E7FF', anchor: 'middle' });

  const label = (str, x, y) => {
    const size = 13;
    const w = measure(str, size) + 16;
    return (
      `<rect x="${x - w / 2}" y="${y - 12}" width="${w}" height="22" rx="11" fill="${C.card}" stroke="#334155"/>` +
      text(str, x, y + 4, { size, fill: C.body, anchor: 'middle' })
    );
  };

  const edge = (d, both = false, dashed = false) =>
    `<path d="${d}" fill="none" stroke="${C.muted}" stroke-width="2"${dashed ? ' stroke-dasharray="5 6"' : ''} marker-end="url(#arrow)"${both ? ' marker-start="url(#arrow)"' : ''}/>`;

  const { ai, crm, erp, mes, wms } = nodes;
  const appY = 384;

  let body = card(0, 0, W, h, 22);
  body += group(20, 24, 230, 318, 'FRONT OFFICE');
  body += group(290, 24, 530, 318, 'BACK OFFICE');
  // Edges first so nodes and labels sit on top.
  body += edge(`M${cx(ai)} ${ai.y + nodeH} V${crm.y - 4}`);
  body += edge(`M${crm.x + nodeW} ${cy(crm)} C 270 ${cy(crm)}, 285 ${cy(erp)}, ${erp.x - 4} ${cy(erp)}`);
  body += edge(`M${erp.x + nodeW + 4} ${cy(erp) - 14} C 560 ${cy(erp) - 14}, 570 ${cy(mes)}, ${mes.x - 4} ${cy(mes)}`, true);
  body += edge(`M${erp.x + nodeW + 4} ${cy(erp) + 14} C 560 ${cy(erp) + 14}, 570 ${cy(wms)}, ${wms.x - 4} ${cy(wms)}`, true);
  body += edge(`M${cx(mes)} ${mes.y + nodeH} V${wms.y - 4}`);
  body += edge(`M${cx(crm)} ${appY} V${crm.y + nodeH + 4}`, false, true);
  body += edge(`M${cx(erp)} ${appY} V${erp.y + nodeH + 4}`, false, true);
  body += edge(`M${cx(wms)} ${appY} V${wms.y + nodeH + 4}`, false, true);

  body += Object.values(nodes).map(node).join('');
  body += label('qualified leads', cx(ai), 190);
  body += label('orders', 272, 232);
  body += label('work orders', 562, 138);
  body += label('stock levels', 562, 244);
  body += label('finished goods', cx(mes), 190);

  body += `<rect x="45" y="${appY}" width="${W - 90}" height="54" rx="16" fill="${C.teal}"/>`;
  body += lucide('smartphone', 70, appY + 15, 24);
  body += text('Web & mobile apps (PWA, iOS, Android)', 106, baseline(appY + 27, 18), { size: 18, font: bold, fill: '#FFFFFF' });

  write(
    'flow.svg',
    svg(W, h, body, 'AI agents feed qualified leads to CRM; CRM sends orders to ERP; ERP exchanges work orders with MES and stock levels with WMS; MES sends finished goods to WMS; web and mobile apps sit on top of CRM, ERP and WMS.'),
  );
}

/* ----------------------------------------------------------- tech icons */

// Skillicons tiles are copied as-is; Devicon / Simple Icons logos get the same
// dark rounded tile so every icon in the row looks alike.
for (const file of fs.readdirSync(path.join(here, 'sources', 'skill'))) {
  fs.copyFileSync(path.join(here, 'sources', 'skill', file), path.join(assets, 'icons', file));
}

/** `fill` colors single-color marks (their paths carry no fill of their own). */
function tile(name, src, { pad = 46, fill } = {}) {
  const source = fs.readFileSync(src, 'utf8');
  const viewBox = source.match(/viewBox="([^"]+)"/)[1];
  const inner = source
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<title>[\s\S]*?<\/title>/, '');
  const content =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="48" height="48" viewBox="0 0 256 256">` +
    `<rect width="256" height="256" rx="60" fill="#242938"/>` +
    `<svg x="${pad}" y="${pad}" width="${256 - pad * 2}" height="${256 - pad * 2}" viewBox="${viewBox}"${fill ? ` fill="${fill}"` : ''}>${inner}</svg></svg>\n`;
  fs.writeFileSync(path.join(assets, 'icons', `${name}.svg`), content);
}

const devicon = (name) => path.join(here, 'sources', 'devicon', `${name}.svg`);
tile('entityframeworkcore', devicon('entityframeworkcore'), { pad: 34 });
tile('android', devicon('android'));
tile('playwright', devicon('playwright'));
// Dark brand colors vanish on the dark tile: single-color marks in a lighter tone.
tile('microsoftsqlserver', devicon('microsoftsqlserver-plain'), { pad: 40, fill: '#F2555A' });
tile('oracle', path.join(here, 'sources', 'oracle-si.svg'), { pad: 50, fill: '#F80000' });
tile('pwa', path.join(here, 'sources', 'pwa.svg'), { pad: 50, fill: '#FFFFFF' });
console.log('icons                     ', fs.readdirSync(path.join(assets, 'icons')).length);
