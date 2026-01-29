# Node Communication Patterns

Guide to communication between nodes in Godot 4.x.

## The Golden Rule

**Signal up, call down.**

- Parents know about children (can call their methods)
- Children don't know about parents (emit signals instead)
- Siblings communicate through shared parent or groups

## Pattern 1: Signals (Decoupled Communication)

Best for: Events, state changes, child-to-parent communication.

```gdscript
# button.gd - Emits signal (doesn't know who listens)
class_name InteractButton
extends Area2D

signal pressed

func _on_body_entered(body: Node2D) -> void:
    if body.is_in_group("player"):
        pressed.emit()
```

```gdscript
# door.gd - Connects to signal
class_name Door
extends Node2D

@export var button: InteractButton

func _ready() -> void:
    if button:
        button.pressed.connect(_on_button_pressed)

func _on_button_pressed() -> void:
    open()
```

### Typed Signals (Godot 4.x)

```gdscript
# Define signals with typed parameters
signal health_changed(new_health: int, max_health: int)
signal item_collected(item: Item, collector: Node2D)
signal damage_dealt(target: Node2D, amount: int, type: DamageType)

# Emit with correct types
health_changed.emit(50, 100)
item_collected.emit(sword_item, player)
```

### Anonymous Signals (One-Time Use)

```gdscript
# Wait for animation to finish
await $AnimationPlayer.animation_finished

# Wait for timer
await get_tree().create_timer(1.0).timeout

# Wait for custom signal
await some_node.some_signal
```

## Pattern 2: Direct Method Calls (Parent to Child)

Best for: Commands, immediate actions, when relationship is known.

```gdscript
# player.gd - Calls child methods directly
class_name Player
extends CharacterBody2D

@onready var weapon: Weapon = $Weapon
@onready var animator: AnimationPlayer = $AnimationPlayer
@onready var health: HealthComponent = $HealthComponent

func attack() -> void:
    weapon.fire()           # Direct call to child
    animator.play("attack") # Direct call to child

func take_damage(amount: int) -> void:
    health.damage(amount)   # Direct call to child
```

### Safe Access with Optional Nodes

```gdscript
# Node might not exist in all scene variations
@onready var optional_shield: Shield = get_node_or_null("Shield")

func block() -> void:
    if optional_shield:
        optional_shield.activate()
```

## Pattern 3: Groups (Cross-Scene Communication)

Best for: Finding nodes across scene boundaries, one-to-many communication.

```gdscript
# Add nodes to groups in _ready() or editor
func _ready() -> void:
    add_to_group("enemies")
    add_to_group("damageable")
```

```gdscript
# explosion.gd - Affects all nodes in group
func explode() -> void:
    var blast_pos := global_position

    for node in get_tree().get_nodes_in_group("damageable"):
        var distance := node.global_position.distance_to(blast_pos)
        if distance < blast_radius:
            var damage := calculate_falloff_damage(distance)
            node.take_damage(damage)
```

### Scene-Specific Groups

Prefix groups with scene identifier for isolation:

```gdscript
# In level_01
add_to_group("level_01_enemies")

# Clean up when level ends
func _exit_tree() -> void:
    get_tree().call_group("level_01_enemies", "queue_free")
```

## Pattern 4: Autoloads (Global State)

Best for: Services, managers, truly global state.

```gdscript
# event_bus.gd - Global event system (autoload)
extends Node

signal player_died
signal level_completed(level_name: String)
signal achievement_unlocked(achievement_id: String)

# Any node can emit
# EventBus.player_died.emit()

# Any node can connect
# EventBus.player_died.connect(_on_player_died)
```

### When to Use Autoloads

| Use Case | Autoload? | Why |
|----------|-----------|-----|
| Audio playback | Yes | Persists between scenes |
| Save/load | Yes | Global service |
| Player stats | Maybe | Consider level-owned |
| Score | Maybe | Consider game state resource |
| Level manager | No | Scene should manage itself |
| Enemy spawning | No | Level-specific logic |

## Pattern 5: Dependency Injection

Pass dependencies instead of hardcoding:

```gdscript
# weapon.gd - Receives owner, doesn't find it
class_name Weapon
extends Node2D

var _owner_stats: CharacterStats

func setup(stats: CharacterStats) -> void:
    _owner_stats = stats

func calculate_damage() -> int:
    return base_damage + _owner_stats.strength
```

```gdscript
# player.gd - Injects dependency
func _ready() -> void:
    $Weapon.setup(stats)
```

## Pattern 6: Callable/Lambda

Pass behavior as parameter:

```gdscript
# timer_utils.gd
static func delayed_call(node: Node, delay: float, callback: Callable) -> void:
    await node.get_tree().create_timer(delay).timeout
    callback.call()

# Usage
TimerUtils.delayed_call(self, 2.0, func(): print("2 seconds later"))
TimerUtils.delayed_call(self, 1.0, queue_free)
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: get_parent() Chains
```gdscript
# Bad: Fragile, breaks on refactor
var player = get_parent().get_parent().get_parent()

# Good: Use groups or signals
var player = get_tree().get_first_node_in_group("player")
```

### Anti-Pattern 2: Global find_node()
```gdscript
# Bad: Searches entire tree, slow and fragile
var enemy = get_tree().root.find_child("Enemy", true, false)

# Good: Use groups or explicit references
var enemies = get_tree().get_nodes_in_group("enemies")
```

### Anti-Pattern 3: Bidirectional References
```gdscript
# Bad: Circular reference, unclear ownership
# player.gd
var current_weapon: Weapon
# weapon.gd
var owner_player: Player

# Good: Parent references child, child signals parent
# player.gd
var weapon: Weapon
# weapon.gd
signal ammo_depleted  # Player connects to this
```

### Anti-Pattern 4: String-Based Signals (Legacy)
```gdscript
# Bad: No autocomplete, typo-prone (Godot 3.x style)
emit_signal("health_changed", 50)
connect("health_changed", self, "_on_health_changed")

# Good: Typed signals (Godot 4.x)
health_changed.emit(50)
health_changed.connect(_on_health_changed)
```

## Decision Guide

| Scenario | Pattern |
|----------|---------|
| Child notifies parent of state change | Signal |
| Parent commands child to act | Direct call |
| Siblings need to communicate | Signal through parent or group |
| Any node to any node | Group or autoload event bus |
| Waiting for something to happen | await signal |
| Global service (audio, saves) | Autoload |
| Need to find multiple nodes | Groups |
| Node needs external configuration | Dependency injection |

## Performance Considerations

1. **Signals are fast** - Don't avoid them for performance
2. **Groups are cached** - `get_nodes_in_group()` is efficient
3. **Avoid per-frame group queries** - Cache references in `_ready()`
4. **Direct calls are fastest** - Use when relationship is stable

```gdscript
# Cache group results if queried frequently
var _cached_enemies: Array[Node]

func _ready() -> void:
    _cached_enemies = get_tree().get_nodes_in_group("enemies")
    get_tree().node_added.connect(_on_node_added)
    get_tree().node_removed.connect(_on_node_removed)

func _on_node_added(node: Node) -> void:
    if node.is_in_group("enemies"):
        _cached_enemies.append(node)
```
