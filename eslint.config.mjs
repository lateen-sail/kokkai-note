import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import checkFile from "eslint-plugin-check-file";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat["recommended-latest"],
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowAny: false,
          allowBoolean: false,
          allowNever: false,
          allowNullish: false,
          allowNumber: true,
          allowRegExp: false,
        },
      ],
      "max-depth": ["error", 3],
      complexity: ["error", 10],
      "max-params": ["error", 3],
      "no-nested-ternary": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "default",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: "variable",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
        },
        {
          selector: "variable",
          types: ["boolean"],
          format: ["PascalCase"],
          prefix: ["is", "has", "can", "should"],
        },
        { selector: "function", format: ["camelCase", "PascalCase"] },
        {
          selector: "parameter",
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
        },
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "enumMember", format: ["PascalCase"] },
        { selector: "import", format: null },
        { selector: ["objectLiteralProperty", "typeProperty"], format: null },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "check-file": checkFile },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        {
          "src/**/components/*.tsx": "PASCAL_CASE",
          "src/**/components/!(ui)/**/*.tsx": "PASCAL_CASE",
          "src/**/hooks/**/*.{ts,tsx}": "use[A-Z]*([a-zA-Z0-9])",
          "src/**/{services,types,utils,lib}/**/*.ts": "CAMEL_CASE",
          "src/pages/**/*.tsx": "PASCAL_CASE",
        },
        { ignoreMiddleExtensions: true },
      ],
      "check-file/folder-naming-convention": [
        "error",
        {
          "src/**/": "KEBAB_CASE",
        },
      ],
      "check-file/filename-blocklist": [
        "error",
        {
          "src/features/*/*.{ts,tsx}":
            "src/features/*/{components,hooks,services,types,utils}/*",
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/components/my/**",
      "src/components/ui/**",
      "src/lib/**",
      "src/**/services/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/ui/*"],
              message: "src/components/my/ のラッパーを import する（CQ08）",
            },
            {
              group: ["**/types/*Api"],
              message:
                "外部APIの型は service だけで使い、自分の型へ変えて渡す（CQ06）",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/my/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/types/*Api"],
              message:
                "外部APIの型は service だけで使い、自分の型へ変えて渡す（CQ06）",
            },
          ],
        },
      ],
    },
  },
  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  prettier,
  globalIgnores([
    ".agents/**",
    ".tanstack/**",
    "src/components/ui/**",
    "src/routeTree.gen.ts",
    ".claude/**",
    "dist/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
