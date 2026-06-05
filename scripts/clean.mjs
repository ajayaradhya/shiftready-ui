// Cross-platform monorepo clean: removes node_modules + build caches.
// Run via `node scripts/clean.mjs` (used by `make clean`).
import { rmSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const CACHE_DIRS = ["node_modules", ".next", ".turbo", ".expo", "dist"];
const WORKSPACE_GLOBS = ["apps", "packages"];

function purge(dir) {
  for (const name of CACHE_DIRS) {
    const target = join(dir, name);
    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true });
      console.log("removed", target);
    }
  }
}

// Root
purge(".");

// Each workspace package
for (const group of WORKSPACE_GLOBS) {
  if (!existsSync(group)) continue;
  for (const pkg of readdirSync(group, { withFileTypes: true })) {
    if (pkg.isDirectory()) purge(join(group, pkg.name));
  }
}

console.log("clean done");
