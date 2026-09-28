# AI Kids Invitation

I wanted to make my kid's birthday invitation feel like his own little story, so I built this one with AI agents. You can do the same for your child. The guide walks through the prompts and steps.

**Live demo:** [ai-kids-invitation.vercel.app](https://ai-kids-invitation.vercel.app)

## What the page does

The invitation is a single scrollable page with four sections:

- **Hero** — Gael swings into the scene in his superhero suit, lands, and reveals his face. An idle loop breathes life into the comic-cover composition. Visitors can tap "Again!" to replay the entrance.
- **Details** — Gael points from a rooftop toward his party headquarters. A hand-drawn route traces across the city to a star marker on the door. Below: the date, time, venue, and buttons for Google Maps and Waze.
- **Activities** — A superpower experiment: scroll or tap three colour buttons to change Gael's costume, each revealing a party activity with a playful reaction effect.
- **RSVP** — Gael offers a high five. Tap for a comic-book contact burst (eight different scenes with speech-bubble captions), then confirm attendance via a WhatsApp deep link.

Everything runs as a static site: no backend, no data collection, no accounts.

## Make it yours in an afternoon

```sh
git clone https://github.com/<your-username>/ai-kids-invitation.git
cd ai-kids-invitation
npm install
```

Edit the files that hold your party's details:

| What to change | File |
|---|---|
| Child's name, age, page text | `src/components/Hero.astro`, `Details.astro`, `Activities.astro`, `Rsvp.astro` |
| Date, time, venue, map links | `src/components/Details.astro` (`partyDetails` object) |
| WhatsApp number and message | `src/components/Rsvp.astro` (`whatsappNumber`, `whatsappMessage`) |
| Site URL and OG metadata | `astro.config.mjs` (`site`), `src/layouts/Layout.astro` (`title`, `description`) |
| Character images | `src/assets/hero/`, `details/`, `activities/`, `rsvp/` |

Regenerate the WhatsApp preview image and deploy:

```sh
node scripts/generate-og.mjs
npm run build
# Deploy to Vercel: connect the repo and it auto-detects Astro
```

See the [guide](guide/) for the full process: how the images were made locally with AI, how they were validated, and the prompts you can reuse.

## The process behind this

The agentic process repository that describes how AI agents were coordinated to build this invitation will be published soon. It covers ideation, roadmaps, chained agent runs, image generation, validation, and the lessons learned.

## Development

```sh
npm run dev      # dev server at localhost:4321
npm run build    # type-check + production build
npm run preview  # preview the built site
```
