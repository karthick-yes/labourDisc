"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { updateSettings, type SettingsState } from "@/app/actions/settings";
import { LocationPicker } from "@/components/LocationPicker";
import { SubmitButton, submitKeepingValues } from "@/components/SubmitButton";

type Initial = {
  probationDays: number;
  lat: number | null;
  lng: number | null;
  areaName: string;
};

export function SettingsForm({ initial }: { initial: Initial }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateSettings, {});

  return (
    <form onSubmit={submitKeepingValues(action)} className="panel space-y-5 p-4">
      <LocationPicker initial={{ lat: initial.lat, lng: initial.lng, areaName: initial.areaName }} />

      <label className="block">
        <span className="label">{t("settings.probationDays")}</span>
        <input
          className="field tabular"
          name="probationDays"
          type="number"
          inputMode="numeric"
          min={1}
          max={90}
          defaultValue={initial.probationDays}
          required
        />
        <span className="hint">{t("settings.probationHint")}</span>
      </label>

      {state.error && (
        <p role="alert" className="font-semibold text-danger">
          {t(state.error)}
        </p>
      )}
      {state.ok && !pending && <p className="font-semibold text-ok">{t("settings.saved")}</p>}

      <SubmitButton pending={pending} className="btn-ink">
        {t("common.save")}
      </SubmitButton>
    </form>
  );
}
