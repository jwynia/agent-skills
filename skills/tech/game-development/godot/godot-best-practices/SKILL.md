---
name: godot-best-practices
description: "Guide AI agents through Godot 4.x GDScript coding best practices including scene organization, signals, resources, state machines, and performance optimization. This skill should be used when generating GDScript code, creating Godot scenes, designing game architecture, implementing state machines, object pooling, save/load systems, or when the user asks about Godot patterns, node structure, or GDScript standards. Keywords: godot, gdscript, game development, signals, resources, scenes, nodes, state machine, object pooling, save system, autoload, export, type hints."
license: MIT
compatibility: Requires Godot 4.x project. GDScript only (not C#).
metadata:
  author: agent-skills
  version: "1.0"
  godot_version: "4.x"
---

# Godot 4.x GDScript Best Practices

Guide AI agents in writing high-quality GDScript code for Godot 4.x. This skill provides coding standards, architecture patterns, and templates for game development.

## When to Use This Skill

Use this skill when:
- Generating new GDScript code
- Creating or organizing Godot scenes
- Designing game architecture and node hierarchies
- Implementing state machines, object pools, or save systems
- Answering questions about GDScript patterns or Godot conventions
- Reviewing GDScript code for quality issues

Do NOT use this skill when:
- Working with C# in Godot (use C# patterns)
- Working with Godot 3.x (syntax differs significantly)
- Using GDExtension/C++ (different paradigm)
- Working with Godot's visual scripting

## Core Principles

### 1. Naming Conventions

Follow GDScript naming standards consistently:

```gdscript
# Classes: PascalCase
class_name PlayerController
extends CharacterBody2D

# Signals: past_tense_snake_case (describe what happened)
signal health_changed(new_health: int)
signal player_died
signal item_collected(item: Item)

# Constants: SCREAMING_SNAKE_CASE
const MAX_SPEED: float = 200.0
const JUMP_FORCE: int = -400

# Variables and functions: snake_case
var current_health: int = 100
var _private_variable: float = 0.0  # Leading underscore for private

func calculate_damage(base: int, multiplier: float) -> int:
    return int(base * multiplier)

func _private_helper() -> void:  # Leading underscore for private
    pass
```

### 2. Type Hints (Static Typing)

Use explicit type hints everywhere for autocomplete and error detection:

```gdscript
# Variable declarations
var speed: float = 100.0
var player: CharacterBody2D
var items: Array[Item] = []
var stats: Dictionary = {}

# Function signatures with return types
func get_damage() -> int:
    return _base_damage * _multiplier

func find_nearest_enemy(position: Vector2) -> Enemy:
    # Implementation
    return null

# Typed signals (Godot 4.x)
signal score_updated(new_score: int, old_score: int)
signal target_acquired(target: Node2D, distance: float)

# Node references with types
@onready var sprite: Sprite2D = $Sprite2D
@onready var collision: CollisionShape2D = $CollisionShape2D
@onready var animation_player: AnimationPlayer = %AnimationPlayer
```

### 3. Node References

Use modern patterns for stable, refactor-friendly references:

```gdscript
# PREFER: @onready with type hints
@onready var health_bar: ProgressBar = $UI/HealthBar
@onready var weapon: Weapon = $WeaponMount/Weapon

# PREFER: Unique names with % for critical nodes
@onready var player: Player = %Player
@onready var game_manager: GameManager = %GameManager

# AVOID: get_node() in _ready()
func _ready() -> void:
    # Don't do this
    var sprite = get_node("Sprite2D")

# AVOID: Deep fragile paths
@onready var thing = $Parent/Child/GrandChild/GreatGrandChild  # Fragile
```

### 4. Signal-Driven Architecture

Use signals for decoupled communication. Follow "signal up, call down":

```gdscript
# Child node emits signals (doesn't know about parent)
class_name HealthComponent
extends Node

signal health_changed(current: int, maximum: int)
signal died

var _health: int = 100
var _max_health: int = 100

func take_damage(amount: int) -> void:
    _health = max(0, _health - amount)
    health_changed.emit(_health, _max_health)
    if _health <= 0:
        died.emit()
```

```gdscript
# Parent connects to child signals (knows about children)
class_name Player
extends CharacterBody2D

@onready var health: HealthComponent = $HealthComponent
@onready var sprite: Sprite2D = $Sprite2D

func _ready() -> void:
    health.health_changed.connect(_on_health_changed)
    health.died.connect(_on_died)

func _on_health_changed(current: int, maximum: int) -> void:
    # Update UI, play effects, etc.
    pass

func _on_died() -> void:
    sprite.modulate = Color.RED
    queue_free()
```

### 5. Resource Loading

Choose the right loading strategy:

```gdscript
# preload(): Compile-time loading for critical/small assets
const BULLET_SCENE: PackedScene = preload("res://scenes/bullet.tscn")
const PLAYER_SPRITE: Texture2D = preload("res://sprites/player.png")
const DAMAGE_SOUND: AudioStream = preload("res://audio/damage.wav")

# load(): Runtime loading for optional/large assets
func load_level(level_name: String) -> void:
    var path := "res://levels/%s.tscn" % level_name
    var level_scene: PackedScene = load(path)
    var level := level_scene.instantiate()
    add_child(level)

# ResourceLoader for async loading (prevents stuttering)
func _load_level_async(path: String) -> void:
    ResourceLoader.load_threaded_request(path)
    # Check with: ResourceLoader.load_threaded_get_status(path)
    # Get with: ResourceLoader.load_threaded_get(path)
```

## Quick Reference

| Category | Prefer | Avoid |
|----------|--------|-------|
| Node references | `@onready var x: Type = $Path` | `get_node()` in `_ready()` |
| Unique nodes | `%UniqueName` | Deep paths `$A/B/C/D` |
| Resource loading | `preload()` for small/critical | `load()` everywhere |
| Signals | Typed: `signal x(val: int)` | String: `emit_signal("x")` |
| Type safety | Explicit type hints | Untyped variables |
| Constants | `const` or `@export` | Magic numbers/strings |
| Null checks | `is_instance_valid(node)` | `node != null` for freed nodes |
| Coroutines | `await` | `yield` (deprecated) |
| Groups | Scene-specific groups | Global groups for everything |
| Autoloads | Services/managers only | Game logic in autoloads |
| Properties | Setters/getters | Direct mutation |
| Communication | Signal up, call down | Child calling parent methods |

## Code Generation Guidelines

### Script Structure

Order sections consistently:

```gdscript
class_name MyClass
extends Node2D
## Brief description of this class.
##
## Longer description if needed, explaining purpose and usage.

# === Signals ===
signal state_changed(new_state: State)

# === Enums ===
enum State { IDLE, RUNNING, JUMPING }

# === Exports ===
@export var speed: float = 100.0
@export_group("Combat")
@export var damage: int = 10
@export var attack_range: float = 50.0

# === Constants ===
const MAX_HEALTH: int = 100

# === Public Variables ===
var current_state: State = State.IDLE

# === Private Variables ===
var _internal_counter: int = 0

# === Onready ===
@onready var sprite: Sprite2D = $Sprite2D
@onready var collision: CollisionShape2D = $CollisionShape2D

# === Lifecycle Methods ===
func _ready() -> void:
    pass

func _process(delta: float) -> void:
    pass

func _physics_process(delta: float) -> void:
    pass

# === Public Methods ===
func take_damage(amount: int) -> void:
    pass

# === Private Methods ===
func _calculate_knockback() -> Vector2:
    return Vector2.ZERO
```

### Export Annotations

Use exports for editor-configurable values:

```gdscript
# Basic exports
@export var health: int = 100
@export var speed: float = 200.0
@export var player_name: String = "Player"

# Range constraints
@export_range(0, 100) var percentage: int = 50
@export_range(0.0, 1.0, 0.1) var volume: float = 0.8

# Resource exports
@export var texture: Texture2D
@export var scene: PackedScene
@export var audio: AudioStream

# Grouped exports
@export_group("Movement")
@export var walk_speed: float = 100.0
@export var run_speed: float = 200.0

@export_group("Combat")
@export var attack_damage: int = 10

# Enum exports
@export var difficulty: Difficulty = Difficulty.NORMAL
enum Difficulty { EASY, NORMAL, HARD }

# Flags (multiselect)
@export_flags("Fire", "Water", "Earth", "Air") var elements: int = 0
```

## Common Game Patterns

### State Machine (Overview)

Use enum-based state machines for simple cases:

```gdscript
enum State { IDLE, WALK, JUMP, ATTACK }

var current_state: State = State.IDLE

func _physics_process(delta: float) -> void:
    match current_state:
        State.IDLE:
            _process_idle(delta)
        State.WALK:
            _process_walk(delta)
        State.JUMP:
            _process_jump(delta)
        State.ATTACK:
            _process_attack(delta)

func change_state(new_state: State) -> void:
    if current_state == new_state:
        return
    _exit_state(current_state)
    current_state = new_state
    _enter_state(new_state)
```

See `references/patterns/state-machine.md` for advanced implementations.

### Object Pooling (Overview)

Reuse objects to avoid instantiation cost:

```gdscript
class_name ObjectPool
extends Node

var _pool: Array[Node] = []
var _scene: PackedScene

func _init(scene: PackedScene, initial_size: int = 10) -> void:
    _scene = scene
    for i in initial_size:
        var obj := _scene.instantiate()
        obj.set_process(false)
        _pool.append(obj)

func acquire() -> Node:
    if _pool.is_empty():
        return _scene.instantiate()
    var obj := _pool.pop_back()
    obj.set_process(true)
    return obj

func release(obj: Node) -> void:
    obj.set_process(false)
    _pool.append(obj)
```

See `references/patterns/object-pooling.md` for complete implementation.

### Save/Load (Overview)

Use Resources or JSON for save data:

```gdscript
# Custom Resource for save data
class_name SaveData
extends Resource

@export var player_position: Vector2
@export var player_health: int
@export var inventory: Array[String]
@export var level_name: String

# Save
func save_game(data: SaveData) -> void:
    ResourceSaver.save(data, "user://save.tres")

# Load
func load_game() -> SaveData:
    if ResourceLoader.exists("user://save.tres"):
        return load("user://save.tres") as SaveData
    return SaveData.new()
```

See `references/patterns/save-load-system.md` for comprehensive guide.

## Common Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Polling in `_process` | Wastes CPU on unchanged state | Use signals for state changes |
| `get_parent().get_parent()` | Tight coupling, fragile | Signal up, or use groups |
| Deep node paths `$A/B/C/D` | Breaks on refactor | Use `%UniqueName` |
| `load()` in `_process` | Stuttering, memory churn | `preload()` or cache reference |
| String signals `emit_signal("x")` | Typos, no autocomplete | Typed: `signal_name.emit()` |
| Untyped `@onready var x = $Node` | Loses autocomplete | Always add type hint |
| Logic in autoloads | Testing difficulty, coupling | Keep autoloads thin |
| Magic numbers | Unclear meaning | Use `const` or `@export` |
| `node != null` for freed nodes | Returns true for freed | Use `is_instance_valid()` |
| Circular dependencies | Load errors, unclear flow | Dependency injection or signals |

## Additional Resources

### Pattern Guides
- `references/patterns/state-machine.md` - Full state machine implementations
- `references/patterns/object-pooling.md` - Complete pooling system
- `references/patterns/save-load-system.md` - Comprehensive save/load guide
- `references/patterns/input-handling.md` - Input buffering and rebinding

### Architecture
- `references/architecture/project-structure.md` - Directory organization
- `references/architecture/scene-composition.md` - Scene design patterns
- `references/architecture/node-communication.md` - Signals vs direct calls

### GDScript Deep Dives
- `references/gdscript/type-system.md` - Static typing in depth
- `references/gdscript/coroutines-await.md` - Async patterns with await

### Templates
- `assets/templates/base-script.gd.md` - Standard script template
- `assets/templates/state-machine.gd.md` - State machine template
- `assets/templates/autoload-manager.gd.md` - Autoload singleton template

## Limitations

- GDScript only (not C#, GDExtension, or VisualScript)
- Godot 4.x syntax (some patterns differ from 3.x)
- Game-focused patterns (not editor plugin development)
- No runtime validation scripts (GDScript requires Godot runtime)
