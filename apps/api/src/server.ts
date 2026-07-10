import "dotenv/config";
import { buildApp } from "./app.js";

const app = await buildApp();
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3333);

try {
  await app.listen({ host: "0.0.0.0", port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
