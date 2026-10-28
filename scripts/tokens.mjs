#!/usr/bin/env node
// Design tokens: app/globals.css (@theme) is the source of truth for shipped work.
//
//   node scripts/tokens.mjs                      print tokens resolved for Figma (JSON)
//   node scripts/tokens.mjs --check <figma.json> compare a Figma variables export to code
//
// Figma can't do fluid type (clamp), so sizes resolve at two widths, matching
// Figma frame sizes: Desktop = 1280px, Mobile = 375px. The Friday sync exports
// Figma's variables to design/figma-variables.json and runs --check; any
// mismatch means Figma is behind the live site (or holds an unshipped idea).
// No dependencies, so it runs anywhere Node runs.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CSS = fs.readFileSync(path.join(ROOT, "app/globals.css"), "utf8");
const WIDTHS = { Desktop: 1280, Mobile: 375 };
const REM = 16;

const theme = CSS.match(/@theme\s*{([\s\S]*?)\n}/)?.[1] ?? "";
const vars = Object.fromEntries(
  [...theme.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]),
);

const round = (n) => Math.round(n * 100) / 100;
const round4 = (n) => Math.round(n * 10000) / 10000;

function px(value, width) {
  const v = value.trim();
  const clamp = v.match(/^clamp\(([^,]+),([^,]+),([^)]+)\)$/);
  if (clamp) {
    const [lo, mid, hi] = clamp.slice(1).map((p) => px(p, width));
    return round(Math.min(Math.max(lo, mid), hi));
  }
  if (v.endsWith("rem")) return round(parseFloat(v) * REM);
  if (v.endsWith("vw")) return round((parseFloat(v) * width) / 100);
  if (v.endsWith("px")) return round(parseFloat(v));
  if (v.endsWith("em")) return round(parseFloat(v) * 100); // letter-spacing → percent
  return round(parseFloat(v));
}

function color(value) {
  const v = value.trim();
  const hex = v.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { r: round4(((n >> 16) & 255) / 255), g: round4(((n >> 8) & 255) / 255), b: round4((n & 255) / 255), a: 1 };
  }
  const rgb = v.match(/^rgb\((\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\)$/);
  if (rgb) {
    const [r, g, b] = rgb.slice(1, 4).map((x) => round4(Number(x) / 255));
    return { r, g, b, a: rgb[4] === undefined ? 1 : Number(rgb[4]) };
  }
  throw new Error(`Unparsed color: ${v}`);
}

export function resolveTokens() {
  const out = { color: {}, type: {}, space: {}, font: {} };
  for (const [k, v] of Object.entries(vars)) {
    if (k.startsWith("color-")) out.color[k.slice(6)] = color(v);
    else if (k.startsWith("font-")) out.font[k.slice(5)] = v.split(",")[0].replace(/"/g, "").trim();
    else if (k.startsWith("text-") && !k.includes("--")) {
      const name = k.slice(5);
      const lh = Number(vars[`${k}--line-height`] ?? 1);
      for (const [mode, w] of Object.entries(WIDTHS)) {
        const size = px(v, w);
        out.type[name] ??= {};
        out.type[name][mode] = { size, lineHeight: round(size * lh) };
      }
    } else if (k.startsWith("tracking-")) out.space[`tracking-${k.slice(9)}`] = px(v, WIDTHS.Desktop);
    else if (k.startsWith("spacing-")) out.space[k.slice(8)] = px(v, WIDTHS.Desktop);
    else if (k.startsWith("container-")) out.space[`container-${k.slice(10)}`] = px(v, WIDTHS.Desktop);
  }
  return out;
}

function flatten(obj, prefix = "") {
  const rows = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}/${k}` : k;
    if (v && typeof v === "object" && !("r" in v)) Object.assign(rows, flatten(v, key));
    else rows[key] = v;
  }
  return rows;
}

const same = (a, b) =>
  typeof a === "object" && typeof b === "object"
    ? ["r", "g", "b", "a"].every((c) => Math.abs((a?.[c] ?? 1) - (b?.[c] ?? 1)) < 0.006)
    : typeof a === "number" && typeof b === "number"
      ? Math.abs(a - b) < 0.05
      : a === b;

const args = process.argv.slice(2);
if (args[0] === "--check") {
  const figmaPath = args[1] ?? path.join(ROOT, "design/figma-variables.json");
  const code = flatten(resolveTokens());
  const figma = flatten(JSON.parse(fs.readFileSync(figmaPath, "utf8")));
  const fmt = (v) => (typeof v === "object" ? JSON.stringify(v) : String(v));
  const rows = [];
  for (const k of new Set([...Object.keys(code), ...Object.keys(figma)])) {
    if (!(k in figma)) rows.push(["MISSING IN FIGMA", k, fmt(code[k]), "—"]);
    else if (!(k in code)) rows.push(["FIGMA ONLY", k, "—", fmt(figma[k])]);
    else if (!same(code[k], figma[k])) rows.push(["DRIFT", k, fmt(code[k]), fmt(figma[k])]);
  }
  console.log(`Token sync — code (app/globals.css) vs Figma (${path.relative(ROOT, figmaPath)})`);
  if (!rows.length) console.log("In sync: every token matches.");
  for (const [kind, k, c, f] of rows) console.log(`  ${kind.padEnd(16)} ${k.padEnd(28)} code ${c}  figma ${f}`);
  // Report only. FIGMA ONLY rows are often unshipped explorations, not errors.
  process.exit(0);
} else {
  console.log(JSON.stringify(resolveTokens(), null, 2));
}
