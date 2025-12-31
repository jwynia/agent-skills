---
name: godot-asset-generator
description: "Generate game assets using AI image generation APIs (DALL-E, Replicate, fal.ai) and prepare them for Godot. Covers the full art pipeline from concept art and style guides to final sprites, sprite sheets, and import configuration. This skill should be used when creating game art, generating sprites, making tilesets, creating UI elements, or preparing assets for Godot import. Keywords: game assets, AI art, DALL-E, Replicate, fal.ai, sprite sheet, tileset, Godot, pixel art, character sprite, game art, texture, animation frames."
license: MIT
compatibility: Requires Deno runtime. API keys for chosen provider (OPENAI_API_KEY, REPLICATE_API_TOKEN, or FAL_KEY).
metadata:
  author: agent-skills
  version: "1.0"
  godot_version: "4.x"
---

# Godot Asset Generator

Generate game assets using AI image generation APIs and prepare them for use in Godot 4.x. This skill covers the complete art pipeline from concept to Godot-ready sprites.

## When to Use This Skill

Use this skill when:
- Generating game sprites, characters, or objects using AI
- Creating tilesets for platformers or top-down games
- Generating UI elements, icons, or menu assets
- Batch-generating animation frames
- Preparing AI-generated assets for Godot import
- Creating consistent asset sets with style guides

Do NOT use this skill when:
- Creating 3D models or textures (2D assets only)
- Manual pixel art or illustration (use art software)
- Complex frame-by-frame animation (use animation tools)
- Working with existing assets (use Godot directly)

## Prerequisites

**Required:**
- Deno runtime installed
- At least one API key:
  - `OPENAI_API_KEY` for DALL-E 3
  - `REPLICATE_API_TOKEN` for Replicate (SDXL, Flux)
  - `FAL_KEY` for fal.ai

**Optional:**
- ImageMagick for advanced image processing
- Godot 4.x project for import file generation

## Quick Start

### Generate a Single Image

```bash
deno run --allow-env --allow-net --allow-write scripts/generate-image.ts \
  --provider dalle \
  --prompt "pixel art knight character, front view, 16-bit style, transparent background" \
  --output ./assets/knight.png
```

### Batch Generate Animation Frames

```bash
deno run --allow-env --allow-net --allow-read --allow-write scripts/batch-generate.ts \
  --spec ./batch-spec.json \
  --output ./generated/
```

### Create Sprite Sheet

```bash
deno run --allow-read --allow-write scripts/pack-spritesheet.ts \
  --input ./generated/*.png \
  --output ./sprites/player-sheet.png \
  --columns 4
```

## Core Workflow

### Phase 1: Style Definition

Define your art style before generating assets:

1. **Choose Art Style**: Pixel art, hand-drawn, painterly, or vector
2. **Create Style Guide**: Document colors, modifiers, and constraints
3. **Test Prompts**: Generate samples to validate style consistency

```json
{
  "style": "pixel-art",
  "resolution": 64,
  "palette": "limited-16-colors",
  "modifiers": "16-bit, no anti-aliasing, clean pixels"
}
```

### Phase 2: Asset Generation

Generate assets using the appropriate provider:

1. **Single Assets**: Use `generate-image.ts` for individual images
2. **Batch Assets**: Use `batch-generate.ts` for multiple related assets
3. **Iterate**: Refine prompts based on results

### Phase 3: Post-Processing

Prepare raw AI output for game use:

1. **Background Removal**: Extract sprites from backgrounds
2. **Color Correction**: Normalize palette if needed
3. **Resize**: Scale to exact game resolution
4. **Trim/Pad**: Remove whitespace, add sprite padding

```bash
deno run --allow-read --allow-write scripts/process-sprite.ts \
  --input ./raw/knight.png \
  --output ./processed/knight.png \
  --remove-bg \
  --resize 64x64 \
  --filter nearest
```

### Phase 4: Godot Integration

Prepare assets for Godot import:

1. **Pack Sprite Sheets**: Combine frames into optimized sheets
2. **Generate Import Files**: Create `.import` with optimal settings
3. **Configure Animations**: Set up SpriteFrames resources

## API Provider Selection

| Provider | Best For | Quality | Cost | Speed |
|----------|----------|---------|------|-------|
| DALL-E 3 | Consistency, high detail | Excellent | $$$ | Medium |
| Replicate | Style control, variations | Very Good | $$ | Medium |
| fal.ai | Fast iteration, testing | Good | $ | Fast |

### DALL-E 3 (OpenAI)

Best for high-quality, consistent results. Excellent prompt following.

```bash
--provider dalle --model dall-e-3
```

- Sizes: 1024x1024, 1792x1024, 1024x1792
- Quality: standard, hd
- Style: vivid, natural

### Replicate (SDXL/Flux)

Best for style control and cheaper batch generation.

```bash
--provider replicate --model stability-ai/sdxl
```

- More model options (SDXL, Flux, specialized)
- Negative prompts supported
- ControlNet and img2img available

### fal.ai

Best for rapid iteration and testing prompts.

```bash
--provider fal --model fal-ai/flux/schnell
```

- Fastest inference
- Good for prototyping
- Lower cost per image

## Prompting by Art Style

### Pixel Art

```
"pixel art [subject], 16-bit style, clean pixels, no anti-aliasing,
limited color palette, retro game sprite, transparent background"
```

**Key modifiers**: `16-bit`, `8-bit`, `pixel art`, `retro`, `clean pixels`, `no anti-aliasing`

**Avoid**: `realistic`, `detailed`, `smooth`, `gradient`

### Hand-Drawn / Illustrated

```
"hand-drawn illustration of [subject], ink lines, watercolor texture,
sketch style, game art, white background"
```

**Key modifiers**: `hand-drawn`, `illustration`, `ink lines`, `sketch`, `watercolor`

### Painterly / Concept Art

```
"digital painting of [subject], concept art style, painterly brush strokes,
dramatic lighting, game asset"
```

**Key modifiers**: `digital painting`, `concept art`, `painterly`, `brush strokes`

### Vector / Flat Design

```
"flat design [subject], vector art style, clean edges, solid colors,
minimal shading, game icon, transparent background"
```

**Key modifiers**: `flat design`, `vector`, `clean edges`, `solid colors`, `minimal`

## Script Reference

### generate-image.ts

Generate a single image from any supported provider.

```bash
deno run --allow-env --allow-net --allow-write scripts/generate-image.ts [options]

Options:
  --provider <name>   Provider: dalle, replicate, fal (required)
  --prompt <text>     Generation prompt (required)
  --output <path>     Output file path (required)
  --model <name>      Specific model (optional, provider-dependent)
  --size <WxH>        Image size, e.g., 1024x1024 (default: 1024x1024)
  --style <name>      Style preset: pixel-art, hand-drawn, painterly, vector
  --negative <text>   Negative prompt (Replicate/fal only)
  --quality <level>   Quality: standard, hd (DALL-E only)
  --json              Output metadata as JSON
  -h, --help          Show help
```

### batch-generate.ts

Generate multiple images from a specification file.

```bash
deno run --allow-env --allow-net --allow-read --allow-write scripts/batch-generate.ts [options]

Options:
  --spec <path>       Path to batch specification JSON (required)
  --output <dir>      Output directory (required)
  --concurrency <n>   Parallel requests (default: 2)
  --delay <ms>        Delay between requests (default: 1000)
  --resume            Resume from last successful
  --json              Output results as JSON
  -h, --help          Show help
```

**Batch Spec Format:**
```json
{
  "provider": "replicate",
  "model": "stability-ai/sdxl",
  "style": "pixel-art",
  "basePrompt": "16-bit pixel art, game sprite, transparent background",
  "assets": [
    { "name": "player-idle", "prompt": "knight standing idle, front view" },
    { "name": "player-walk-1", "prompt": "knight walking, frame 1 of 4" },
    { "name": "player-walk-2", "prompt": "knight walking, frame 2 of 4" }
  ]
}
```

### process-sprite.ts

Post-process generated images for game use.

```bash
deno run --allow-read --allow-write scripts/process-sprite.ts [options]

Options:
  --input <path>      Input image path (required)
  --output <path>     Output image path (required)
  --remove-bg         Remove background (make transparent)
  --resize <WxH>      Resize to dimensions
  --filter <type>     Resize filter: nearest, linear (default: nearest)
  --trim              Trim transparent whitespace
  --padding <n>       Add padding pixels
  --color-key <hex>   Color to make transparent (e.g., ff00ff)
  -h, --help          Show help
```

### pack-spritesheet.ts

Pack multiple sprites into a sprite sheet.

```bash
deno run --allow-read --allow-write scripts/pack-spritesheet.ts [options]

Options:
  --input <pattern>   Input files (glob pattern, required)
  --output <path>     Output sprite sheet path (required)
  --columns <n>       Number of columns (default: auto)
  --padding <n>       Padding between sprites (default: 0)
  --power-of-two      Force power-of-two dimensions
  --metadata <path>   Output JSON metadata path
  -h, --help          Show help
```

**Output Metadata:**
```json
{
  "image": "player-sheet.png",
  "size": { "width": 256, "height": 128 },
  "frames": [
    { "name": "idle", "x": 0, "y": 0, "width": 64, "height": 64 },
    { "name": "walk-1", "x": 64, "y": 0, "width": 64, "height": 64 }
  ]
}
```

### generate-import-files.ts

Generate Godot .import files with optimal settings.

```bash
deno run --allow-read --allow-write scripts/generate-import-files.ts [options]

Options:
  --input <path>      Input image or directory (required)
  --preset <name>     Preset: pixel-art, hd-sprite, ui (default: pixel-art)
  --frames <n>        Animation frame count (for sprite sheets)
  --columns <n>       Sprite sheet columns
  --fps <n>           Animation FPS (default: 12)
  -h, --help          Show help
```

## Godot Import Settings

### Pixel Art Sprites

```
Filter Mode: Nearest
Compression: Lossless
Mipmaps: Off
Fix Alpha Border: On
```

### HD Sprites

```
Filter Mode: Linear
Compression: VRAM Compressed
Mipmaps: On
```

### UI Elements

```
Filter Mode: Linear (or Nearest for pixel UI)
Compression: Lossless
Mipmaps: Off
```

## Examples

### Example 1: Pixel Art Character with Walk Animation

```bash
# 1. Create batch spec
cat > character-batch.json << 'EOF'
{
  "provider": "replicate",
  "style": "pixel-art",
  "basePrompt": "16-bit pixel art knight, game sprite, transparent background",
  "assets": [
    { "name": "knight-idle", "prompt": "standing idle, front view" },
    { "name": "knight-walk-1", "prompt": "walking, left foot forward" },
    { "name": "knight-walk-2", "prompt": "walking, standing straight" },
    { "name": "knight-walk-3", "prompt": "walking, right foot forward" },
    { "name": "knight-walk-4", "prompt": "walking, standing straight" }
  ]
}
EOF

# 2. Generate images
deno run --allow-env --allow-net --allow-read --allow-write \
  scripts/batch-generate.ts --spec character-batch.json --output ./raw/

# 3. Process sprites
for f in ./raw/knight-*.png; do
  deno run --allow-read --allow-write scripts/process-sprite.ts \
    --input "$f" --output "./processed/$(basename $f)" \
    --remove-bg --resize 64x64 --filter nearest
done

# 4. Pack sprite sheet
deno run --allow-read --allow-write scripts/pack-spritesheet.ts \
  --input "./processed/knight-*.png" \
  --output ./sprites/knight-sheet.png \
  --columns 5 --metadata ./sprites/knight-sheet.json

# 5. Generate Godot import
deno run --allow-read --allow-write scripts/generate-import-files.ts \
  --input ./sprites/knight-sheet.png --preset pixel-art \
  --frames 5 --columns 5 --fps 8
```

### Example 2: Tileset Generation

```bash
# Generate individual tiles
deno run --allow-env --allow-net --allow-write scripts/generate-image.ts \
  --provider dalle \
  --prompt "seamless pixel art grass tile, top-down view, 32x32, game tileset" \
  --output ./tiles/grass.png \
  --style pixel-art

# Process and resize
deno run --allow-read --allow-write scripts/process-sprite.ts \
  --input ./tiles/grass.png --output ./tiles/grass-processed.png \
  --resize 32x32 --filter nearest
```

### Example 3: UI Icons

```bash
# Batch generate UI icons
cat > ui-batch.json << 'EOF'
{
  "provider": "fal",
  "style": "vector",
  "basePrompt": "flat design game icon, clean edges, solid colors, transparent background",
  "assets": [
    { "name": "icon-sword", "prompt": "sword weapon icon" },
    { "name": "icon-shield", "prompt": "shield defense icon" },
    { "name": "icon-potion", "prompt": "health potion bottle icon" },
    { "name": "icon-coin", "prompt": "gold coin currency icon" }
  ]
}
EOF

deno run --allow-env --allow-net --allow-read --allow-write \
  scripts/batch-generate.ts --spec ui-batch.json --output ./icons/
```

## Common Issues

### API Key Not Found

```
Error: OPENAI_API_KEY environment variable is not set
```

**Solution**: Export the API key before running:
```bash
export OPENAI_API_KEY="sk-..."
```

### Inconsistent Style Across Batch

**Problem**: Generated images have different styles despite same prompt.

**Solutions**:
- Use more specific style modifiers
- Use Replicate with seed parameter for reproducibility
- Generate more images and select best matches
- Use img2img with reference image (Replicate)

### Background Removal Fails

**Problem**: `--remove-bg` doesn't cleanly separate sprite.

**Solutions**:
- Add "transparent background" or "white background" to prompt
- Use `--color-key` with a specific background color
- Use more explicit prompts: "isolated on transparent background"
- Manual cleanup may be needed for complex images

### Pixel Art Has Anti-Aliasing

**Problem**: Generated pixel art has smoothed edges.

**Solutions**:
- Add "no anti-aliasing", "clean pixels" to prompt
- Generate at larger size, then downscale with nearest neighbor
- Use `--filter nearest` in process-sprite.ts
- Post-process with palette reduction

### Rate Limiting

**Problem**: API returns 429 rate limit errors.

**Solutions**:
- Increase `--delay` in batch-generate.ts
- Reduce `--concurrency`
- Wait and retry
- Use different provider for large batches

## Additional Resources

### Prompting Guides
- `references/prompting/pixel-art.md` - Detailed pixel art techniques
- `references/prompting/hand-drawn.md` - Illustrated style guide
- `references/prompting/consistent-characters.md` - Character consistency

### API Guides
- `references/api-guides/openai-dalle.md` - DALL-E 3 API reference
- `references/api-guides/replicate-sdxl.md` - Replicate integration
- `references/api-guides/fal-ai.md` - fal.ai guide

### Godot Integration
- `references/godot-integration/import-settings.md` - Import configuration
- `references/godot-integration/animation-setup.md` - AnimatedSprite2D setup

### Templates
- `assets/prompts/pixel-art-templates.json` - Pixel art prompt templates
- `assets/prompts/character-templates.json` - Character prompts
- `assets/style-guides/style-guide-template.json` - Style guide schema

## Limitations

- **API-based only**: Requires internet and API keys (no local models)
- **Style consistency**: AI may produce variations despite same prompt
- **Resolution constraints**: Each provider has size limits
- **2D assets only**: Not for 3D models, textures, or complex animations
- **Background removal**: May require manual cleanup for complex images
- **Cost**: API calls incur charges, especially for large batches
