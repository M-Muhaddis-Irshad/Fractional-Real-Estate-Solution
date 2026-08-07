import http from "node:http";
import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { seed } from "./utils/seed.js";
import { initRealtime } from "./utils/realtime.js";

const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = "mongodb+srv://muhaddisirshad58_db_user:BPOwZylr7jEvatPl@fractionaldata.yhyuekq.mongodb.net"

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
