"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { saveEnterprise, type EnterpriseFormState } from "@/app/actions/enterprises";
import { LocationPicker } from "@/components/LocationPicker";
import { SubmitButton, submitKeepingValues } from "@/components/SubmitButton";

export type EnterpriseFormInitial = {
  id: string;
  name: string;
  phone: string | null;
  categoryId: string | null;
  lat: number | null;
  lng: number | null;
  areaName: string | null;
  notes: string | null;
};

export function EnterpriseForm({
  categories,
  initial,
}: {
  categories: { id: string; label: string }[];
  initial?: EnterpriseFormInitial;
}) {
  const t = useTranslations("enterprises");
  const tAll = useTranslations();
  const [state, action, pending] = useActionState<EnterpriseFormState, FormData>(saveEnterprise, {});

  return (
    <form onSubmit={submitKeepingValues(action)} className="space-y-5 pb-6">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <label className="block">
        <span className="label">{t("name")}</span>
        <input className="field" name="name" defaultValue={initial?.name} maxLength={100} required />
      </label>
      <label className="block">
        <span className="label">{t("phone")}</span>
        <input
          className="field"
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={initial?.phone ? initial.phone.slice(-10) : ""}
          placeholder={tAll("auth.phonePlaceholder")}
        />
      </label>
      <label className="block">
        <span className="label">{t("category")}</span>
        <select className="field" name="categoryId" defaultValue={initial?.categoryId ?? ""}>
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <LocationPicker
        variant="enterprise"
        initial={initial ? { lat: initial.lat, lng: initial.lng, areaName: initial.areaName ?? "" } : undefined}
      />
      <label className="block">
        <span className="label">{t("notes")}</span>
        <textarea className="field min-h-24" name="notes" defaultValue={initial?.notes ?? ""} maxLength={1000} />
      </label>
      {state.error && (
        <p role="alert" className="font-semibold text-danger">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <SubmitButton pending={pending}>{tAll("common.save")}</SubmitButton>
    </form>
  );
}
