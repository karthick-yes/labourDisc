import { MessageCircle, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { whatsappUrl } from "@/lib/share";
import { InfoButton } from "./InfoSheet";

// Call + WhatsApp to an enterprise. Shops are real, but when the message is
// about a sample worker or sample need we never contact the real shop: the
// buttons go to DEMO_WHATSAPP_NUMBER if set, otherwise they are off, with the
// (i) button explaining why. No visible "demo" label.

export async function ContactButtons({
  phone,
  sample,
  message,
  compact,
}: {
  phone: string | null;
  sample: boolean;
  message?: string;
  compact?: boolean;
}) {
  const t = await getTranslations("contact");
  const testNumber = process.env.DEMO_WHATSAPP_NUMBER?.replace(/\D/g, "") || null;
  const waTarget = sample ? testNumber : phone;
  const callTarget = sample ? testNumber : phone;
  // Tight padding: Malayalam labels ("വാട്സ്ആപ്പ്") must fit half a card.
  const size = compact ? "min-h-12 gap-1.5 px-2 text-[15px]" : "min-h-14 gap-1.5 px-2.5 text-base";
  // Deliberately off (sample record or no phone): dashed, clearly not tappable.
  const off = `btn ${size} min-w-0 border-dashed border-ink-2/50 bg-transparent text-ink-2`;
  // Compact cards: the card already says what is being sent.
  const waLabel = message && !compact ? t("sendWhatsapp") : t("whatsapp");
  const label = (text: string) => <span className="truncate">{text}</span>;

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-2 gap-2">
        {callTarget ? (
          <a href={`tel:+${callTarget}`} className={`btn btn-outline ${size} min-w-0`}>
            <Phone className="size-5 shrink-0" aria-hidden />
            {label(t("call"))}
          </a>
        ) : (
          <span className={off} aria-disabled>
            <Phone className="size-5 shrink-0" aria-hidden />
            {label(t("call"))}
          </span>
        )}
        {waTarget ? (
          <a
            href={message ? whatsappUrl(waTarget, message) : `https://wa.me/${waTarget}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-wa ${size} min-w-0`}
          >
            <MessageCircle className="size-5 shrink-0" aria-hidden />
            {label(waLabel)}
          </a>
        ) : (
          <span className={off} aria-disabled title={phone ? undefined : t("noPhone")}>
            <MessageCircle className="size-5 shrink-0" aria-hidden />
            {label(waLabel)}
          </span>
        )}
      </div>
      {sample && !testNumber && <InfoButton variant="inline" />}
      {!sample && !phone && <p className="text-sm text-ink-2">{t("noPhone")}</p>}
    </div>
  );
}
