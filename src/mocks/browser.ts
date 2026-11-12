import { setupWorker } from "msw/browser";

import { handlers } from "@/mocks/handlers";
import { findScenario } from "@/mocks/scenarios";

export const worker = setupWorker(...handlers);

export const applyScenario = (name: string | null): void => {
  worker.use(...findScenario(name));
};
