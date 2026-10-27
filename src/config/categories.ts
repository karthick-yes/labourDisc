// Enterprise categories, the OSM tags that map to them, and the roles each
// typically hires for. Order matters: the first category whose tags match
// an OSM place wins (specific craft tags come before the generic craft=* workshop).

export type CategorySeed = {
  id: string;
  en: string;
  ml: string;
  osmTags: string[]; // "key=value", or "key=*" for any value
  roles: string[]; // skill ids from config/skills.ts
};

export const CATEGORIES: CategorySeed[] = [
  {
    id: "bakery",
    en: "Bakery",
    ml: "ബേക്കറി",
    osmTags: ["shop=bakery", "shop=pastry", "shop=confectionery"],
    roles: ["baker", "helper", "cleaner"],
  },
  {
    id: "restaurant",
    en: "Restaurant / cafe",
    ml: "ഹോട്ടൽ / റെസ്റ്റോറന്റ്",
    osmTags: ["amenity=restaurant", "amenity=fast_food", "amenity=cafe", "shop=tea"],
    roles: ["cook", "kitchen_helper", "cleaner", "waiter", "juice_maker"],
  },
  {
    id: "juice_shop",
    en: "Juice shop",
    ml: "ജ്യൂസ് കട",
    // Also matched by name containing "juice" (see OSM import rules).
    // Not shop=beverages: in Kerala that is usually a liquor outlet.
    osmTags: ["cuisine=juice"],
    roles: ["juice_maker", "helper"],
  },
  {
    id: "supermarket",
    en: "Supermarket",
    ml: "സൂപ്പർമാർക്കറ്റ്",
    osmTags: ["shop=supermarket", "shop=convenience", "shop=general", "shop=grocery", "shop=department_store", "shop=mall"],
    roles: ["loader", "helper", "cleaner"],
  },
  {
    id: "hardware",
    en: "Hardware store",
    ml: "ഹാർഡ്‌വെയർ കട",
    osmTags: ["shop=hardware", "shop=doityourself", "shop=paint", "shop=tiles", "shop=electrical", "shop=trade"],
    roles: ["loader", "helper"],
  },
  {
    id: "industrial",
    en: "Plywood / industrial unit",
    ml: "പ്ലൈവുഡ് / വ്യവസായ യൂണിറ്റ്",
    osmTags: ["landuse=industrial", "industrial=*", "man_made=works", "craft=sawmill"],
    roles: ["machine_operator", "plywood_press_operator", "loader", "helper"],
  },
  {
    id: "construction",
    en: "Construction",
    ml: "നിർമ്മാണം",
    osmTags: ["office=construction_company", "craft=builder"],
    roles: ["mason", "helper", "carpenter", "painter", "roofing_worker"],
  },
  {
    id: "workshop",
    en: "Workshop",
    ml: "വർക്ക്ഷോപ്പ്",
    osmTags: ["craft=*", "shop=car_repair", "shop=motorcycle_repair"],
    roles: ["welder", "fitter", "helper"],
  },
  {
    id: "other",
    en: "Other",
    ml: "മറ്റുള്ളവ",
    osmTags: [],
    roles: ["helper", "loader"],
  },
];
