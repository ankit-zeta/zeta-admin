#!/usr/bin/env node
/**
 * Clears the Next.js build/dev cache (.next).
 * Run this whenever dev or build shows stale-page errors
 * (e.g. "Cannot find module for page" / PageNotFoundError).
 */
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
try {
  rmSync(path.join(appDir, ".next"), { recursive: true, force: true });
  console.log("[clean] .next cache removed.");
} catch (err) {
  console.error(`[clean] Failed to remove .next cache: ${err.message}`);
  process.exit(1);
}