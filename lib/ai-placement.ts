/**
 * Per-category knowledge for the AI placement simulator.
 *
 * The simulator used to hardcode "dome CCTV camera near the ceiling" into both
 * prompts, which is wrong for every product that isn't a camera — a fingerprint
 * terminal or an exit switch goes beside the door at hand height, not on the
 * ceiling. Each category slug now carries its own mounting facts, and both
 * `/api/analyze` and `/api/generate` build their prompts from them.
 *
 * Categories are admin-managed rows (see lib/categories.ts), so a slug with no
 * profile here falls back to `FALLBACK` rather than breaking.
 */

/** One example row for the analyze step's JSON format demo. */
export interface PlacementExample {
  x: number;
  y: number;
  /** English label — this is what the image model is prompted with. */
  position: string;
  /** Thai label — display only. The image model never sees Thai. */
  positionTh: string;
  reason: string;
  reasonTh: string;
}

export interface PlacementProfile {
  /** Short English noun for the device — used throughout both prompts. */
  device: string;
  /** What it looks like. Carries the no-reference-image generate prompt. */
  appearance: string;
  /** Mounting surface, e.g. "on the ceiling or high on a wall". */
  mount: string;
  /** Real-world mounting height, in plain words. */
  height: string;
  /** Plausible band for the marker's y coordinate, as % from the top of the photo. */
  yRange: readonly [number, number];
  /** True real-world size, so the model renders neither a dot nor a monolith. */
  size: string;
  /** Which way the device points once installed. */
  facing: string;
  /** What the three suggested spots should optimise for. */
  goal: string;
  /** Format examples for the analyze step — the strongest lever on output quality. */
  examples: readonly PlacementExample[];
}

/**
 * Keyed by `Category.slug` (which is what `Product.type` stores).
 *
 * The y ranges are where the device lands in a normal eye-level room photo:
 * ceiling devices sit high in the frame, door-side devices sit near the middle.
 */
export const PLACEMENT_PROFILES: Record<string, PlacementProfile> = {
  // Wired fixed cameras: five bullets and one turret. Described bullet-first,
  // since that is what five of the six are — and for AI-tagged products the
  // reference photo, not this text, decides the shape anyway.
  cctv: {
    device: "fixed CCTV security camera",
    appearance:
      "a white fixed CCTV camera — a horizontal barrel-shaped body on a short wall bracket, with a dark glass lens at the front",
    mount:
      "on a short bracket high on a wall just below the ceiling line, or on the ceiling itself",
    height: "about 2.5–3 m above the floor",
    yRange: [5, 22],
    size: "about 15 cm long and 6 cm across — the size of a real fixed camera body, clearly visible, never a tiny dot",
    facing: "angled downward into the room so it looks across the floor area",
    goal:
      "the widest coverage of the room and its entry points, with the three options covering different zones and cancelling each other's blind spots",
    examples: [
      {
        x: 15,
        y: 12,
        position: "High on the left wall above the door",
        positionTh: "ผนังด้านซ้ายสูงเหนือประตู",
        reason: "Covers the entrance and most of the room in one view",
        reasonTh: "ครอบคลุมทางเข้าและพื้นที่ส่วนใหญ่ของห้องในมุมเดียว",
      },
      {
        x: 85,
        y: 10,
        position: "High in the right-hand corner, just below the ceiling",
        positionTh: "มุมขวาบนใต้แนวเพดาน",
        reason: "Diagonal coverage removes the blind spot behind the door",
        reasonTh: "มุมทแยงช่วยลบจุดบอดหลังประตู",
      },
      {
        x: 50,
        y: 14,
        position: "High on the centre wall above the window",
        positionTh: "ผนังกลางสูงเหนือหน้าต่าง",
        reason: "Watches the secondary entry point and the window side",
        reasonTh: "เฝ้าดูทางเข้ารองและด้านหน้าต่าง",
      },
    ],
  },

  // Wireless pan-tilt cameras — a different animal entirely: small, antennas,
  // wall bracket or shelf, and nowhere near the ceiling.
  "cctv-wifi": {
    device: "wireless Wi-Fi pan-tilt security camera",
    appearance:
      "a compact white pan-tilt camera — a rounded camera ball seated on a small base, with two thin antennas standing up behind it",
    mount:
      "on a small bracket screwed flat to the wall, or standing on a shelf or cabinet top",
    height: "about 2–2.5 m above the floor, within reach of a ladder",
    yRange: [12, 42],
    size: "about 12 cm tall including the antennas — small, roughly the size of a coffee mug, never the size of a floodlight",
    facing:
      "the lens ball turned out across the room and tilted slightly downward",
    goal:
      "covering the room and its entry points from an easy wall spot, with the three options watching different zones",
    examples: [
      {
        x: 22,
        y: 24,
        position: "Upper left wall facing the entrance",
        positionTh: "ผนังซ้ายส่วนบน หันเข้าหาทางเข้า",
        reason: "Sees the door and the walkway leading to it",
        reasonTh: "เห็นประตูและทางเดินที่มุ่งเข้าหาประตู",
      },
      {
        x: 78,
        y: 22,
        position: "Upper right wall, opposite corner",
        positionTh: "ผนังขวาส่วนบน มุมตรงข้าม",
        reason: "Covers the far side the first spot cannot reach",
        reasonTh: "ครอบคลุมฝั่งไกลที่จุดแรกมองไม่ถึง",
      },
      {
        x: 50,
        y: 30,
        position: "Centre wall above the furniture line",
        positionTh: "ผนังกลางเหนือแนวเฟอร์นิเจอร์",
        reason: "Balanced view of the whole room from one bracket",
        reasonTh: "มองเห็นทั้งห้องอย่างสมดุลจากขาตั้งเดียว",
      },
    ],
  },

  "card-reader": {
    device: "wall-mounted RFID access-control card reader",
    appearance:
      "a slim rectangular wall panel with a flat card-tap face and a small status LED",
    mount: "flat against the wall right beside the door frame, on the handle side",
    height: "about 110–130 cm above the floor, roughly waist-to-chest height",
    yRange: [45, 70],
    size: "about 12 cm tall and 8 cm wide — small, roughly two stacked light-switch plates",
    facing: "flush to the wall with its face pointing out into the room, so a card can be tapped on it",
    goal:
      "easy card-tap access at the doors, with the three options covering different doors or different sides of the same door frame",
    examples: [
      {
        x: 30,
        y: 55,
        position: "Wall beside the main door, handle side",
        positionTh: "ผนังข้างประตูหลัก ฝั่งลูกบิด",
        reason: "Within arm's reach as someone opens the door",
        reasonTh: "อยู่ในระยะเอื้อมมือขณะเปิดประตู",
      },
      {
        x: 62,
        y: 58,
        position: "Wall beside the inner door",
        positionTh: "ผนังข้างประตูด้านใน",
        reason: "Controls access between the two rooms",
        reasonTh: "ควบคุมการเข้าออกระหว่างสองห้อง",
      },
      {
        x: 18,
        y: 52,
        position: "Wall next to the entrance, hinge side",
        positionTh: "ผนังข้างทางเข้า ฝั่งบานพับ",
        reason: "Alternative when the handle side has no free wall",
        reasonTh: "ใช้แทนเมื่อฝั่งลูกบิดไม่มีผนังว่าง",
      },
    ],
  },

  "face-scanner": {
    device: "wall-mounted face-recognition access terminal",
    appearance:
      "an upright tablet-shaped terminal with a display on the front and a camera lens at the top",
    mount:
      "flat against the wall beside the door frame, or on a post facing whoever walks up",
    height: "about 140–160 cm above the floor, so the lens sits at an adult's face height",
    yRange: [30, 55],
    size: "about 20 cm tall and 9 cm wide",
    facing:
      "screen and lens pointing outward at whoever approaches the door, tilted very slightly upward",
    goal:
      "a clear, well-lit, head-on view of anyone approaching, avoiding strong backlight from windows",
    examples: [
      {
        x: 28,
        y: 42,
        position: "Wall beside the main door at face height",
        positionTh: "ผนังข้างประตูหลัก ระดับใบหน้า",
        reason: "Head-on view of everyone entering, with even indoor light",
        reasonTh: "เห็นใบหน้าตรงๆ ของทุกคนที่เข้ามา ภายใต้แสงในอาคารที่สม่ำเสมอ",
      },
      {
        x: 70,
        y: 40,
        position: "Wall facing the entrance walkway",
        positionTh: "ผนังหันเข้าหาทางเดินเข้า",
        reason: "Catches the face early, before the person reaches the door",
        reasonTh: "จับใบหน้าได้ตั้งแต่ก่อนถึงประตู",
      },
      {
        x: 48,
        y: 45,
        position: "Wall between the two doors",
        positionTh: "ผนังระหว่างประตูทั้งสอง",
        reason: "One terminal covers both entry points",
        reasonTh: "เครื่องเดียวครอบคลุมทางเข้าทั้งสองจุด",
      },
    ],
  },

  "fingerprint-scanner": {
    device: "wall-mounted fingerprint access-control terminal",
    appearance:
      "a compact wall terminal with a small display, a keypad and a fingerprint sensor pad below it",
    mount: "flat against the wall right beside the door frame, on the handle side",
    height: "about 120–140 cm above the floor, at comfortable hand height",
    yRange: [40, 62],
    size: "about 16 cm tall and 8 cm wide",
    facing: "flush to the wall with the sensor pad and keypad facing out into the room",
    goal:
      "comfortable, reachable fingerprint access at the doors people actually use",
    examples: [
      {
        x: 32,
        y: 52,
        position: "Wall beside the main door, handle side",
        positionTh: "ผนังข้างประตูหลัก ฝั่งลูกบิด",
        reason: "Natural hand height right where people reach for the door",
        reasonTh: "อยู่ในระยะเอื้อมมือขณะเปิดประตู",
      },
      {
        x: 66,
        y: 50,
        position: "Wall beside the office door",
        positionTh: "ผนังข้างประตูห้องทำงาน",
        reason: "Logs entry to the inner room separately",
        reasonTh: "บันทึกการเข้าห้องด้านในแยกต่างหาก",
      },
      {
        x: 20,
        y: 55,
        position: "Wall next to the entrance, hinge side",
        positionTh: "ผนังข้างทางเข้า ฝั่งบานพับ",
        reason: "Works when the handle side is glass or has no free wall",
        reasonTh: "ใช้แทนเมื่อฝั่งลูกบิดไม่มีผนังว่าง",
      },
    ],
  },

  "exit-switch": {
    device: "emergency exit push-button release switch",
    appearance:
      "a small square wall plate with one large round press button in the middle",
    mount: "flat against the wall beside the door, on the inside of the room",
    height: "about 120–140 cm above the floor",
    yRange: [45, 68],
    size: "about 8.6 cm square — very small, no bigger than a single light-switch plate on the wall beside it; if in doubt draw it SMALLER, never a large panel",
    facing: "flush to the wall with the button facing out into the room",
    goal:
      "an obvious, instantly reachable exit release next to each door, findable without searching",
    examples: [
      {
        x: 35,
        y: 55,
        position: "Wall beside the main door, inside",
        positionTh: "ผนังข้างประตูหลัก ด้านใน",
        reason: "Reachable the moment someone turns to leave",
        reasonTh: "เอื้อมถึงทันทีเมื่อหันออกจากห้อง",
      },
      {
        x: 68,
        y: 57,
        position: "Wall beside the second door",
        positionTh: "ผนังข้างประตูที่สอง",
        reason: "Every controlled door needs its own release",
        reasonTh: "ประตูควบคุมทุกบานต้องมีปุ่มปลดล็อกของตัวเอง",
      },
      {
        x: 22,
        y: 60,
        position: "Wall on the approach to the exit",
        positionTh: "ผนังบนทางเดินไปยังทางออก",
        reason: "Visible from across the room in an emergency",
        reasonTh: "มองเห็นได้จากอีกฝั่งของห้องในกรณีฉุกเฉิน",
      },
    ],
  },
};

/**
 * Key cards have nothing to mount — what actually gets installed is the reader
 * they tap against, so they borrow the card-reader geometry. Products in this
 * category are better off with the AI toggle switched off entirely.
 */
PLACEMENT_PROFILES.kaycard = PLACEMENT_PROFILES["card-reader"];

/** Used for admin-created categories that have no hand-written profile. */
export const FALLBACK_PROFILE: PlacementProfile = {
  device: "security device",
  appearance: "a wall-mounted security device in a clean modern housing",
  mount: "flat against a wall, in a spot that is realistic for this kind of device",
  height: "at the height this kind of device is normally installed",
  yRange: [15, 60],
  size: "the size such a device really is — clearly visible and in focus, never a tiny dot",
  facing: "flush to the wall, facing out into the room",
  goal: "practical, realistic installation spots that a technician would actually pick",
  examples: [
    {
      x: 25,
      y: 30,
      position: "Wall beside the main door",
      positionTh: "ผนังข้างประตูหลัก",
      reason: "Covers the busiest entry point",
      reasonTh: "ครอบคลุมทางเข้าที่มีคนใช้มากที่สุด",
    },
    {
      x: 75,
      y: 28,
      position: "Opposite wall",
      positionTh: "ผนังฝั่งตรงข้าม",
      reason: "Reaches the far side of the room",
      reasonTh: "ครอบคลุมพื้นที่ฝั่งไกลของห้อง",
    },
    {
      x: 50,
      y: 35,
      position: "Center wall",
      positionTh: "ผนังกลางห้อง",
      reason: "Balanced position between both entrances",
      reasonTh: "ตำแหน่งสมดุลระหว่างทางเข้าทั้งสอง",
    },
  ],
};

/** Look up a profile by category slug, falling back for unknown categories. */
export function placementProfile(slug: string | null | undefined): PlacementProfile {
  if (!slug) return FALLBACK_PROFILE;
  return PLACEMENT_PROFILES[slug] ?? FALLBACK_PROFILE;
}

/** Prompt for /api/analyze — asks for 3 mount spots as image percentages. */
export function buildAnalyzePrompt(p: PlacementProfile): string {
  const [lo, hi] = p.yRange;
  return `Analyze this room photo. Identify exactly 3 realistic positions to install a ${p.device} in this room.

Return ONLY raw JSON (no markdown, no code fences):
{
  "placements": ${JSON.stringify(p.examples, null, 2).replace(/\n/g, "\n  ")}
}

Rules:
- The values above only demonstrate the format — do NOT copy them. Read the actual photo.
- x and y are percentages (0-100) from the top-left of the image
- This device installs ${p.mount}, ${p.height}
- So y is normally between ${lo} and ${hi}; only go outside that band if the photo's perspective clearly puts that mounting height elsewhere in the frame
- Choose spots that give ${p.goal}
- "position" is a short English label for the spot; "reason" is one short sentence
- "positionTh" and "reasonTh" are natural Thai translations of those two fields. Translate the meaning, do not transliterate, and do not leave them in English
- Return exactly 3 distinct options

HARD RULES — a point that breaks any of these is wrong, move it:
- Mount ONLY on a solid, permanently fixed wall or ceiling surface.
- NEVER on glass, a window, a mirror, a door leaf, a door frame, or anything that opens, swings or slides.
- NEVER on furniture, a plant, a curtain, a TV, artwork, or any object that can be moved.
- NEVER floating in mid-air, in an open doorway, or over a reflection.
- The surface must be clearly VISIBLE in this photo. If the ceiling is not in frame, do not claim a ceiling spot — use the highest visible piece of wall and say so.
- Keep every point at least 4% in from all four edges, so the device is not half out of frame.
- Keep the 3 points at least 12% apart from each other.
- There must be enough clear, flat surface at the point for a device ${p.size.split("—")[0].trim()}.

Before you answer, re-check each of the 3 points against every hard rule and move any that breaks one.`;
}

/**
 * Prompt for /api/generate. When `hasReference` is true the request carries a
 * second image (the product's clean reference shot) and the model composites
 * that exact unit instead of inventing a generic one.
 */
export function buildGeneratePrompt(
  p: PlacementProfile,
  selectedPosition: string,
  hasReference: boolean,
  point?: { x: number; y: number } | null
): string {
  // The description is the primary signal; the coordinate is a backstop for
  // when the user has dragged the marker somewhere the words describe loosely.
  const where = point
    ? `${selectedPosition} (about ${Math.round(point.x)}% from the left edge and ${Math.round(point.y)}% down from the top of the photo)`
    : selectedPosition;
  const rules = [
    `- It installs ${p.mount}, ${p.height}.`,
    `- Orientation: ${p.facing}.`,
    `- Render it at its true real-world size: ${p.size}.`,
    `- It MUST cast a soft contact shadow on the surface behind it, along its lower and outer edges, in the same direction and softness as the shadows already in the room, with subtle ambient occlusion in the seam where it meets the surface. With no shadow it looks pasted on and fake.`,
    `- Light it with the room's own light: same colour temperature, same soft highlights along the edges that face the light.`,
    `- Keep its perspective consistent with the surface it is mounted on.`,
  ].join("\n");

  // NOTE: never say "camera angle" here. Half the catalogue is not a camera,
  // and the image model will happily draw a CCTV dome it saw named in the text.
  const keepIdentical =
    "identical room, furniture, layout, wall positions, floor, colours, lighting and viewpoint";

  const nothingElse = `Do NOT redraw, re-render, mirror, restyle, rearrange, recolour or reframe the room, and do NOT change its viewpoint. Do NOT open, close or move any door. Do NOT add a CCTV camera, dome, sensor, alarm, keypad, sign or any other object — the ONLY thing added to the photo is the single ${p.device}. Photorealistic.`;

  if (hasReference) {
    return `You are EDITING the FIRST image (a room photo), not creating a new image. The SECOND image shows the exact ${p.device} product to install.

Return the FIRST image EXACTLY as-is — ${keepIdentical} — with only ONE change: install one copy of the device from the SECOND image at ${where}.

Placement rules for this device:
${rules}
- Match the shape, proportions, colour and finish of the product in the SECOND image exactly.

${nothingElse}`;
  }

  return `You are EDITING this room photo, not creating a new image. Add exactly 1 realistic ${p.device} — ${p.appearance} — installed at ${where}.

Placement rules for this device:
${rules}

Keep EVERYTHING else completely identical — ${keepIdentical}, and the existing shadows.

${nothingElse}`;
}

/**
 * Prompt for /api/describe — the user dragged the marker somewhere of their own
 * choosing, so instead of trusting the original suggestion's wording we ask the
 * vision model what is actually at that point and whether it can be mounted on.
 *
 * Returns English for the image prompt plus Thai for the UI, and a Thai warning
 * when the spot breaks a mounting rule (glass, a door leaf, furniture, mid-air).
 */
export function buildDescribePrompt(
  p: PlacementProfile,
  x: number,
  y: number
): string {
  return `Look at this room photo. A user has picked the point ${x.toFixed(1)}% from the LEFT edge and ${y.toFixed(1)}% DOWN from the TOP edge as the place to install a ${p.device}.

Describe what is actually at that exact point in the photo.

Return ONLY raw JSON (no markdown, no code fences):
{
  "position": "short English label for what is at that point, phrased as an install location",
  "positionTh": "Thai translation of position",
  "reason": "one short English sentence on what this spot gives",
  "reasonTh": "Thai translation of reason",
  "warning": null,
  "warningTh": null
}

Rules:
- Describe the REAL surface at that point in THIS photo — name what you see there (for example "on the white wall just left of the door frame"), not a generic guess.
- "position" must read as an install location, so it can be dropped into the sentence "install the device at ...".
- Translate meaning into natural Thai; never leave Thai fields in English.
- This device normally installs ${p.mount}, ${p.height}. If the chosen point sits well away from that, still describe the point honestly — the user's choice wins.

Set "warning"/"warningTh" to a short sentence ONLY if the point breaks one of these, otherwise leave both null:
- It is on glass, a window, a mirror, a door leaf, a door frame, or anything that opens, swings or slides.
- It is on furniture, a plant, a curtain, a TV, artwork, or any movable object.
- It is floating in mid-air, in an open doorway, or over a reflection.
- There is not enough clear flat surface there for a device ${p.size.split("—")[0].trim()}.`;
}

/**
 * Aspect ratios google/gemini-2.5-flash-image can be asked for.
 *
 * Left unset, the model picks its own canvas — and a canvas that does not match
 * the uploaded photo forces it to RE-SHOOT the room rather than edit it, which
 * is why generated rooms came back zoomed and from a different viewpoint.
 */
export const SUPPORTED_ASPECT_RATIOS: readonly { label: string; value: number }[] = [
  { label: "1:1", value: 1 },
  { label: "2:3", value: 2 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "3:4", value: 3 / 4 },
  { label: "4:3", value: 4 / 3 },
  { label: "4:5", value: 4 / 5 },
  { label: "5:4", value: 5 / 4 },
  { label: "9:16", value: 9 / 16 },
  { label: "16:9", value: 16 / 9 },
  { label: "21:9", value: 21 / 9 },
];

/** Nearest requestable ratio to the uploaded photo's own width/height. */
export function snapAspectRatio(aspect: number | null | undefined): string | null {
  if (!aspect || !Number.isFinite(aspect) || aspect <= 0) return null;
  let best = SUPPORTED_ASPECT_RATIOS[0];
  // Compare in log space so 16:9 and 9:16 are judged by the same relative error.
  let bestErr = Math.abs(Math.log(aspect / best.value));
  for (const r of SUPPORTED_ASPECT_RATIOS.slice(1)) {
    const err = Math.abs(Math.log(aspect / r.value));
    if (err < bestErr) {
      best = r;
      bestErr = err;
    }
  }
  return best.label;
}
