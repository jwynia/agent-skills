# Scene Composition Patterns

Guide to designing and organizing Godot scenes for maintainability and reusability.

## Core Principles

1. **Scenes as prefabs** - Reusable, self-contained units
2. **Composition over inheritance** - Combine small scenes, don't extend large ones
3. **Single responsibility** - Each scene does one thing well
4. **Loose coupling** - Scenes communicate through signals

## Pattern 1: Component Composition

Build complex entities from simple component scenes:

```
# Entity composed of components
Player.tscn
├── CharacterBody2D (player.gd)
│   ├── Sprite2D
│   ├── CollisionShape2D
│   ├── AnimationPlayer
│   ├── HealthComponent (health_component.tscn)
│   ├── HitboxComponent (hitbox_component.tscn)
│   ├── MovementComponent (movement_component.tscn)
│   └── InventoryComponent (inventory_component.tscn)
```

```gdscript
# player.gd - Orchestrates components
class_name Player
extends CharacterBody2D

@onready var health: HealthComponent = $HealthComponent
@onready var hitbox: HitboxComponent = $HitboxComponent
@onready var movement: MovementComponent = $MovementComponent

func _ready() -> void:
    health.died.connect(_on_died)
    hitbox.hit_received.connect(health.take_damage)

func _physics_process(delta: float) -> void:
    var input_dir := Input.get_vector("left", "right", "up", "down")
    movement.move(input_dir, delta)
    move_and_slide()
```

```gdscript
# health_component.gd - Reusable component
class_name HealthComponent
extends Node

signal health_changed(current: int, maximum: int)
signal died

@export var max_health: int = 100

var current_health: int:
    set(value):
        current_health = clamp(value, 0, max_health)
        health_changed.emit(current_health, max_health)
        if current_health <= 0:
            died.emit()

func _ready() -> void:
    current_health = max_health

func take_damage(amount: int) -> void:
    current_health -= amount

func heal(amount: int) -> void:
    current_health += amount
```

## Pattern 2: Scene Inheritance

Extend base scenes for variations:

```
# Base enemy scene
enemy_base.tscn
├── CharacterBody2D (enemy_base.gd)
│   ├── Sprite2D
│   ├── CollisionShape2D
│   ├── HealthComponent
│   └── NavigationAgent2D

# Inherited scenes override properties
slime.tscn (inherits enemy_base.tscn)
├── [Sprite2D with slime texture]
├── [CollisionShape2D resized]
└── slime.gd (extends EnemyBase)

goblin.tscn (inherits enemy_base.tscn)
├── [Sprite2D with goblin texture]
├── WeaponMount (added node)
└── goblin.gd (extends EnemyBase)
```

```gdscript
# enemy_base.gd
class_name EnemyBase
extends CharacterBody2D

@export var move_speed: float = 50.0
@export var damage: int = 10

@onready var nav_agent: NavigationAgent2D = $NavigationAgent2D
@onready var health: HealthComponent = $HealthComponent

func _ready() -> void:
    health.died.connect(_on_died)

func _physics_process(delta: float) -> void:
    _move_toward_target(delta)

func _move_toward_target(delta: float) -> void:
    # Base movement logic
    pass

func _on_died() -> void:
    queue_free()
```

```gdscript
# slime.gd - Extends base with specific behavior
class_name Slime
extends EnemyBase

@export var split_count: int = 2

func _on_died() -> void:
    _spawn_smaller_slimes()
    super._on_died()

func _spawn_smaller_slimes() -> void:
    if split_count > 0:
        # Spawn logic
        pass
```

## Pattern 3: Container Scenes

Scenes that manage child scenes dynamically:

```gdscript
# level.gd - Container that loads/manages sub-scenes
class_name Level
extends Node2D

@export var enemy_spawns: Array[PackedScene] = []

@onready var enemy_container: Node2D = $Enemies
@onready var pickup_container: Node2D = $Pickups

func _ready() -> void:
    _spawn_enemies()

func _spawn_enemies() -> void:
    for spawn_point in $SpawnPoints.get_children():
        var enemy_scene: PackedScene = enemy_spawns.pick_random()
        var enemy := enemy_scene.instantiate()
        enemy.position = spawn_point.position
        enemy_container.add_child(enemy)

func add_pickup(pickup: Node2D, position: Vector2) -> void:
    pickup.position = position
    pickup_container.add_child(pickup)
```

## Pattern 4: Owner Access

Child scenes can access their owner for context:

```gdscript
# weapon.gd - Attached to weapon.tscn, instanced in player
class_name Weapon
extends Node2D

var wielder: CharacterBody2D

func _ready() -> void:
    # Owner is the root of the scene this was instanced into
    wielder = owner as CharacterBody2D
    if not wielder:
        push_error("Weapon must be child of CharacterBody2D")

func attack() -> void:
    var direction := wielder.global_transform.x
    # Use wielder's position, stats, etc.
```

## Pattern 5: Unique Names

Use `%` for stable references to important nodes:

```
Player.tscn
├── CharacterBody2D
│   ├── %Sprite (unique name)
│   ├── %AnimationPlayer (unique name)
│   ├── UI
│   │   └── %HealthBar (unique name)
│   └── Weapons
│       └── %CurrentWeapon (unique name)
```

```gdscript
# Access via % regardless of hierarchy
@onready var sprite: Sprite2D = %Sprite
@onready var anim: AnimationPlayer = %AnimationPlayer
@onready var health_bar: ProgressBar = %HealthBar
@onready var weapon: Weapon = %CurrentWeapon

# Works even if UI node is renamed or moved
```

## Scene Communication Patterns

### Signals (Preferred)
```gdscript
# Child emits, parent connects
# health_component.gd
signal health_changed(current: int, max: int)

# player.gd
func _ready() -> void:
    $HealthComponent.health_changed.connect(_update_health_bar)
```

### Direct Calls (When Appropriate)
```gdscript
# Parent calls child methods (knows about children)
func attack() -> void:
    $Weapon.fire()
    $AnimationPlayer.play("attack")
```

### Groups (Cross-Scene Communication)
```gdscript
# Any node can find others in same group
func _on_explosion() -> void:
    for enemy in get_tree().get_nodes_in_group("enemies"):
        if enemy.global_position.distance_to(position) < blast_radius:
            enemy.take_damage(damage)
```

## Scene Checklist

Before creating a new scene:

- [ ] Can it be reused elsewhere?
- [ ] Does it have a single responsibility?
- [ ] Are dependencies injected (not hardcoded)?
- [ ] Does it communicate via signals?
- [ ] Is the root node type appropriate?
- [ ] Are exported properties documented?

## Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Deep node paths | Fragile to refactoring | Use `%UniqueName` |
| Direct parent access | Tight coupling | Use signals |
| God scenes | Hard to maintain | Split into components |
| Missing null checks | Crashes | Use `get_node_or_null()` |
| Circular references | Memory leaks | Weak references or signals |

## Best Practices

1. **Start simple, add complexity** - Don't over-engineer upfront
2. **Test scenes in isolation** - Each scene should work alone
3. **Document public API** - What signals/methods are for external use
4. **Use tool mode for preview** - `@tool` scripts show in editor
5. **Keep scene tree shallow** - Avoid deeply nested hierarchies
