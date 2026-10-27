"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { deleteAccount, type DeleteState } from "@/app/actions/account";

/** Delete the account and all its data (DPDP: allow deletion). Needs the PIN. */
export function DeleteAccount() {
  const t = useTranslations("settings.data");
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, {});

  if (!open) {
    return (
      <button type="button" className="btn btn-danger w-full" onClick={() => setOpen(true)}>
        <Trash2 className="size-5" aria-hidden />
        {t("delete")}
      </button>
    );
  }
  return (
    <form action={action} className="space-y-3 rounded-board border-2 border-danger bg-danger-soft p-3">
      <p className="font-semibold text-danger">{t("deleteWarning")}</p>
      <label className="block">
        <span className="label">{t("deletePin")}</span>
        <input className="field" name="pin" type="password" inputMode="numeric" maxLength={6} required autoComplete="current-password" />
      </label>
      {state.error && (
        <p role="alert" className="font-semibold text-danger">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
          {t("cancel")}
        </button>
        <button type="submit" className="btn border-danger bg-danger text-white" disabled={pending}>
          {t("deleteConfirm")}
        </button>
      </div>
    </form>
  );
}
