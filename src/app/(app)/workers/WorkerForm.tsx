"use client";

import { Check, IndianRupee } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState, type FormEvent } from "react";
import { saveWorker, type WorkerFormState } from "@/app/actions/workers";
import { PhotoInput, VideoInput } from "@/components/PhotoInput";
import { SkillPicker, type SelectedSkill } from "@/components/SkillPicker";
import { SubmitButton, submitKeepingValues } from "@/components/SubmitButton";
import { clearDraft, useDraftSaver, useInitialDraft } from "@/components/useDraft";
import { VoiceRecorder, type AiStatus, type VoiceResult } from "@/components/VoiceRecorder";
import { HOME_STATES, LANGUAGES } from "@/config/workers";
import type { WorkerExtraction } from "@/lib/ai/extract";

export type WorkerFormInitial = {
  id: string;
  name: string;
  photoUrl: string | null;
  homeState: string | null;
  languages: string[];
  expectedWage: number | null;
  availability: "available" | "placed" | "inactive";
  notes: string | null;
  mediaConsent: boolean;
  skills: SelectedSkill[];
  hasVideo: boolean;
};

type Values = {
  name: string;
  skills: SelectedSkill[];
  wage: string;
  homeState: string;
  languages: string[];
  notes: string;
  consent: boolean;
  transcript: string;
  voiceUrl: string;
};

const DRAFT_KEY = "pb:draft:worker";

export function WorkerForm({
  skillOptions,
  initial,
  ai,
  video,
}: {
  skillOptions: { id: string; label: string }[];
  initial?: WorkerFormInitial;
  ai: AiStatus;
  video: { maxSeconds: number; maxBytes: number };
}) {
  const t = useTranslations("workers");
  const tc = useTranslations("common");
  const tOff = useTranslations("offline");
  const [state, action, pending] = useActionState<WorkerFormState, FormData>(saveWorker, {});
  const [v, setV] = useState<Values>({
    name: initial?.name ?? "",
    skills: initial?.skills ?? [],
    wage: initial?.expectedWage ? String(initial.expectedWage) : "",
    homeState: initial?.homeState ?? "",
    languages: initial?.languages ?? [],
    notes: initial?.notes ?? "",
    consent: initial?.mediaConsent ?? false,
    transcript: "",
    voiceUrl: "",
  });
  const [offlineBlocked, setOfflineBlocked] = useState(false);
  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((prev) => ({ ...prev, [k]: val }));

  // New workers only: offer back an unsent draft from this phone, keep saving.
  const savedDraft = useInitialDraft<Values>(DRAFT_KEY);
  const [draftHandled, setDraftHandled] = useState(false);
  const offerDraft = !initial && !draftHandled && Boolean(savedDraft && (savedDraft.name || savedDraft.skills?.length));
  useDraftSaver(DRAFT_KEY, v, !initial);

  function applyVoice(r: VoiceResult<WorkerExtraction>) {
    const known = new Set(skillOptions.map((o) => o.id));
    const state = HOME_STATES.find((s) => s.toLowerCase() === r.result.home_state?.toLowerCase()) ?? r.result.home_state ?? "";
    const skills = r.result.skills.filter((s) => known.has(s.skill_id)).map((s) => ({ skillId: s.skill_id, years: s.years }));
    setV((prev) => ({
      ...prev,
      name: r.result.name ?? prev.name,
      skills: skills.length ? skills : prev.skills,
      wage: r.result.expected_wage ? String(r.result.expected_wage) : prev.wage,
      homeState: state || prev.homeState,
      languages: r.result.languages.length ? r.result.languages : prev.languages,
      notes: [r.result.notes_ml, r.result.availability].filter(Boolean).join("\n") || prev.notes,
      transcript: r.transcript,
      voiceUrl: r.voiceUrl,
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

  const otherState = Boolean(v.homeState) && !HOME_STATES.includes(v.homeState as (typeof HOME_STATES)[number]);

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-6">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="transcript" value={v.transcript} />
      <input type="hidden" name="voiceNoteUrl" value={v.voiceUrl} />

      {offerDraft && savedDraft && (
        <div className="space-y-2 rounded-board border-2 border-ink bg-board-soft p-3">
          <p className="text-[15px] font-semibold">{t("draftFound", { name: savedDraft.name || "—" })}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn btn-ink btn-sm"
              onClick={() => {
                setV(savedDraft);
                setDraftHandled(true);
              }}
            >
              {t("draftRestore")}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                clearDraft(DRAFT_KEY);
                setDraftHandled(true);
              }}
            >
              {t("draftDiscard")}
            </button>
          </div>
        </div>
      )}

      {!initial && <VoiceRecorder<WorkerExtraction> kind="worker" status={ai} onResult={applyVoice} />}

      <PhotoInput initialUrl={initial?.photoUrl} />

      <label className="block">
        <span className="label">{t("name")}</span>
        <input className="field" name="name" value={v.name} onChange={(e) => set("name", e.target.value)} maxLength={80} autoComplete="off" required />
      </label>

      <fieldset className="space-y-2">
        <legend className="label">{t("skills")}</legend>
        <SkillPicker options={skillOptions} value={v.skills} onChange={(s) => set("skills", s)} />
      </fieldset>

      <label className="block">
        <span className="label">{t("expectedWage")}</span>
        <div className="relative">
          <IndianRupee className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-2" aria-hidden />
          <input
            className="field tabular pl-10"
            name="expectedWage"
            type="number"
            inputMode="numeric"
            min={100}
            max={10000}
            step={50}
            value={v.wage}
            onChange={(e) => set("wage", e.target.value)}
            placeholder="1000"
          />
        </div>
      </label>

      <fieldset className="space-y-2">
        <legend className="label">{t("homeState")}</legend>
        <div className="flex flex-wrap gap-2">
          {HOME_STATES.map((s) => (
            <button key={s} type="button" aria-pressed={v.homeState === s} onClick={() => set("homeState", v.homeState === s ? "" : s)} className="chip">
              {s}
            </button>
          ))}
        </div>
        <input
          className="field"
          name="homeState"
          value={v.homeState}
          onChange={(e) => set("homeState", e.target.value)}
          placeholder={t("homeStateOther")}
          maxLength={40}
          aria-label={t("homeState")}
          hidden={Boolean(v.homeState) && !otherState}
        />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="label">{t("languages")}</legend>
        <div className="flex flex-wrap gap-2">
          {[...new Set([...LANGUAGES, ...v.languages])].map((l) => {
            const on = v.languages.includes(l);
            return (
              <button
                key={l}
                type="button"
                aria-pressed={on}
                className="chip"
                onClick={() => set("languages", on ? v.languages.filter((x) => x !== l) : [...v.languages, l])}
              >
                {on && <Check className="size-4" strokeWidth={3} aria-hidden />}
                {l}
              </button>
            );
          })}
        </div>
        {v.languages.map((l) => (
          <input key={l} type="hidden" name="languages" value={l} />
        ))}
      </fieldset>

      {initial && (
        <label className="block">
          <span className="label">{t("availabilityLabel")}</span>
          <select className="field" name="availability" defaultValue={initial.availability}>
            {(["available", "placed", "inactive"] as const).map((a) => (
              <option key={a} value={a}>
                {t(`availability.${a}`)}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="label">{t("notes")}</span>
        <textarea className="field min-h-24" name="notes" value={v.notes} onChange={(e) => set("notes", e.target.value)} maxLength={1000} placeholder={t("notesPlaceholder")} />
      </label>

      <VideoInput maxSeconds={video.maxSeconds} maxBytes={video.maxBytes} hasExisting={Boolean(initial?.hasVideo)} />

      <label className="flex items-start gap-3 rounded-board border-2 border-ink bg-surface p-4">
        <input
          type="checkbox"
          name="mediaConsent"
          checked={v.consent}
          onChange={(e) => set("consent", e.target.checked)}
          className="mt-0.5 size-6 shrink-0 accent-[var(--color-bus)]"
        />
        <span>
          <span className="block font-semibold">{t("consent")}</span>
          <span className="text-[15px] text-ink-2">{t("consentHint")}</span>
        </span>
      </label>

      {offlineBlocked && (
        <p role="alert" className="font-semibold text-danger">
          {tOff("cantSave")}
        </p>
      )}
      {state.error && (
        <p role="alert" className="font-semibold text-danger">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <SubmitButton pending={pending}>{initial ? tc("save") : t("saveAndMatch")}</SubmitButton>
    </form>
  );
}
