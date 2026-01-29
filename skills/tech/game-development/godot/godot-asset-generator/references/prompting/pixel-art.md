# Pixel Art Prompting Guide

Comprehensive guide to generating pixel art game assets with AI image APIs.

## Core Principles

Pixel art AI generation requires specific prompting to avoid common issues like anti-aliasing, wrong resolution, and blurry pixels.

## Essential Modifiers

Always include these modifiers for pixel art:

```
pixel art, 16-bit, clean pixels, no anti-aliasing, limited color palette,
retro game sprite, crisp edges
```

### Resolution Modifiers

| Style | Modifier | Best For |
|-------|----------|----------|
| 8-bit | "8-bit, NES style, very low resolution" | Tiny sprites, icons |
| 16-bit | "16-bit, SNES style, pixel art" | Standard game sprites |
| 32-bit | "32-bit pixel art, detailed pixels" | HD pixel art |

### Negative Prompts (Replicate/fal.ai)

```
blurry, anti-aliased, smooth, gradient, realistic, 3d render,
photorealistic, high resolution photography, soft edges
```

## Prompt Templates

### Character Sprites

```
pixel art [character description], 16-bit style, game sprite,
[pose/action], [view direction], clean pixels, no anti-aliasing,
transparent background, limited color palette
```

**Example:**
```
pixel art knight warrior, 16-bit style, game sprite, idle standing pose,
front view, clean pixels, no anti-aliasing, transparent background,
limited color palette, medieval fantasy
```

### Animation Frames

```
pixel art [character], 16-bit style, [animation] frame [N] of [total],
game animation sprite, consistent style, clean pixels,
transparent background
```

**Example:**
```
pixel art knight, 16-bit style, walking animation frame 1 of 4,
left foot forward, game animation sprite, consistent style,
clean pixels, transparent background
```

### Tilesets

```
seamless pixel art tile, [description], top-down view, 32x32 pixels,
tileable pattern, game tileset, retro style, clean edges
```

**Example:**
```
seamless pixel art grass tile, green meadow with small flowers,
top-down view, 32x32 pixels, tileable pattern, game tileset,
retro style, clean edges
```

### UI Elements

```
pixel art [element type], 16-bit UI style, game interface element,
clean edges, flat colors, retro game aesthetic
```

**Example:**
```
pixel art health bar frame, 16-bit UI style, game interface element,
red and gold colors, clean edges, flat colors, retro game aesthetic
```

### Items and Objects

```
pixel art [item], 16-bit style, game item sprite, isolated object,
transparent background, clean pixels, iconic design
```

**Example:**
```
pixel art sword weapon, 16-bit style, game item sprite,
glowing blue blade, isolated object, transparent background,
clean pixels, iconic fantasy design
```

## Provider-Specific Tips

### DALL-E 3

- Excellent prompt following
- Tends toward higher detail - emphasize "simple", "limited palette"
- Use "pixel art style illustration" for more stylized results
- Request "transparent background" explicitly

### Replicate (SDXL)

- Use negative prompts to avoid realism
- Models like `kohaku-xl` are good for stylized pixel art
- Set guidance_scale to 7-9 for pixel art
- Consider upscaling then downscaling for cleaner results

### fal.ai (Flux)

- Fast iteration for testing prompts
- Works well with simple, direct prompts
- May need post-processing for clean pixels

## Post-Processing Pipeline

1. **Generate at 1024x1024** - Higher resolution gives more detail
2. **Remove background** - Use `--remove-bg` or `--color-key`
3. **Downscale** - Use `--resize` with `--filter nearest`
4. **Palette reduction** - Optional: reduce to 16/32 colors

```bash
# Example pipeline
deno run scripts/generate-image.ts --provider dalle \
  --prompt "pixel art knight, 16-bit style..." \
  --output ./raw/knight.png

deno run scripts/process-sprite.ts \
  --input ./raw/knight.png \
  --output ./sprites/knight.png \
  --remove-bg --resize 64x64 --filter nearest
```

## Common Issues

### Anti-Aliasing / Soft Edges

**Problem:** Pixels have soft, blurred edges instead of hard transitions.

**Solutions:**
- Add "no anti-aliasing", "hard edges", "crisp pixels"
- Generate larger, then downscale with nearest neighbor
- Use negative prompt: "anti-aliased, smooth, blurry"

### Wrong Scale / Too Detailed

**Problem:** Image has too many tiny details, not blocky enough.

**Solutions:**
- Specify exact resolution: "32x32 pixels", "64 pixel sprite"
- Add "low resolution", "chunky pixels", "simple"
- Reduce after generation with nearest neighbor

### Inconsistent Style

**Problem:** Multiple assets don't match visually.

**Solutions:**
- Create and reuse consistent base prompt
- Use same model and settings for batch
- Reference specific game/era: "SNES style", "like Stardew Valley"
- Post-process with same palette reduction

### Gradients Instead of Flat Colors

**Problem:** AI uses gradients where flat color blocks are expected.

**Solutions:**
- Add "flat colors", "solid colors", "no gradients"
- Specify "limited color palette", "16 colors"
- Use negative prompt: "gradient, shading, realistic"

## Resolution Guide

| Sprite Size | Generate At | Downscale To |
|-------------|-------------|--------------|
| 16x16 | 512x512 or 1024x1024 | 16x16 |
| 32x32 | 1024x1024 | 32x32 |
| 64x64 | 1024x1024 | 64x64 |
| 128x128 | 1024x1024 | 128x128 |

Always use nearest neighbor filtering when downscaling.

## Color Palette Tips

### Specifying Palettes

```
limited to 16 colors, [palette description]
```

**Examples:**
- "NES color palette, limited colors"
- "earth tones palette, browns and greens"
- "fantasy game palette, purples and golds"
- "monochrome blue palette with white highlights"

### Common Game Palettes

Reference known palettes for consistency:
- "NES color palette" - Classic 8-bit limited colors
- "Game Boy palette" - 4 shades of green
- "PICO-8 palette" - 16 specific colors
- "Commodore 64 palette" - Specific retro palette

## Example Prompts

### Player Character (Idle)
```
pixel art adventurer hero, 16-bit RPG style, idle standing pose,
front view, brown hair, blue tunic, sword on back, game sprite,
clean pixels, no anti-aliasing, transparent background,
limited fantasy color palette
```

### Enemy (Slime)
```
pixel art slime monster, 16-bit style, bouncy blob creature,
green translucent body, simple cute face, game enemy sprite,
front view, clean pixels, transparent background, cartoony
```

### Environment Tile (Stone Floor)
```
seamless pixel art stone floor tile, medieval dungeon style,
top-down view, 32x32 pixels, gray cobblestone pattern,
tileable texture, subtle cracks, game tileset, clean edges
```

### Item (Potion)
```
pixel art health potion bottle, 16-bit style, red liquid,
glass bottle with cork, glowing effect, game item sprite,
isolated object, transparent background, fantasy RPG item
```
