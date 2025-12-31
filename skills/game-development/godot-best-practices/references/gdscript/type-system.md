# GDScript Type System

Complete guide to static typing in GDScript 2.0 (Godot 4.x).

## Why Use Static Typing

1. **Editor autocomplete** - Better suggestions and method lookup
2. **Compile-time errors** - Catch type mismatches before running
3. **Performance** - Typed code can be optimized
4. **Documentation** - Types explain expected values
5. **Refactoring** - IDE can safely rename and modify

## Basic Type Annotations

### Variables

```gdscript
# Explicit type declaration
var health: int = 100
var speed: float = 200.0
var player_name: String = "Player"
var is_alive: bool = true

# Type inference (inferred from value)
var score := 0          # int
var velocity := Vector2.ZERO  # Vector2

# Nullable types (can be null)
var target: Node2D = null
var current_weapon: Weapon = null

# Constants (always inferred or explicit)
const MAX_HEALTH: int = 100
const GRAVITY: float = 980.0
```

### Functions

```gdscript
# Explicit parameter and return types
func calculate_damage(base: int, multiplier: float) -> int:
    return int(base * multiplier)

# Void return (no return value)
func take_damage(amount: int) -> void:
    health -= amount

# Optional parameters with defaults
func spawn_enemy(position: Vector2, health: int = 100) -> Enemy:
    var enemy := Enemy.new()
    enemy.position = position
    enemy.health = health
    return enemy

# No explicit return type (returns Variant)
func get_data():  # Avoid - always add return type
    return _data
```

## Built-in Types

### Primitive Types

```gdscript
var integer: int = 42
var floating: float = 3.14
var text: String = "Hello"
var flag: bool = true
```

### Vector Types

```gdscript
var pos2d: Vector2 = Vector2(100, 200)
var pos3d: Vector3 = Vector3(1, 2, 3)
var pos4d: Vector4 = Vector4(1, 2, 3, 4)

var int_pos: Vector2i = Vector2i(10, 20)  # Integer vector
var int_pos3: Vector3i = Vector3i(1, 2, 3)
```

### Color and Transform

```gdscript
var tint: Color = Color.RED
var xform2d: Transform2D = Transform2D.IDENTITY
var xform3d: Transform3D = Transform3D.IDENTITY
var basis: Basis = Basis.IDENTITY
```

### Collections

```gdscript
# Typed arrays (Godot 4.x)
var numbers: Array[int] = [1, 2, 3]
var names: Array[String] = ["Alice", "Bob"]
var enemies: Array[Enemy] = []
var nodes: Array[Node] = []

# Untyped array (avoid when possible)
var mixed: Array = [1, "two", 3.0]

# Dictionary (keys and values are Variant)
var data: Dictionary = {"key": "value"}

# PackedArrays (memory-efficient)
var bytes: PackedByteArray = PackedByteArray([0, 1, 2])
var ints: PackedInt32Array = PackedInt32Array([1, 2, 3])
var floats: PackedFloat32Array = PackedFloat32Array([1.0, 2.0])
var strings: PackedStringArray = PackedStringArray(["a", "b"])
var vectors: PackedVector2Array = PackedVector2Array([Vector2.ZERO])
```

## Class Types

### Custom Classes

```gdscript
# Define class with class_name
class_name Player
extends CharacterBody2D

# Use as type
var player: Player
var players: Array[Player] = []

func get_player() -> Player:
    return player
```

### Node Types

```gdscript
# Use specific node types
@onready var sprite: Sprite2D = $Sprite2D
@onready var collision: CollisionShape2D = $CollisionShape2D
@onready var animation: AnimationPlayer = $AnimationPlayer
@onready var audio: AudioStreamPlayer = $AudioStreamPlayer

# Generic Node when type varies
@onready var child: Node = $SomeChild
```

### Resource Types

```gdscript
# Specific resource types
@export var texture: Texture2D
@export var scene: PackedScene
@export var audio: AudioStream
@export var font: Font

# Custom resource
@export var item_data: ItemData
@export var character_stats: CharacterStats
```

## Type Casting

### Safe Casting with `as`

```gdscript
# Returns null if cast fails (safe)
func _on_body_entered(body: Node2D) -> void:
    var player := body as Player
    if player:
        player.collect_item(self)

# Also works with is check
func _on_area_entered(area: Area2D) -> void:
    if area is Hitbox:
        var hitbox := area as Hitbox
        take_damage(hitbox.damage)
```

### Type Checking with `is`

```gdscript
func process_node(node: Node) -> void:
    if node is CharacterBody2D:
        # node is narrowed to CharacterBody2D in this block
        node.move_and_slide()

    if node is Enemy:
        node.take_damage(10)
    elif node is Player:
        node.add_score(100)
```

## Typed Signals

```gdscript
# Signal with typed parameters
signal health_changed(current: int, maximum: int)
signal target_acquired(target: Node2D, distance: float)
signal item_collected(item: ItemData, amount: int)

# Emit with correct types
func take_damage(amount: int) -> void:
    _health -= amount
    health_changed.emit(_health, _max_health)

# Connect with typed callable
func _ready() -> void:
    health_changed.connect(_on_health_changed)

func _on_health_changed(current: int, maximum: int) -> void:
    health_bar.value = float(current) / maximum
```

## Enums

```gdscript
# Define enum
enum State { IDLE, WALK, JUMP, ATTACK }
enum DamageType { PHYSICAL, FIRE, ICE, ELECTRIC }

# Use as type
var current_state: State = State.IDLE
var damage_type: DamageType = DamageType.PHYSICAL

# In functions
func change_state(new_state: State) -> void:
    current_state = new_state

func apply_damage(amount: int, type: DamageType) -> void:
    match type:
        DamageType.FIRE:
            # Apply burning
            pass
        DamageType.ICE:
            # Apply slow
            pass
```

## Advanced Patterns

### Nullable Types

```gdscript
# Node references can be null
var target: Enemy = null

func find_target() -> void:
    target = _find_nearest_enemy()

func attack() -> void:
    if target and is_instance_valid(target):
        target.take_damage(damage)
```

### Union-like Types (Variant)

```gdscript
# When multiple types are valid, use Variant
func get_config_value(key: String) -> Variant:
    return _config.get(key)

# Or use method overloading pattern
func set_property_int(key: String, value: int) -> void:
    _properties[key] = value

func set_property_string(key: String, value: String) -> void:
    _properties[key] = value
```

### Generic-like Patterns

```gdscript
# Typed array in class
class_name Inventory
extends Node

var _items: Array[Item] = []

func add_item(item: Item) -> void:
    _items.append(item)

func get_items() -> Array[Item]:
    return _items.duplicate()

func find_by_type(item_type: Item.Type) -> Array[Item]:
    return _items.filter(func(item: Item) -> bool:
        return item.type == item_type
    )
```

## Common Gotchas

### Array Type Covariance

```gdscript
# This doesn't work as expected
var enemies: Array[Enemy] = []
var nodes: Array[Node] = enemies  # Error! Arrays are invariant

# Work around by copying
var nodes: Array[Node] = []
for enemy in enemies:
    nodes.append(enemy)
```

### Null vs Invalid Instance

```gdscript
# Node was freed but reference still exists
var enemy: Enemy = $Enemy

func _process(_delta: float) -> void:
    # enemy != null is true even if freed!
    if enemy:  # This passes for freed nodes
        enemy.update()  # Crash!

    # Correct way
    if is_instance_valid(enemy):
        enemy.update()
```

### Export Type Mismatch

```gdscript
# Export must match variable type
@export var speed: float = 100.0  # Good
@export var speed: float = 100    # Error: 100 is int

# Use explicit float
@export var speed: float = 100.0
```

## Type Annotation Cheatsheet

| Declaration | Syntax | Example |
|-------------|--------|---------|
| Variable | `var x: Type` | `var health: int = 100` |
| Inferred | `var x := value` | `var pos := Vector2.ZERO` |
| Constant | `const X: Type = val` | `const MAX: int = 100` |
| Parameter | `func f(x: Type)` | `func move(dir: Vector2)` |
| Return | `func f() -> Type` | `func get_hp() -> int` |
| Array | `Array[Type]` | `Array[Enemy]` |
| Nullable | `var x: Type = null` | `var target: Node = null` |
| Cast | `x as Type` | `body as Player` |
| Check | `x is Type` | `if node is Enemy` |

## Best Practices

1. **Always type public API** - Parameters, returns, signals
2. **Use `:=` for inference** - When type is obvious from value
3. **Prefer specific types** - `Sprite2D` over `Node`
4. **Use `is_instance_valid()`** - For node references
5. **Type signal parameters** - Better documentation
6. **Use typed arrays** - `Array[Enemy]` not `Array`
7. **Cast safely with `as`** - Returns null on failure
