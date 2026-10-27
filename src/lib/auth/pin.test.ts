import { describe, expect, it } from "vitest";
import { hashPin, verifyPin } from "./pin";

describe("PIN hashing", () => {
  it("verifies the right PIN and rejects a wrong one", async () => {
    const stored = await hashPin("4821");
    expect(stored).not.toContain("4821");
    expect(await verifyPin("4821", stored)).toBe(true);
    expect(await verifyPin("4822", stored)).toBe(false);
  });

  it("salts each hash", async () => {
    expect(await hashPin("1234")).not.toBe(await hashPin("1234"));
  });

  it("rejects malformed stored values", async () => {
    expect(await verifyPin("1234", "garbage")).toBe(false);
  });
});
