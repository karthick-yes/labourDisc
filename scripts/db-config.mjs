// Shared Postgres connection options for the plain-JS scripts.
// Replit's production database needs SSL; local Docker and Replit's
// development database don't.

export function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  return url;
}

export function sslOption(url) {
  if (/sslmode=(require|verify-ca|verify-full|prefer)/.test(url)) return "require";
  if (process.env.DATABASE_SSL === "true" || process.env.REPLIT_DEPLOYMENT === "1") return "require";
  return false;
}
