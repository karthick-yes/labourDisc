// Prepares the production database when a Replit deployment starts.
//
// Replit copies the development database's structure into the production
// database when you publish, but not necessarily drizzle's record of which
// migrations ran. So:
//   - no app tables yet          -> run all migrations (fresh database)
//   - tables but no record       -> structure came from Replit's sync; record
//                                    every migration as applied
//   - tables and a record        -> run new migrations; if one fails because
//                                    the change is already there (synced),
//                                    record it as applied
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { databaseUrl, sslOption } from "./db-config.mjs";

const FOLDER = "./drizzle";
// "already exists" errors: table, object/type, column, schema.
const ALREADY_THERE = new Set(["42P07", "42710", "42701", "42P06"]);

const url = databaseUrl();
const sql = postgres(url, { max: 1, ssl: sslOption(url), onnotice: () => {} });
const db = drizzle(sql);
const migrations = readMigrationFiles({ migrationsFolder: FOLDER });

await sql`create schema if not exists drizzle`;
await sql`create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)`;

const [{ exists: hasTables }] = await sql`select to_regclass('public.contractors') is not null as exists`;
const [last] = await sql`select created_at from drizzle.__drizzle_migrations order by created_at desc limit 1`;
const lastApplied = last ? Number(last.created_at) : 0;

async function recordAsApplied(list) {
  for (const m of list) {
    await sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${m.hash}, ${m.folderMillis})`;
  }
  console.log(`Recorded ${list.length} migration(s) as already applied.`);
}

const pending = migrations.filter((m) => m.folderMillis > lastApplied);

if (!hasTables) {
  console.log("Fresh database: running all migrations.");
  await migrate(db, { migrationsFolder: FOLDER });
} else if (!lastApplied) {
  console.log("Tables exist without migration history (copied by Replit on publish).");
  await recordAsApplied(migrations);
} else if (pending.length) {
  try {
    await migrate(db, { migrationsFolder: FOLDER });
    console.log(`Applied ${pending.length} new migration(s).`);
  } catch (err) {
    const code = err?.code ?? err?.cause?.code;
    if (!ALREADY_THERE.has(code)) throw err;
    console.log(`Migration changes already present (${code}); Replit synced them on publish.`);
    await recordAsApplied(pending);
  }
} else {
  console.log("Database is up to date.");
}

await sql.end();
