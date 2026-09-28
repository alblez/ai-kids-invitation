# Prompts

Copy-ready prompts for each stage of the process. Personal details have been replaced with `<placeholder>` slots. These are faithful to the prompts that were actually used, shortened for clarity.

## 1. Ideation prompt

Ask one strong model to research current animation technology, then propose creative directions for the invitation. This was run as a single session.

```text
You are the creative director for a birthday party invitation website
for <your child's name>. The site is already built and deployed.
Your job is to propose creative animations and interactive experiences.

Stack: Astro + GSAP (ScrollTrigger, MotionPath) + Tailwind CSS.
90%+ users on mobile phones via a WhatsApp link.

The parent can create custom cartoon images of the child as:
- The child wearing a superhero costume
- The child as different costume characters
- Sprite sheets for animation
Any image asset you propose, the parent can create.

Research current web animation tools first. Then propose at least
3 creative ideas. For each:
- Section: which page section it applies to
- Description: what a parent experiences scrolling on their phone
- Assets needed: exact images the parent must create (dimensions,
  format, poses, transparency requirements)
- Technology: which library and why
- Technical approach: key code patterns, how it integrates

Think about:
- The child as the protagonist, not generic shapes
- Scroll as storytelling: each section like turning a page
- The emotional arc: excitement -> information -> anticipation -> action
- The "share moment": what makes a parent want to show it to someone
```

## 2. Roadmap-writing prompt

After the parent picks a creative direction, write a roadmap for each section. This was given to the orchestrator.

```text
Write a delivery roadmap for the <section name> section.

Read the creative direction in the ideas document and the existing
codebase. The roadmap must contain:

- ROADMAP.md: goal, non-goals, dependencies, five stages (define
  scene, request assets, validate assets, implement, verify and ship),
  acceptance checklist, risks and fallbacks.
- ASSETS.md: required and optional assets with exact specifications
  (dimensions, format, pose description, alignment constraints),
  status tracking, and derivative production steps.
- CHOREOGRAPHY.md: beat-by-beat animation timing, coordinates,
  responsive layout rules, reduced-motion behaviour, and failure
  states.
- Numbered prompts: 01-create-assets.md, 02-validate-assets.md,
  03-implement.md, 04-verify.md.

Each section must be independently shippable. Do not modify other
sections. The whole invitation must keep working after every delivery.

Asset states: not requested -> requested -> received ->
technically-validated -> parent-approved (or needs-revision).
Publication is not approval.
```

## 3. Image generation prompts

These are the prompts used with the local image model. The workflow is: generate a character reference sheet first, then derive each pose from it.

### Character reference sheet (Step 0 — the only step that uses real photos)

```text
Create a new 3D animated character illustration of the boy in the
reference photos. This is not an edit of the photos; use them only
as likeness reference.

Likeness to keep:
- <hair colour and length>
- <face shape, cheeks, skin tone>
- <eye colour and expression>
- <smile description>

Give him preschool 3D CG proportions (about 3 heads tall, very large
round head, big expressive eyes, small soft body) while keeping these
features recognizable as this child.

Layout: two figures of the same child side by side. Left: head-and-
shoulders close-up, facing the viewer, smiling. Right: full body,
front view, standing relaxed, feet visible. Plain T-shirt, shorts,
sneakers: no costume.

Plain flat light-grey background. Soft key light from the upper left.
No text, labels, other characters, or props.
```

### Costume front view (Step 1 — references only, no photos)

```text
Using <image1> as the canvas (identity, pose, proportions), render
the boy in a superhero costume matching <image2> (costume reference).

Keep exactly from <image1>: face, hair, skin tone, eye shape, smile,
head size, body proportions. Do not redesign his face.

Costume: <describe the colours and key features of the costume>.
The child holds the matching mask in one hand at his side.

Same 3D CG preschool render style. Plain background, soft key light
from the upper left, no text, no other characters.
```

### Pose generation (transparent, from reference sheet)

```text
This is an RGBA image with transparency. Using <image1> as the
canvas, render the boy in the same 3D animation style as <image3>,
keeping his face and hair exactly as in <image1> and <image2>.

<Describe the specific pose, costume, and any props.>

Balanced, moderate exposure with no bloom or blown-out highlights.
Keep his standing pose, feet visible and flat on the ground. No
text, labels, or extra characters. The image has alpha channel
and the background is transparent.
```

In the original prompts, `<image1>` was the costume front view (canvas/pose), `<image2>` was the face close-up crop from the reference sheet (identity anchor), and `<image3>` was the full reference sheet (style anchor). State each image's role explicitly in your prompt.

### Costume variant (reference editing)

```text
This is an RGBA image with transparency. Change the clothing on the
boy in <image1> to <describe the new costume: colours, key features,
any hood or accessories>.

Keep his face exactly as in <image1> and <image2>, his pose, framing,
body proportions, feet position, and 3D animation style identical to
<image1>. Consistent key light from the upper left, soft shadows.
No text. The image has alpha channel and the background is transparent.
```

## 4. Image validation prompt

Given to a validation agent that inspects every received image.

```text
Validate received artwork against the asset specification. Run each
check against actual files and record pass/fail. Do not approve
based on filenames or specifications alone.

For each image, check:

1. File exists, opens as valid PNG, record dimensions.
2. Transparency: alpha channel present, no opaque background.
   Zero out alpha values 1-8 (faint residual fringe).
3. Pose matches the specification (costume, expression, props).
4. Style consistency with the reference sheet: render style,
   palette, proportions, lighting direction.
5. Hand anatomy at 4x zoom: count fingers (must be exactly five
   per hand, no fused or extra digits).
6. Blown pixels: < 2% of face and hand regions above value 250
   in any channel.
7. Sleeve/costume colour: compare against the reference sheet
   palette. Flag any colour drift (e.g. blue where red is
   expected).
8. Hair fringe: inspect semi-transparent edges composited on the
   page background colour. Flag any coloured halo.
9. Canvas clearance: at least 20 px margin on all sides.
10. No baked text, logos, or extra characters.

For pose pairs (e.g. before/after high five):
11. Face-centre delta between poses: <= 6 px on the fitted master.
12. Eye-line delta: <= 6 px.
13. Feet baseline delta: <= 6 px.
14. Generate a 50% overlay composite to visually confirm
    registration.

Status: all checks pass -> technically-validated.
Any check fails -> needs-revision with the specific failure listed.
Parent approval is a separate human decision.
```

In practice, the face-centre and eye-line thresholds above (6 px) were used for the RSVP pose pair. The Activities section used a 10 px threshold. Adjust the thresholds to what your animation needs: a costume-change wipe tolerates less drift than a discrete pose swap.

## 5. Stage handoff skeleton

Each stage gets a handoff file that a fresh agent reads from scratch.

```text
# Handoff: <stage name>

Today is <date>. You are starting in a fresh session. No previous
chat is available.

## Goal

<One paragraph: what this stage must produce.>

## Read first

<Numbered list of files to read, in order.>

## Boundaries

- Do not modify <list of files/sections that are off limits>.
- Do not install software or change environments.
- Do not commit or push unless explicitly authorized below.

## Steps

<Numbered sequence of what to do.>

## Acceptance criteria

| # | Criterion | Evidence required |
|---|-----------|-------------------|
| 1 | <observable result> | <command + output, or file + measurement> |

## Authority

<What the agent may commit, push, deploy, or spend.>

## When blocked

Write status "blocked" with the question, then stop.

## Lessons from previous stages

<Concrete things that went wrong before and how to avoid them.>

## Output

Write a report to <path> and a result file to <path>.
```

## 6. Review prompt

Used to get an independent review of the finished project.

```text
You are reviewing a static single-page birthday invitation built with
Astro + GSAP + Tailwind CSS. The audience is parents on mobile phones
who receive a link via WhatsApp.

Validate across these dimensions:

1. Architecture: component structure, GSAP integration, TypeScript,
   build pipeline.
2. Responsiveness: mobile-first CSS, touch targets (>= 44px), font
   sizes, overflow handling, WhatsApp/Maps button usability.
3. Project organization: file structure, naming, documentation,
   dependency management.
4. Performance: page weight, number of requests, font loading,
   image optimization, render-blocking resources.
5. Documentation accuracy: cross-reference every claim in the docs
   against the actual codebase.

Dispatch parallel research agents before answering. Be specific:
file paths, line numbers, code patterns. Every KB matters on mobile
data.

Output:
- Validation summary with a score per dimension.
- Numbered issues with severity, affected files, and fix.
- Prioritized improvement plan: quick wins, medium effort, future.
```
