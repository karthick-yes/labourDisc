"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { savePlacement, type PlacementFormState } from "@/app/actions/placements";
import { SubmitButton, submitKeepingValues } from "@/components/SubmitButton";

export function PlacementForm({
  workerId,
  needId,
  summary,
  defaults,
}: {
  workerId: string;
  needId: string;
  summary: { worker: string; enterprise: string; skill: string };
  defaults: { startDate: string; wage: number; commission: number; probationDays: number };
}) {
  const t = useTranslations("placements");
  const [state, action, pending] = useActionState<PlacementFormState, FormData>(savePlacement, {});
  const [wage, setWage] = useState(String(defaults.wage || ""));
  const [commission, setCommission] = useState(String(defaults.commission || ""));
  const [commissionTouched, setCommissionTouched] = useState(false);

  return (
    <form onSubmit={submitKeepingValues(action)} className="space-y-5 pb-6">
      <input type="hidden" name="workerId" value={workerId} />
      <input type="hidden" name="needId" value={needId} />

      <div className="panel">
        <div className="strip">{summary.skill}</div>
        <p className="flex items-center gap-2 px-3 py-3 text-base font-bold">
          <span className="truncate">{summary.worker}</span>
          <ArrowRight className="size-5 shrink-0" aria-hidden />
          <span className="truncate">{summary.enterprise}</span>
        </p>
      </div>

      <label className="block">
        <span className="label">{t("startDate")}</span>
        <input className="field" type="date" name="startDate" defaultValue={defaults.startDate} required />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">{t("wage")}</span>
          <input
            className="field tabular"
            name="wage"
            type="number"
            inputMode="numeric"
            min={100}
            step={50}
            value={wage}
            onChange={(e) => {
              setWage(e.target.value);
              // Commission defaults to one day's wage until edited.
              if (!commissionTouched) setCommission(e.target.value);
            }}
            required
          />
        </label>
        <label className="block">
          <span className="label">{t("commissionLabel")}</span>
          <input
            className="field tabular"
            name="commissionAmount"
            type="number"
            inputMode="numeric"
            min={0}
            step={50}
            value={commission}
            onChange={(e) => {
              setCommission(e.target.value);
              setCommissionTouched(true);
            }}
            required
          />
        </label>
      </div>
      <p className="-mt-3 text-sm text-muted">{t("commissionHint")}</p>

      <label className="block">
        <span className="label">{t("probationDays")}</span>
        <input className="field tabular" name="probationDays" type="number" inputMode="numeric" min={0} max={90} defaultValue={defaults.probationDays} required />
        <span className="hint">{t("probationHint")}</span>
      </label>

      {state.error && (
        <p role="alert" className="font-semibold text-danger">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <SubmitButton pending={pending}>{t("save")}</SubmitButton>
    </form>
  );
}
