import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

// Reuse one connection pool across hot reloads in dev.
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };
// Replit's production database needs SSL; local Docker and Replit's
// development database don't (see scripts/db-config.mjs).
const ssl =
  /sslmode=(require|verify-ca|verify-full|prefer)/.test(url) ||
  process.env.DATABASE_SSL === "true" ||
  process.env.REPLIT_DEPLOYMENT === "1"
    ? ("require" as const)
    : false;
const client = globalForDb.pgClient ?? postgres(url, { max: 10, ssl });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
export { schema };
