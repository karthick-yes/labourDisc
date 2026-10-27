"use client";

import { Check, LoaderCircle, LocateFixed, MapPin, Phone, Plus, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { addBusinesses, geocode, searchBusinesses, type FoundPlace } from "@/app/actions/find";
import { useOnline } from "@/components/OfflineBanner";
import { REGIONS } from "@/config/regions";

type Center = { lat: number; lng: number; label: string };
const RADII = [2, 5, 10, 20] as const;
const PAGE = 40;

export function FindBusinesses({
  base,
  categories,
}: {
  base: Center | null;
  categories: { id: string; label: string }[];
}) {
  const t = useTranslations("find");
  const locale = useLocale();
  const online = useOnline();
  const [center, setCenter] = useState<Center | null>(base);
  const [radius, setRadius] = useState<(typeof RADII)[number]>(5);
  const [category, setCategory] = useState<string>("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<{ name: string; lat: number; lng: number }[] | null>(null);
  const [places, setPlaces] = useState<FoundPlace[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState<Set<string>>(new Set());
  const [showAdded, setShowAdded] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  const inCategory = useMemo(() => (places ?? []).filter((p) => !category || p.categoryId === category), [places, category]);
  const notAdded = inCategory.filter((p) => !p.added);
  const addedCount = inCategory.length - notAdded.length;
  const shown = showAdded ? inCategory : notAdded;
  const catLabel = (id: string) => categories.find((c) => c.id === id)?.label ?? id;

  function search(c: Center | null = center, r = radius) {
    if (!c) return;
    setError(null);
    startTransition(async () => {
      const res = await searchBusinesses({ lat: c.lat, lng: c.lng, radiusKm: r });
      if (res.ok) {
        setPlaces(res.places);
        setLimit(PAGE);
      } else setError(res.error);
    });
  }

  function lookUpPlace() {
    setError(null);
    startTransition(async () => {
      const res = await geocode(placeQuery);
      if (res.ok) setPlaceResults(res.results);
      else setError(res.error);
    });
  }

  function useGps() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: t("here") };
        setCenter(c);
        search(c);
      },
      () => setError("gps"),
      { timeout: 15000, maximumAge: 300000 },
    );
  }

  async function add(list: FoundPlace[]) {
    setAdding(new Set(list.map((p) => p.osmId)));
    await addBusinesses(list.map(({ km: _km, added: _a, ...p }) => p));
    setPlaces((prev) => prev?.map((p) => (list.some((l) => l.osmId === p.osmId) ? { ...p, added: true } : p)) ?? null);
    setAdding(new Set());
  }

  return (
    <div className="space-y-5">
      <section className="panel">
        <div className="strip text-base">
          <span className="inline-flex min-w-0 items-center gap-2">
            <MapPin className="size-5 shrink-0" aria-hidden />
            <span className="truncate">{center ? center.label : t("pickPlace")}</span>
          </span>
        </div>
        <div className="space-y-3 p-3">
          <div className="flex flex-wrap gap-2">
            {base && (
              <button type="button" className="chip" aria-pressed={center?.label === base.label} onClick={() => setCenter(base)}>
                {t("myBase")}
              </button>
            )}
            {REGIONS.map((r) => {
              const label = locale === "ml" ? r.ml : r.en;
              return (
                <button key={r.id} type="button" className="chip" aria-pressed={center?.label === label} onClick={() => setCenter({ lat: r.lat, lng: r.lng, label })}>
                  {label}
                </button>
              );
            })}
          </div>
          <button type="button" className="btn btn-outline w-full" onClick={useGps}>
            <LocateFixed className="size-5" aria-hidden />
            {t("useGps")}
          </button>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              lookUpPlace();
            }}
          >
            <input
              className="field flex-1"
              value={placeQuery}
              onChange={(e) => setPlaceQuery(e.target.value)}
              placeholder={t("typePlace")}
              aria-label={t("typePlace")}
              maxLength={100}
            />
            <button type="submit" className="btn btn-ink shrink-0 px-3" disabled={pending || placeQuery.trim().length < 2} aria-label={t("findPlace")}>
              <Search className="size-5" aria-hidden />
            </button>
          </form>
          {placeResults && (
            <ul className="divide-y-2 divide-ground rounded-board border-2 border-ink-2/30">
              {placeResults.length === 0 && <li className="p-3 text-[15px] text-muted">{t("noPlace")}</li>}
              {placeResults.map((r) => (
                <li key={`${r.lat},${r.lng}`}>
                  <button
                    type="button"
                    className="min-h-12 w-full px-3 py-2 text-left text-[15px] font-semibold active:bg-ground"
                    onClick={() => {
                      const c = { lat: r.lat, lng: r.lng, label: r.name.split(",")[0] };
                      setCenter(c);
                      setPlaceResults(null);
                      search(c);
                    }}
                  >
                    {r.name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div>
            <span className="label">{t("radius")}</span>
            <div className="flex gap-2">
              {RADII.map((r) => (
                <button key={r} type="button" className="chip tabular flex-1 justify-center" aria-pressed={radius === r} onClick={() => setRadius(r)}>
                  {r} km
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="btn btn-primary min-h-14 w-full text-lg" disabled={!center || pending || !online} onClick={() => search()}>
            {pending ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <Search className="size-5" aria-hidden />}
            {t("search")}
          </button>
          {error && (
            <p role="alert" className="font-semibold text-danger">
              {t(`errors.${error}`)}
            </p>
          )}
        </div>
      </section>

      {places && (
        <section className="space-y-3">
          <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" aria-label={t("filterType")}>
            <button type="button" className="chip shrink-0" aria-pressed={!category} onClick={() => setCategory("")}>
              {t("allTypes")} <span className="tabular opacity-70">{places.length}</span>
            </button>
            {categories
              .filter((c) => places.some((p) => p.categoryId === c.id))
              .map((c) => (
                <button key={c.id} type="button" className="chip shrink-0" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
                  {c.label} <span className="tabular opacity-70">{places.filter((p) => p.categoryId === c.id).length}</span>
                </button>
              ))}
          </nav>

          {notAdded.length > 1 && (
            <button type="button" className="btn btn-board w-full" disabled={adding.size > 0} onClick={() => add(notAdded)}>
              <Plus className="size-5" strokeWidth={3} aria-hidden />
              {t("addAll", { count: notAdded.length })}
            </button>
          )}

          {addedCount > 0 && (
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-board border-2 border-ink-2/30 bg-surface px-3 text-[15px] font-semibold">
              <input type="checkbox" className="size-6 shrink-0 accent-[var(--color-ink)]" checked={showAdded} onChange={(e) => setShowAdded(e.target.checked)} />
              {t("showAdded", { count: addedCount })}
            </label>
          )}

          {shown.length === 0 ? (
            <p className="panel p-4 text-center font-semibold">{addedCount > 0 ? t("allAdded") : t("nothing")}</p>
          ) : (
            <ul className="panel divide-y-2 divide-ground">
              {shown.slice(0, limit).map((p) => (
                <li key={p.osmId} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{p.name}</p>
                    <p className="truncate text-sm text-ink-2">
                      {catLabel(p.categoryId)} · <span className="tabular">{p.km} km</span>
                      {p.phone && <Phone className="ml-1.5 inline size-3.5" aria-label={t("hasPhone")} />}
                    </p>
                  </div>
                  {p.added ? (
                    <span className="plate bg-ok-soft text-ok">
                      <Check className="size-4" strokeWidth={3} aria-hidden />
                      {t("added")}
                    </span>
                  ) : (
                    <button type="button" className="btn btn-outline btn-sm shrink-0" disabled={adding.has(p.osmId)} onClick={() => add([p])}>
                      {adding.has(p.osmId) ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" strokeWidth={3} aria-hidden />}
                      {t("add")}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {shown.length > limit && (
            <button type="button" className="btn btn-outline w-full" onClick={() => setLimit(limit + PAGE)}>
              {t("showMore", { count: shown.length - limit })}
            </button>
          )}
          <p className="text-center text-xs text-muted">© OpenStreetMap contributors</p>
        </section>
      )}
    </div>
  );
}
