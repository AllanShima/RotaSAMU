import { buildApp } from "./app.js";

const app = await buildApp();

app.listen({ port: 3001, host: "0.0.0.0" });
