import "@/styles/styles.css";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { LatestSpeech } from "@/features/search/components/LatestSpeech";
import { createQueryClient } from "@/lib/queryClient";
import { createPersistOptions } from "@/lib/queryPersister";

// 本番のビルドでは DEV が false になり、MSW の読み込みごと消える
const isMockingEnabled =
  import.meta.env.DEV && import.meta.env.VITE_API_MOCKING === "enabled";

const enableMocking = async (): Promise<void> => {
  if (!isMockingEnabled) return;
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

const queryClient = createQueryClient();
// モックの応答を保存すると、場面の切り替えが効かず、本物の API の画面にも混ざる
const persistOptions = createPersistOptions(
  isMockingEnabled ? { storage: null } : {},
);

// #15 で、ルーターと画面の枠に置き換える
createRoot(root).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      <h1>国会ノート</h1>
      <LatestSpeech />
    </PersistQueryClientProvider>
  </StrictMode>,
);
