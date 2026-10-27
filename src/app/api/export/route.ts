import { z } from "zod";
import { getContractor } from "@/lib/auth/session";
import { exportRows, toCsv } from "@/lib/data/account";

// CSV export of the logged-in contractor's own data (brief §8).
export async function GET(req: Request) {
  const contractor = await getContractor();
  if (!contractor) return new Response("Unauthorized", { status: 401 });
  const type = z.enum(["workers", "enterprises", "needs", "placements"]).safeParse(new URL(req.url).searchParams.get("type"));
  if (!type.success) return new Response("Bad request", { status: 400 });

  const csv = toCsv((await exportRows(contractor.id, type.data)) as Record<string, unknown>[]);
  const date = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="panibook-${type.data}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
