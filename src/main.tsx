import "@/styles/styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// 本番のビルドでは DEV が false になり、MSW の読み込みごと消える
const enableMocking = async (): Promise<void> => {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_MOCKING !== "enabled") {
    return;
  }
  const { applyScenario, worker } = await import("@/mocks/browser");
  applyScenario(new URLSearchParams(location.search).get("mock"));
  await worker.start({
    onUnhandledFrame: "error",
    // base が /kokkai-note/ のため、ワーカーもその下から読む
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
};

await enableMocking();

const root = document.getElementById("root");
if (!root) throw new Error("root の要素がない");

createRoot(root).render(
  <StrictMode>
    <h1>国会ノート</h1>
  </StrictMode>,
);
