// Invariants for the published pages. No dependencies: run with `node tools/check-site.mjs`.
import { readFileSync } from "node:fs";

const SITE_PATH = "/magic-storage-guard-docs/";
const failures = [];
const fail = (file, message) => failures.push(`${file}: ${message}`);
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const count = (text, pattern) => (text.match(pattern) ?? []).length;

function checkCommon(file, html) {
  if (!/^<!doctype html>/i.test(html)) fail(file, "missing doctype");
  if (!/<html lang="en">/.test(html)) fail(file, "missing lang attribute");
  if (!/<meta charset="utf-8">/.test(html)) fail(file, "missing charset");
  if (!/<meta name="viewport" /.test(html)) fail(file, "missing viewport");
  if (count(html, /<title>[^<]+<\/title>/g) !== 1) fail(file, "expected exactly one title");
  if (count(html, /<h1[ >]/g) !== 1) fail(file, "expected exactly one h1");

  // The policy states that no advertising or analytics is used. Keep the pages
  // free of scripts and of anything fetched from another host.
  if (/<script/i.test(html)) fail(file, "scripts are not allowed");
  if (/<(?:img|iframe|link|source|video|audio|embed|object)\b[^>]*\b(?:src|href|data)="(?:https?:)?\/\/(?![^"]*matrixdemodisk-dev\.github\.io)/i.test(html)) {
    fail(file, "third party resources are not allowed");
  }
  if (/@import|url\((?!['"]?data:)/i.test(html)) fail(file, "external CSS resources are not allowed");

  for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)) {
    if (href.startsWith("http://")) fail(file, `insecure link ${href}`);
    if (href === "" || href === "#") fail(file, "empty link target");
  }

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  for (const id of new Set(ids)) {
    if (ids.filter((x) => x === id).length > 1) fail(file, `duplicate id "${id}"`);
  }
  return ids;
}

const index = read("index.html");
const indexIds = checkCommon("index.html", index);

// These anchors are linked from outside the site. Renaming them breaks those links.
for (const id of ["privacy", "use"]) {
  if (!indexIds.includes(id)) fail("index.html", `required anchor #${id} is missing`);
}
for (const [, target] of index.matchAll(/href="#([^"]+)"/g)) {
  if (!indexIds.includes(target)) fail("index.html", `link to missing anchor #${target}`);
}
for (const [, target] of index.matchAll(/aria-labelledby="([^"]+)"/g)) {
  if (!indexIds.includes(target)) fail("index.html", `aria-labelledby points to missing id "${target}"`);
}
if (!/<meta name="description" content="[^"]{50,200}">/.test(index)) {
  fail("index.html", "meta description missing or outside 50 to 200 characters");
}
if (!index.includes(`<link rel="canonical" href="https://matrixdemodisk-dev.github.io${SITE_PATH}">`)) {
  fail("index.html", "canonical link missing or changed");
}

// The machine readable effective date must match the date shown to readers.
const effective = index.match(/Effective <time datetime="(\d{4}-\d{2}-\d{2})">([^<]+)<\/time>/);
if (!effective) {
  fail("index.html", "effective date is missing");
} else {
  const shown = new Date(`${effective[2]} UTC`);
  if (Number.isNaN(shown.getTime()) || shown.toISOString().slice(0, 10) !== effective[1]) {
    fail("index.html", `effective date mismatch: datetime="${effective[1]}" but text is "${effective[2]}"`);
  }
}

const notFound = read("404.html");
const notFoundIds = checkCommon("404.html", notFound);
if (!/<meta name="robots" content="noindex">/.test(notFound)) fail("404.html", "must be noindex");
// GitHub Pages serves 404.html at any depth, so relative links would break.
for (const [, href] of notFound.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)) {
  if (!href.startsWith(SITE_PATH)) fail("404.html", `link must start with ${SITE_PATH}: ${href}`);
  const anchor = href.split("#")[1];
  if (anchor && !indexIds.includes(anchor)) fail("404.html", `link to missing anchor #${anchor}`);
}
if (notFoundIds.length) fail("404.html", "unexpected ids");

if (failures.length) {
  console.error(failures.map((f) => `FAIL ${f}`).join("\n"));
  process.exit(1);
}
console.log("Site checks passed: index.html, 404.html");
