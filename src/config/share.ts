// WhatsApp share and reminder templates (Malayalam; for native-speaker review).

export const WORKER_CARD_TEMPLATE = `👷 തൊഴിലാളി: {worker_name}
കഴിവ്: {skill}{years_part}
പ്രതീക്ഷിക്കുന്ന കൂലി: ₹{wage}/ദിവസം
പ്രൊഫൈൽ: {profile_link}
ബന്ധപ്പെടുക: {contractor_name}, {contractor_phone}`;

export const YEARS_PART_TEMPLATE = " ({years} വർഷം)";

// Ask the shop to pay the commission before the worker is sent (brief §3
// Flow E, as contractors actually work: payment first, then the auto).
export const PAYMENT_REQUEST_TEMPLATE = `നമസ്കാരം,
{skill} ആയി {worker_name} {enterprise_name}-ലേക്ക് വരാൻ തയ്യാറാണ്.
കമ്മീഷൻ ₹{amount} അയച്ചാൽ ഉടൻ ആളെ ഓട്ടോയിൽ വിടാം.
ട്രയൽ {days} ദിവസം. അതിനുള്ളിൽ ശരിയായില്ലെങ്കിൽ പകരം ആളെ തരാം.
നന്ദി,
{contractor_name}`;
