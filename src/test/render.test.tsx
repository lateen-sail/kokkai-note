import { screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { renderWithProviders } from "@/test/render";

it("[401] 渡した要素を描画する", () => {
  renderWithProviders(<h1>国会ノート</h1>);

  expect(
    screen.getByRole("heading", { name: "国会ノート" }),
  ).toBeInTheDocument();
});
