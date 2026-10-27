"use client";

import { Check, IndianRupee, Minus, Plus, Search, Store, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useMemo, useState, type FormEvent } from "react";
import { saveNeed, type NeedFormState } from "@/app/actions/needs";
import { LocationPicker } from "@/components/LocationPicker";
import { SubmitButton, submitKeepingValues } from "@/components/SubmitButton";
import { clearDraft, useDraftSaver, useInitialDraft } from "@/components/useDraft";
import { VoiceRecorder, type AiStatus, type VoiceResult } from "@/components/VoiceRecorder";
import { WAGE_RANGES } from "@/config/wages";
import type { NeedExtraction } from "@/lib/ai/extract";

type EnterpriseOption = { id: string; name: string; area: string | null; categoryId: string | null };
type Option = { id: string; label: string };

export type NeedFormInitial = {
  id: string;
  enterpriseId: string;
  skillId: string;
  countNeeded: number;
  wageOffered: number | null;
  startDate: string | null;
  notes: string | null;
};

type Values = {
  enterpriseId: string;
  newName: string;
  skillId: string;
  count: number;
  wage: string;
  startDate: string;
  notes: string;
};

const DRAFT_KEY = "pb:draft:need";

export function NeedForm({
  enterprises,
  skills,
  categories,
  categoryRoles,
  initial,
  preselectEnterpriseId,
  ai,
}: {
  enterprises: EnterpriseOption[];
  skills: Option[];
  categories: Option[];
  categoryRoles: Record<string, string[]>;
  initial?: NeedFormInitial;
  preselectEnterpriseId?: string;
  ai: AiStatus;
}) {
  const t = useTranslations("needs");
  const te = useTranslations("enterprises");
  const tAll = useTranslations();
  const [state, action, pending] = useActionState<NeedFormState, FormData>(saveNeed, {});
  const [v, setV] = useState<Values>({
    enterpriseId: initial?.enterpriseId ?? preselectEnterpriseId ?? "",
    newName: "",
    skillId: initial?.skillId ?? "",
    count: initial?.countNeeded ?? 1,
    wage: initial?.wageOffered ? String(initial.wageOffered) : "",
    startDate: initial?.startDate ?? "",
    notes: initial?.notes ?? "",
  });
  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((prev) => ({ ...prev, [k]: val }));
  const [query, setQuery] = useState("");
  const [offlineBlocked, setOfflineBlocked] = useState(false);

  const savedDraft = useInitialDraft<Values>(DRAFT_KEY);
  const [draftHandled, setDraftHandled] = useState(false);
  const offerDraft =
    !initial && !preselectEnterpriseId && !draftHandled && Boolean(savedDraft && (savedDraft.enterpriseId || savedDraft.skillId || savedDraft.newName));
  useDraftSaver(DRAFT_KEY, v, !initial);

  const selected = enterprises.find((e) => e.id === v.enterpriseId);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return enterprises.filter((e) => e.name.toLowerCase().includes(q) || e.area?.toLowerCase().includes(q)).slice(0, 8);
  }, [enterprises, query]);

  // Roles this kind of shop usually hires come first.
  const suggested = new Set(selected?.categoryId ? (categoryRoles[selected.categoryId] ?? []) : []);
  const orderedSkills = [...skills].sort((a, b) => Number(suggested.has(b.id)) - Number(suggested.has(a.id)));
  const range = v.skillId ? WAGE_RANGES[v.skillId] : undefined;

  function applyVoice(r: VoiceResult<NeedExtraction>) {
    const name = r.result.enterprise_name?.trim().toLowerCase();
    const match = name ? enterprises.find((e) => e.name.toLowerCase().includes(name) || name.includes(e.name.toLowerCase())) : undefined;
    setV((prev) => ({
      ...prev,
      enterpriseId: match ? match.id : name ? "new" : prev.enterpriseId,
      newName: !match && r.result.enterprise_name ? r.result.enterprise_name : prev.newName,
      skillId: r.result.skill_id && skills.some((s) => s.id === r.result.skill_id) ? r.result.skill_id : prev.skillId,
      count: r.result.count ?? prev.count,
      wage: r.result.wage_offered ? String(r.result.wage_offered) : prev.wage,
      startDate: r.result.start_date ?? prev.startDate,
      notes: r.result.notes ?? prev.notes,
    }));
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (!navigator.onLine) {
      e.preventDefault();
      setOfflineBlocked(true);
      return;
    }
    setOfflineBlocked(false);
    if (!initial) clearDraft(DRAFT_KEY);
    submitKeepingValues(action)(e);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-6">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="enterpriseId" value={v.enterpriseId} />

      {offerDraft && savedDraft && (
        <div className="space-y-2 rounded-board border-2 border-ink bg-board-soft p-3">
          <p className="text-[15px] font-semibold">{t("draftFound")}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn btn-ink btn-sm"
              onClick={() => {
                setV(savedDraft);
                setDraftHandled(true);
              }}
            >
              {tAll("workers.draftRestore")}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                clearDraft(DRAFT_KEY);
                setDraftHandled(true);
              }}
            >
              {tAll("workers.draftDiscard")}
            </button>
          </div>
        </div>
      )}

      {!initial && <VoiceRecorder<NeedExtraction> kind="need" status={ai} onResult={applyVoice} />}

      <fieldset className="space-y-2">
        <legend className="label">{t("enterprise")}</legend>
        {v.enterpriseId === "new" ? (
          <div className="panel">
            <div className="strip text-base">
              {te("newTitle")}
              <button type="button" className="flex size-9 items-center justify-center" onClick={() => set("enterpriseId", "")} aria-label={tAll("common.cancel")}>
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="space-y-4 p-3">
              <label className="block">
                <span className="label">{te("name")}</span>
                <input className="field" name="newEnterprise.name" value={v.newName} onChange={(e) => set("newName", e.target.value)} maxLength={100} required />
              </label>
              <label className="block">
                <span className="label">{te("phone")}</span>
                <input className="field" name="newEnterprise.phone" type="tel" inputMode="tel" placeholder={tAll("auth.phonePlaceholder")} />
              </label>
              <label className="block">
                <span className="label">{te("category")}</span>
                <select className="field" name="newEnterprise.categoryId" defaultValue="">
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <LocationPicker variant="enterprise" namePrefix="newEnterprise." />
            </div>
          </div>
        ) : selected ? (
          <div className="panel flex items-center justify-between gap-3 bg-board-soft p-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <Store className="size-5 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="block truncate font-bold">{selected.name}</span>
                {selected.area && <span className="block truncate text-sm text-ink-2">{selected.area}</span>}
              </span>
            </span>
            <button type="button" className="btn btn-outline btn-sm shrink-0" onClick={() => set("enterpriseId", "")}>
              {t("change")}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-2" aria-hidden />
              <input
                className="field pl-11"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchEnterprise")}
                aria-label={t("searchEnterprise")}
              />
            </div>
            {results.length > 0 && (
              <ul className="panel divide-y-2 divide-ground">
                {results.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      className="flex min-h-12 w-full flex-col justify-center px-3 py-2 text-left active:bg-ground"
                      onClick={() => {
                        set("enterpriseId", e.id);
                        setQuery("");
                      }}
                    >
                      <span className="font-semibold">{e.name}</span>
                      {e.area && <span className="text-sm text-ink-2">{e.area}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="btn btn-outline w-full"
              onClick={() => {
                setV((prev) => ({ ...prev, enterpriseId: "new", newName: prev.newName || query }));
              }}
            >
              <Plus className="size-5" aria-hidden />
              {te("add")}
            </button>
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="label">{t("skill")}</legend>
        <input type="hidden" name="skillId" value={v.skillId} />
        <div className="flex flex-wrap gap-2">
          {orderedSkills.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => set("skillId", s.id)}
              aria-pressed={v.skillId === s.id}
              className={`chip ${suggested.has(s.id) && v.skillId !== s.id ? "border-ink bg-board-soft" : ""}`}
            >
              {v.skillId === s.id && <Check className="size-4" strokeWidth={3} aria-hidden />}
              {s.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="label">{t("count")}</span>
          <div className="flex min-h-12 items-center justify-between rounded-board border-2 border-ink-2/40 bg-surface p-0.5">
            <button type="button" className="flex size-11 items-center justify-center" onClick={() => set("count", Math.max(1, v.count - 1))} aria-label={t("fewer")}>
              <Minus className="size-5" aria-hidden />
            </button>
            <span className="font-display tabular text-2xl">{v.count}</span>
            <button type="button" className="flex size-11 items-center justify-center" onClick={() => set("count", Math.min(100, v.count + 1))} aria-label={t("more")}>
              <Plus className="size-5" aria-hidden />
            </button>
          </div>
          <input type="hidden" name="countNeeded" value={v.count} />
        </div>
        <label className="block">
          <span className="label">{t("wageOffered")}</span>
          <div className="relative">
            <IndianRupee className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-ink-2" aria-hidden />
            <input
              className="field tabular pl-9"
              name="wageOffered"
              type="number"
              inputMode="numeric"
              min={100}
              max={10000}
              step={50}
              value={v.wage}
              onChange={(e) => set("wage", e.target.value)}
              placeholder={range ? String(range[0]) : "1000"}
            />
          </div>
        </label>
      </div>
      {range && <p className="-mt-4 text-sm text-ink-2">{t("typicalWage", { min: range[0], max: range[1] })}</p>}

      <label className="block">
        <span className="label">{t("startDate")}</span>
        <input className="field" name="startDate" type="date" value={v.startDate} onChange={(e) => set("startDate", e.target.value)} />
      </label>

      <label className="block">
        <span className="label">{t("notes")}</span>
        <textarea className="field min-h-20" name="notes" value={v.notes} onChange={(e) => set("notes", e.target.value)} maxLength={1000} placeholder={t("notesPlaceholder")} />
      </label>

      {offlineBlocked && (
        <p role="alert" className="font-semibold text-danger">
          {tAll("offline.cantSave")}
        </p>
      )}
      {state.error && (
        <p role="alert" className="font-semibold text-danger">
          {tAll(state.error)}
        </p>
      )}
      <SubmitButton pending={pending}>{initial ? tAll("common.save") : t("saveAndMatch")}</SubmitButton>
    </form>
  );
}
