# The process

This invitation was built over about four days by one parent supervising a team of AI agents. It was not one-click: there were many agent runs, several rounds of image generation, manual reviews, and real-phone checks. This section explains what happened so you know what to expect.

## The short version

1. **Ideate.** One strong AI model researches what is possible and proposes two or three creative directions. The parent picks one.
2. **Write a roadmap per section.** Each section (Hero, Details, Activities, RSVP) gets its own plan: the scene, the assets needed, the animation choreography, and the prompts for generating images.
3. **Generate images.** A local image model creates cartoon illustrations of the child in costume, using reference photos that never leave the computer. Each image takes 15-20 minutes on an Apple Silicon Mac.
4. **Validate.** A different AI agent re-measures every image (dimensions, transparency, face alignment, hand anatomy, colour accuracy). The agent that generated the images never validates its own work.
5. **Build.** An AI agent implements the section's animation and layout in code, following the roadmap and choreography spec.
6. **Verify.** The agent tests the built page at mobile and desktop sizes, checks reduced motion, no-JavaScript fallback, image failure, rapid interaction, and link integrity.
7. **Parent approves.** The parent reviews the result on real phones. Approval is recorded separately from publication: deploying a candidate does not mean the artwork is accepted.

## Roles

| Role | Who | What they own |
|---|---|---|
| Parent | You | Goals, decisions, permissions (what gets published, spent, or deleted), final acceptance |
| Orchestrator | One long session on an advanced AI model | Design, writing handoffs for each stage, launching and monitoring agents, re-verifying everything, reporting to the parent |
| Executor | A fresh agent session per stage | One closed task with clear acceptance criteria |
| Validator | A fresh session on a different model family | Re-running the checks independently; nobody validates their own work |

The orchestrator may make small changes itself. The key rule is: one integration owner, and the agent that did the work never signs off on it.

## Choosing models

Match the model to the risk level of the work. These are criteria, not brand recommendations — substitute whatever is available to you.

| Work | What to use | Why |
|---|---|---|
| Orchestration (design, handoffs, monitoring) | An advanced model, medium effort | Judgment across the whole project; high effort was slower without visible gain for this role |
| Complex animation code, final verification | An advanced model, high effort | Hardest reasoning; owns the publish step |
| Copy writing, short one-shots | A fast model | Quick turnaround: a batch of captions in seconds |
| Long mechanical work (image batches, extraction) | The cheapest capable model | Procedural work against a spec, not designing |
| Validation | An advanced model of a **different family** from the executor | Independence matters more than cost; a weak validator misses real problems |
| Image generation | An open local model, or a hosted image tool | The child's photos are the sensitive input; see the [images guide](4-images-with-qwen.md) |

Older or cheaper models read instructions well but judged sources poorly in this project. Pair them with an advanced reviewer for any decision-changing work.

**Examples as of 2026-09:** advanced models include Claude Opus 5.5 and GPT 6 Astra. Cheap/fast models include DeepSeek V4.1 Flash, GLM 5.3 Flash, and MiMo V2.6 Flash. Weigh cost against capability and use the subscriptions you already have.

## What the original project used

This is a record of the specific models and costs from the original build. It is not a recommendation.

| Work | Model used |
|---|---|
| Orchestration (design, handoffs, monitoring) | Claude Opus 5.5, medium effort |
| Complex animation code, final verification | Claude Opus 5.5, high effort |
| Copy writing, short one-shots | GPT 6 Sol |
| Image generation | Qwen-Image-2.1, locally on an M1 Max |



|---|---|

Per section (plan + generate + build):

|---|---|---|---|

Image generation dominated the clock. Each full-quality image took 15-20 minutes on an M1 Max, so a batch of four images ran for over an hour unattended.

## How long it took

The original project ran from a Tuesday to a Friday (about four calendar days). Most of that time the agents worked unattended: the parent checked in to approve artwork and review results.

## Pitfalls you will hit

These are the real problems that came up during the build, in parent language.

**The first image tool could not do it.** The project initially tried a hosted image generation tool, but it could not do reference editing (keeping a child's likeness from a photo). A research stage found and tested a different tool before committing to a full batch. Lesson: test the exact operation with a quick smoke test before running a long unattended batch.

**Grey, embossed images.** On Apple Silicon, a bug in the image model's internal processing corrupted reference images, producing flat grey outputs. A runtime patch fixed it. This is documented in the installation section of the [images guide](4-images-with-qwen.md).

**An agent got stuck in a loop.** One agent kept polling a background job 223 times, wasting a lot of usage. Lesson: tell agents to stop polling after two skipped attempts and use a different strategy.

**A signed-out agent looked like a finished agent.** When an agent's login expired, it sat idle, which the automation interpreted as "finished." Lesson: check that every agent is signed in before starting a batch, and make sure a sign-in failure stops the chain instead of passing the stage.

**WhatsApp cached the old preview image.** After changing the OG image, WhatsApp kept showing the old one because it caches by URL. Fix: bump the URL with a version parameter (`og.jpg?v=2`).

**The character's sleeve was the wrong colour.** A blue sleeve appeared on what should have been a red suit. The validation agent caught it by comparing colours against the reference sheet. Without that check, it would have shipped.

**A hand had an extra finger.** AI-generated hands are unreliable. The validation agent counted fingers at 4x zoom and flagged a probable sixth finger that the generating agent had missed.

**The agent placed the burst effect on the character's hair instead of the hand.** The generating agent reported the palm position, but the next agent re-measured it independently and found the coordinate was wrong. Lesson: never trust a previous agent's measurements.

## The chain that kept work moving

The orchestrator launched each stage as a fresh agent session. Between the orchestrator's own context resets (which happened four times as the conversation grew too long), a small script kept the work queue running. The script was simple and had known bugs (it could not reliably tell if an agent had crashed versus finished), but it worked because the orchestrator checked every result itself.
