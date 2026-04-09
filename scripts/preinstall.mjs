#!/usr/bin/env node
// Cross-platform preinstall guard: enforces pnpm usage and removes stray lock files.
// Works on Linux, macOS, and Windows without requiring sh or bash.
import { rmSync } from "fs";

for (const f of ["package-lock.json", "yarn.lock"]) {
  try { rmSync(f); } catch { /* already absent — fine */ }
}

const ua = process.env.npm_config_user_agent ?? "";
if (!ua.startsWith("pnpm/")) {
  process.stderr.write("Error: use pnpm instead of npm/yarn to install dependencies.\n");
  process.exit(1);
}
