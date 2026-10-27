// CLI: load (or clear) demo data for one contractor.
//   npm run demo:load -- 9847055555
//   npm run demo:clear -- 9847055555
import "dotenv/config";
import { eq } from "drizzle-orm";
import { clearDemoData, loadDemoData } from "../../lib/demo";
import { normalizePhone } from "../../lib/phone";
import { db } from "../index";
import { contractors } from "../schema";

async function main() {
  const [mode, phoneArg] = process.argv.slice(2);
  const phone = normalizePhone(phoneArg ?? "");
  if (!["load", "clear"].includes(mode) || !phone) {
    console.error("Usage: tsx src/db/seed/demo.ts <load|clear> <contractor phone>");
    process.exit(1);
  }
  const [contractor] = await db.select().from(contractors).where(eq(contractors.phone, phone)).limit(1);
  if (!contractor) throw new Error(`No contractor with phone ${phone}`);

  if (mode === "clear") {
    await clearDemoData(contractor.id);
    console.log("Demo data cleared.");
  } else {
    const r = await loadDemoData(contractor);
    console.log(
      `Loaded ${r.enterprises} enterprises (${r.source}), ${r.needs} needs, ${r.workers} workers, ${r.placements} placements.`,
    );
    if (r.liveError) console.warn(`Live OSM fetch failed: ${r.liveError}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
