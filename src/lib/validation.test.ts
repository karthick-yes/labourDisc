import { describe, expect, it } from "vitest";
import { locationSchema } from "./validation";

describe("locationSchema", () => {
  it("accepts coordinates from form strings", () => {
    expect(locationSchema.parse({ lat: "10.1077", lng: "76.4752", areaName: " Perumbavoor " })).toEqual({
      lat: 10.1077,
      lng: 76.4752,
      areaName: "Perumbavoor",
    });
  });

  it("rejects empty coordinates instead of treating them as 0", () => {
    expect(locationSchema.safeParse({ lat: "", lng: "", areaName: "" }).success).toBe(false);
    expect(locationSchema.safeParse({ lat: null, lng: null, areaName: null }).success).toBe(false);
  });

  it("rejects out-of-range coordinates", () => {
    expect(locationSchema.safeParse({ lat: "91", lng: "76", areaName: "" }).success).toBe(false);
  });

  it("stores a blank area name as null", () => {
    expect(locationSchema.parse({ lat: "1", lng: "2", areaName: "" }).areaName).toBeNull();
  });
});
