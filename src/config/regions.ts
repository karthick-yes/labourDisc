// Quick-pick base locations shown at sign-up. Contractors anywhere can also
// use their phone's GPS or type their own area, so this list is a
// convenience, not a limit. Add towns here as new contractors come on.

export type Region = {
  id: string;
  en: string;
  ml: string;
  lat: number;
  lng: number;
};

export const REGIONS: Region[] = [
  { id: "perumbavoor", en: "Perumbavoor", ml: "പെരുമ്പാവൂർ", lat: 10.1077, lng: 76.4752 },
  { id: "thodupuzha", en: "Thodupuzha", ml: "തൊടുപുഴ", lat: 9.8959, lng: 76.7184 },
  { id: "kalady", en: "Kalady", ml: "കാലടി", lat: 10.1667, lng: 76.4386 },
  { id: "aluva", en: "Aluva", ml: "ആലുവ", lat: 10.1004, lng: 76.3570 },
  { id: "kothamangalam", en: "Kothamangalam", ml: "കോതമംഗലം", lat: 10.0602, lng: 76.6351 },
  { id: "muvattupuzha", en: "Muvattupuzha", ml: "മൂവാറ്റുപുഴ", lat: 9.9894, lng: 76.5790 },
  { id: "angamaly", en: "Angamaly", ml: "അങ്കമാലി", lat: 10.1960, lng: 76.3860 },
  { id: "kochi", en: "Kochi", ml: "കൊച്ചി", lat: 9.9312, lng: 76.2673 },
];
