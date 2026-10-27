// Applies checked-in SQL migrations from ./drizzle. Plain JS so it runs in
// production (Replit deploy) without tsx.
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { databaseUrl, sslOption } from "./db-config.mjs";

const url = databaseUrl();
const client = postgres(url, { max: 1, ssl: sslOption(url), onnotice: () => {} });
await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
await client.end();
console.log("Migrations applied.");
