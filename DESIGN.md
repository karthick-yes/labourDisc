---
name: PaniBook
description: A contractor's private book of workers and shop needs, styled like a Kerala bus destination board and readable in full sun.
colors:
  bus-red: "#c8102e"
  bus-red-deep: "#9e0b22"
  board-yellow: "#ffc72c"
  board-yellow-deep: "#e0a800"
  board-pale: "#ffe07a"
  board-black: "#111111"
  ink-2: "#2b2f35"
  muted: "#4b5159"
  line: "#c9cdd3"
  ground: "#eef0f3"
  surface: "#ffffff"
  ok: "#137a43"
  ok-soft: "#ddf3e6"
  danger: "#b3261e"
  danger-soft: "#fbe3e1"
  whatsapp: "#128c4a"
  whatsapp-deep: "#0d6e3a"
typography:
  display:
    fontFamily: "Baloo Chettan 2, Noto Sans Malayalam, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  figure:
    fontFamily: "Baloo Chettan 2, Noto Sans Malayalam, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Baloo Chettan 2, Noto Sans Malayalam, system-ui, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Baloo Chettan 2, Noto Sans Malayalam, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.2
  body:
    fontFamily: "Noto Sans Malayalam, Noto Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Noto Sans Malayalam, Noto Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
  plate:
    fontFamily: "Noto Sans Malayalam, Noto Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: "20px"
  nav:
    fontFamily: "Noto Sans Malayalam, Noto Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.25
rounded:
  plate: "6px"
  board: "10px"
  sheet: "16px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
components:
  button-primary:
    backgroundColor: "{colors.bus-red}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.board}"
    padding: "0 16px"
    height: "48px"
  button-primary-active:
    backgroundColor: "{colors.bus-red-deep}"
  button-board:
    backgroundColor: "{colors.board-yellow}"
    textColor: "{colors.board-black}"
    rounded: "{rounded.board}"
    padding: "0 16px"
    height: "48px"
  button-board-active:
    backgroundColor: "{colors.board-yellow-deep}"
  button-ink:
    backgroundColor: "{colors.board-black}"
    textColor: "{colors.surface}"
    rounded: "{rounded.board}"
    padding: "0 16px"
    height: "48px"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.board-black}"
    rounded: "{rounded.board}"
    padding: "0 16px"
    height: "48px"
  button-whatsapp:
    backgroundColor: "{colors.whatsapp}"
    textColor: "{colors.surface}"
    rounded: "{rounded.board}"
    padding: "0 10px"
    height: "56px"
  button-whatsapp-active:
    backgroundColor: "{colors.whatsapp-deep}"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    rounded: "{rounded.board}"
    padding: "0 16px"
    height: "48px"
  button-small:
    padding: "0 12px"
    height: "40px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.board-black}"
    rounded: "{rounded.board}"
    padding: "10px 16px"
    height: "48px"
  board-strip:
    backgroundColor: "{colors.board-yellow}"
    textColor: "{colors.board-black}"
    typography: "{typography.title}"
    padding: "8px 12px"
  route-number:
    backgroundColor: "{colors.board-black}"
    textColor: "{colors.board-yellow}"
    rounded: "{rounded.plate}"
    size: "32px"
  plate-strong:
    backgroundColor: "{colors.board-black}"
    textColor: "{colors.board-yellow}"
    typography: "{typography.plate}"
    rounded: "{rounded.plate}"
    padding: "2px 8px"
  plate-ok:
    backgroundColor: "{colors.ok-soft}"
    textColor: "{colors.ok}"
    rounded: "{rounded.plate}"
    padding: "2px 8px"
  plate-warn:
    backgroundColor: "{colors.board-yellow}"
    textColor: "{colors.board-black}"
    rounded: "{rounded.plate}"
    padding: "2px 8px"
  plate-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.plate}"
    padding: "2px 8px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.board}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.board-black}"
    rounded: "{rounded.board}"
    padding: "0 14px"
    height: "44px"
  chip-active:
    backgroundColor: "{colors.board-black}"
    textColor: "{colors.board-yellow}"
  header-bar:
    backgroundColor: "{colors.bus-red}"
    textColor: "{colors.surface}"
  bottom-nav:
    backgroundColor: "{colors.board-black}"
    textColor: "{colors.surface}"
    typography: "{typography.nav}"
    height: "64px"
---

# Design System: PaniBook

## Overview

**Creative North Star: "The KSRTC Destination Board"**

Every screen reads like the front of a Kerala bus. The shell is bus red, every list item has a yellow destination-board strip with big Malayalam on it that you can read from across a road, and the key facts sit on black plates. The contractor uses the app outdoors in bright sun and turns the screen round to show workers and shop owners, so the system goes for contrast, heavy display type and large tap targets ahead of anything subtle.

Surfaces are flat white panels on a cool grey ground, outlined with a 2px ink keyline. Depth comes from colour blocks and keylines, never from soft shadows. The density is that of a working tool: one centred phone-width column, 12–16px inner spacing, and every row ready to act on (call, send on WhatsApp, mark placed).

Board black and board yellow carry meaning, and that meaning is kept narrow. Black-on-yellow marks the board (headers, strong matches, counts). Red marks the shell and the main action. Green is held back for WhatsApp and for things that are confirmed or paid.

**Key Characteristics:**
- Bus-red header, black bottom tab bar, cool grey ground, white panels with 2px ink keylines.
- A yellow board strip heads every list card and section panel; match strength sits on it as a black plate.
- Baloo Chettan 2 at weight 800 for boards and headings, Noto Sans Malayalam for body, tabular figures for money and counts.
- Squared corners (6–10px), no soft shadows, Lucide line icons at one stroke weight.
- Minimum tap height of 48px, 56px for contact actions.

## Colors

A loud transit palette of red, yellow and black on a cool neutral ground, with a narrow green kept for WhatsApp and confirmation.

### Primary
- **Bus Red** (bus-red): the app header bar, the primary button, the "new need" home block, the PWA theme colour and the text caret. It is also the colour of the warning icon when a worker asks for more than the offer. The pressed state darkens to **Deep Bus Red** (bus-red-deep).

### Secondary
- **Board Yellow** (board-yellow): board strips, the "new worker" home block, highlighted stat cells (the wage offered, commission due), warn and open status plates, selection highlight, the outer focus ring, active tab text and the active-tab marker. Its pressed state and the star rating fill use **Deep Board Yellow** (board-yellow-deep).
- **Board Pale** (board-pale): the soft tint of the board family, used for warning notices. It is pale yellow, not cream.

### Tertiary
- **WhatsApp Green** (whatsapp, pressed whatsapp-deep): the fill of WhatsApp send buttons and nothing else.
- **Confirmed Green** (ok on ok-soft): confirmed, paid and available status plates, success notices and saved confirmations.
- **Danger Red** (danger on danger-soft): failed or lost status plates, error notices and the outlined destructive button. It is a different red from bus red so that errors never look like the brand.

### Neutral
- **Board Black** (board-black): all text, every keyline, the bottom tab bar, the day's-board banner, strong-match plates, route-number boxes, the active chip and the ink button.
- **Ink 2** (ink-2): secondary text, the back link, metadata icons, the borders of resting fields and chips (at 40% and 30% alpha) and the dashed outline of off buttons.
- **Muted** (muted): hints, the chevrons on list rows, the counts in section titles and placeholders.
- **Line** (line): hairline divider grey.
- **Ground** (ground): the page background, neutral plates, transcript wells and the pressed state of outlined surfaces.
- **Surface** (surface): panels, fields, outlined buttons and chips.

### Named Rules
**The Green Is Spoken For Rule.** Green appears only on WhatsApp actions and on ok/confirmed/paid states. Match-fit lines are never green. They are ink with a check icon, or show a bus-red warning icon when the worker asks for more than the offer.

**The Board Family Rule.** Every tint of yellow comes from the board family (board-yellow, board-yellow-deep, board-pale). No cream, beige or off-white tints.

## Typography

**Display Font:** Baloo Chettan 2 at 800 (also loaded at 600), falling back to Noto Sans Malayalam then system-ui
**Body Font:** Noto Sans Malayalam, with Noto Sans for Latin, then system-ui
All three fonts are self-hosted through next/font.

**Character:** A heavy, rounded Malayalam display face that looks like painted bus-board lettering, paired with a plain, very legible Noto body. English and Malayalam sit side by side without either one taking over.

### Hierarchy
- **Display** (800, 1.75rem, 1.15, -0.01em): page titles, balanced across lines. The contractor's name in the header bar uses the same face at 1.6rem.
- **Headline** (800, 1.45rem, 1.1): the labels on the two large home action blocks.
- **Figure** (800, 2rem, 1): money totals, stat figures and the sign-in wordmark, always with tabular figures.
- **Title** (800, 1.25rem, 1.2): board strips, section titles and the day's-board banner. Strips that head form sections or settings drop to 1rem.
- **Body** (400, 16px, 1.5): running text. Row metadata sits at 15px. Field input text is 18px so it can be read at arm's length.
- **Label** (600, 15px): form labels, chips and button labels (16px on buttons, 14px on small buttons).
- **Plate** (700, 13px, 20px line): status and match plates. They never wrap.
- **Nav** (12px; 700 when active): bottom tab labels.

### Named Rules
**The Tabular Money Rule.** Every rupee amount, count, score and distance uses tabular figures.

**The Board Face Rule.** The 800-weight display face is for boards, headings and big numbers only. Body copy, labels and plates always use Noto.

## Layout

The layout is one mobile column. The header bar and the bottom tab bar span the full viewport width. Their contents, and the main content, sit in a centred column capped at 28rem (max-w-md) with 16px side padding. On desktop the app stays a phone-width column on the grey ground; it does not stretch into a wide layout. The header is sticky and respects the top safe area. The tab bar is fixed to the bottom, respects the bottom safe area, and the main area reserves 112px of bottom padding to clear it.

Rhythm: 20px between major home sections, 12px between list cards and inside panel bodies (16px on detail panels), 8px between paired buttons and chips. Filter chips scroll sideways and run to the edges of the column. Pairs of contact actions sit on a two-column grid.

**The Full-Bleed Shell Rule.** The red header and black tab bar always run edge to edge. Content never does; it stays in the centred max-w-md column.

## Elevation & Depth

The system is flat. Nothing has a soft drop shadow. Hierarchy comes from colour blocks (red shell, yellow strip, black plate), the 2px ink keylines, and the white-on-grey contrast between panels and the ground. Stat groups are split by 2px black gutters: a black grid shows through 2px gaps between the white and yellow cells. Pressing a button nudges it down 1px instead of lifting it. The bottom sheet sits on a 60% ink scrim.

### Shadow Vocabulary
- **Focus halo** (`outline: 3px solid #111; outline-offset: 2px; box-shadow: 0 0 0 6px #ffc72c`): keyboard focus on any element.
- **Field focus ring** (`box-shadow: 0 0 0 4px #ffc72c`, with the border shifting to ink): focused inputs.

### Named Rules
**The No Soft Shadow Rule.** Box-shadow is used only as a solid yellow focus ring. Depth comes from keylines and colour blocks.

## Shapes

Corners are squared off rather than round. 10px (board) is used on panels, buttons, fields, chips, avatars and home blocks. 6px (plate) is used on plates and route-number boxes. 16px is used only for the top corners of the bottom sheet. Pills and fully round shapes appear only as tiny map-legend dots and the progress track. Containers carry a solid 2px ink border. Empty states use the same border dashed, and so do deliberately disabled contact buttons.

## Components

### Buttons
Squared, keylined and heavy-labelled. They look like fare-stage buttons on a ticket machine.
- **Shape:** 10px corners, 2px ink border, minimum height 48px, 16px horizontal padding, 8px gap between icon and label.
- **Primary:** bus red with white text. **Board:** yellow with ink text. **Ink:** black with white text. **Outline:** white with ink text. **Danger:** white with a danger-red border and text. **WhatsApp:** WhatsApp green with a deeper green border.
- **Pressed:** each variant darkens to its deep tone and the button moves down 1px (150ms transform/background transition, removed under reduced motion). Disabled buttons drop to 50% opacity.
- **Small:** 40px tall, 12px padding, 14px label.
- **Contact pair:** Call (outline) and WhatsApp side by side, 56px tall (48px in compact cards), labels truncated so long Malayalam fits half the width.
- **Deliberately off:** when a contact action is intentionally unavailable (sample record, missing phone), the button gets a dashed ink-2 outline on a transparent fill, with ink-2 text and icon. A labelled "why is this off?" link with an (i) icon sits below the row, never inside it.

### Chips
- **Style:** white fill, 2px ink-2 border at 30%, 10px corners, 44px tall, 15px medium label, optional count in tabular figures at 70%.
- **State:** the active or pressed chip turns black with yellow text and an ink border.

### Plates
Small labels on a 6px corner, 13px bold, never wrapping. Tones: neutral (ground/ink-2), ok (ok-soft/ok), warn (board-yellow/ink), danger (danger-soft/danger), ink (black/white). Match plates: **strong** is black with yellow text, **good** is white with an ink keyline, **possible** is ground with muted text. Each shows its score at 80% opacity.

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** white surface on the grey ground.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 2px solid ink; dashed for empty states.
- **Internal Padding:** 12px in list cards, 16px in detail panels; footer action rows are separated by a 2px ground rule.
- Worker and shop rows are plain white panels with a heavy name line and a muted chevron. Needs and matches get a board strip.

### Inputs / Fields
- **Style:** white, 2px ink-2 border at 40%, 10px corners, 48px minimum height, 18px text, placeholder in muted at 80%. Labels are 15px semibold above the field, and hints are 14px muted below it.
- **Focus:** the border turns ink and a 4px solid board-yellow ring appears.
- Search fields carry a 20px Lucide search icon inset 14px from the left.

### Navigation
- **Header bar:** bus red, full width. The contractor's name is in the display face at 1.6rem with a small "PaniBook" under it. On the right are 40px icon buttons with 2px white/70 outlines (info, language, settings).
- **Bottom tab bar:** board black, full width, five tabs, each 64px tall with a 22px Lucide icon over a 12px label. Inactive tabs are white at 80%. The active tab is bold board-yellow, its icon stroke goes from 2 to 2.5, and a 4px yellow bar runs along the top edge.
- **Back link:** chevron plus label in ink-2 semibold, above the page title.

### Board Strip (signature)
The universal header for list cards and section panels: a yellow band, 12px by 8px padding, with the display face at 800 and 1.25rem in ink. The title is on the left and a plate (match strength, or status) on the right. The strip is the panel's top edge; inside a panel it is clipped by the 10px corners.
- **Wrapping:** strip titles wrap onto more lines. They never truncate.
- **Route number:** a count above one sits before the title in a 32px black box with yellow tabular figures and 6px corners, like a bus route number.
- **Black board:** the home "day's board" banner (area on the left, open-needs count on the right) is the inverted form, yellow text on black.

### Stat Grid
Two or three cells split by 2px black gutters inside a keylined box. Labels are 14px ink-2 and values use the display face with tabular figures. The cell that holds the money that matters most (commission due, wage offered) is filled board yellow.

### Notice
A full-width 2px-bordered block with 10px corners and semibold text. Ok: green border on ok-soft. Warn: ink border on board-pale. Danger: danger border on danger-soft.

## Do's and Don'ts

### Do:
- **Do** head every need, match and section panel with a yellow board strip, and put match strength on it as a plate. Strong matches use black with yellow text.
- **Do** let board-strip titles wrap; never truncate them.
- **Do** put any count above one in a black route-number box on the strip.
- **Do** show match fit in ink with a check icon, and use a bus-red warning icon when the worker's ask is above the offer.
- **Do** render a deliberately off contact action as a dashed outline on a transparent fill, and put the labelled "why is this off?" (i) link below the button row.
- **Do** keep a 2px ink keyline on panels, buttons and avatars, with 10px corners.
- **Do** run the header and bottom nav full width and keep content in the centred max-w-md column.
- **Do** use tabular figures for every amount, count and score.
- **Do** use Lucide line icons at one stroke weight (2, or 2.5 for active or emphasised).

### Don't:
- **Don't** use green anywhere except WhatsApp actions and ok/confirmed/paid states.
- **Don't** use cream or off-white tints; the pale tint is board-pale.
- **Don't** add soft drop shadows; the only box-shadow is the solid yellow focus ring.
- **Don't** put the "why is this off?" explanation inside the button row, or label records as demo or sample one by one.
- **Don't** use the 800-weight display face for body copy, labels or plates.
- **Don't** stretch content to full width on desktop.
- **Don't** use pill-shaped buttons or chips; corners stay at 6–10px.
