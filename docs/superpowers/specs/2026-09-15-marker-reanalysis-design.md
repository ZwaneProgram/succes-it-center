# Re-reading a dragged marker before generating

**Date:** 2026-09-15
**Status:** implemented

## The problem

The AI simulator analyses a room photo and returns three suggested mount spots,
each with an `x`/`y` percentage and an English label. The user can drag those
markers, and dragging did update `x`/`y` in component state — but `generate()`
sent only `chosen.position`, the text label written by the original analysis:

```ts
fd.append("selectedPosition", chosen.position);   // the stale label
```

The coordinates never left the browser. So a user who dragged marker 1 from the
left wall to the right of the door still got an image with the device on the
left wall, because the image model was told "Left wall beside the door frame".
The drag looked like it worked and silently did nothing.

Reported against `เครื่องทาบบัตร` (card-reader), but it affected every category.

## The decision

Suggestions become genuinely advisory. The user's marker position is the source
of truth, and the description is regenerated from it.

Re-analysis happens **at generate time**, not on drop. Dragging stays free and
instant; the extra vision call is paid once, only when the user commits, and
only when the marker actually moved.

Descriptions are shown to the user in **Thai** but prompted to the image model
in **English** — the image model follows English mounting instructions more
reliably, so Thai never reaches it.

## Design

### Bilingual placements

`/api/analyze` now asks for four text fields per placement: `position` and
`reason` in English, `positionTh` and `reasonTh` in Thai. The vision model emits
both in the same call, so there is no separate translation round-trip. The
per-category examples in `lib/ai-placement.ts` carry Thai too, since those
examples are the strongest lever on output quality.

English is what `buildGeneratePrompt` consumes. Thai is display-only.

### `/api/describe` — one point, re-read

A new route with a single job: given the room photo, a category and one `x`/`y`,
describe what is actually at that point.

```
POST /api/describe   { image, category, x, y }
  → { position, positionTh, reason, reasonTh, warning, warningTh }
```

Its prompt names the coordinates explicitly, asks the model to describe the real
surface it sees there rather than guess, and requires `position` to read as an
install location so it drops cleanly into "install the device at ...".

It reuses the mounting rules from the analyze prompt as a **warning**, not a
veto: glass, a door leaf, furniture, mid-air, or too little flat surface fills in
`warning`/`warningTh`. The prompt states plainly that the user's choice wins —
the route describes the point honestly even when it is unusual for the device.

Kept as its own route rather than a mode of `/api/analyze`: different input,
different response shape, different prompt.

### Two-step generate

```
press Generate
  ├─ marker within 2% of its suggestion → generate with the original label
  └─ marker moved
       ├─ state "describing"  → POST /api/describe
       ├─ placement's text replaced with the re-read description
       ├─ warning surfaced (does not block)
       └─ state "generating" → POST /api/generate with the NEW English label
```

Each placement carries `srcX`/`srcY`, the spot the analysis first chose, so
"moved" is detectable. After a re-read those become the new baseline, so a
second Generate on an untouched marker costs nothing.

`/api/generate` also receives `x`/`y` and appends a coordinate hint to the
English prompt ("about 34% from the left edge and 52% down from the top"). The
description stays the primary signal; the coordinate is a backstop.

### UI

- Hint text says outright that suggestions are only suggestions and that moving
  a marker triggers a re-read.
- A moved marker gets a `ย้ายแล้ว · AI จะอ่านจุดใหม่` tag in the list.
- New `describing` state with its own spinner screen, so the button is not
  silently busy across two round-trips.
- Warnings render as an amber strip above the Generate button.

## Out of scope

Letting the user type their own Thai description and translating it into the
prompt. That is a different feature; the Thai text here is display-only.

## Files

| File | Change |
|---|---|
| `lib/ai-placement.ts` | Thai fields on `PlacementExample`; bilingual examples; `buildDescribePrompt`; coordinate hint in `buildGeneratePrompt` |
| `app/api/describe/route.ts` | New |
| `app/api/generate/route.ts` | Accepts `x`/`y`, passes the point through |
| `components/detail/ai-simulator.tsx` | `srcX`/`srcY` tracking, `describing` state, two-step generate, Thai display, warning strip |
