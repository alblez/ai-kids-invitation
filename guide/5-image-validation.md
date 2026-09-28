# Image validation

Every generated image went through a structured validation process before it could be used in the invitation. This section describes the checks, what each one caught, and why letting an AI agent inspect images saves a parent a lot of time.

## Why validate

AI-generated images look plausible at a glance. The problems are in the details: an extra finger, a sleeve that changed colour, a face that drifted from the reference, a faint halo around the hair on a dark background. A human reviewing a dozen images on a phone screen will miss most of these. An AI agent with specific check instructions and access to pixel-level tools catches them systematically.

The key principle: **the agent that generated the image never validates it.** A different agent (ideally on a different model family) re-runs every check independently.

## The checks

### Technical checks

These are objective, measurable checks run on every image file.

**Dimensions and format.** The fitted master must be exactly the specified size (e.g. 1000x1200 for character poses). The mode must be RGBA with a transparent background. The generating script records the native output size and the scale factor applied during fitting; any scale factor above 1.0 is an upscale and gets flagged.

What it caught: the Details city plate came out at 1184 pixels wide instead of 1200, because the image model rounds dimensions to multiples of 32. The implementing agent adjusted the SVG viewBox to match.

**Alpha channel cleanup.** After generation, faint alpha values (1-8 out of 255) are zeroed to eliminate residual fringe. The check counts how many pixels had residual alpha and confirms they were cleaned.

What it caught: the smoke tests showed substantial residual alpha in the 1-8 range before cleanup (for example, the RSVP smoke had 938,932 out of 1,245,184 pixels with alpha 1-8). Full-quality masters were cleaned during the fitting step, and the ledger confirmed 0 residual alpha 1-8 on every fitted master. WebP derivatives were cleaned again after resizing, clearing 2,000-3,000 pixels per image. Without cleanup, these residuals show as a faint coloured halo when composited on the dark page background.

**Canvas clearance.** At least 20 pixels of transparent margin on all sides, so the image has room for animation (swing arcs, lean effects) without clipping.

### Re-measurement by the next agent

This was the single most valuable check. Instead of trusting the generating agent's report, the next agent re-measured everything from the actual files.

What it caught:

- **The RSVP palm coordinate was wrong.** The generating agent reported the palm position for the burst effect origin, but the next agent re-measured it independently and found the coordinate pointed at the character's hair, not the hand. The burst would have appeared above the head instead of at the palm.
- **A probable extra finger.** The generating agent passed the RSVP R02 hand check, but the next agent flagged five fingertip lobes plus a thumb at 4x zoom — a probable sixth finger. The parent reviewed it and accepted it as a curled-hand ambiguity.
- **A blue sleeve on a red suit.** The Details pose had a blue upper sleeve on the pointing arm. The generating agent did not flag it. The next agent caught it by comparing sleeve colour values against the reference sheet palette. The image was marked `needs-revision`.
- **Face registration drift.** In the Activities poses, two of the four costume variants had faces offset from the base pose: one by 43 pixels vertically, another by 13-17 pixels horizontally. These were caught by overlaying the poses at 50% opacity. The parent judged both deviations as not perceptible in the final animation and accepted them.

### Face landmark checks

On macOS, Apple Vision framework detects illustrated faces and returns landmark coordinates (eye positions, face centre, face height, confidence score). This repository includes a small Swift script (`tools/face-landmarks.swift`) that calls Vision and prints the measurements.

What it measures:

- **Eye midpoint** (average of left and right eye centre coordinates) — used to align poses so the eyes stay in the same place during a costume-change wipe or a pose swap.
- **Face centre** — used to position the character on the canvas.
- **Face height** — used to scale multiple poses to the same head size (fit by face, not by total character height, because different poses have different body extents).
- **Confidence** — a low confidence means Vision is unsure it found a face, which could indicate the face is obscured or the illustration style is too far from photorealistic.

What it caught: earlier fitting scripts matched poses by their bounding box (hair/hood top to feet). This caused a 43-pixel face drift in one Activities pose because the hood added height that the base pose lacked. The Activities deviations were measured and accepted by the parent. The later RSVP and Details workflows used face-landmark fitting (eye-to-feet distance) to prevent this drift, and achieved sub-pixel registration (RSVP R01/R02 deltas were under 1 px on every axis).

#### Try it

```sh
swift tools/face-landmarks.swift src/assets/source/ACT-R01-master-1000x1200.png
```

This prints six space-separated numbers:

```
488.093 275.199 489.786 323.799 265.068 1.000
```

In order: eye midpoint x, eye midpoint y, face centre x, face centre y, face height, confidence. All coordinates are in top-left pixel space of the input image.

### Finger and hand counts

Every hand in every image was inspected at 4x zoom. The check counts distinct fingers and flags any fused, extra, or missing digits.

What it caught: AI models frequently generate hands with the wrong number of fingers. The RSVP R02 curled hand showed five fingertip lobes plus a thumb at 4x, which was flagged. Multiple Activities and Hero poses required the generating prompt to explicitly describe "five short child-proportioned fingers, one thumb and four fingers, no fused or additional digits" to get acceptable results.

### Colour drift

Sleeve and costume colours were compared against the reference sheet palette. The check samples mean RGB values from specific regions (e.g. left arm, right arm) and flags any drift from the expected range.

What it caught: the Details pose had a blue upper sleeve on the pointing arm where the suit should have been red. The Activities poses all maintained correct colours because the validation prompt explicitly checked both sleeves.

### Blown pixel analysis

Regions of the face and hands were checked for pixels with values above 250 in any channel. The threshold was 2% of the region. Blown highlights indicate the model rendered the skin or gloves too bright, losing detail.

What it caught: the Details pose had elevated face highlights in the red channel. The generating report measured 6.2% R-channel pixels above 250 in the face region (box 100:400, 300:700); the subsequent independent recheck measured 9.1% R-channel in the Vision-detected face box (a different, tighter region). Both measurements found 0% all-channel blown pixels, so the issue was cosmetic warm CG lighting on rosy cheeks, not lost detail. It was flagged as a documented deviation.

### Hair fringe inspection

Semi-transparent edge pixels were composited on the actual page background colour (`#0f172a`, a dark navy) and inspected for coloured halos: purple, blue, or unnaturally bright fringes that come from the generation process.

What it caught: early smoke tests showed a possible purple halo. Full-quality masters on the dark background showed neutral-coloured fringe pixels from natural hair colour, not a coloured halo. The check distinguished real issues from false alarms.

### Contact sheets and overlays

For every set of related poses, the validation agent generated:

- **Individual composites** on the page background colour, to see how each image looks in context.
- **A contact sheet** (side-by-side grid) for quick comparison.
- **50% overlay images** blending each variant against the base pose, to check face/body registration.

These are visual evidence files that the parent can glance at to spot problems without opening each image individually.

#### Try it

ImageMagick (`magick`) must be installed. These commands work on the source PNGs in this repository:

Contact sheet (four poses side by side on the page background):

```sh
magick src/assets/source/ACT-R0{1,2,3,4}-master-1000x1200.png \
  -resize 400x480 -background '#0f172a' -gravity center -extent 416x496 \
  +append contact.png
```

50% overlay (blend two poses to check registration):

```sh
magick src/assets/source/ACT-R01-master-1000x1200.png \
  src/assets/source/ACT-R02-master-1000x1200.png \
  -compose blend -define compose:args=50 -composite overlay.png
```

## The approval workflow

Every image went through these states:

```
not requested -> requested -> received -> technically-validated -> parent-approved
                                      \-> needs-revision (loop back to received)
```

- **Technically validated** means all automated checks passed. It does not mean the parent has seen or approved the image.
- **Parent-approved** means the parent reviewed the image (usually in the assembled page, not as a standalone file) and explicitly accepted it. The parent can accept a documented deviation (e.g. "the face registration is off by 43 pixels but I cannot see it in the animation").
- **Needs-revision** means a check failed. The failure is documented with the specific check and what needs to change. Up to three retries are allowed, each changing exactly one thing (seed or one phrase in the prompt).

**Publication is not approval.** In this project, the parent authorized deploying candidate images to the live site before approving the artwork, so the assembled result could be reviewed in context on real phones. A deployed image with a `needs-revision` flag was still pending approval.

Note that validation thresholds differed per section. For example, the Activities poses used a face registration target of 10 px (which ACT-R02 and ACT-R04 exceeded, prompting revision requests that the parent ultimately waived), while the RSVP poses used a stricter 6 px target and met it.

## Example: an illustrative validation entry

A typical validation entry for one image looks like this. The numbers below are taken from the ACT-R01 (scientist pose) record to show the format; your images will have different values.

```
ACT-R01 (Scientist pose)
  Native: 1024x1216 RGBA, 831,091 bytes
  Fitted: 1000x1200 RGBA, scale 0.95 (no upscale)
  Alpha 1-8 residual: 0 (after cleanup)
  Clearance: min 43 px (top)
  Hand: 5 fingers, natural joints, confirmed at 4x
  Face blown: 1.02% any-channel (pass, < 2%)
  Hand blown: 0.00%
  Sleeves: grey T-shirt, matching reference (scientist wears no suit)
  Hair fringe on dark: neutral, no halo
  Registration vs reference: (baseline pose, no cross-pose delta)
  Status: technically-validated
```

The parent then sees the assembled page on their phone and says yes or no. That human decision is what moves the image to `parent-approved`.
