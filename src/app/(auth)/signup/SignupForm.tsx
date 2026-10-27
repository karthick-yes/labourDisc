"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { signup, type AuthState } from "@/app/actions/auth";
import { LocationPicker } from "@/components/LocationPicker";
import { SubmitButton, submitKeepingValues } from "@/components/SubmitButton";

export function SignupForm({ needsCode }: { needsCode: boolean }) {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<AuthState, FormData>(signup, {});

  return (
    <form onSubmit={submitKeepingValues(action)} className="space-y-4 pb-8">
      <h1 className="font-display text-[1.75rem]">{t("signupTitle")}</h1>

      <label className="block">
        <span className="label">{t("name")}</span>
        <input className="field" name="name" autoComplete="name" maxLength={80} required />
      </label>

      <label className="block">
        <span className="label">{t("phone")}</span>
        <input
          className="field"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t("phonePlaceholder")}
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">{t("pin")}</span>
          <input
            className="field tabular tracking-[0.4em]"
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={6}
            required
          />
        </label>
        <label className="block">
          <span className="label">{t("confirmPin")}</span>
          <input
            className="field tabular tracking-[0.4em]"
            name="pin2"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={6}
            required
          />
        </label>
      </div>
      <p className="-mt-2 text-sm text-ink-2">{t("pinHint")}</p>

      <LocationPicker />

      {needsCode && (
        <label className="block">
          <span className="label">{t("signupCode")}</span>
          <input className="field" name="signupCode" required />
        </label>
      )}

      {state.error && (
        <p role="alert" className="font-semibold text-danger">
          {t(`errors.${state.error}`, state.values)}
        </p>
      )}

      <SubmitButton pending={pending}>{t("signupButton")}</SubmitButton>

      <Link href="/login" className="btn btn-outline w-full">
        {t("haveAccount")}
      </Link>
    </form>
  );
}
