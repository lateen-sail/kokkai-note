// @vitest-environment node
import { compile } from "@tailwindcss/node";
import { format, resolveConfig } from "prettier";
import { describe, expect, test } from "vitest";

const STYLES_DIR = new URL(".", import.meta.url).pathname;

const THEME_IDS = [
  "prices",
  "parenting",
  "education",
  "work",
  "housing",
  "pension",
  "disaster",
  "climate",
  "digital",
  "diplomacy",
];

async function buildCss(candidates: string[]) {
  const compiler = await compile('@import "./styles.css";', {
    base: STYLES_DIR,
    onDependency: () => undefined,
  });
  return compiler.build(candidates);
}

describe("[801] campus のデザインの値を Tailwind のクラスで使える", () => {
  test("[801] ネイビーと蛍光ペンの色のクラスが、DESIGN.md の値を指す", async () => {
    const css = await buildCss(["bg-primary", "bg-highlight"]);

    expect(css).toContain("--ref-color-navy-800: #23395b");
    expect(css).toContain("--ref-color-yellow-300: #ffe873");
    expect(css).toMatch(
      /\.bg-primary\s*\{\s*background-color: var\(--primary\)/,
    );
    expect(css).toMatch(
      /\.bg-highlight\s*\{\s*background-color: var\(--highlight\)/,
    );
  });

  test.each(THEME_IDS)(
    "[801] テーマ %s の面、文字、差し色のクラスがある",
    async (id) => {
      const css = await buildCss([
        `bg-theme-${id}`,
        `text-theme-${id}-foreground`,
        `border-theme-${id}-accent`,
      ]);

      expect(css).toContain(`.bg-theme-${id} {`);
      expect(css).toContain(`.text-theme-${id}-foreground {`);
      expect(css).toContain(`.border-theme-${id}-accent {`);
    },
  );

  test("[801] Tailwind の既定の色のクラスは作られない", async () => {
    const css = await buildCss(["bg-red-500"]);

    expect(css).not.toContain(".bg-red-500");
  });

  test("[801] フォントのクラスが Noto Sans JP と Inter を指す", async () => {
    const css = await buildCss(["font-sans", "font-en"]);

    expect(css).toContain('--ref-font-family-jp: "Noto Sans JP", sans-serif');
    expect(css).toContain(
      '--ref-font-family-en: "Inter", var(--ref-font-family-jp)',
    );
    expect(css).toMatch(
      /\.font-en\s*\{\s*font-family: var\(--ref-font-family-en\)/,
    );
  });

  test("[801] フォントを Fontsource から自分で配信する", async () => {
    const css = await buildCss([]);

    expect(css).toMatch(
      /@font-face\s*\{\s*font-family: 'Noto Sans JP';[^}]*font-weight: 700;[^}]*url\(.*\/noto-sans-jp-/,
    );
    expect(css).toMatch(
      /@font-face\s*\{\s*font-family: 'Inter';[^}]*font-weight: 400;[^}]*url\(.*\/inter-/,
    );
  });

  test("[801] 角丸と影のクラスが DESIGN.md の値を指す", async () => {
    const css = await buildCss(["rounded-lg", "shadow-md"]);

    expect(css).toContain("--ref-radius-lg: 0.75rem");
    expect(css).toContain("--ref-shadow-md: 0 2px 8px rgba(42, 39, 36, 0.1)");
    expect(css).toMatch(
      /\.rounded-lg\s*\{\s*border-radius: var\(--ref-radius-lg\)/,
    );
    expect(css).toContain(".shadow-md {");
  });
});

describe("[802] 画面の背景に方眼を表示する", () => {
  test("[802] 方眼のクラスが 1.5rem 間隔の線を引く", async () => {
    const css = await buildCss(["bg-grid"]);

    expect(css).toMatch(/\.bg-grid\s*\{[^}]*linear-gradient/);
    expect(css).toMatch(/\.bg-grid\s*\{[^}]*background-size: 1\.5rem 1\.5rem/);
  });
});

describe("[803] pnpm format で Tailwind のクラスの並びがそろう", () => {
  test("[803] クラスを Tailwind の推奨の順に並べ替える", async () => {
    const filepath = "src/Sample.tsx";
    const options = await resolveConfig(filepath);

    const formatted = await format(
      '<div className="p-4 text-primary flex bg-theme-prices" />;\n',
      { ...options, filepath },
    );

    expect(formatted).toContain(
      'className="flex bg-theme-prices p-4 text-primary"',
    );
  });
});
