// Referenz: docs/development/workflow.md#guardrail-skripte
//
// Verifiziert jeden relativen Markdown-Link (`](pfad.md)`, auch mit `#anchor`)
// und jede in Backticks stehende `docs/*.md`-Pfadangabe im Repo gegen das
// Dateisystem. Deterministisch, keine Fehlalarme — deshalb Teil der CI statt
// wie `npm run deadcode` nur ein manuelles Werkzeug.

import { readFileSync, statSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const IGNORED_DIRS = new Set(["node_modules", ".git", ".next", "generated", "coverage", "playwright-report"]);

function collectFiles(dir: string, exts: string[], out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, exts, out);
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

interface BrokenLink {
  file: string;
  target: string;
  resolved: string;
}

const broken: BrokenLink[] = [];
let checked = 0;

const files = collectFiles(ROOT, [".md", ".mjs"]);

const markdownLinkPattern = /\]\(([^()\s]+\.md(?:#[^()\s]*)?)\)/g;
const barePathPattern = /`(docs\/[A-Za-z0-9_\-/]+\.md)`/g;

for (const file of files) {
  const content = readFileSync(file, "utf8");
  const dir = dirname(file);
  const isMarkdown = file.endsWith(".md");

  // Echte Markdown-Link-Syntax gilt in .md-Dateien immer als navigierbarer
  // Verweis. In .mjs-Dateien kommt sie nicht vor, schadet aber nicht, zu prüfen.
  for (const match of content.matchAll(markdownLinkPattern)) {
    const target = match[1].split("#")[0];
    if (target.startsWith("http")) continue;
    checked++;
    const resolved = resolve(dir, target);
    if (!fileExists(resolved)) {
      broken.push({ file: relative(ROOT, file), target, resolved: relative(ROOT, resolved) });
    }
  }

  // Bloße, in Backticks stehende docs/*.md-Pfade nur außerhalb von .md-Dateien
  // prüfen: in Quellcode (.mjs) ist so ein String immer als echter Verweis
  // gemeint (genau das hat den eslint.config.mjs-Fund in Audit #10 aufgedeckt).
  // In Markdown-Prosa kann derselbe Text legitim einen historischen, absichtlich
  // nicht mehr existierenden Pfad zitieren (z. B. dieses Dokument hier) — dort
  // zählt nur echte Link-Syntax als Verweis.
  if (!isMarkdown) {
    for (const match of content.matchAll(barePathPattern)) {
      checked++;
      const resolved = resolve(ROOT, match[1]);
      if (!fileExists(resolved)) {
        broken.push({ file: relative(ROOT, file), target: match[1], resolved: relative(ROOT, resolved) });
      }
    }
  }
}

function fileExists(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

console.log(`${checked} Links/Pfadangaben geprüft.`);

if (broken.length > 0) {
  console.error(`\n${broken.length} kaputte(r) Link(s):\n`);
  for (const b of broken) {
    console.error(`  ${b.file} -> "${b.target}" (aufgelöst: ${b.resolved})`);
  }
  process.exit(1);
}

console.log("Alle Links intakt.");
