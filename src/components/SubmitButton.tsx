"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { startTransition, type FormEvent } from "react";

export function SubmitButton({
  pending,
  children,
  className = "btn-primary",
}: {
  pending: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("common");
  return (
    <button type="submit" className={`btn ${className} min-h-14 w-full text-lg`} disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <LoaderCircle className="size-5 animate-spin" aria-hidden />
          {t("saving")}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * onSubmit handler that runs a useActionState action without React's
 * automatic form reset, so typed values survive a validation error.
 */
export function submitKeepingValues(action: (form: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(() => action(form));
  };
}
