import "@/styles/styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const root = document.getElementById("root");
if (!root) throw new Error("root の要素がない");

createRoot(root).render(
  <StrictMode>
    <h1>国会ノート</h1>
  </StrictMode>,
);
