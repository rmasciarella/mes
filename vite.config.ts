import { defineConfig } from "vite-plus";

/**
 * Defines top-level Vite+ configurations for the different tools in its ecosystem.
 * @see {@link https://viteplus.dev/config}
 */
export default defineConfig({
  // Commit hooks - https://viteplus.dev/guide/commit-hooks
  staged: {
    "*": "vp check --fix",
  },

  // Vitest - https://vitest.dev/config
  test: {
    include: ["**/*.test.ts"],
  },

  // Oxfmt - https://oxc.rs/docs/guide/usage/formatter/config.html
  fmt: {
    ignorePatterns: [
      "pnpm-lock.yaml",
      "package-lock.json",
      "yarn.lock",
      "bun.lock",
      "routeTree.gen.ts",
      ".tanstack-start/",
      ".tanstack/",
      "drizzle/",
      "migrations/",
      ".drizzle/",
      ".cache",
      "worker-configuration.d.ts",
      ".vercel",
      ".output",
      ".wrangler",
      ".netlify",
      "dist",
    ],
    sortImports: {
      customGroups: [
        {
          elementNamePattern: ["@tsu-stack/**"],
          groupName: "@tsu-stack",
        },
      ],
      groups: [
        "builtin",
        "external",
        "@tsu-stack",
        ["internal", "subpath"],
        ["parent", "sibling", "index"],
        "style",
        "unknown",
      ],
      internalPattern: ["@/", "#@/", "~/", "~~/", "#"],
      sortSideEffects: true,
    },
    sortPackageJson: true,
    sortTailwindcss: {
      attributes: ["class", "className"],
      functions: ["clsx", "cn", "cva", "tw"],
      stylesheet: "./packages/ui/styles/globals.css",
    },
  },

  // Oxlint - https://oxc.rs/docs/guide/usage/linter/config
  lint: {
    env: {
      browser: true,
      builtin: true,
      node: true,
    },
    ignorePatterns: [
      "dist",
      ".wrangler",
      ".vercel",
      ".netlify",
      ".output",
      "build/",
      "worker-configuration.d.ts",
      "scripts/",
    ],
    jsPlugins: [
      { name: "react-hooks-js", specifier: "eslint-plugin-react-hooks" },
      /**
       * FIXME: Plugins with "/" in name have to be aliased for now
       * @see {@link https://github.com/oxc-project/oxc/issues/14557}
       */
      {
        name: "eslint-tanstack-router",
        specifier: "@tanstack/eslint-plugin-router",
      },
      {
        name: "eslint-tanstack-query",
        specifier: "@tanstack/eslint-plugin-query",
      },
    ],
    options: { typeAware: true, typeCheck: true },
    plugins: [
      "eslint",
      "react",
      "react-perf",
      "jsx-a11y",
      "typescript",
      "import",
      "promise",
      "jest",
      "unicorn",
    ],
    // You can add more rules from: https://oxc.rs/docs/guide/usage/linter/rules.html?sort=fix&dir=asc&has_fix=true
    rules: {
      "arrow-body-style": ["error", "as-needed", { requireReturnForObjectLiteral: true }],
      "ban-ts-comment": "error",
      "consistent-indexed-object-style": ["error", "record"],
      "consistent-test-it": ["error", { fn: "it" }],
      "consistent-type-definitions": ["error", "type"],
      "consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports", prefer: "type-imports" },
      ],
      "consistent-type-specifier-style": ["error", "prefer-inline"],
      curly: ["error", "multi-line"],
      "escape-case": "warn",
      "explicit-length-check": "warn",
      "jsx-fragments": ["error", "syntax"],
      "jsx-props-no-spread-multi": "error",
      "no-aria-hidden-on-focusable": "error",
      "no-array-reverse": "warn",
      "no-array-sort": "warn",
      "no-console": ["warn", { allow: ["debug"] }],
      "no-else-return": "error",
      "no-explicit-any": ["error", { fixToUnknown: true, ignoreRestArgs: true }],
      "no-new-statics": "error",
      "no-redundant-roles": "error",
      "no-relative-parent-imports": "error",
      "no-var": "warn",
      "prefer-array-flat-map": "error",
      "prefer-const": "warn",
      "prefer-nullish-coalescing": "error",
      "prefer-object-spread": "error",
      "prefer-spread": "warn",
      "switch-case-braces": ["error", "avoid"],
      "switch-exhaustiveness-check": "error",
      "throw-new-error": "error",
      "valid-title": "error",
      yoda: "warn",
    },
  },
});
