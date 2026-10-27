"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { ratePlacementAction } from "@/app/actions/placements";

/** 1-tap rating (1–5) plus an optional note of what the shop said. */
export function RatingPicker({ placementId, initial }: { placementId: string; initial?: { score: number; note: string | null } }) {
  const t = useTranslations("rating");
  const [score, setScore] = useState(initial?.score ?? 0);
  const [note, setNote] = useState(initial?.note ?? "");
  const [saved, setSaved] = useState(Boolean(initial));
  const [pending, startTransition] = useTransition();

  const save = (s: number, n: string) =>
    startTransition(async () => {
      await ratePlacementAction(placementId, s, n);
      setSaved(true);
    });

  return (
    <div className="space-y-3">
      <div className="flex justify-between gap-1" role="radiogroup" aria-label={t("label")}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={score === n}
            aria-label={t("stars", { count: n })}
            disabled={pending}
            onClick={() => {
              setScore(n);
              save(n, note);
            }}
            className={`flex size-14 items-center justify-center rounded-board border-2 ${n <= score ? "border-ink bg-board" : "border-ink-2/30 bg-surface"}`}
          >
            <Star className={`size-7 ${n <= score ? "fill-ink text-ink" : "text-ink-2"}`} aria-hidden />
          </button>
        ))}
      </div>
      {score > 0 && (
        <div className="space-y-2">
          <label className="block">
            <span className="label">{t("note")}</span>
            <input
              className="field"
              value={note}
              maxLength={300}
              placeholder={t("notePlaceholder")}
              onChange={(e) => {
                setNote(e.target.value);
                setSaved(false);
              }}
            />
          </label>
          {!saved && (
            <button type="button" className="btn btn-ink btn-sm w-full" disabled={pending} onClick={() => save(score, note)}>
              {t("saveNote")}
            </button>
          )}
          {saved && <p className="text-sm font-semibold text-ok">{t("saved")}</p>}
        </div>
      )}
    </div>
  );
}
