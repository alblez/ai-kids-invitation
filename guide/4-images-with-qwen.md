# Images with Qwen

## Why generate images locally

The child's reference photos never leave your computer. This matters for two reasons:

1. **Privacy.** You do not upload photos of your child to a cloud service. The local model runs entirely on your machine.
2. **Capability.** In this project, hosted image tools (such as ChatGPT's image generation) refused or blocked requests involving photos of a child in a superhero costume. The local model had no such restrictions and produced friendly cartoon likenesses.

The model used is **[Qwen-Image-2.1](https://huggingface.co/Qwen/Qwen-Image-2.1)**, an open image generation and editing model that supports reference editing: you give it a photo of your child, and it generates a cartoon version that preserves the likeness. It runs on Apple Silicon Macs using the Diffusers library with MPS (Metal Performance Shaders) acceleration.

## Installation

This repository includes a wrapper script at `tools/qwen-image-2.1` that handles the setup and works around known Apple Silicon bugs. The wrapper runs Qwen-Image-2.1 through the Diffusers library in a dedicated Python virtual environment.

### What the wrapper does

- Loads `QwenImage21Pipeline` from the Diffusers library (the pipeline was added to Diffusers after version 0.40.0, so it must be installed from the development branch).
- Uses bfloat16 precision with `enable_model_cpu_offload(device="mps")` to fit in memory.
- **Patches an MPS bug** that corrupts reference image encoding. On Apple Silicon, `F.pad` on a 5-dimensional tensor returns zeros when the spatial dimensions are large enough. The wrapper replaces the affected padding operation with a `torch.cat` equivalent. Without this patch, reference-edited images come out grey and embossed.
- Runs one image per process, because a second edit in the same process can return all-NaN values on MPS (a separate known bug).
- Prints the seed, step-by-step timing, peak memory usage, and output path.

### Prerequisites

- An Apple Silicon Mac. This project used a 64 GB M1 Max.
- Python 3.12.
- About 32 GB of disk space for the model weights (downloaded once from Hugging Face).

### Steps

Follow the [official model instructions](https://huggingface.co/Qwen/Qwen-Image-2.1) for installing Qwen-Image-2.1 with Diffusers. The key packages are:

- `torch` (the model instructions require `>=2.4`; this project used 2.14.0)
- `transformers` (5.17 or later)
- `diffusers` (installed from the GitHub main branch, not a release)
- `accelerate`
- `torchvision` (required by the Qwen3-VL processor; may not be listed in the official instructions)

Create a dedicated virtual environment to avoid conflicts with other tools:

```sh
uv venv --python 3.12 ~/.local/share/qwen21-diffusers
uv pip install --python ~/.local/share/qwen21-diffusers/bin/python \
  torch transformers accelerate pillow numpy torchvision \
  "diffusers @ https://github.com/huggingface/diffusers/archive/main.tar.gz"
```

The wrapper reads the Python at `$HOME/.local/share/qwen21-diffusers/bin/python` by default. You can override this with the `PY` environment variable: `PY=/path/to/python ./tools/qwen-image-2.1 …`.

The first run downloads the model weights (~31 GB) to the Hugging Face cache. Subsequent runs reuse the cache.

## Using the wrapper

Run the wrapper from the repository root, or copy it onto your `PATH`:

```sh
# Text-to-image
./tools/qwen-image-2.1 --prompt "A cat astronaut" --output cat.png

# Reference editing (identity from reference photo)
./tools/qwen-image-2.1 --prompt "Put <image1> in a superhero costume" \
  --output hero.png --ref photo.png
```

Full options:

```sh
./tools/qwen-image-2.1 \
  --prompt "..." \
  --output out.png \
  --width 1024 --height 1216 \
  --steps 40 \
  --seed 42 \
  --ref reference1.png \
  --ref reference2.png \
  --res 768
```

### Options explained

| Option | Default | Notes |
|---|---|---|
| `--prompt` | (required) | For text-to-image: describe the image. For edits: an instruction like "Change the clothing to..." |
| `--output` | (required) | Output PNG path |
| `--width`, `--height` | 1024 | Output size, must be multiples of 32 |
| `--steps` | 40 | More steps = better quality but slower |
| `--seed` | random | Use a fixed seed for reproducibility. Each image should have its own seed |
| `--ref` | none | Reference image(s). Use `<image1>`, `<image2>` etc. in the prompt to refer to them. With one reference, say "the image" instead |
| `--res` | 768 | Resolution for encoding reference images. 768 is a safe value that avoids MPS corruption |

### Timing

On an M1 Max with 64 GB:

- **1024x1536 with references, 40 steps:** ~21 minutes, ~30 s/step (from the wrapper help).
- **1024x1216 with references, 40 steps:** ~18 minutes. The four Activities poses averaged 23–25 s/step; the two RSVP poses took 1087 s and 1045 s.
- **1024x1536 with references, 12 steps (smoke test):** 443 s total, first step 107 s (includes reference encoding prefill), then ~30 s/step.

The agent can run image generation unattended. Each image is a separate process, so you can queue a batch and walk away.

## The workflow

### Step 1: Character reference sheet

Generate a reference sheet that establishes the child's cartoon likeness. This is the only step that uses real photos.

1. Prepare two or three clear photos of your child: a front-facing portrait, a full body shot, and a smiling close-up.
2. Run the wrapper with the photos as references and a detailed prompt describing the likeness to preserve (hair, face shape, eyes, smile).
3. The output is a two-figure sheet: a close-up and a full body view, both in the cartoon style, no costume.
4. Review the output. Does it look like your child? Show it to another parent for a second opinion.
5. If the likeness is off, adjust the prompt (describe the specific features that drifted) and try again with a different seed.

This sheet becomes the **identity anchor** for every later image. All costume poses reference it.

### Step 2: Costume front view

Generate a front view of the child in costume, using the approved reference sheet for identity and a costume reference image for the outfit.

- The prompt points at the reference images for identity and describes only the costume change.
- Use the same seed strategy: one unique seed per image.
- The output should match the reference sheet's face, hair, and proportions exactly.

### Step 3: Poses from the reference

Generate each pose needed by the invitation sections. In this project:

- **Hero:** swing pose (masked), revealed pose (face visible), web strand
- **Activities:** four costume variants (scientist + three superhero costumes)
- **RSVP:** reaching pose (open hand), high-five reaction pose
- **Details:** pointing pose on a rooftop

Each pose is generated by editing the costume front view or a base pose. The prompt changes only what needs to change (pose, costume, props) and explicitly preserves everything else.

### Step 4: Fit and export

Raw outputs are larger than what the web page needs. A fitting script:

1. Detects the face using Apple Vision landmarks (on macOS) for accurate positioning. This was used in the RSVP and Details workflows; the Activities poses were fitted by head size and feet baseline, and their face registration deviations (up to 43 px) were measured and accepted by the parent.
2. Scales the image to the target canvas size without upscaling.
3. Aligns multiple poses to the same face position and foot baseline.
4. Zeros out faint alpha residuals (values 1-8) that cause halo artifacts on dark backgrounds.
5. Exports WebP derivatives at the web display size (e.g. 560x672 for character poses, quality 85).

### Step 5: Review

Generate contact sheets (side-by-side composites on the page background colour) and 50% overlay images to verify alignment. Inspect at 4x zoom for hand anatomy and edge quality.

## Known Apple Silicon issues

| Bug | Symptom | Workaround | Upstream |
|---|---|---|---|
| MPS `F.pad` corruption | Reference-edited images come out grey and flat | The wrapper patches the padding function at runtime | [Qwen-Image-2.1 #6](https://github.com/QwenLM/Qwen-Image-2.1/issues/6) |
| NaN on second edit | A second image in the same process returns noise | Run one process per image (the wrapper does this) | [diffusers #14859](https://github.com/huggingface/diffusers/issues/14859) |
| Grey/embossed edits | Editing an image the model itself generated, at `--res 1024`, comes out grey and embossed regardless of seed (photos as references were fine). The project's research suspected the same cause as the `F.pad` bug, but that was not confirmed | Use `--res 768` instead of the default 1024 | [diffusers #14858](https://github.com/huggingface/diffusers/issues/14858) |
| Noise replay | Editing an image with the same seed and size that generated it returns a haloed near-copy | Use a different seed for each image | [diffusers #14824](https://github.com/huggingface/diffusers/issues/14824) |

These are known issues in the Diffusers and PyTorch MPS backends. They may be fixed in future releases; check the linked issues before applying workarounds.
