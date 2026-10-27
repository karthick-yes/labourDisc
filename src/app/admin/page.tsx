import type { Metadata } from "next";
import { count, gte, sql } from "drizzle-orm";
import { DEFAULT_EXTRACT_MODEL, DEFAULT_TRANSCRIBE_MODEL } from "@/config/ai-pricing";
import { aiLimits, externalLimits } from "@/config/limits";
import { db } from "@/db";
import { externalCalls } from "@/db/schema";
import { usageReport } from "@/lib/ai/usage";
import { adminConfigured, isAdmin } from "@/lib/auth/admin";
import { logoutAdmin } from "./actions";
import { AdminLogin } from "./AdminLogin";

// Owner-only usage page (English; not part of the contractor UI).
export const metadata: Metadata = { title: "PaniBook admin", robots: { index: false, follow: false } };

const usd = (n: number) => `$${n.toFixed(n < 1 ? 4 : 2)}`;

export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <Shell>
        <p className="font-semibold">Set ADMIN_PIN (at least 4 characters) to use this page.</p>
      </Shell>
    );
  }
  if (!(await isAdmin())) {
    return (
      <Shell>
        <AdminLogin />
      </Shell>
    );
  }

  const limits = aiLimits();
  const ext = externalLimits();
  const report = await usageReport();
  const externalToday = await db
    .select({ service: externalCalls.service, n: count() })
    .from(externalCalls)
    .where(gte(externalCalls.createdAt, sql`date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'`))
    .groupBy(externalCalls.service);
  const extCount = (s: string) => externalToday.find((e) => e.service === s)?.n ?? 0;
  const remaining = Math.max(0, limits.monthlyCapUsd - report.monthSpentUsd);

  return (
    <Shell>
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border-2 border-ink bg-ink">
        <Stat label="AI" value={limits.enabled ? "ON" : "OFF"} tone={limits.enabled ? "ok" : "off"} />
        <Stat label="OpenAI key" value={process.env.OPENAI_API_KEY ? "set" : "missing"} tone={process.env.OPENAI_API_KEY ? "ok" : "off"} />
        <Stat label="Spent this month" value={usd(report.monthSpentUsd)} />
        <Stat label="Remaining budget" value={usd(remaining)} />
        <Stat label="Calls this month" value={String(report.monthCalls)} />
        <Stat label="Blocked this month" value={String(report.monthBlocked)} />
        <Stat label="Voice intakes today" value={`${report.intakesToday} / ${limits.maxIntakesPerDay}`} />
        <Stat label="Live map lookups today" value={`${extCount("overpass")} / ${ext.overpassPerDay}`} />
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Caps (env)</h2>
        <dl className="divide-y divide-line rounded-[10px] border-2 border-ink bg-white text-sm">
          {[
            ["AI_ENABLED", String(limits.enabled)],
            ["AI_MONTHLY_CAP_USD", usd(limits.monthlyCapUsd)],
            ["AI_DAILY_CAP_PER_CONTRACTOR_USD", usd(limits.dailyCapPerContractorUsd)],
            ["AI_MAX_INTAKES_PER_DAY", String(limits.maxIntakesPerDay)],
            ["AI_MAX_INTAKES_PER_HOUR_PER_CONTRACTOR", String(limits.maxIntakesPerHourPerContractor)],
            ["OPENAI_TRANSCRIBE_MODEL", process.env.OPENAI_TRANSCRIBE_MODEL || `${DEFAULT_TRANSCRIBE_MODEL} (default)`],
            ["OPENAI_EXTRACT_MODEL", process.env.OPENAI_EXTRACT_MODEL || `${DEFAULT_EXTRACT_MODEL} (default)`],
            ["OVERPASS_PER_DAY", String(ext.overpassPerDay)],
            ["NOMINATIM_PER_DAY", `${ext.nominatimPerDay} (used today: ${extCount("nominatim")})`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 px-3 py-2">
              <dt className="font-mono text-xs">{k}</dt>
              <dd className="text-right font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Spend per contractor (this month)</h2>
        {report.perContractor.length ? (
          <table className="w-full overflow-hidden rounded-[10px] border-2 border-ink bg-white text-sm">
            <thead className="bg-ink text-left text-board">
              <tr>
                <th className="px-3 py-2">Contractor</th>
                <th className="px-3 py-2 text-right">Calls</th>
                <th className="px-3 py-2 text-right">Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {report.perContractor.map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">{r.name ?? "(deleted)"} <span className="text-muted">{r.phone?.slice(-10)}</span></td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.calls}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{usd(r.spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted">No AI calls this month.</p>
        )}
      </section>

      <form action={logoutAdmin}>
        <button className="btn btn-outline w-full">Log out</button>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh max-w-md space-y-5 bg-ground px-4 py-6">
      <h1 className="font-display text-2xl">PaniBook admin</h1>
      {children}
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "off" }) {
  return (
    <div className="bg-white p-3">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={`font-display text-xl tabular-nums ${tone === "ok" ? "text-ok" : tone === "off" ? "text-danger" : ""}`}>{value}</p>
    </div>
  );
}
