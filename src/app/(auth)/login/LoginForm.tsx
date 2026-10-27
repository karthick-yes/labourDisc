"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { login, type AuthState } from "@/app/actions/auth";
import { SubmitButton, submitKeepingValues } from "@/components/SubmitButton";

export function LoginForm() {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<AuthState, FormData>(login, {});

  return (
    <form onSubmit={submitKeepingValues(action)} className="space-y-4">
      <h1 className="font-display text-[1.75rem]">{t("loginTitle")}</h1>

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

      <label className="block">
        <span className="label">{t("pin")}</span>
        <input
          className="field tabular tracking-[0.4em]"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={6}
          required
        />
      </label>

      {state.error && (
        <p role="alert" className="font-semibold text-danger">
          {t(`errors.${state.error}`, state.values)}
        </p>
      )}

      <SubmitButton pending={pending}>{t("loginButton")}</SubmitButton>

      <Link href="/signup" className="btn btn-outline w-full">
        {t("noAccount")}
      </Link>
    </form>
  );
}
