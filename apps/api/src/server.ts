import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { parseEnvironment } from "./env.js";

const environment = parseEnvironment(process.env);
serve({ fetch: createApp().fetch, port: environment.PORT });
console.info(JSON.stringify({ level: "info", event: "server.started", port: environment.PORT }));
