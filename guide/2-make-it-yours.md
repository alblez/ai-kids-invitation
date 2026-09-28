# Make it yours

This is the first-run page. It walks you through turning the demo invitation into your own child's party, from tools to deployment.

## Requirements

You need:

- **Node** >= 22.12 (see `package.json` `engines`)
- **pnpm** (the repo's package manager)
- **git** and a **GitHub account** (`gh` CLI recommended)
- **A Vercel account** for deployment (Vercel CLI or the Git integration both work)
- **macOS** for the OG image generator (`pnpm og` uses `sips`)

Optional, for generating your own cartoon images:

- **ImageMagick** (`magick`) for contact sheets and overlays
- **swift** (macOS) for face landmark checks
- A cartoon-image tool (see "Creating the cartoon master" below)

### Preflight

Run the check script to see what is ready:

```sh
pnpm preflight
```

It reports required tools, warns about demo config values, and counts photos.

## The config file

All variable data lives in one file: `src/invitation.config.ts`. Every component, the OG image script, and the Astro/Tailwind config read from it. Edit this file and the rest follows.

| Field | What it controls | Demo value |
|---|---|---|
| `child.name` | Titles, copy, alt text, OG image | (see config file) |
| `child.age` | Age badge, star count, OG image | `4` |
| `child.pronouns` | Copy and alt text (subject/object/possessive) | `he / him / his` |
| `party.date` | Details card | `"Saturday, June 13, 2026"` |
| `party.time` | Details card | `"3:00 p.m. to 6:00 p.m."` |
| `party.ogDateTime` | OG image | `"Saturday, June 13 · 3:00 p.m."` |
| `party.venue` | Details card, OG image | `"The Beverly Hills Hotel"` |
| `party.address` | Details card, map links | `"9641 Sunset Boulevard, Beverly Hills, CA 90210"` |
| `party.addressNote` | Small note under the address (optional) | `"Demo address — use your own party location"` |
| `party.links.googleMaps` | Override the auto-derived Google Maps URL (optional) | (auto-derived) |
| `party.links.waze` | Override the auto-derived Waze URL (optional) | (auto-derived) |
| `rsvp.whatsappNumber` | WhatsApp deep link (country code, no leading +) | `"15555550123"` |
| `rsvp.whatsappMessage` | Pre-filled WhatsApp message | `"Hi! We'll be at [name]'s party. See you there!"` |
| `site.url` | Canonical URL, OG image URL | `"https://ai-kids-invitation.vercel.app"` |
| `site.title` | Page title and og:title | `"[name] is turning [age]!"` |
| `site.description` | Meta description and og:description | `"You're invited to [name]'s birthday party."` |
| `theme.colors.*` | Ten colour tokens used by Tailwind utilities | See config file |
| `theme.fonts.display` | Heading font (loaded from Google Fonts) | `Bangers, 400` |
| `theme.fonts.body` | Body font | `Nunito, 400/600/700` |

The age works for any number. If the party is not an age milestone, set `child.age` to the child's current age (it drives the star count in the Hero section) or edit the Hero component to hide the age badge.

## Photos folder

Put your child's reference photos in `photos/`. This folder is gitignored — photos never leave your machine through version control. Only the image tool you choose sees them.

## Creating the cartoon master

The invitation uses cartoon illustrations of your child. You have three options, with different privacy and speed trade-offs:

### Option 1: A hosted AI image tool

Use a hosted image generation service (such as ChatGPT's image generation or a similar tool) to create the cartoon character from your child's photos.

- **Trade-off:** Your photos are uploaded to that provider's servers.
- **Speed:** Fast (seconds per image).
- **Note:** Some hosted tools refuse or block requests involving photos of children in costumes. Test with a single image before committing to a batch.

### Option 2: Qwen-Image locally

Run the open Qwen-Image-2.1 model on your own machine. Your child's photos never leave the computer.

- **Trade-off:** Slow (15-20 minutes per image on an Apple Silicon Mac) and needs ~32 GB disk for model weights.
- **Requirements:** Apple Silicon Mac with 64 GB RAM, Python 3.12.
- **Details:** See [Images with Qwen](4-images-with-qwen.md) for installation, the wrapper script, and known issues.

### Option 3: Qwen's hosted API (Alibaba Cloud Model Studio)

Alibaba Cloud's Model Studio offers hosted image editing models (`qwen-image-2.0-pro` and others) that accept reference images. You send photos via API and receive edited images back. As of 2026-09, there is no hosted `qwen-image-2.1` model; the editing API uses the `qwen-image-2.0` series, `qwen-image-edit-max`, and `qwen-image-edit-plus`.

- **Trade-off:** Photos are uploaded to Alibaba Cloud servers. Requires a Model Studio account and API key.
- **Speed:** Faster than local generation, slower than Option 1.
- **API docs:** [Qwen-Image Edit API](https://www.alibabacloud.com/help/en/model-studio/qwen-image-edit-api) (accessed 2026-09-28).
- **Note:** The hosted API supports up to 3 reference images per request and returns PNG output. The exact model capabilities (character likeness preservation, costume editing) may differ from the local Qwen-Image-2.1 weights.

Whichever option you choose, the workflow is the same: generate a reference sheet first, then derive each pose from it. See the [Prompts](3-prompts.md) page for the exact prompts.

## Images per section

Each section needs specific images at specific sizes. The guide pages cover the details:

- [Prompts](3-prompts.md) — the prompts for generating each image
- [Images with Qwen](4-images-with-qwen.md) — the local generation workflow
- [Image validation](5-image-validation.md) — how to check every image before it ships

The image directories and sizes:

| Directory | Images | Sizes |
|---|---|---|
| `src/assets/hero/` | Swing pose, revealed portrait, web strand, sky plate | Swing/revealed: 600x600, 900x900, 1200x1200. Sky: 900x675, 1536x1152. Web: 400x800. |
| `src/assets/details/` | City plate, character on rooftop | 1184x896 (city), 500x625 (character) |
| `src/assets/activities/` | Four costume poses | 560x672 each |
| `src/assets/rsvp/` | Reaching pose, high-five pose | 560x672 each |

When replacing images:

1. **Keep the same dimensions.** Animation coordinates are measured in the images' pixel space. Changing dimensions means re-measuring coordinates in the component code.
2. **Keep transparency.** All character images are transparent WebPs composited over the dark background (`#0f172a`).
3. **Use WebP.** Export at quality 85, preserving the alpha channel.
4. **Master PNGs go in `src/assets/source/`.** These are tracked in git but never shipped to visitors.

If you change the Activities poses, they must stay aligned: same canvas size, same face position, same foot baseline. The costume-change wipe depends on pixel-level registration. See [image validation](5-image-validation.md) for how alignment was checked.

If you change the RSVP poses, the burst effect origin is measured from the R01 pose's palm position (33.8% / 40.2% of the canvas). Update the CSS custom properties in the component if your character's hand is in a different spot.

If you change the Details images, the SVG route coordinates (fingertip at 588,477 and door marker at 768,594 in plate units) need to match your new artwork. These are hard-coded in the inline SVG inside `Details.astro`.

## Regenerate the OG image

The WhatsApp preview image (`public/og.jpg`) is generated from the config:

```sh
pnpm og
```

This produces a 1200x630 JPEG using Satori and resvg. It reads the child's name, age, date, time, and venue from `src/invitation.config.ts`. The script runs on macOS (it uses `sips` for the final JPEG conversion).

### WhatsApp OG caching

WhatsApp caches the preview image by URL. After changing `og.jpg`, visitors who already received the link will still see the old image. To force a refresh, bump the version parameter in `src/layouts/Layout.astro`:

```ts
const ogImage = new URL('/og.jpg?v=3', Astro.site);  // was ?v=2
```

## Deploy

1. Create a GitHub repository and push your fork.
2. Import it in Vercel. It auto-detects Astro and configures the build.
3. Your site will be live at `your-project.vercel.app`.

No adapter or server configuration is needed: this is a fully static site.

## Test on a real phone

After deploying, test on an actual phone:

1. Open the link from WhatsApp. Check that the preview image, title, and description appear.
2. Tap the WhatsApp RSVP button. Verify it opens a chat with the correct number and pre-filled message.
3. Tap Google Maps and Waze. Verify they open to the correct address.
4. Scroll the whole page. Check that animations play, the experiment works, and the high five responds to taps.
5. Check with the phone's "reduce motion" setting on. The page should show static compositions with no animation.

Browser emulation does not replace this. Link previews, deep links, and touch interactions behave differently on real devices.

## Privacy checklist

Before making the repository public or sharing the link:

**Intentionally public.** The RSVP phone number and the party address are visible to every guest who opens the page — that is by design. Only put contact details into the source that you are comfortable with every recipient seeing.

**Must never be committed:**

- [ ] **No real photos.** The `src/assets/source/` directory should contain only cartoon illustrations, never photographs of your child. Reference photos used for image generation should stay in `photos/` (gitignored) or outside the repository entirely.
- [ ] **No private paths.** Search for your home directory path (`grep -ri '/Users/' .`) to make sure no private file paths appear in any committed file.
- [ ] **No secrets.** No API keys, tokens, passwords or `.env` files.
- [ ] **No home address unless it is the venue.** If the party is somewhere else, your home address must not appear anywhere in the repository or the page.
- [ ] **No other people's data.** Do not include other children's names, parents' contact details, or any information belonging to someone else.

**Verify before sharing:**

- [ ] **Grep for your phone number.** Run: `grep -r 'your-phone-digits' .` — make sure your real number does not appear anywhere except the RSVP config field where you intentionally placed it.
- [ ] **Grep for your address.** Run: `grep -ri 'your street name' .` — check that your address does not appear anywhere except the Details config field where you intentionally placed it.
- [ ] **Check the rendered page.** Open the live site and read every line of text. Metadata is easy to miss.
- [ ] **Check the OG image.** Share the link in a private WhatsApp chat with yourself. Read the preview text and look at the image.
- [ ] **Check git history.** If you committed real details and then changed them, the old values are still in the history. Consider squashing or starting fresh with `git checkout --orphan`.
