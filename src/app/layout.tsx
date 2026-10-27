import type { Metadata, Viewport } from "next";
import { Baloo_Chettan_2, Noto_Sans, Noto_Sans_Malayalam } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

// Self-hosted at build time by next/font.
const baloo = Baloo_Chettan_2({ variable: "--font-baloo", subsets: ["malayalam", "latin"], weight: ["600", "800"] });
const notoMl = Noto_Sans_Malayalam({ variable: "--font-noto-ml", subsets: ["malayalam"] });
const noto = Noto_Sans({ variable: "--font-noto", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PaniBook",
  description: "Match walk-in workers to enterprise needs",
  appleWebApp: { capable: true, title: "PaniBook", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Draw under the iPhone notch/home bar; the header and tab bar pad
  // themselves with env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: "#c8102e",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${baloo.variable} ${notoMl.variable} ${noto.variable} h-full antialiased`}>
      <body className="min-h-full">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
