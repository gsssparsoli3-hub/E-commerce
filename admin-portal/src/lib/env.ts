import fs from "fs";
import path from "path";

/**
 * Local .env loader with override — runs once at import time.
 *
 * Why: `prisma` CLI and Vercel inject environment variables correctly, but a
 * local dev shell can export stale values globally (e.g. a DATABASE_URL
 * pointing at an old SQLite file). This module loads the portal's own `.env`
 * — when present — and lets it win over the inherited process environment.
 *
 * On Vercel there is no `.env` file (secrets come from the dashboard), so this
 * is a no-op there.
 */
function loadLocalEnv() {
  if (process.env.VERCEL || process.env.VERCEL_ENV) return;
  const file = path.join(process.cwd(), ".env");
  try {
    if (!fs.existsSync(file)) return;
    const raw = fs.readFileSync(file, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      let trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      if (trimmed.startsWith("export ")) trimmed = trimmed.slice(7).trim();
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
        (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {
    // best-effort only
  }
}

loadLocalEnv();
