#!/usr/bin/env node
// Content QA for the gregfrye.us content tree. Node built-ins only.
//
//   node check-content.mjs <repo> [--public] [--no-info]
//
// Reads <repo>/content the same way lib/content.ts + lib/content-blocks.ts do
// and reports findings grouped by page. --public promotes drafting-state
// WARNs (brackets, stub lines, placeholder image slots) to ERRORs: the gate
// before claude/preview -> main. Exits 1 on any ERROR.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// ---------------------------------------------------------------- args

const args = process.argv.slice(2);
const PUBLIC = args.includes("--public");
const NO_INFO = args.includes("--no-info");
const repo = path.resolve(args.find((a) => !a.startsWith("--")) ?? ".");
const CONTENT = path.join(repo, "content");
if (!fs.existsSync(CONTENT)) {
  console.error(`No content/ directory under ${repo}`);
  process.exit(2);
}

// ---------------------------------------------------------------- constants (mirrors lib/content-blocks.ts)

const BLOCK_TYPES = ["full", "pair", "inset", "stagger", "scroll", "motion"];
const IMAGE_FILE = /^(\S+\.(?:jpe?g|png|webp|gif|avif))\s*(?:\|\s*(.*))?$/i;
const LOOKS_LIKE_FILE = /^(\S+\.([a-z0-9]{2,5}))(\s*\||\s*$)/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)$/i;
const MAX_EDGE = 2400;
const MAX_BYTES = 1.5 * 1024 * 1024;
// Seed vocabulary from CLAUDE.md; labels used by other case studies are added at runtime.
const SPINE_VOCAB = ["Context", "Complication", "The Turn", "Approach", "Positioning", "Market Thesis", "Entry"];
const MOOD = /\b(shepherd\w*|resonan\w*|journey\w*)\b/gi;
const STUB_CS = /\b(TBD|TODO|FIXME|TK|NEEDED|XXX)\b/; // case-sensitive
const STUB_CI = /\b(phase\s*[2-9]|lorem ipsum|coming soon)\b/i;
const BRACKET = /\[([^\]\n]+)\](?!\()/g; // [note] but not [link](url)
const PROMOTE_IN_PUBLIC = new Set(["bracket", "stub", "placeholder", "draft"]);

// ---------------------------------------------------------------- findings

const findings = [];
const rel = (p) => path.relative(repo, p);
function add(page, severity, code, file, line, msg) {
  if (PUBLIC && severity === "WARN" && PROMOTE_IN_PUBLIC.has(code)) severity = "ERROR";
  findings.push({ page, severity, code, file: file ? rel(file) : "", line, msg });
}
const stats = new Map(); // page -> { counters }
function bump(page, key, n = 1) {
  if (!stats.has(page)) stats.set(page, {});
  const s = stats.get(page);
  s[key] = (s[key] ?? 0) + n;
}

// ---------------------------------------------------------------- frontmatter (simple YAML subset)

function parseScalar(v) {
  v = v.trim();
  if (v === "") return "";
  if (/^".*"$/.test(v) || /^'.*'$/.test(v)) return v.slice(1, -1).replace(/\\"/g, '"');
  if (v === "true") return true;
  if (v === "false") return false;
  if (v.startsWith("[") && v.endsWith("]")) {
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    const items = [];
    let cur = "", q = null;
    for (const ch of inner) {
      if (q) { if (ch === q) q = null; cur += ch; }
      else if (ch === '"' || ch === "'") { q = ch; cur += ch; }
      else if (ch === ",") { items.push(cur); cur = ""; }
      else cur += ch;
    }
    items.push(cur);
    return items.map((s) => parseScalar(s));
  }
  return v.replace(/\s+#.*$/, "");
}

function parseMdx(file) {
  const raw = fs.readFileSync(file, "utf-8").replace(/\r\n/g, "\n");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, keyLines: {}, body: raw, bodyStart: 1, raw, noFrontmatter: true };
  const fmLines = m[1].split("\n");
  const data = {}, keyLines = {};
  let i = 0;
  while (i < fmLines.length) {
    const line = fmLines[i];
    const km = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!km) { i++; continue; }
    const [, key, val] = km;
    keyLines[key] = i + 2; // +1 for '---', +1 for 1-based
    if (val.trim() !== "") { data[key] = parseScalar(val); i++; continue; }
    // block list
    const list = [];
    i++;
    while (i < fmLines.length && /^\s+(-|\w)/.test(fmLines[i])) {
      const item = fmLines[i].match(/^(\s*)-\s*(.*)$/);
      if (item) {
        const kv = item[2].match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (kv) {
          const obj = { [kv[1]]: parseScalar(kv[2]) };
          i++;
          while (i < fmLines.length && /^\s+[A-Za-z_][\w-]*:/.test(fmLines[i]) && !/^\s*-/.test(fmLines[i])) {
            const kv2 = fmLines[i].trim().match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
            obj[kv2[1]] = parseScalar(kv2[2]);
            i++;
          }
          list.push(obj);
          continue;
        }
        list.push(parseScalar(item[2]));
      }
      i++;
    }
    data[key] = list;
  }
  const bodyStart = m[0].split("\n").length - (m[0].endsWith("\n") ? 1 : 0) + 1;
  return { data, keyLines, body: raw.slice(m[0].length), bodyStart, raw };
}

// ---------------------------------------------------------------- fs helpers

const isDir = (p) => fs.existsSync(p) && fs.statSync(p).isDirectory();
const folderSlugs = (dir) =>
  isDir(dir) ? fs.readdirSync(dir).filter((n) => isDir(path.join(dir, n)) && fs.existsSync(path.join(dir, n, "index.mdx"))).sort() : [];
const flatSlugs = (dir) => (isDir(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).map((f) => f.slice(0, -4)).sort() : []);
const imageFiles = (dir) => (isDir(dir) ? fs.readdirSync(dir).filter((f) => IMAGE_EXT.test(f)).sort() : []);
const arr = (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);

function dirSize(dir) {
  let bytes = 0, files = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { const s = dirSize(p); bytes += s.bytes; files += s.files; }
    else { bytes += fs.statSync(p).size; files++; }
  }
  return { bytes, files };
}
const mb = (b) => `${(b / 1024 / 1024).toFixed(2)}MB`;

// ---------------------------------------------------------------- image headers

function imageInfo(file) {
  const buf = fs.readFileSync(file);
  const info = { bytes: buf.length, format: "unknown", width: null, height: null };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    info.format = "jpeg";
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker === 0xff) { i++; continue; }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        info.height = buf.readUInt16BE(i + 5);
        info.width = buf.readUInt16BE(i + 7);
        break;
      }
      i += 2 + len;
    }
  } else if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    info.format = "png";
    info.width = buf.readUInt32BE(16);
    info.height = buf.readUInt32BE(20);
  } else if (buf.slice(0, 3).toString() === "GIF") {
    info.format = "gif";
    info.width = buf.readUInt16LE(6);
    info.height = buf.readUInt16LE(8);
  } else if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") {
    info.format = "webp";
  }
  info.hash = crypto.createHash("md5").update(buf).digest("hex");
  return info;
}

const hashes = new Map(); // md5 -> [relpath]

function checkImageFile(page, file) {
  const info = imageInfo(file);
  const ext = path.extname(file).toLowerCase();
  const expected = { ".jpg": "jpeg", ".jpeg": "jpeg", ".png": "png", ".gif": "gif", ".webp": "webp" }[ext];
  if (expected && info.format !== "unknown" && expected !== info.format)
    add(page, "WARN", "image-format", file, null, `extension ${ext} but file is ${info.format}`);
  const edge = Math.max(info.width ?? 0, info.height ?? 0);
  if (edge > MAX_EDGE)
    add(page, "WARN", "image-size", file, null, `${info.width}x${info.height} — long edge ${edge}px > ${MAX_EDGE}px`);
  if (info.bytes > MAX_BYTES) add(page, "WARN", "image-weight", file, null, `${mb(info.bytes)} > ${mb(MAX_BYTES)}`);
  if (info.format !== "jpeg")
    add(page, "INFO", "image-format", file, null, `${info.format.toUpperCase()}, not JPEG (CLAUDE.md: images land as JPEG)` + (info.width ? ` — ${info.width}x${info.height}` : ""));
  if (!/^\d{2}[a-z]?-/.test(path.basename(file)))
    add(page, "WARN", "image-name", file, null, `filename lacks NN- display-order prefix — sorts unpredictably as card fallback`);
  if (!hashes.has(info.hash)) hashes.set(info.hash, []);
  hashes.get(info.hash).push({ page, file: rel(file) });
  return info;
}

function checkImagesFolder(page, dir, { referenced, exempt = new Set(), exemptWhy = "", hasBody }) {
  if (!isDir(dir)) return [];
  const files = imageFiles(dir);
  bump(page, "images on disk", files.length);
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      const s = dirSize(p);
      add(page, "WARN", "staging-folder", p, null,
        `subfolder with ${s.files} files, ${mb(s.bytes)} — ignored by lib/content.ts but still publicly reachable via /content-images/${path.relative(CONTENT, p)}/…`);
    } else if (!IMAGE_EXT.test(e.name) && e.name !== ".gitkeep") {
      add(page, "WARN", "stray-file", p, null, `non-image file in images/`);
    }
  }
  for (const f of files) {
    checkImageFile(page, path.join(dir, f));
    if (referenced.has(f)) continue;
    if (exempt.has(f)) continue;
    add(page, "WARN", "unreferenced-image", path.join(dir, f), null,
      hasBody ? "no fence block or featuredImage references this file — never rendered" : `never rendered — only the card image (${exemptWhy}) is shown for this entity`);
  }
  return files;
}

// ---------------------------------------------------------------- text checks

function textChecks(page, file, line, text, { onImageLine = false, where = "" } = {}) {
  const loc = where ? ` (${where})` : "";
  let m;
  BRACKET.lastIndex = 0;
  let brackets = 0;
  while ((m = BRACKET.exec(text))) {
    brackets++;
    add(page, "WARN", "bracket", file, line, `drafting note${loc}: [${m[1]}]`);
  }
  if (brackets) bump(page, "brackets", brackets);
  if (!onImageLine) {
    const outside = text.replace(BRACKET, " ");
    const s = outside.match(STUB_CS) ?? outside.match(STUB_CI);
    if (s) { bump(page, "stubs"); add(page, "WARN", "stub", file, line, `stub/planning text "${s[0]}"${loc}: ${clip(text)}`); }
  }
  MOOD.lastIndex = 0;
  while ((m = MOOD.exec(text))) {
    const before = text.slice(0, m.index), after = text.slice(m.index);
    const quoted = (/"[^"]*$/.test(before) && /^[^"]*"/.test(after)) || (/“[^”]*$/.test(before) && /^[^“]*”/.test(after));
    const uiLabel = onImageLine && /^[A-Z]/.test(m[0]);
    if (quoted || uiLabel)
      add(page, "INFO", "mood-word", file, line, `"${m[0]}" ${quoted ? "inside a quoted string" : "capitalized in image alt text"} — likely product UI copy, not narrative voice${loc}: ${clip(text)}`);
    else add(page, "WARN", "mood-word", file, line, `banned mood word "${m[0]}"${loc}: ${clip(text)}`);
  }
}
const clip = (s, n = 110) => { s = s.trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };

// ---------------------------------------------------------------- MDX body checks

function checkBody(page, file, parsed, imagesDir, { kind, spineLabels }) {
  const lines = parsed.body.split("\n");
  const L = (i) => parsed.bodyStart + i;
  const referenced = new Set();
  let inCode = false;
  let block = null; // { type, line, slots: [], captions: 0 }
  const onDisk = new Set(imageFiles(imagesDir));
  const spineStack = [];
  let resultsSeen = false;

  const closeBlock = () => {
    const n = block.slots;
    if (n === 0) add(page, "WARN", "fence-empty", file, block.line, `::: ${block.type} block has no image lines`);
    if (block.type === "pair" && n !== 2) add(page, "WARN", "fence-count", file, block.line, `::: pair has ${n} image(s), expects 2`);
    if ((block.type === "full" || block.type === "inset") && n > 1) add(page, "WARN", "fence-count", file, block.line, `::: ${block.type} has ${n} images, renders as a single image`);
    if (["stagger", "scroll"].includes(block.type) && n > 3) add(page, "INFO", "fence-count", file, block.line, `::: ${block.type} has ${n} images; v1 grid wraps at 3 across`);
    if (block.captions > 1) add(page, "WARN", "fence-caption", file, block.line, `${block.captions} Caption: lines — only the last is kept`);
    block = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    if (t.startsWith("```")) { inCode = !inCode; continue; }
    if (inCode) continue;

    if (block) {
      if (t === ":::") { closeBlock(); continue; }
      const opener = line.match(/^\s*:::\s*(\w+)\s*$/);
      if (opener) {
        add(page, "ERROR", "fence-unclosed", file, block.line, `::: ${block.type} not closed before next opener at line ${L(i)} — the opener is swallowed as an image line`);
        closeBlock();
        i--; continue;
      }
      if (t === "") continue;
      const cap = t.match(/^Caption:\s*(.+)$/);
      if (cap) { block.captions++; textChecks(page, file, L(i), cap[1], { where: "caption" }); continue; }
      const num = t.match(/^\d+\.\s*(.+)$/);
      const entry = num ? num[1] : t;
      block.slots++;
      const fm = entry.match(IMAGE_FILE);
      if (fm) {
        const name = fm[1], alt = (fm[2] ?? "").trim();
        bump(page, "image refs");
        referenced.add(name);
        if (!onDisk.has(name)) {
          const ci = [...onDisk].find((f) => f.toLowerCase() === name.toLowerCase());
          add(page, "ERROR", "image-missing", file, L(i),
            ci ? `${name} — case mismatch with ${ci} (works on macOS, 404s on Vercel)` : `${name} not found in ${rel(imagesDir)}/`);
        }
        if (!alt) add(page, "WARN", "alt-missing", file, L(i), `${name} has no alt text (add " | description")`);
        else textChecks(page, file, L(i), alt, { onImageLine: true, where: "alt" });
      } else {
        const lf = entry.match(LOOKS_LIKE_FILE);
        if (lf && !IMAGE_EXT.test(lf[1]) && /^[\w.-]+$/.test(lf[1]) && !/^\d+(\.\d+)?$/.test(lf[1]))
          add(page, "ERROR", "image-ext", file, L(i), `"${lf[1]}" looks like a filename but .${lf[2]} isn't a supported image type — renders as placeholder text`);
        bump(page, "placeholders");
        add(page, "WARN", "placeholder", file, L(i), `placeholder slot in ::: ${block.type}: ${clip(entry)}`);
        textChecks(page, file, L(i), entry, { onImageLine: true, where: "placeholder" });
      }
      continue;
    }

    // not in a block
    const open = line.match(/^:::\s*(\w+)\s*$/);
    if (open) {
      if (BLOCK_TYPES.includes(open[1])) { block = { type: open[1], line: L(i), slots: 0, captions: 0 }; bump(page, "fence blocks"); }
      else add(page, "ERROR", "fence-type", file, L(i), `unknown fence type "::: ${open[1]}" — passes through as literal text (valid: ${BLOCK_TYPES.join(", ")})`);
      continue;
    }
    if (t.startsWith(":::")) {
      if (t === ":::") add(page, "ERROR", "fence-stray", file, L(i), `stray ::: closer with no open block — renders as literal text`);
      else add(page, "ERROR", "fence-malformed", file, L(i), `malformed fence opener "${clip(t, 40)}" (must be "::: type" at column 0)`);
      continue;
    }

    // SpineSection balance
    if (!resultsSeen && line.includes("## Results")) {
      resultsSeen = true;
      if (spineStack.length) add(page, "ERROR", "spine-split", file, L(i), `"## Results" falls inside <SpineSection> opened at line ${spineStack.at(-1)} — splitClientContent() will cut the tag in half`);
    }
    const tagRe = /<(\/?)SpineSection\b([^>]*?)(\/?)>/g;
    let tm;
    while ((tm = tagRe.exec(line))) {
      const [, closing, attrs, selfClose] = tm;
      if (closing) {
        if (!spineStack.length) add(page, "ERROR", "spine-balance", file, L(i), `</SpineSection> with no open tag`);
        else spineStack.pop();
        continue;
      }
      if (kind !== "client") add(page, "WARN", "spine-in-project", file, L(i), `<SpineSection> in a project body — projects are chapters, no spine labels`);
      if (spineStack.length) add(page, "ERROR", "spine-balance", file, L(i), `<SpineSection> opened inside another (line ${spineStack.at(-1)}) — missing </SpineSection>`);
      bump(page, "spine sections");
      const label = attrs.match(/label="([^"]*)"/)?.[1];
      const subhead = attrs.match(/subhead="([^"]*)"/)?.[1];
      if (label == null) add(page, "ERROR", "spine-attr", file, L(i), `<SpineSection> missing label`);
      else spineLabels.push({ label, file, line: L(i) });
      if (subhead == null) add(page, "WARN", "spine-attr", file, L(i), `<SpineSection label="${label}"> missing subhead`);
      if (!selfClose) spineStack.push(L(i));
    }
    if (/<\/?SpineSection\b[^>]*$/.test(line) && !tagRe.test(line)) add(page, "WARN", "spine-parse", file, L(i), `multi-line <SpineSection> tag — not checked`);

    // text checks on prose / headings / list items / jsx attrs
    if (t) textChecks(page, file, L(i), line);
  }
  if (block) add(page, "ERROR", "fence-unclosed", file, block.line, `::: ${block.type} never closed — swallows everything to end of file`), closeBlock();
  for (const ln of spineStack) add(page, "ERROR", "spine-balance", file, ln, `<SpineSection> opened here is never closed`);
  return { referenced, hasResults: /^## Results\b/m.test(parsed.body), hasCredits: /^## Credits\b/m.test(parsed.body), empty: parsed.body.trim() === "" };
}

function requireFields(page, file, parsed, fields) {
  if (parsed.noFrontmatter) { add(page, "ERROR", "frontmatter", file, 1, "no frontmatter block"); return; }
  for (const f of fields) {
    const v = parsed.data[f];
    if (v == null || v === "") add(page, "ERROR", "field-missing", file, null, `required frontmatter "${f}" missing`);
  }
}
function fmText(page, file, parsed, keys) {
  for (const k of keys) {
    const v = parsed.data[k];
    if (typeof v === "string") textChecks(page, file, parsed.keyLines[k], v, { where: `frontmatter ${k}` });
  }
}
function checkFeaturedImage(page, file, parsed, imagesDir) {
  const fi = parsed.data.featuredImage;
  if (!fi) return null;
  if (!imageFiles(imagesDir).includes(fi))
    add(page, "ERROR", "featured-missing", file, parsed.keyLines.featuredImage, `featuredImage "${fi}" not in ${rel(imagesDir)}/`);
  return fi;
}

// ---------------------------------------------------------------- load collections

const G_GRAPH = "Content graph";
const G_ROLES = "Roles  (/roles/[slug], homepage roles index)";
const G_SKILLS = "Skills  (/skills/[slug])";
const G_STUDIES = "Studies  (homepage strip only — no route)";
const clientPage = (slug, name) => `/work/${slug}${name ? `  (${name})` : ""}`;

const rolesDir = path.join(CONTENT, "roles");
const clientsDir = path.join(CONTENT, "clients");
const skillsDir = path.join(CONTENT, "skills");
const studiesDir = path.join(CONTENT, "studies");

const roles = new Map();
for (const slug of flatSlugs(rolesDir)) {
  const file = path.join(rolesDir, `${slug}.mdx`);
  const p = parseMdx(file);
  roles.set(slug, { slug, file, p, clients: arr(p.data.clients), skills: arr(p.data.skills) });
}
const skills = new Map();
for (const slug of folderSlugs(skillsDir)) {
  const file = path.join(skillsDir, slug, "index.mdx");
  skills.set(slug, { slug, file, p: parseMdx(file), dir: path.join(skillsDir, slug) });
}
const clients = new Map();
for (const slug of folderSlugs(clientsDir)) {
  const dir = path.join(clientsDir, slug);
  const file = path.join(dir, "index.mdx");
  const p = parseMdx(file);
  const projDir = path.join(dir, "projects");
  const projects = new Map();
  for (const ps of folderSlugs(projDir)) {
    const pdir = path.join(projDir, ps);
    const pfile = path.join(pdir, "index.mdx");
    const artifacts = new Map();
    for (const as of folderSlugs(path.join(pdir, "artifacts"))) {
      const adir = path.join(pdir, "artifacts", as);
      artifacts.set(as, { slug: as, dir: adir, file: path.join(adir, "index.mdx"), p: parseMdx(path.join(adir, "index.mdx")) });
    }
    projects.set(ps, { slug: ps, dir: pdir, file: pfile, p: parseMdx(pfile), artifacts });
  }
  clients.set(slug, { slug, dir, file, p, projects, roles: arr(p.data.roles), order: p.data.projects == null ? null : arr(p.data.projects) });
}
const studies = new Map();
for (const slug of folderSlugs(studiesDir)) {
  const file = path.join(studiesDir, slug, "index.mdx");
  studies.set(slug, { slug, file, p: parseMdx(file) });
}

// drafts: visible on wip, hidden on Production; --public blocks the merge until the flag comes off
for (const c of clients.values()) {
  const page = clientPage(c.slug, c.p.data.name);
  if (c.p.data.draft === true) add(page, "WARN", "draft", c.file, c.p.keyLines.draft, "draft: true — hidden on gregfrye.us");
  for (const pr of c.projects.values())
    if (pr.p.data.draft === true) add(page, "WARN", "draft", pr.file, pr.p.keyLines.draft, `project "${pr.slug}" is draft: true — hidden on gregfrye.us`);
}

// directories the loader silently skips
for (const [base, label] of [[clientsDir, "client"], [skillsDir, "skill"], [studiesDir, "study"]]) {
  if (!isDir(base)) continue;
  for (const n of fs.readdirSync(base)) {
    const p = path.join(base, n);
    if (isDir(p) && !fs.existsSync(path.join(p, "index.mdx"))) add(G_GRAPH, "WARN", "orphan-dir", p, null, `${label} folder without index.mdx — silently skipped`);
  }
}
for (const c of clients.values()) {
  const pd = path.join(c.dir, "projects");
  if (isDir(pd)) for (const n of fs.readdirSync(pd)) if (isDir(path.join(pd, n)) && !fs.existsSync(path.join(pd, n, "index.mdx")))
    add(clientPage(c.slug), "WARN", "orphan-dir", path.join(pd, n), null, "project folder without index.mdx — silently skipped");
}

// ---------------------------------------------------------------- roles

const currentRoles = [];
for (const r of roles.values()) {
  requireFields(G_ROLES, r.file, r.p, ["company", "title", "years", "location", "description"]);
  fmText(G_ROLES, r.file, r.p, ["company", "title", "description"]);
  if (r.p.data.current === true) currentRoles.push(r);
  for (const c of r.clients) {
    if (!clients.has(c)) add(G_ROLES, "ERROR", "ref-client", r.file, r.p.keyLines.clients, `role "${r.slug}" → missing client "${c}"`);
    else if (!clients.get(c).roles.includes(r.slug))
      add(clientPage(c, clients.get(c).p.data.name), "ERROR", "ref-twoway", clients.get(c).file, clients.get(c).p.keyLines.roles,
        `role "${r.slug}" lists this client, but client.roles[] doesn't list "${r.slug}" — getRolesByClient/getClientsByRole disagree`);
  }
  for (const s of r.skills) if (!skills.has(s)) add(G_ROLES, "ERROR", "ref-skill", r.file, r.p.keyLines.skills, `role "${r.slug}" → missing skill "${s}"`);
  for (const n of arr(r.p.data.names)) {
    const slugish = String(n).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (clients.has(slugish)) add(G_ROLES, "WARN", "names-entity", r.file, r.p.keyLines.names, `names[] has "${n}" but client entity "${slugish}" exists — move it to clients[]`);
  }
  if (body(r.p)) add(G_ROLES, "WARN", "role-body", r.file, r.p.bodyStart, "role body is never rendered");
}
function body(p) { return p.body.trim() !== ""; }
if (currentRoles.length > 1) add(G_ROLES, "ERROR", "current-role", null, null, `${currentRoles.length} roles marked current: true (${currentRoles.map((r) => r.slug).join(", ")}) — at most one`);
if (currentRoles.length === 0) add(G_ROLES, "WARN", "current-role", null, null, `no role marked current: true — homepage hero has no about copy`);
for (const r of currentRoles) {
  const latest = [...roles.values()].sort((a, b) => yr(b.p.data.years) - yr(a.p.data.years))[0];
  if (latest && latest !== r && yr(latest.p.data.years) > yr(r.p.data.years))
    add(G_ROLES, "INFO", "current-role", r.file, r.p.keyLines.current,
      `current role "${r.slug}" (${r.p.data.years}) is not the most recent era — "${latest.slug}" (${latest.p.data.years}) sorts first on the roles index`);
}
function yr(y) { return Number(String(y ?? "").match(/\d{4}/)?.[0] ?? 0); }

// ---------------------------------------------------------------- skills

for (const s of skills.values()) {
  requireFields(G_SKILLS, s.file, s.p, ["name", "summary"]);
  fmText(G_SKILLS, s.file, s.p, ["name", "summary"]);
  if (body(s.p)) add(G_SKILLS, "WARN", "skill-body", s.file, s.p.bodyStart, "skills have no body — this text is never rendered");
  const imgDir = path.join(s.dir, "images");
  const fi = checkFeaturedImage(G_SKILLS, s.file, s.p, imgDir);
  const card = fi ?? imageFiles(imgDir)[0];
  checkImagesFolder(G_SKILLS, imgDir, { referenced: new Set(), exempt: new Set(card ? [card] : []), exemptWhy: card ?? "", hasBody: false });
  let used = false;
  for (const c of clients.values()) for (const p of c.projects.values()) if (arr(p.p.data.skills).includes(s.slug)) used = true;
  for (const r of roles.values()) if (r.skills.includes(s.slug)) used = true;
  if (!used) add(G_SKILLS, "WARN", "skill-unused", s.file, null, `skill "${s.slug}" is referenced by no role or project — /skills/${s.slug} lists nothing`);
}

// ---------------------------------------------------------------- clients, projects, artifacts

const spineLabelsByClient = new Map();
for (const c of clients.values()) {
  const page = clientPage(c.slug, c.p.data.name);
  stats.set(page, stats.get(page) ?? {});
  requireFields(page, c.file, c.p, ["name", "roles", "summary"]);
  fmText(page, c.file, c.p, ["name", "summary", "years"]);
  for (const st of arr(c.p.data.stats)) if (st && typeof st === "object") for (const v of Object.values(st)) textChecks(page, c.file, c.p.keyLines.stats, String(v), { where: "stats" });
  if (arr(c.p.data.stats).length > 3) add(page, "WARN", "stats", c.file, c.p.keyLines.stats, `${arr(c.p.data.stats).length} stats — three max, by design`);

  for (const r of c.roles) {
    if (!roles.has(r)) add(page, "ERROR", "ref-role", c.file, c.p.keyLines.roles, `client → missing role "${r}"`);
    else if (!roles.get(r).clients.includes(c.slug))
      add(page, "ERROR", "ref-twoway", roles.get(r).file, roles.get(r).p.keyLines.clients, `client.roles[] lists "${r}", but role "${r}" doesn't list "${c.slug}" in clients[]`);
  }

  // projects[] order vs disk
  const onDisk = [...c.projects.keys()];
  if (c.order == null && onDisk.length) add(page, "ERROR", "projects-order", c.file, null, `no projects[] — ${onDisk.length} project(s) on disk render in directory order`);
  const order = c.order ?? [];
  const seen = new Set();
  for (const s of order) {
    if (seen.has(s)) add(page, "WARN", "projects-order", c.file, c.p.keyLines.projects, `projects[] lists "${s}" twice`);
    seen.add(s);
    if (s.includes("/")) add(page, "ERROR", "projects-order", c.file, c.p.keyLines.projects, `projects[] entry "${s}" must be short form`);
    else if (!c.projects.has(s)) add(page, "ERROR", "projects-order", c.file, c.p.keyLines.projects, `projects[] lists "${s}" — not on disk`);
  }
  for (const s of onDisk) if (c.order && !order.includes(s)) add(page, "ERROR", "projects-order", c.file, c.p.keyLines.projects, `project "${s}" on disk but missing from projects[]`);

  // client body + images
  const labels = [];
  spineLabelsByClient.set(c.slug, labels);
  const clientImgDir = path.join(c.dir, "images");
  const cb = checkBody(page, c.file, c.p, clientImgDir, { kind: "client", spineLabels: labels });
  const cfi = checkFeaturedImage(page, c.file, c.p, clientImgDir);
  const cardImg = cfi ?? imageFiles(clientImgDir)[0];
  if (cfi) cb.referenced.add(cfi);
  checkImagesFolder(page, clientImgDir, { referenced: cb.referenced, exempt: new Set(cardImg ? [cardImg] : []), hasBody: true });
  if (cb.empty) add(page, "WARN", "empty-case-study", c.file, null, `client body is empty — /work/${c.slug} renders header + projects only, no spine`);
  else {
    if (!cb.hasResults) add(page, "INFO", "closing", c.file, null, "no ## Results — whole body renders as spine");
    if (!cb.hasCredits) add(page, "INFO", "closing", c.file, null, "no ## Credits");
  }
  if (!cardImg && c.p.data.featuredOnHome) add(page, "INFO", "card", c.file, null, "featuredOnHome with no image — text-only card");
  bump(page, "projects", onDisk.length);

  for (const pr of c.projects.values()) {
    const pf = pr.file;
    requireFields(page, pf, pr.p, ["title", "role", "summary"]);
    fmText(page, pf, pr.p, ["title", "summary"]);
    for (const k of ["client", "slug"]) if (k in pr.p.data) add(page, "WARN", "derived-field", pf, pr.p.keyLines[k], `"${k}" is derived from the path — never author it`);
    const role = pr.p.data.role;
    if (role && !roles.has(role)) add(page, "ERROR", "ref-role", pf, pr.p.keyLines.role, `project "${c.slug}/${pr.slug}" → missing role "${role}"`);
    else if (role && !c.roles.includes(role)) add(page, "WARN", "ref-role", pf, pr.p.keyLines.role, `project role "${role}" isn't in client.roles[] (${c.roles.join(", ")})`);
    if (!arr(pr.p.data.skills).length) add(page, "WARN", "ref-skill", pf, null, `project has no skills — contributes nothing to the client's derived skill list`);
    for (const s of arr(pr.p.data.skills)) if (!skills.has(s)) add(page, "ERROR", "ref-skill", pf, pr.p.keyLines.skills, `project "${c.slug}/${pr.slug}" → missing skill "${s}"`);
    const pImg = path.join(pr.dir, "images");
    const pb = checkBody(page, pf, pr.p, pImg, { kind: "project", spineLabels: [] });
    const pfi = checkFeaturedImage(page, pf, pr.p, pImg);
    if (pfi) pb.referenced.add(pfi);
    const pcard = pfi ?? imageFiles(pImg)[0];
    const pex = new Set(pr.p.data.featuredOnHome && pcard ? [pcard] : []);
    const pfiles = checkImagesFolder(page, pImg, { referenced: pb.referenced, exempt: pex, hasBody: true });
    if (pb.empty && !pfiles.length) add(page, "WARN", "empty-project", pf, null, `project "${pr.slug}" has no body and no images — renders as title + summary only`);
    if (/^## /m.test(pr.p.body)) add(page, "INFO", "project-heading", pf, null, "project body uses ## headings — will look like a page section inside <ProjectSection>");

    for (const a of pr.artifacts.values()) {
      requireFields(page, a.file, a.p, ["title", "type", "summary"]);
      fmText(page, a.file, a.p, ["title", "summary"]);
      for (const k of ["client", "project", "slug"]) if (k in a.p.data) add(page, "WARN", "derived-field", a.file, a.p.keyLines[k], `"${k}" is derived from the path — never author it`);
      const aImg = path.join(a.dir, "images");
      const afi = checkFeaturedImage(page, a.file, a.p, aImg);
      const acard = afi ?? imageFiles(aImg)[0];
      checkImagesFolder(page, aImg, { referenced: new Set(), exempt: new Set(acard ? [acard] : []), exemptWhy: acard ?? "", hasBody: false });
      if (a.p.data.featuredOnHome && !acard) add(page, "INFO", "card", a.file, null, "featuredOnHome artifact with no image — text-only card");
      bump(page, "artifacts");
    }
  }
}

// spine vocabulary: CLAUDE.md seed + labels used by at least one *other* client
for (const [slug, labels] of spineLabelsByClient) {
  const page = clientPage(slug, clients.get(slug).p.data.name);
  const others = new Set(SPINE_VOCAB);
  for (const [s2, l2] of spineLabelsByClient) if (s2 !== slug) for (const x of l2) others.add(x.label);
  const seen = new Map();
  for (const { label, file, line } of labels) {
    if (seen.has(label)) add(page, "WARN", "spine-label", file, line, `label "${label}" used twice (also line ${seen.get(label)})`);
    seen.set(label, line);
    if (others.has(label)) continue;
    const near = [...others].find((v) => v.toLowerCase().replace(/\s+/g, "") === label.toLowerCase().replace(/\s+/g, ""));
    add(page, "WARN", "spine-label", file, line, near ? `label "${label}" — did you mean "${near}"?` : `label "${label}" not in the shared vocabulary (${[...others].join(", ")})`);
  }
}

// ---------------------------------------------------------------- studies

const fullSlugs = new Set();
for (const c of clients.values()) for (const p of c.projects.keys()) fullSlugs.add(`${c.slug}/${p}`);
for (const s of studies.values()) {
  requireFields(G_STUDIES, s.file, s.p, ["title", "summary"]);
  fmText(G_STUDIES, s.file, s.p, ["title", "summary"]);
  for (const ref of arr(s.p.data.projects)) {
    if (!ref.includes("/")) add(G_STUDIES, "ERROR", "ref-project", s.file, s.p.keyLines.projects, `study "${s.slug}" → short-form project "${ref}" is ambiguous; use client/project`);
    else if (!fullSlugs.has(ref)) add(G_STUDIES, "ERROR", "ref-project", s.file, s.p.keyLines.projects, `study "${s.slug}" → missing project "${ref}"`);
  }
  for (const c of arr(s.p.data.clients)) if (!clients.has(c)) add(G_STUDIES, "ERROR", "ref-client", s.file, s.p.keyLines.clients, `study "${s.slug}" → missing client "${c}"`);
  add(G_STUDIES, "INFO", "study-route", s.file, null, `study "${s.slug}" has no route${s.p.data.featuredOnHome ? " — appears only as a homepage card" : " and isn't featured — not rendered anywhere"}`);
}

// ---------------------------------------------------------------- duplicates

for (const list of hashes.values()) {
  if (list.length < 2) continue;
  add(list[0].page, "INFO", "duplicate-image", null, null, `identical files: ${list.map((x) => x.file).join(" = ")}`);
}

// ---------------------------------------------------------------- report

const SEV = { ERROR: 0, WARN: 1, INFO: 2 };
const pages = [...new Set([...stats.keys(), ...findings.map((f) => f.page)])];
const order = (p) => (p.startsWith("/work/") ? 1 : p === G_GRAPH ? 0 : 2);
pages.sort((a, b) => order(a) - order(b) || a.localeCompare(b));

const total = { ERROR: 0, WARN: 0, INFO: 0 };
console.log(`Content QA — ${repo}`);
console.log(`Mode: ${PUBLIC ? "PUBLIC (merge-to-main gate: bracket/stub/placeholder WARN → ERROR)" : "preview"}\n`);
for (const page of pages) {
  const fs_ = findings.filter((f) => f.page === page).sort((a, b) => SEV[a.severity] - SEV[b.severity] || a.file.localeCompare(b.file) || (a.line ?? 0) - (b.line ?? 0));
  for (const f of fs_) total[f.severity]++;
  const counts = { ERROR: 0, WARN: 0, INFO: 0 };
  for (const f of fs_) counts[f.severity]++;
  console.log(`== ${page}   [${counts.ERROR} error, ${counts.WARN} warn]`);
  const s = stats.get(page);
  if (s && Object.keys(s).length && !NO_INFO) console.log(`   INFO   counts: ${Object.entries(s).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
  for (const f of fs_) {
    if (NO_INFO && f.severity === "INFO") continue;
    const loc = f.file ? `${f.file}${f.line ? `:${f.line}` : ""}` : "";
    console.log(`   ${f.severity.padEnd(6)} ${f.code.padEnd(18)} ${loc}${loc ? "  " : ""}${f.msg}`);
  }
  console.log("");
}
console.log(`Total: ${total.ERROR} error(s), ${total.WARN} warning(s), ${total.INFO} info`);
process.exit(total.ERROR > 0 ? 1 : 0);
