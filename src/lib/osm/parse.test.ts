import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { classify, classifyPlaces, placesFromGeoJson, placesFromOverpass, type OsmPlace } from "./parse";

describe("classify", () => {
  it.each([
    ["Bevco Kalady", { shop: "alcohol" }],
    ["KSBC premium outlet", { shop: "beverages" }],
    ["Beverages Corporation Outlet", { shop: "yes" }],
    ["Toddy Shop", { amenity: "restaurant" }],
    ["Picnic Beer Wine Parlour", { shop: "yes" }],
    ["Toddy Bar Perumbavoor", { amenity: "bar" }],
    ["St. Mary's School Canteen", { amenity: "cafe" }],
    ["Mar Athanasius College", { amenity: "college" }],
    ["DC Books", { shop: "books" }],
    ["Some Beverages", { shop: "beverages" }],
    ["Federal Bank", { amenity: "bank" }],
  ])("drops %s", (name, tags) => {
    expect(classify(name, tags)).toBeNull();
  });

  it.each([
    ["Zaques Juice Corner", { shop: "beverages" }, "juice_shop"],
    ["Pubg Juice Pub", { amenity: "cafe" }, "juice_shop"],
    ["Fresh Cafe", { amenity: "cafe", cuisine: "juice" }, "juice_shop"],
    ["Family Supermarket", { shop: "supermarket" }, "supermarket"],
    ["Bismi Bakery", { shop: "bakery" }, "bakery"],
    ["Hotel Aryaas", { amenity: "restaurant" }, "restaurant"],
    ["KM Plywoods", { man_made: "works" }, "industrial"],
    ["Sree Sawmill", { craft: "sawmill" }, "industrial"],
    ["Joy Welding Works", { craft: "metal_construction" }, "workshop"],
    ["Popular Hardwares", { shop: "hardware" }, "hardware"],
    ["Ammu Textiles", { shop: "clothes" }, "other"],
  ])("keeps %s as %s", (name, tags, expected) => {
    expect(classify(name, tags)).toBe(expected);
  });

  it("drops named buildings with no business tags", () => {
    expect(classify("Kurian Building", { building: "yes" })).toBeNull();
  });
});

describe("classifyPlaces", () => {
  it("drops unnamed places and de-duplicates", () => {
    const places: OsmPlace[] = [
      { osmId: "node/1", name: "", lat: 10, lng: 76, tags: { shop: "bakery" } },
      { osmId: "node/2", name: "Bismi Bakery", lat: 10.1001, lng: 76.4001, tags: { shop: "bakery", phone: "+91 98" } },
      { osmId: "way/3", name: "Bismi  Bakery", lat: 10.1002, lng: 76.4002, tags: { shop: "bakery" } },
      { osmId: "node/2", name: "Bismi Bakery", lat: 10.1001, lng: 76.4001, tags: { shop: "bakery" } },
    ];
    const out = classifyPlaces(places);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ osmId: "node/2", categoryId: "bakery", phone: "+91 98" });
  });
});

describe("parsers", () => {
  it("reads overpass-turbo GeoJSON", () => {
    const places = placesFromGeoJson({
      features: [
        {
          id: "way/9",
          properties: { "@id": "way/9", name: "X", shop: "bakery", "@geometry": "center" },
          geometry: { type: "Point", coordinates: [76.4, 10.1] },
        },
      ],
    });
    expect(places).toEqual([{ osmId: "way/9", name: "X", lat: 10.1, lng: 76.4, tags: { name: "X", shop: "bakery" } }]);
  });

  it("reads raw Overpass JSON with centers", () => {
    const places = placesFromOverpass({
      elements: [
        { type: "node", id: 1, lat: 10, lon: 76, tags: { name: "A" } },
        { type: "way", id: 2, center: { lat: 11, lon: 77 }, tags: { name: "B" } },
        { type: "way", id: 3, tags: { name: "no geometry" } },
      ],
    });
    expect(places.map((p) => [p.osmId, p.lat, p.lng])).toEqual([
      ["node/1", 10, 76],
      ["way/2", 11, 77],
    ]);
  });

  it("bundled Perumbavoor file yields a sensible, liquor-free set", () => {
    const file = path.join(process.cwd(), "data/osm/perumbavoor.geojson");
    const places = classifyPlaces(placesFromGeoJson(JSON.parse(readFileSync(file, "utf8"))));
    expect(places.length).toBeGreaterThan(300);
    const names = places.map((p) => p.name.toLowerCase());
    for (const bad of ["bevco", "ksbc", "toddy", "beer"]) {
      expect(names.some((n) => n.includes(bad))).toBe(false);
    }
    expect(names.some((n) => n.includes("juice"))).toBe(true);
  });
});
