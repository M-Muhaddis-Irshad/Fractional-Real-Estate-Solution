import http from "node:http";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { seed } from "./utils/seed.js";
import { initRealtime } from "./utils/realtime.js";
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
});

const PORT = Number(process.env.PORT);
const MONGODB_URI = process.env.MONGODB_URI

console.log(PORT)
async function main() {
  await connectDB(MONGODB_URI);
  await seed();
  const server = http.createServer(app);
  initRealtime(server);
  server.listen(PORT, () => {
    console.log(`[server] Flux API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
