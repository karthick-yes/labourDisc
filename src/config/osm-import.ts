// Rules for turning OpenStreetMap places into enterprises (brief §4).
// Order of checks: no name -> drop; excluded name -> drop; juice name ->
// juice shop; excluded tag -> drop; category tag match; else "other" only
// if it is some kind of shop.

/** Names that mark liquor outlets, schools, places of worship etc. */
export const EXCLUDED_NAME_PATTERNS: RegExp[] = [
  /bevco/i,
  /\bksbc\b/i,
  /beverages?\s+corporation/i,
  /toddy/i,
  /\bbar\b/i,
  /\bbeer\b/i,
  /\bwine\b/i,
  /liquor/i,
  /school/i,
  /college/i,
  /vidyalaya|vidyapeeth/i,
  /canteen/i,
  /\bbank\b/i,
  /\batm\b/i,
  /church|temple|masjid|mosque|kshetram/i,
  /hospital|clinic/i,
  /panchayat|municipality|police|post office|village office/i,
];

/** Names that mean a juice shop, whatever the tags say. */
export const JUICE_NAME_PATTERN = /juice|ജ്യൂസ്/i;

/** Tags that are never employers for us. "key=value" or "key=*". */
export const EXCLUDED_TAGS: string[] = [
  // In Kerala shop=beverages is usually a Bevco/KSBC liquor outlet.
  "shop=beverages",
  "shop=alcohol",
  "amenity=bar",
  "amenity=pub",
  "amenity=school",
  "amenity=college",
  "amenity=university",
  "amenity=kindergarten",
  "amenity=bank",
  "amenity=atm",
  "amenity=place_of_worship",
  "amenity=hospital",
  "amenity=clinic",
  "amenity=doctors",
  "amenity=pharmacy",
  "amenity=internet_cafe",
  "amenity=townhall",
  "amenity=police",
  "amenity=post_office",
  "shop=books",
  "shop=stationery",
  "shop=mobile_phone",
  "shop=jewelry",
  "shop=beauty",
  "shop=hairdresser",
  "shop=optician",
  "shop=chemist",
  "shop=medical_supply",
  "shop=gift",
  "shop=fashion_accessories",
  "shop=lottery",
  "shop=pet",
  "shop=computer",
  "shop=electronics",
  "shop=copyshop",
  "office=government",
];

/** Bundled OSM exports (overpass-turbo GeoJSON) live here. */
export const OSM_DATA_DIR = "data/osm";

/** Demo data uses places within this distance of the contractor's base. */
export const DEMO_RADIUS_KM = 20;

/**
 * A live Overpass query runs only when no bundled file covers the search
 * point, or a covered point still has fewer places than this nearby.
 */
export const MIN_PLACES_BEFORE_LIVE_FETCH = 10;

export const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
export const OVERPASS_TIMEOUT_S = 25;
