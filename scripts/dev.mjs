#!/usr/bin/env node
/**
 * ZetaGrow dev launcher
 *
 * Fixes the two common dev crashes:
 *  1. EADDRINUSE  - a previous Next.js server is still running on the port.
 *                   This script detects it and stops it before starting.
 *  2. Stale cache - a previous `next build` (or interrupted run) left a corrupt
 *                   `.next` cache. Pass --clean to remove it before starting,
 *                   or use `npm run dev:clean`.
 *
 * Usage:
 *   node scripts/dev.mjs [--port=3000] [--clean] [--kill-all]
 */
import { execSync, spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const portArg = args.find((a) => a.startsWith("--port="));
const port = portArg ? portArg.split("=")[1] : process.env.PORT || "3000";
const shouldClean = args.includes("--clean");
const killAll = args.includes("--kill-all");
const isWin = process.platform === "win32";

function run(cmd) {
  try {
    return execSync(cmd, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      cwd: appDir,
    }).trim();
  } catch {
    return "";
  }
}

function findListenerPids(targetPort) {
  if (isWin) {
    return run(
      `netstat -ano -p tcp | findstr :${targetPort} | findstr LISTENING`
    )
      .split(/\r?\n/)
      .map((l) => l.trim().split(/\s+/).pop())
      .filter(Boolean);
  }
  return run(`lsof -ti tcp:${targetPort}`).split(/\r?\n/).filter(Boolean);
}

function getCommandLine(pid) {
  if (isWin) {
    return run(
      `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}').CommandLine"`
    );
  }
  return run(`ps -o command= -p ${pid}`);
}

function killPid(pid) {
  if (isWin) {
    run(`powershell -NoProfile -Command "Stop-Process -Id ${pid} -Force"`);
  } else {
    run(`kill -9 ${pid}`);
  }
}

// 1. Stop an existing Next.js server on this port (auto-restart)
const pids = findListenerPids(port);
for (const pid of pids) {
  if (!pid || pid === "0") continue;
  const cmdline = getCommandLine(pid) || "";
  const isNext = /(next(\.cmd)?|next-server|next dev|next-server)/i.test(cmdline);
  if (isNext) {
    console.log(
      `[dev] Port ${port} is held by a previous Next.js server (PID ${pid}) — stopping it...`
    );
    killPid(pid);
  } else if (killAll) {
    console.log(
      `[dev] Port ${port} is held by PID ${pid} (not Next.js) — stopping it (--kill-all)...`
    );
    killPid(pid);
  } else {
    console.error(
      `[dev] Port ${port} is already in use by PID ${pid} (not a Next.js process).`
    );
    console.error(
      `[dev] Stop it manually, or run with --kill-all to force-stop it.`
    );
    process.exit(1);
  }
}

// 2. Clear the stale cache when requested
if (shouldClean) {
  console.log("[dev] Clearing stale .next cache...");
  try {
    rmSync(path.join(appDir, ".next"), { recursive: true, force: true });
  } catch (err) {
    console.error(`[dev] Failed to clear .next cache: ${err.message}`);
  }
}

// 3. Start the dev server
console.log(`[dev] Starting Next.js dev server on port ${port}...`);
const child = spawn("next", ["dev", "-p", port], {
  stdio: "inherit",
  shell: true,
  cwd: appDir,
});
child.on("exit", (code) => process.exit(code ?? 0));