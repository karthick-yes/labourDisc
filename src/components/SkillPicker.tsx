"use client";

import { Check, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

type Option = { id: string; label: string };
export type SelectedSkill = { skillId: string; years: number | null };

// Tap skills to select (no typing), then set years with − / +.
// Controlled; also submits a hidden "skills" field as JSON.
export function SkillPicker({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: SelectedSkill[];
  onChange: (v: SelectedSkill[]) => void;
}) {
  const t = useTranslations("workers");
  const isOn = (id: string) => value.some((s) => s.skillId === id);
  const toggle = (id: string) =>
    onChange(isOn(id) ? value.filter((s) => s.skillId !== id) : [...value, { skillId: id, years: null }]);
  const setYears = (id: string, years: number | null) =>
    onChange(value.map((s) => (s.skillId === id ? { ...s, years } : s)));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.id} type="button" onClick={() => toggle(o.id)} aria-pressed={isOn(o.id)} className="chip">
            {isOn(o.id) && <Check className="size-4" strokeWidth={3} aria-hidden />}
            {o.label}
          </button>
        ))}
      </div>

      {value.length > 0 && (
        <ul className="panel divide-y-2 divide-ground">
          {value.map((s) => (
            <li key={s.skillId} className="flex items-center justify-between gap-2 py-1.5 pr-1.5 pl-3">
              <span className="font-semibold">{options.find((o) => o.id === s.skillId)?.label}</span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  className="flex size-11 items-center justify-center rounded-board border-2 border-ink-2/30"
                  onClick={() => setYears(s.skillId, s.years && s.years > 1 ? s.years - 1 : null)}
                  aria-label={t("fewerYears")}
                >
                  <Minus className="size-5" aria-hidden />
                </button>
                <span className="tabular w-[4.5rem] text-center font-semibold">
                  {s.years ? t("yearsShort", { years: s.years }) : t("yearsUnknown")}
                </span>
                <button
                  type="button"
                  className="flex size-11 items-center justify-center rounded-board border-2 border-ink-2/30"
                  onClick={() => setYears(s.skillId, Math.min(60, (s.years ?? 0) + 1))}
                  aria-label={t("moreYears")}
                >
                  <Plus className="size-5" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <input type="hidden" name="skills" value={JSON.stringify(value)} />
    </div>
  );
}
