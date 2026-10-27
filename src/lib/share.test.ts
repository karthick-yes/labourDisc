import { describe, expect, it } from "vitest";
import { profileUrl, whatsappUrl, workerCardMessage } from "./share";

const card = {
  workerName: "Rahul Das",
  skillMl: "വെൽഡർ",
  years: 5,
  wage: 1200,
  profileUrl: "https://x.app/w/abc",
  contractorName: "Rajan",
  contractorPhone: "919847055555",
};

describe("workerCardMessage", () => {
  it("fills the Malayalam template with the contractor as contact", () => {
    const msg = workerCardMessage(card);
    expect(msg).toContain("👷 തൊഴിലാളി: Rahul Das");
    expect(msg).toContain("കഴിവ്: വെൽഡർ (5 വർഷം)");
    expect(msg).toContain("₹1200/ദിവസം");
    expect(msg).toContain("https://x.app/w/abc");
    expect(msg).toContain("Rajan, +91 98470 55555");
  });

  it("omits years and wage when unknown", () => {
    const msg = workerCardMessage({ ...card, years: null, wage: null });
    expect(msg).toContain("കഴിവ്: വെൽഡർ\n");
    expect(msg).not.toContain("₹");
  });
});

describe("urls", () => {
  it("builds wa.me and profile links", () => {
    expect(whatsappUrl("919800000000", "a b")).toBe("https://wa.me/919800000000?text=a%20b");
    expect(profileUrl("https://x.app/", "tok")).toBe("https://x.app/w/tok");
  });
});
