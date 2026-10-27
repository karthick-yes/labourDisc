"use client";

import { ClipboardList, Handshake, House, Store, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const ITEMS = [
  { href: "/", key: "home", Icon: House },
  { href: "/workers", key: "workers", Icon: Users },
  { href: "/needs", key: "needs", Icon: ClipboardList },
  { href: "/enterprises", key: "enterprises", Icon: Store },
  { href: "/placements", key: "placements", Icon: Handshake },
] as const;

export function BottomNav() {
  const t = useTranslations("nav");
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 bg-ink pb-[env(safe-area-inset-bottom)]" aria-label={t("main")}>
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map(({ href, key, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 text-center text-[12px] leading-tight ${
                  active ? "font-bold text-board" : "text-white/80"
                }`}
              >
                {active && <span className="absolute inset-x-3 top-0 h-1 rounded-b bg-board" aria-hidden />}
                <Icon className="size-[22px]" strokeWidth={active ? 2.5 : 2} aria-hidden />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
