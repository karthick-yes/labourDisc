"use client";

import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

/** Strip under the header while the phone has no connection. */
export function OfflineBanner() {
  const online = useOnline();
  const t = useTranslations("offline");
  if (online) return null;
  return (
    <div role="status" className="sticky top-[68px] z-10 flex items-center gap-2 bg-ink px-4 py-2 text-sm font-semibold text-board">
      <WifiOff className="size-4" aria-hidden />
      {t("banner")}
    </div>
  );
}
