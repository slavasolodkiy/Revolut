#!/usr/bin/env node
/**
 * verify-ci-presence.mjs
 *
 * Anti-regression guard: fails if the CI workflow file is missing.
 * Also scans replit.md and STATUS.md for CI claims and cross-checks them
 * against the actual file on disk.
 *
 * Run:
 *   node scripts/verify-ci-presence.mjs
 *
 * Used in:
 *   - .github/workflows/ci.yml (runs in every CI leg before other steps)
 *   - Root package.json "verify" script
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// 1. Hard check: workflow file must exist
// ---------------------------------------------------------------------------

const WORKFLOW = ".github/workflows/ci.yml";
const workflowPath = resolve(root, WORKFLOW);

if (!existsSync(workflowPath)) {
  console.error(`\n❌  FAIL: ${WORKFLOW} is missing from the repository.`);
  console.error(
    "    CI is documented in replit.md and STATUS.md but the workflow file does not exist."
  );
  console.error("    Create it before merging or fix the documentation to remove CI claims.\n");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Documentation cross-check: if docs claim CI, file must exist (it does at
//    this point, so this is a forward-facing check for docs that add new claims)
// ---------------------------------------------------------------------------

const DOCS = ["replit.md", "STATUS.md"];
const CI_CLAIM_PATTERNS = [
  /github actions/i,
  /\.github\/workflows/i,
  /ci\.yml/i,
  /matrix.*ubuntu/i,
  /matrix.*windows/i,
];

let docClaimsFound = false;

for (const doc of DOCS) {
  const docPath = resolve(root, doc);
  if (!existsSync(docPath)) continue;
  const content = readFileSync(docPath, "utf8");
  const hasClaim = CI_CLAIM_PATTERNS.some((p) => p.test(content));
  if (hasClaim) {
    docClaimsFound = true;
  }
}

// If docs claim CI but the workflow file is missing — already caught above.
// (Reaching here means the file exists, so no conflict to report.)

// ---------------------------------------------------------------------------
// 3. Sanity-check YAML has a matrix with at least two OS entries
// ---------------------------------------------------------------------------

const ciContent = readFileSync(workflowPath, "utf8");

if (!ciContent.includes("ubuntu-latest")) {
  console.error(`\n❌  FAIL: ${WORKFLOW} does not include ubuntu-latest in the matrix.\n`);
  process.exit(1);
}

if (!ciContent.includes("windows-latest")) {
  console.error(`\n❌  FAIL: ${WORKFLOW} does not include windows-latest in the matrix.\n`);
  process.exit(1);
}

if (!ciContent.includes("pnpm install")) {
  console.error(`\n❌  FAIL: ${WORKFLOW} does not contain a pnpm install step.\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Done
// ---------------------------------------------------------------------------

console.log(`✅  CI presence verified: ${WORKFLOW} exists with ubuntu+windows matrix.`);
if (docClaimsFound) {
  console.log("    Documentation CI claims are consistent with workflow file on disk.");
}
