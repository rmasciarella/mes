import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vite-plus/test";

/**
 * Architectural fitness tests.
 *
 * Enforces the dependency rule: inner layers must never import from outer layers.
 *
 * Layer order (inside-out):
 *   core -> db, api, auth, env, logger, ui, i18n -> apps/server, apps/web
 */

const OUTER_PACKAGES = [
  "@tsu-stack/db",
  "@tsu-stack/api",
  "@tsu-stack/auth",
  "@tsu-stack/env",
  "@tsu-stack/logger",
  "@tsu-stack/ui",
  "@tsu-stack/i18n",
];

function readPackageJson(dir: string) {
  const raw = readFileSync(join(dir, "package.json"), "utf-8");
  return JSON.parse(raw) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
}

function collectTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectTsFiles(full));
    } else if (full.endsWith(".ts") && !full.endsWith(".test.ts")) {
      files.push(full);
    }
  }
  return files;
}

function extractImports(filePath: string): string[] {
  const content = readFileSync(filePath, "utf-8");
  const importPattern = /from\s+["']([^"']+)["']/g;
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = importPattern.exec(content)) !== null) {
    matches.push(match[1]!);
  }
  return matches;
}

const coreDir = resolve(import.meta.dirname, "..");
const coreSrcDir = resolve(coreDir, "src");

describe("@tsu-stack/core dependency rule", () => {
  it("must not declare outer-layer packages as runtime dependencies", () => {
    const pkg = readPackageJson(coreDir);
    const deps = Object.keys(pkg.dependencies ?? {});

    for (const forbidden of OUTER_PACKAGES) {
      expect(deps, `core must not depend on ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("must not declare outer-layer packages as peer dependencies", () => {
    const pkg = readPackageJson(coreDir);
    const peers = Object.keys(pkg.peerDependencies ?? {});

    for (const forbidden of OUTER_PACKAGES) {
      expect(peers, `core must not peer-depend on ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("source files must not import from outer-layer packages", () => {
    const tsFiles = collectTsFiles(coreSrcDir);
    const violations: string[] = [];

    for (const file of tsFiles) {
      const imports = extractImports(file);
      for (const imp of imports) {
        for (const forbidden of OUTER_PACKAGES) {
          if (imp === forbidden || imp.startsWith(`${forbidden}/`)) {
            const relative = file.replace(`${coreDir}/`, "");
            violations.push(`${relative} imports "${imp}"`);
          }
        }
      }
    }

    expect(violations, `Found forbidden imports in core:\n${violations.join("\n")}`).toHaveLength(
      0,
    );
  });
});
