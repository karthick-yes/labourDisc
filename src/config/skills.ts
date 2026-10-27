// Canonical skills. Synonyms cover English, Malayalam, Hindi and Bengali so
// voice transcripts and typed text can be mapped to a skill id.
// Malayalam names are drafts for native-speaker review.

export type SkillSeed = {
  id: string;
  en: string;
  ml: string;
  synonyms: string[];
};

export const SKILLS: SkillSeed[] = [
  {
    id: "welder",
    en: "Welder",
    ml: "വെൽഡർ",
    synonyms: ["welding", "arc welding", "gas welding", "വെൽഡിംഗ്", "वेल्डर", "वेल्डिंग", "ওয়েল্ডার", "ঝালাই"],
  },
  {
    id: "fitter",
    en: "Fitter",
    ml: "ഫിറ്റർ",
    synonyms: ["fitting", "pipe fitter", "ഫിറ്റിംഗ്", "फिटर", "फिटिंग", "ফিটার"],
  },
  {
    id: "electrician",
    en: "Electrician",
    ml: "ഇലക്ട്രീഷ്യൻ",
    synonyms: ["wiring", "electrical", "വയറിംഗ്", "इलेक्ट्रीशियन", "बिजली मिस्त्री", "वायरिंग", "ইলেকট্রিশিয়ান", "বিদ্যুৎ মিস্ত্রি"],
  },
  {
    id: "plumber",
    en: "Plumber",
    ml: "പ്ലംബർ",
    synonyms: ["plumbing", "പ്ലംബിംഗ്", "प्लंबर", "नल मिस्त्री", "প্লাম্বার", "কলের মিস্ত্রি"],
  },
  {
    id: "mason",
    en: "Mason",
    ml: "മേസൺ",
    synonyms: ["masonry", "brick work", "plastering", "കല്പണി", "കല്പണിക്കാരൻ", "राजमिस्त्री", "मिस्त्री", "চিনাই", "রাজমিস্ত্রি"],
  },
  {
    id: "carpenter",
    en: "Carpenter",
    ml: "ആശാരി",
    synonyms: ["carpentry", "wood work", "furniture", "മരപ്പണി", "बढ़ई", "कारपेंटर", "ছুতার", "কাঠমিস্ত্রি"],
  },
  {
    id: "painter",
    en: "Painter",
    ml: "പെയിന്റർ",
    synonyms: ["painting", "പെയിന്റിംഗ്", "पेंटर", "पुताई", "রংমিস্ত্রি", "পেইন্টার"],
  },
  {
    id: "roofing_worker",
    en: "Roofing / sheet worker",
    ml: "ഷീറ്റ് / മേൽക്കൂര പണിക്കാരൻ",
    synonyms: ["roofing", "sheet work", "truss work", "ഷീറ്റ് പണി", "छत", "शीट का काम", "টিনের কাজ", "ছাউনি"],
  },
  {
    id: "helper",
    en: "Helper / general labour",
    ml: "ഹെൽപ്പർ",
    synonyms: ["helper", "labour", "general labour", "coolie", "സഹായി", "കൂലിപ്പണി", "हेल्पर", "मजदूर", "लेबर", "হেল্পার", "যোগালি", "মজুর"],
  },
  {
    id: "loader",
    en: "Loader",
    ml: "ലോഡിംഗ് തൊഴിലാളി",
    synonyms: ["loading", "unloading", "headload", "കയറ്റിറക്ക്", "लोडर", "पल्लेदार", "हम्माल", "লোডার", "কুলি"],
  },
  {
    id: "machine_operator",
    en: "Machine operator",
    ml: "മെഷീൻ ഓപ്പറേറ്റർ",
    synonyms: ["machine", "operator", "cnc", "lathe", "मशीन ऑपरेटर", "मशीन चलाना", "মেশিন অপারেটর"],
  },
  {
    id: "cook",
    en: "Cook",
    ml: "പാചകക്കാരൻ",
    synonyms: ["cooking", "chef", "parotta", "porotta", "tandoor", "പാചകം", "പൊറോട്ട", "रसोइया", "कुक", "बावर्ची", "रोटी", "রাঁধুনি", "বাবুর্চি"],
  },
  {
    id: "kitchen_helper",
    en: "Kitchen helper",
    ml: "അടുക്കള സഹായി",
    synonyms: ["kitchen", "dish washing", "cutting", "അടുക്കള", "किचन हेल्पर", "बर्तन", "রান্নাঘরের সহায়ক", "বাসন মাজা"],
  },
  {
    id: "juice_maker",
    en: "Juice maker",
    ml: "ജ്യൂസ് മേക്കർ",
    synonyms: ["juice", "shake", "ജ്യൂസ്", "जूस", "जूस वाला", "জুস"],
  },
  {
    id: "baker",
    en: "Baker",
    ml: "ബേക്കർ",
    synonyms: ["bakery", "baking", "cake", "puffs", "ബേക്കറി", "बेकर", "बेकरी", "বেকার", "বেকারি"],
  },
  {
    id: "cleaner",
    en: "Cleaner",
    ml: "ക്ലീനർ",
    synonyms: ["cleaning", "housekeeping", "sweeping", "ശുചീകരണം", "सफाई", "क्लीनर", "ঝাড়ুদার", "ক্লিনার", "পরিষ্কার"],
  },
  {
    id: "waiter",
    en: "Waiter / server",
    ml: "സപ്ലയർ",
    // In Kerala restaurants a waiter is commonly called a "supplier".
    synonyms: ["waiter", "server", "supplier", "serving", "വെയിറ്റർ", "वेटर", "ওয়েটার"],
  },
  {
    id: "driver",
    en: "Driver",
    ml: "ഡ്രൈവർ",
    synonyms: ["driving", "lorry", "pickup", "ഡ്രൈവിംഗ്", "ड्राइवर", "गाड़ी चलाना", "ড্রাইভার", "চালক"],
  },
  {
    id: "plywood_press_operator",
    en: "Plywood press operator",
    ml: "പ്ലൈവുഡ് പ്രസ് ഓപ്പറേറ്റർ",
    synonyms: ["plywood", "press", "veneer", "peeling", "hot press", "പ്ലൈവുഡ്", "प्लाईवुड", "प्रेस", "প্লাইউড"],
  },
  {
    id: "security",
    en: "Security",
    ml: "സെക്യൂരിറ്റി",
    synonyms: ["security guard", "watchman", "guard", "വാച്ച്മാൻ", "गार्ड", "चौकीदार", "सिक्योरिटी", "দারোয়ান", "সিকিউরিটি গার্ড"],
  },
];
