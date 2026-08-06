import dns from "node:dns";
import mongoose from "mongoose";

const FALLBACK_SERVERS = ["8.8.8.8", "1.1.1.1", "8.8.4.4"];

function ensureSrvResolution(uri) {
  const rest = uri.replace(/^mongodb\+srv:\/\//, "").split(/[/?#]/)[0];
  const host = rest.includes("@") ? rest.slice(rest.lastIndexOf("@") + 1) : rest;
  if (!host) return Promise.resolve();
  return new Promise((resolve) => {
    dns.resolveSrv(`_mongodb._tcp.${host}`, (err) => {
      if (err) {
        try {
          dns.setServers(FALLBACK_SERVERS);
        } catch (setErr) {
          // ignore — the connect attempt below will surface the real error
        }
        console.warn(
          `[db] DNS SRV resolution failed for ${host}; retrying with public resolvers.`
        );
      }
      resolve();
    });
  });
}

export async function connectDB(uri) {
  await ensureSrvResolution(uri);
  mongoose.set("strictQuery", true);
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log(`[db] connected: ${conn.connection.host}`);
  return conn;
}
