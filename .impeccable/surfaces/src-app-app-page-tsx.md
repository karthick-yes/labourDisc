---
version: 1
slug: "src-app-app-page-tsx"
primary_target: "src/app/(app)/page.tsx"
related_targets: ["src/app/w/[token]/page.tsx"]
---

# Surface: PaniBook contractor app (all logged-in screens + public worker page)

Mode: Operate. Audience: Malayali labour contractor, outdoors in bright sun, often showing the screen to a worker or shop owner. Task: intake workers, log needs, match, share on WhatsApp, track placements and commission. Constraints: Malayalam first, big tap targets, high contrast, no DEMO badges (one info button explains sample data), contractor's name front and centre on shared surfaces.

## Direction contract

THESIS: The app reads like a Kerala bus front: every need and worker is headed by a destination-board strip, big Malayalam on yellow, legible across a road. It refuses the grey-card-plus-one-accent utility layout.

OWN-WORLD: Bus red #C8102E shell (header, primary actions), board yellow #FFC72C strips and highlights, board black #111 for board plates and the tab bar, clean white work surfaces on a cool #F2F3F5 ground. Baloo Chettan 2 (800) for boards and headings, Noto Sans Malayalam for body, tabular figures for money. Squared 6–10px corners, 2px black keylines, no soft shadows. Lucide line icons, one stroke weight.

STORY: Open the app and the day's board is on top: contractor's name, area, open needs. Two huge tap blocks start intake or a need. Every list row is a board strip naming the skill and count, then the shop and money; strong matches carry a black "മികച്ചത്" plate. Tap a strip, act: call, send on WhatsApp, mark placed.

FIRST VIEWPORT: Red header bar with contractor name (left) and language, search, settings icons (right). A black board strip: area name left, open-needs count right. Two blocks 104px tall: yellow "പുതിയ തൊഴിലാളി", red "പുതിയ ആവശ്യം". Stat plates (available workers, commission due in yellow). Latest needs as board-strip cards. Black bottom tab bar, active tab in yellow.

FORM: Pick card, KSRTC Destination Board, my rank 1 of 7. seed:2b0bd8e699293785. Signature move: the board strip as the universal list header, with match strength as a black plate on the strip.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
