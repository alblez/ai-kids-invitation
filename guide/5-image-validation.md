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

What it caught: every generated image had some residual alpha in the 1-8 range. Without cleanup, these show as a faint coloured halo when composited on the dark page background.

**Canvas clearance.** At least 20 pixels of transparent margin on all sides, so the image has room for animation (swing arcs, lean effects) without clipping.

### Re-measurement by the next agent

This was the single most valuable check. Instead of trusting the generating agent's report, the next agent re-measured everything from the actual files.

What it caught:

- **The RSVP palm coordinate was wrong.** The generating agent reported the palm position for the burst effect origin, but the next agent re-measured it independently and found the coordinate pointed at the character's hair, not the hand. The burst would have appeared above the head instead of at the palm.
- **A probable extra finger.** The generating agent passed the RSVP R02 hand check, but the next agent flagged five fingertip lobes plus a thumb at 4x zoom — a probable sixth finger. The parent reviewed it and accepted it as a curled-hand ambiguity.
- **A blue sleeve on a red suit.** The Details pose had a blue upper sleeve on the pointing arm. The generating agent did not flag it. The next agent caught it by comparing sleeve colour values against the reference sheet palette. The image was marked `needs-revision`.
- **Face registration drift.** In the Activities poses, two of the four costume variants had faces offset from the base pose: one by 43 pixels vertically, another by 13-17 pixels horizontally. These were caught by overlaying the poses at 50% opacity. The parent judged both deviations as not perceptible in the final animation and accepted them.

### Face landmark checks

On macOS, Apple Vision framework detects illustrated faces and returns landmark coordinates (eye positions, face centre, face height, confidence score). A small Swift script calls Vision and prints the measurements.

What it measures:

- **Eye midpoint** (average of left and right eye centre coordinates) — used to align poses so the eyes stay in the same place during a costume-change wipe or a pose swap.
- **Face centre** — used to position the character on the canvas.
- **Face height** — used to scale multiple poses to the same head size (fit by face, not by total character height, because different poses have different body extents).
- **Confidence** — a low confidence means Vision is unsure it found a face, which could indicate the face is obscured or the illustration style is too far from photorealistic.

What it caught: earlier fitting scripts matched poses by their bounding box (hair/hood top to feet). This caused a 43-pixel face drift in one Activities pose because the hood added height that the base pose lacked. Switching to face-landmark fitting (eye-to-feet distance) eliminated the systematic drift.

### Finger and hand counts

Every hand in every image was inspected at 4x zoom. The check counts distinct fingers and flags any fused, extra, or missing digits.

What it caught: AI models frequently generate hands with the wrong number of fingers. The RSVP R02 curled hand showed five fingertip lobes plus a thumb at 4x, which was flagged. Multiple Activities and Hero poses required the generating prompt to explicitly describe "five short child-proportioned fingers, one thumb and four fingers, no fused or additional digits" to get acceptable results.

### Colour drift

Sleeve and costume colours were compared against the reference sheet palette. The check samples mean RGB values from specific regions (e.g. left arm, right arm) and flags any drift from the expected range.

What it caught: the Details pose had a blue upper sleeve on the pointing arm where the suit should have been red. The Activities poses all maintained correct colours because the validation prompt explicitly checked both sleeves.

### Blown pixel analysis

Regions of the face and hands were checked for pixels with values above 250 in any channel. The threshold was 2% of the region. Blown highlights indicate the model rendered the skin or gloves too bright, losing detail.

What it caught: the Details pose had 6.2% of face pixels above 250 in the red channel (warm CG lighting on rosy cheeks). It was flagged as a documented deviation. All-channel blown pixels were 0%, so the issue was cosmetic highlights, not lost detail.

### Hair fringe inspection

Semi-transparent edge pixels were composited on the actual page background colour (`#0f172a`, a dark navy) and inspected for coloured halos: purple, blue, or unnaturally bright fringes that come from the generation process.

What it caught: early smoke tests showed a possible purple halo. Full-quality masters on the dark background showed neutral-coloured fringe pixels from natural hair colour, not a coloured halo. The check distinguished real issues from false alarms.

### Contact sheets and overlays

For every set of related poses, the validation agent generated:

- **Individual composites** on the page background colour, to see how each image looks in context.
- **A contact sheet** (2x2 grid for four poses, side-by-side for two) for quick comparison.
- **50% overlay images** blending each variant against the base pose, to check face/body registration.

These are visual evidence files that the parent can glance at to spot problems without opening each image individually.

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

## Example: a generic validation report

A typical validation entry for one image looks like this:

```
ACT-R01 (Scientist pose)
  Native: 1024x1216 RGBA, 886,995 bytes
  Fitted: 1000x1200 RGBA, scale 0.86 (no upscale)
  Alpha 1-8 residual: 0 (after cleanup)
  Clearance: min 43 px (top)
  Hand: 5 fingers, natural joints, confirmed at 4x
  Face blown: 0.00%
  Hand blown: 0.00%
  Sleeves: both red, matching reference
  Hair fringe on dark: neutral, no halo
  Registration vs reference: face centre +0.2 px, eyes -0.4 px
  Status: technically-validated
```

The parent then sees the assembled page on their phone and says yes or no. That human decision is what moves the image to `parent-approved`.
