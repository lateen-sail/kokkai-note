import { setupServer } from "msw/node";

// vitest.setup.ts から tsconfig.node.json で型検査され、そこには @/ の別名がない
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
