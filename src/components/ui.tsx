import { ChevronLeft, Search, Star } from "lucide-react";
import Link from "next/link";
import type { MatchLabel } from "@/lib/matching/score";
import { initials } from "@/lib/names";

// Shared pieces of the destination-board system. No hooks, so they work in
// server and client components.

export function Avatar({ name, photoUrl, size = 48 }: { name: string; photoUrl?: string | null; size?: number }) {
  const style = { width: size, height: size };
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- served by our own media route
    return <img src={photoUrl} alt="" style={style} className="shrink-0 rounded-board border-2 border-ink object-cover" />;
  }
  return (
    <span
      style={{ ...style, fontSize: size * 0.4 }}
      className="font-display flex shrink-0 items-center justify-center rounded-board border-2 border-ink bg-board text-ink"
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

const MATCH_PLATE: Record<MatchLabel, string> = {
  strong: "bg-ink text-board",
  good: "border-2 border-ink bg-surface text-ink",
  possible: "bg-ground text-muted",
};

export function MatchPlate({ label, text, score }: { label: MatchLabel; text: string; score: number }) {
  return (
    <span className={`plate ${MATCH_PLATE[label]}`}>
      {text}
      <span className="tabular opacity-80">{score}</span>
    </span>
  );
}

type Tone = "neutral" | "ok" | "warn" | "danger" | "ink";
const TONES: Record<Tone, string> = {
  neutral: "bg-ground text-ink-2",
  ok: "bg-ok-soft text-ok",
  warn: "bg-board text-ink",
  danger: "bg-danger-soft text-danger",
  ink: "bg-ink text-white",
};

export function StatusPlate({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`plate ${TONES[tone]}`}>{children}</span>;
}

export function PageHeader({
  title,
  back,
  action,
}: {
  title: string;
  back?: { href: string; label: string };
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-4 space-y-1">
      {back && (
        <Link href={back.href} className="-ml-1 inline-flex min-h-10 items-center gap-0.5 font-semibold text-ink-2">
          <ChevronLeft className="size-5" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[1.75rem] text-balance">{title}</h1>
        {action}
      </div>
    </header>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="panel border-dashed px-5 py-8 text-center">
      {icon && <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-board bg-board text-ink">{icon}</div>}
      <p className="font-display text-lg">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-[32ch] text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function FilterChips({ items }: { items: { href: string; label: string; active: boolean; count?: number }[] }) {
  return (
    <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" aria-label="Filter">
      {items.map((i) => (
        <Link key={i.href} href={i.href} replace className="chip shrink-0" data-active={i.active} aria-current={i.active ? "page" : undefined}>
          {i.label}
          {i.count != null && <span className="tabular opacity-70">{i.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function SearchBox({ action, q, placeholder, hidden }: { action: string; q?: string; placeholder: string; hidden?: Record<string, string> }) {
  return (
    <form action={action} role="search" className="relative">
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-2" aria-hidden />
      <input type="search" name="q" defaultValue={q} className="field pl-11" placeholder={placeholder} aria-label={placeholder} />
    </form>
  );
}

export function Stars({ avg, count, label }: { avg: number | null; count: number; label: string }) {
  if (!count || avg == null) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
      <Star className="size-4 fill-board-dark text-board-dark" aria-hidden />
      <span className="tabular">{avg.toFixed(1)}</span>
      <span className="font-normal text-muted">· {label}</span>
    </span>
  );
}

export function SectionTitle({ children, count, action }: { children: React.ReactNode; count?: number; action?: React.ReactNode }) {
  return (
    <div className="mt-2 mb-2.5 flex items-end justify-between gap-3">
      <h2 className="font-display min-w-0 text-xl">
        {children}
        {count != null && <span className="tabular ml-1.5 text-base text-muted">{count}</span>}
      </h2>
      {action && <div className="shrink-0 whitespace-nowrap">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "ok", children }: { tone?: "ok" | "warn" | "danger"; children: React.ReactNode }) {
  const t = { ok: "border-ok bg-ok-soft text-ok", warn: "border-ink bg-board-soft text-ink", danger: "border-danger bg-danger-soft text-danger" }[tone];
  return <div className={`rounded-board border-2 px-3.5 py-3 font-semibold ${t}`}>{children}</div>;
}
