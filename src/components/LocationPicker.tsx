"use client";

import { Check, LoaderCircle, LocateFixed } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { REGIONS } from "@/config/regions";

type Value = { lat: number | null; lng: number | null; areaName: string };

// Pick a town, or use the phone's GPS (works anywhere, not just the towns in
// the list). Submits lat/lng/areaName, optionally with a field-name prefix.
// variant "base" = contractor's own location, "enterprise" = a shop's.
export function LocationPicker({
  initial,
  variant = "base",
  namePrefix = "",
}: {
  initial?: Value;
  variant?: "base" | "enterprise";
  namePrefix?: string;
}) {
  const t = useTranslations("location");
  const locale = useLocale();
  const [value, setValue] = useState<Value>(
    initial ?? { lat: null, lng: null, areaName: "" },
  );
  const [regionId, setRegionId] = useState(
    () => REGIONS.find((r) => r.lat === initial?.lat && r.lng === initial?.lng)?.id ?? "",
  );
  const [gps, setGps] = useState<"idle" | "working" | "failed" | "set">("idle");

  function pickRegion(id: string) {
    setRegionId(id);
    const region = REGIONS.find((r) => r.id === id);
    if (region) setValue({ lat: region.lat, lng: region.lng, areaName: region.en });
    setGps("idle");
  }

  function useGps() {
    if (!navigator.geolocation) return setGps("failed");
    setGps("working");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRegionId("");
        setValue((v) => ({
          ...v,
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        }));
        setGps("set");
      },
      () => setGps("failed"),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  }

  return (
    <fieldset className="space-y-3">
      <legend className="font-display text-lg">{t(variant === "base" ? "title" : "enterpriseTitle")}</legend>
      <p className="-mt-1 text-[15px] text-ink-2">{t(variant === "base" ? "hint" : "enterpriseHint")}</p>

      <label className="block">
        <span className="label">{t("pickArea")}</span>
        <select className="field" value={regionId} onChange={(e) => pickRegion(e.target.value)}>
          <option value="">—</option>
          {REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {locale === "ml" ? r.ml : r.en}
            </option>
          ))}
        </select>
      </label>

      <button type="button" className="btn btn-outline w-full" onClick={useGps} disabled={gps === "working"}>
        {gps === "working" ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <LocateFixed className="size-5" aria-hidden />}
        {gps === "working" ? t("gpsWorking") : t(variant === "base" ? "useGps" : "enterpriseGps")}
      </button>
      {gps === "failed" && <p className="text-[15px] font-semibold text-danger">{t("gpsFailed")}</p>}
      {gps === "set" && value.lat !== null && (
        <p className="tabular inline-flex items-center gap-1.5 text-[15px] font-semibold text-ok">
          <Check className="size-4" strokeWidth={3} aria-hidden />
          {t("gpsSet")} ({value.lat}, {value.lng})
        </p>
      )}

      <label className="block">
        <span className="label">{t("areaName")}</span>
        <input
          className="field"
          name={`${namePrefix}areaName`}
          value={value.areaName}
          maxLength={80}
          placeholder={t("areaNamePlaceholder")}
          onChange={(e) => setValue((v) => ({ ...v, areaName: e.target.value }))}
        />
      </label>

      <input type="hidden" name={`${namePrefix}lat`} value={value.lat ?? ""} />
      <input type="hidden" name={`${namePrefix}lng`} value={value.lng ?? ""} />
    </fieldset>
  );
}
