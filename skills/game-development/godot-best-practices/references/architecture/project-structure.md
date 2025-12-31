# Project Structure

Recommended directory organization for Godot 4.x projects.

## Standard Project Layout

```
project/
├── .godot/                  # Godot cache (gitignore)
├── addons/                  # Editor plugins and extensions
│   └── my_plugin/
├── assets/                  # Non-code resources
│   ├── audio/
│   │   ├── music/
│   │   └── sfx/
│   ├── fonts/
│   ├── sprites/
│   │   ├── characters/
│   │   ├── environment/
│   │   └── ui/
│   ├── textures/
│   └── themes/
├── autoloads/               # Global singletons
│   ├── game_manager.gd
│   ├── audio_manager.gd
│   └── save_manager.gd
├── components/              # Reusable node components
│   ├── health_component.gd
│   ├── hitbox_component.gd
│   └── movement_component.gd
├── resources/               # Custom Resource definitions
│   ├── item_data.gd
│   ├── character_stats.gd
│   └── dialogue_data.gd
├── scenes/                  # Game scenes
│   ├── actors/              # Characters, enemies, NPCs
│   │   ├── player/
│   │   │   ├── player.tscn
│   │   │   └── player.gd
│   │   └── enemies/
│   ├── levels/              # Level/world scenes
│   │   ├── level_01.tscn
│   │   └── level_02.tscn
│   ├── objects/             # Interactive objects
│   │   ├── door.tscn
│   │   └── chest.tscn
│   └── ui/                  # UI scenes
│       ├── hud.tscn
│       ├── main_menu.tscn
│       └── pause_menu.tscn
├── scripts/                 # Standalone scripts
│   ├── classes/             # Base classes
│   │   └── actor.gd
│   └── utils/               # Utility functions
│       └── math_utils.gd
├── shaders/                 # Shader files
│   └── outline.gdshader
├── data/                    # Static data files
│   ├── items.tres
│   └── enemies.tres
├── project.godot            # Project settings
├── export_presets.cfg       # Export configurations
└── .gitignore
```

## Directory Purposes

### addons/
Third-party and custom editor plugins:
```
addons/
├── gut/                     # Unit testing framework
├── dialogic/                # Dialogue system
└── my_custom_plugin/
    ├── plugin.cfg
    └── plugin.gd
```

### autoloads/
Global singletons registered in Project Settings > Autoload:
- Keep autoloads thin (services, not game logic)
- One responsibility per autoload
- Prefer signals over direct method calls

```gdscript
# Good autoload: Manages audio globally
class_name AudioManager
extends Node

func play_sfx(sound: AudioStream) -> void:
    # ...

# Bad autoload: Too much game logic
class_name GameManager
extends Node

var player_health: int  # Should be on Player
var current_level: int  # Should be on LevelManager
func spawn_enemy() -> void:  # Should be on EnemySpawner
```

### components/
Reusable node scripts that can be attached to any scene:
```gdscript
# health_component.gd
class_name HealthComponent
extends Node

signal health_changed(current: int, maximum: int)
signal died

@export var max_health: int = 100
var current_health: int

func take_damage(amount: int) -> void:
    current_health = max(0, current_health - amount)
    health_changed.emit(current_health, max_health)
    if current_health <= 0:
        died.emit()
```

### resources/
Custom Resource class definitions (not instances):
```gdscript
# item_data.gd
class_name ItemData
extends Resource

@export var id: String
@export var display_name: String
@export var icon: Texture2D
@export var stack_size: int = 99
@export_multiline var description: String
```

Resource instances go in `data/`:
```
data/
├── items/
│   ├── sword.tres       # ItemData instance
│   └── potion.tres
└── enemies/
    ├── slime.tres       # EnemyData instance
    └── goblin.tres
```

### scenes/
Organized by entity type, not by node type:
```
# Good: Organized by game entity
scenes/
├── actors/
│   └── player/
│       ├── player.tscn
│       ├── player.gd
│       └── player_states/

# Avoid: Organized by node type
scenes/
├── characterbody2d/
│   └── player.tscn
├── area2d/
│   └── hitbox.tscn
```

### scripts/
Scripts not attached to specific scenes:
- Base classes extended by scene scripts
- Utility functions
- Data structures

```gdscript
# scripts/classes/actor.gd
class_name Actor
extends CharacterBody2D
## Base class for all game characters

signal died

@export var move_speed: float = 100.0
var health_component: HealthComponent

func _ready() -> void:
    health_component = get_node_or_null("HealthComponent")
    if health_component:
        health_component.died.connect(_on_died)
```

## Scene Organization Patterns

### Co-located Scripts
Keep script next to its scene:
```
scenes/actors/player/
├── player.tscn
├── player.gd           # Main player script
├── player_camera.gd    # Camera control
└── player_animations.gd
```

### Nested Scenes
Break complex scenes into sub-scenes:
```
# player.tscn contains:
Player (CharacterBody2D)
├── CollisionShape2D
├── Sprite2D
├── AnimationPlayer
├── WeaponMount (Node2D)
│   └── weapon.tscn (instanced)
├── HealthComponent (health_component.tscn)
└── StateMachine
    └── [states as child nodes]
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Folders | snake_case | `player_states/` |
| Scenes | snake_case.tscn | `main_menu.tscn` |
| Scripts | snake_case.gd | `player_controller.gd` |
| Resources | snake_case.tres | `fire_sword.tres` |
| Shaders | snake_case.gdshader | `water_ripple.gdshader` |
| Images | snake_case.png | `player_idle.png` |
| Audio | snake_case.wav/ogg | `jump_sound.wav` |

## Git Configuration

Recommended `.gitignore`:
```gitignore
# Godot cache
.godot/

# Exports
*.pck
*.zip
build/

# OS files
.DS_Store
Thumbs.db

# Editor backups
*.import.bak

# IDE
.vscode/
*.code-workspace
```

## Import Presets

Configure import settings for asset types in `project.godot` or via `.import` files:

```
# Pixel art project - disable filtering
[preset.0]
name="Pixel Art Texture"
platform="*"
filter=false
mipmaps=false
```

## Best Practices

1. **One scene, one responsibility** - Split complex scenes
2. **Co-locate related files** - Script next to scene
3. **Use Resources for data** - Not scripts with `const` values
4. **Avoid deep nesting** - Max 3-4 levels deep
5. **Consistent naming** - Same conventions everywhere
6. **Version control friendly** - Text-based resources (.tres not .res)
7. **Document non-obvious structure** - README in complex folders
