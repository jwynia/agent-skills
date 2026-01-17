# Godot Import Settings Guide

Optimal import settings for different game asset types in Godot 4.x.

## Import Settings Overview

When you add an image to a Godot project, it creates a `.import` file that controls how the image is processed.

## Presets Reference

### Pixel Art Sprites

For retro/pixel art games with crisp, unfiltered pixels.

| Setting | Value | Reason |
|---------|-------|--------|
| Filter Mode | Nearest | Preserves hard pixel edges |
| Compress Mode | Lossless | No quality loss |
| Mipmaps | Off | Prevents blur at different scales |
| Fix Alpha Border | On | Prevents edge artifacts |

**Import file settings:**
```ini
compress/mode=0
mipmaps/generate=false
process/fix_alpha_border=true
```

**Project Settings (also set globally):**
```
rendering/textures/canvas_textures/default_texture_filter = Nearest
```

### HD 2D Sprites

For high-resolution 2D games with smooth scaling.

| Setting | Value | Reason |
|---------|-------|--------|
| Filter Mode | Linear | Smooth scaling |
| Compress Mode | VRAM Compressed | GPU-friendly |
| Mipmaps | On | Better quality at small sizes |
| Fix Alpha Border | On | Prevents edge artifacts |

**Import file settings:**
```ini
compress/mode=2
compress/high_quality=true
mipmaps/generate=true
process/fix_alpha_border=true
```

### UI Elements

For interface elements like buttons, panels, icons.

| Setting | Value | Reason |
|---------|-------|--------|
| Filter Mode | Linear (or Nearest for pixel UI) | Depends on style |
| Compress Mode | Lossless | Crisp text/edges |
| Mipmaps | Off | UI is at fixed scale |
| Fix Alpha Border | On | Clean edges |

### Backgrounds

For large background images.

| Setting | Value | Reason |
|---------|-------|--------|
| Filter Mode | Linear | Smooth appearance |
| Compress Mode | Lossy | Smaller file size OK |
| Mipmaps | On | Better for parallax |
| Lossy Quality | 0.8 | Balance size/quality |

## Compression Modes

| Mode | Value | Size | Quality | Best For |
|------|-------|------|---------|----------|
| Lossless | 0 | Large | Perfect | Sprites, UI |
| Lossy | 1 | Medium | Good | Photos, backgrounds |
| VRAM | 2 | Small | Good | Large textures, 3D |

## Filter Modes

### Nearest (Pixel Art)

Preserves hard pixel edges. Essential for:
- Pixel art sprites
- Retro-style games
- Any asset where you want visible pixels

### Linear (Smooth)

Interpolates between pixels. Use for:
- HD sprites
- Painted/illustrated assets
- Photographs
- Backgrounds

## Sprite Sheet Configuration

For sprite sheets, configure in the Import dock:

1. **Import as**: Texture2D (default)
2. **Detect 3D**: Off
3. **Process → Fix Alpha Border**: On

Then in your scene:
- Create `AnimatedSprite2D` node
- Create new `SpriteFrames` resource
- Add frames by region or auto-slice

### Using Sheet Metadata

If using `pack-spritesheet.ts` with `--metadata`:

```gdscript
# Load metadata
var meta = JSON.parse_string(FileAccess.open("res://sprites/sheet.json", FileAccess.READ).get_as_text())

# Create frames from metadata
var frames = SpriteFrames.new()
frames.add_animation("walk")

for frame in meta.frames:
    var texture = load("res://sprites/sheet.png")
    var atlas = AtlasTexture.new()
    atlas.atlas = texture
    atlas.region = Rect2(frame.x, frame.y, frame.width, frame.height)
    frames.add_frame("walk", atlas)
```

## AnimatedSprite2D Setup

### From Sprite Sheet

1. Add `AnimatedSprite2D` node
2. Create new `SpriteFrames` in Sprite Frames property
3. Click SpriteFrames to open animation editor
4. Add animation (e.g., "walk")
5. Click folder icon → "Add Frames from Sprite Sheet"
6. Select your sprite sheet image
7. Configure grid (columns × rows)
8. Select frames for animation
9. Set FPS in animation panel

### Recommended FPS

| Animation Type | FPS |
|----------------|-----|
| Idle | 4-6 |
| Walk | 8-12 |
| Run | 10-14 |
| Attack | 12-16 |
| Effects | 15-24 |

## AtlasTexture for Individual Frames

For extracting single sprites from a sheet:

```gdscript
var atlas = AtlasTexture.new()
atlas.atlas = preload("res://sprites/sheet.png")
atlas.region = Rect2(0, 0, 64, 64)  # x, y, width, height

$Sprite2D.texture = atlas
```

## Nine-Patch for UI

For scalable UI elements (panels, buttons):

1. Import as Texture2D with Lossless
2. Create `NinePatchRect` node
3. Assign texture
4. Set patch margins (left, top, right, bottom)
5. Set draw center as needed

```gdscript
var nine_patch = NinePatchRect.new()
nine_patch.texture = preload("res://ui/panel.png")
nine_patch.patch_margin_left = 16
nine_patch.patch_margin_top = 16
nine_patch.patch_margin_right = 16
nine_patch.patch_margin_bottom = 16
```

## Tileset Setup

For tile-based games:

1. Import tile sheet with Nearest filter (for pixel art)
2. Create `TileSet` resource
3. Add texture as TileSetAtlasSource
4. Configure tile size (e.g., 16×16, 32×32)
5. Set up collision, navigation as needed

**TileMap configuration:**
```gdscript
var tilemap = TileMap.new()
tilemap.tile_set = preload("res://tilesets/world.tres")
tilemap.cell_quadrant_size = 16  # Match tile size
```

## Project-Wide Settings

### For Pixel Art Games

In Project Settings → Rendering → Textures:
```
canvas_textures/default_texture_filter = Nearest
```

In Project Settings → Display → Window:
```
stretch/mode = viewport
stretch/aspect = keep
```

### For HD Games

In Project Settings → Rendering → Textures:
```
canvas_textures/default_texture_filter = Linear
```

## Using generate-import-files.ts

```bash
# Pixel art preset
deno run scripts/generate-import-files.ts \
  --input ./sprites/player.png --preset pixel-art

# HD sprites
deno run scripts/generate-import-files.ts \
  --input ./hd-sprites/ --preset hd-sprite

# UI elements
deno run scripts/generate-import-files.ts \
  --input ./ui/ --preset ui
```

## Troubleshooting

### Sprites Look Blurry

- Check Filter Mode is set to Nearest
- Verify project default texture filter
- Ensure no scaling applied to Sprite2D node

### Edge Artifacts / Bleeding

- Enable "Fix Alpha Border" in import
- Add 1-2px transparent padding in sprite sheet
- Use `--padding` option in pack-spritesheet.ts

### Colors Look Wrong

- Check color space settings
- Ensure PNG is saved with correct color profile
- Try Lossless compression mode

### File Size Too Large

- Use VRAM compression for large textures
- Lower Lossy quality for backgrounds
- Consider splitting very large sheets
