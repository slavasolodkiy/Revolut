#!/usr/bin/env node
/**
 * verify-repo-consistency.mjs
 *
 * Checks that documentation does not make false claims about GitHub Actions CI.
 *
 * Policy: this repository intentionally has NO .github/workflows/ files.
 * Replit->GitHub sync does not support the workflow permission scope needed to
 * push workflow files, so CI is intentionally absent. See:
 *   docs/engineering/no-ci-policy.md
 *
 * Rules enforced:
 *   PASS  — .github/workflows/ci.yml is absent (expected state)
 *   FAIL  — docs claim CI/workflow exists while .github/workflows/ci.yml is absent
 *   FAIL  — .github/workflows/ci.yml exists while docs say CI is absent (opposite contradiction)
 *
 * Run:
 *   node scripts/verify-repo-consistency.mjs
 *   pnpm run verify
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Patterns that constitute a "CI is present" claim in documentation
// ---------------------------------------------------------------------------
const CI_PRESENT_PATTERNS = [
  // Specific claims about the file existing
  /\.github\/workflows\/ci\.yml.*present/i,
  /ci\.yml.*present/i,
  /ci\.yml.*exists/i,
  // Claims of CI-verified platforms
  /ci.verified/i,
  // GitHub Actions workflow matrix claims
  /matrix.*ubuntu-latest.*windows-latest/is,
  /ubuntu-latest.*windows-latest.*matrix/is,
  // Positive CI stack line (without a negation qualifier)
  /\*\*CI\*\*:\s*GitHub Actions/i,
  // Steps list referencing a workflow run
  /pnpm install --frozen-lockfile.*CI/is,
];

// Patterns that are OK — they acknowledge CI is intentionally absent
const CI_ABSENT_ACKNOWLEDGEMENT_PATTERNS = [
  /no.*github actions/i,
  /intentionally.*no.*ci/i,
  /ci.*intentionally.*absent/i,
  /no-ci/i,
  /workflow.*not.*used/i,
  /workflow.*intentionally/i,
];

// ---------------------------------------------------------------------------
// 1. Determine actual state
// ---------------------------------------------------------------------------

const WORKFLOW_FILE = ".github/workflows/ci.yml";
const workflowExists = existsSync(resolve(root, WORKFLOW_FILE));

// ---------------------------------------------------------------------------
// 2. Scan docs
// ---------------------------------------------------------------------------

const DOCS = ["replit.md", "STATUS.md"];
const errors = [];
const info = [];

for (const doc of DOCS) {
  const docPath = resolve(root, doc);
  if (!existsSync(docPath)) {
    info.push(`    info: ${doc} not found, skipping`);
    continue;
  }

  const content = readFileSync(docPath, "utf8");

  // Check for positive CI claims
  const claimsCI = CI_PRESENT_PATTERNS.some((p) => p.test(content));
  // Check if the doc acknowledges the no-CI policy
  const acknowledgesAbsence = CI_ABSENT_ACKNOWLEDGEMENT_PATTERNS.some((p) => p.test(content));

  if (!workflowExists && claimsCI && !acknowledgesAbsence) {
    errors.push(
      `  ❌  ${doc} claims CI is present but ${WORKFLOW_FILE} does not exist.\n` +
      `      Remove or correct the CI claim, or add a no-CI policy note.`
    );
  }

  if (workflowExists && acknowledgesAbsence && !claimsCI) {
    errors.push(
      `  ❌  ${doc} says CI is absent but ${WORKFLOW_FILE} exists.\n` +
      `      Update documentation to reflect the actual repo state.`
    );
  }
}

// ---------------------------------------------------------------------------
// 3. Report
// ---------------------------------------------------------------------------

if (errors.length > 0) {
  console.error("\n❌  verify-repo-consistency: documentation contradicts repository state.\n");
  for (const e of errors) console.error(e);
  console.error(
    "\n    See docs/engineering/no-ci-policy.md for the rationale and expected state.\n"
  );
  process.exit(1);
}

// Print state summary
const ciState = workflowExists
  ? `present (${WORKFLOW_FILE})`
  : "absent (intentional — no-CI policy)";

console.log(`✅  verify-repo-consistency passed.`);
console.log(`    Workflow file : ${ciState}`);
if (info.length) info.forEach((l) => console.log(l));
console.log(`    Docs scanned  : ${DOCS.join(", ")}`);
console.log(`    No contradictions found.`);
