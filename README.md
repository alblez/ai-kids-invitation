# AI Kids Invitation

I wanted to make my kid's birthday invitation feel like his own little story, so I built this one with AI agents. You can do the same for your child — the demo uses Gael turning 4, but the config file takes any name and any age ("turning 3", "turning 7", or drop the number entirely in the copy). The guide walks through the prompts and steps.

**Live demo:** [ai-kids-invitation.vercel.app](https://ai-kids-invitation.vercel.app)

## What the page does

The invitation is a single scrollable page with four sections:

- **Hero** — The child swings into the scene in a superhero suit, lands, and reveals their face. An idle loop breathes life into the comic-cover composition. Visitors can tap "Again!" to replay the entrance.
- **Details** — The child points from a rooftop toward the party headquarters. A hand-drawn route traces across the city to a star marker on the door. Below: date, time, venue, and buttons for Google Maps and Waze.
- **Activities** — A superpower experiment: scroll or tap three colour buttons to change the costume, each revealing a party activity with a playful reaction effect.
- **RSVP** — A high five. Tap for a comic-book contact burst (eight different scenes with speech-bubble captions), then confirm attendance via a WhatsApp deep link.

Everything runs as a static site: no backend, no data collection, no accounts.

## First run with an agent

If you have a coding agent (omp, Claude Code, Codex, or similar), three steps:

1. **Fork and clone.** Fork this repo on GitHub, clone your fork, and run `pnpm install`.
2. **Run `pnpm preflight`.** The agent reads the output to know what is ready and what is missing.
3. **Let the agent ask you the questions.** It reads `AGENTS.md`, asks for your child's name, age, party details, and writes `src/invitation.config.ts`. Then it builds, regenerates the OG image, and shows you the result.

The agent handles the rest. See `AGENTS.md` for the full first-run instructions it follows.

## First run without an agent

1. Fork and clone:

```sh
git clone https://github.com/<your-username>/ai-kids-invitation.git
cd ai-kids-invitation
pnpm install
```

2. Run preflight and check for missing tools:

```sh
pnpm preflight
```

3. Edit `src/invitation.config.ts` with your child's name, age, party details, WhatsApp number, and site URL. Every component reads from this file.

4. Regenerate the OG image, build, and deploy:

```sh
pnpm og
pnpm build
```

5. For images, see the [guide](guide/).

Prerequisites: Node >= 22.12 (see `package.json`). The OG image generator (`pnpm og`) uses macOS `sips`, so it only runs on a Mac.

## The guide

The [guide](guide/) covers the full process:

- How the images were made locally with AI (your child's photos stay on your computer)
- How every image was validated (dimensions, transparency, face alignment, hand anatomy)
- Copy-ready prompts you can reuse
- Three options for creating the cartoon character (hosted tool, local model, hosted API)
- Privacy checklist before you publish

## The process behind this

The agentic process repository behind this project, **agentic-roadmaps**, will be published soon.

## Development

```sh
pnpm dev        # dev server at localhost:4321
pnpm build      # type-check + production build
pnpm preview    # preview the built site
pnpm preflight  # check tools and config
pnpm og         # regenerate the WhatsApp preview image
```
