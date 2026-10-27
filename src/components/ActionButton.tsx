"use client";

import { LoaderCircle } from "lucide-react";
import { useTransition } from "react";

/** Runs a server action on tap, with an optional confirm prompt. */
export function ActionButton({
  action,
  confirm,
  className = "btn btn-outline",
  children,
}: {
  action: () => Promise<unknown>;
  confirm?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      className={className}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        startTransition(async () => {
          await action();
        });
      }}
    >
      {pending ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : children}
    </button>
  );
}
