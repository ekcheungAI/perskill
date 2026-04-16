#!/usr/bin/env tsx
/**
 * path-utils.ts
 *
 * Shared path resolution utilities for research scripts.
 * import.meta.url correctly points to the script path when running files via `npx tsx path/to/script.ts`.
 */

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

/**
 * Returns the directory containing the running script.
 * import.meta.url points to the script path when running via `npx tsx path/to/script.ts`.
 */
export function getScriptDir(): string {
  return dirname(fileURLToPath(import.meta.url));
}

/**
 * Project root = perskill/ directory.
 * From scripts/research/2_distill/:
 *   ..      → research/
 *   ../..   → scripts/
 *   ../../.. → perskill/ (project root)
 */
export function resolveProjectRoot(scriptDir: string): string {
  return resolve(scriptDir, "../../../");
}
