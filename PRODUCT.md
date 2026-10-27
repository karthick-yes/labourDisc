# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Labour contractors in central Kerala (Perumbavoor, Thodupuzha and nearby towns) who place migrant workers from Assam, West Bengal and elsewhere with local businesses. The contractor is Malayali, reads Malayalam comfortably and knows little English, uses a mid-range Android phone all day, and lives in WhatsApp. He is not a "software user" and has low patience for complexity.

He mostly uses the app outdoors or at the roadside in bright sun, and often turns the screen around to show it to a worker or a shop owner, so screens double as something he presents to others.

Workers and enterprises (bakeries, restaurants, supermarkets, hardware stores, workshops, plywood units) do not log in. Enterprises only see WhatsApp messages and a public worker profile page.

## Product Purpose

Replace the contractor's two paper books (enterprise needs and walk-in workers) and match them automatically. Success: a walk-in worker goes from intake to a WhatsApp profile card at a matching enterprise in under 60 seconds, and the contractor always knows which commissions he is owed.

The immediate goal is a demo good enough to sell a paid pilot to one or two contractors.

## Positioning

A private book for one contractor, not a marketplace. His workers and enterprises are his alone and are never shared with anyone else, and every shared card and profile shows him, not the worker, as the contact, so his commission is protected.

## Operating Context

- Intake: worker walks in; contractor takes a photo, records a voice note (worker speaks Hindi/Bengali/Assamese or contractor summarises in Malayalam), checks the pre-filled profile, saves.
- New need: usually typed while on a phone call with the enterprise.
- Sharing: `wa.me` links with a Malayalam card and a link to a public profile page. No WhatsApp Business API.
- Money: the contractor sets a commission per placement (about one day's wage). The enterprise pays it upfront; only then does the contractor release the workers and send them in an auto. The trial is a guarantee period: if the worker leaves or doesn't work out, the contractor refunds the commission or sends a replacement worker. After the trial the commission is earned.
- Patchy 4G; installable as a PWA.

## Capabilities and Constraints

- Must work on mid-range Android (Chrome) **and iPhone Safari**, including camera photo/video capture, voice recording, and Add to Home Screen as an installed PWA.
- Malayalam UI by default with an English toggle; all strings in translation files; a native speaker will review Malayalam copy.
- Big tap targets, minimal typing; prefer voice, photo and pick-from-list.
- Worker phone numbers are never shown to enterprises. No Aadhaar or ID documents stored. Photos shown publicly only with consent.
- Strict per-contractor data isolation.
- AI (OpenAI) use is capped very tightly: a handful of voice intakes per day by default, kill switch, dollar caps.
- Demo mode loads real local businesses from OpenStreetMap plus sample workers/needs. No per-record DEMO badges: the person demoing explains what is sample data; a single info control explains it in-app.
- Out of scope for now: payments, worker/enterprise logins, OCR of paper books, verified-worker tier, WhatsApp Business API, SMS OTP, push notifications, any cross-contractor network.

## Brand Commitments

- Working name: PaniBook.
- Shareable surfaces (WhatsApp card, public worker profile) put the contractor's own name front and centre, like his agency; PaniBook stays small in the footer.

## Evidence on Hand

- OpenStreetMap export for the Perumbavoor area: `data/osm/perumbavoor.geojson`.
- No real contractor books, testimonials, customers or photos yet. Do not fabricate them.

## Product Principles

1. Faster than the paper book, or it fails: every primary action within one or two taps.
2. The contractor is the customer: everything should make him faster and look more professional in front of others.
3. His data and his commission are protected by default.
4. Malayalam first, readable at a glance in sunlight.
5. Demo honestly: real places, clearly explained sample data.

## Accessibility & Inclusion

High contrast and large type for outdoor, bright-sun use. Malayalam-first copy with icons supporting, not replacing, words. Minimal English.
