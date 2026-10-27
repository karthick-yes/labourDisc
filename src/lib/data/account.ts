import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { enterprises, needs, placements, workerMedia, workerSkills, workers } from "@/db/schema";
import { keyFromUrl } from "@/lib/storage";

// Data export (CSV) and the file list for account deletion (brief §8).

export async function listMediaKeys(contractorId: string) {
  const [ws, media] = await Promise.all([
    db.select({ photo: workers.photoUrl, voice: workers.voiceNoteUrl }).from(workers).where(eq(workers.contractorId, contractorId)),
    db.select({ url: workerMedia.url }).from(workerMedia).where(eq(workerMedia.contractorId, contractorId)),
  ]);
  return [...ws.flatMap((w) => [w.photo, w.voice]), ...media.map((m) => m.url)]
    .map((u) => (u ? keyFromUrl(u) : null))
    .filter((k): k is string => Boolean(k));
}

const cell = (v: unknown) => {
  if (v == null) return "";
  const s = v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.join("; ") : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n") + "\n";
}

export async function exportRows(contractorId: string, type: "workers" | "enterprises" | "needs" | "placements") {
  switch (type) {
    case "workers": {
      const rows = await db.select().from(workers).where(eq(workers.contractorId, contractorId));
      const skills = await db
        .select({ workerId: workerSkills.workerId, skillId: workerSkills.skillId, years: workerSkills.years })
        .from(workerSkills)
        .innerJoin(workers, eq(workers.id, workerSkills.workerId))
        .where(eq(workers.contractorId, contractorId));
      return rows.map(({ contractorId: _c, shareToken: _s, ...w }) => ({
        ...w,
        skills: skills.filter((s) => s.workerId === w.id).map((s) => `${s.skillId}${s.years ? `:${s.years}y` : ""}`),
      }));
    }
    case "enterprises":
      return (await db.select().from(enterprises).where(eq(enterprises.contractorId, contractorId))).map(({ contractorId: _c, ...e }) => e);
    case "needs":
      return (await db.select().from(needs).where(eq(needs.contractorId, contractorId))).map(({ contractorId: _c, ...n }) => n);
    case "placements":
      return (await db.select().from(placements).where(eq(placements.contractorId, contractorId))).map(({ contractorId: _c, ...p }) => p);
  }
}
