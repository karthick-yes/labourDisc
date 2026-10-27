import { PAYMENT_REQUEST_TEMPLATE, WORKER_CARD_TEMPLATE, YEARS_PART_TEMPLATE } from "@/config/share";
import { formatPhone } from "./phone";

export type WorkerCard = {
  workerName: string;
  skillMl: string;
  years: number | null;
  wage: number | null;
  profileUrl: string;
  contractorName: string;
  contractorPhone: string;
};

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

export function workerCardMessage(card: WorkerCard): string {
  const lines = fill(WORKER_CARD_TEMPLATE, {
    worker_name: card.workerName,
    skill: card.skillMl,
    years_part: card.years ? fill(YEARS_PART_TEMPLATE, { years: String(card.years) }) : "",
    wage: card.wage ? String(card.wage) : "—",
    profile_link: card.profileUrl,
    contractor_name: card.contractorName,
    contractor_phone: formatPhone(card.contractorPhone),
  }).split("\n");
  // Drop the wage line entirely if the worker has no expected wage.
  return lines.filter((l) => !(card.wage == null && l.includes("₹—"))).join("\n");
}

export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function profileUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/w/${token}`;
}

export function paymentRequestMessage(v: {
  workerName: string;
  enterpriseName: string;
  skillMl: string;
  amount: number;
  trialDays: number;
  contractorName: string;
}): string {
  return fill(PAYMENT_REQUEST_TEMPLATE, {
    worker_name: v.workerName,
    enterprise_name: v.enterpriseName,
    skill: v.skillMl,
    amount: String(v.amount),
    days: String(v.trialDays),
    contractor_name: v.contractorName,
  });
}
