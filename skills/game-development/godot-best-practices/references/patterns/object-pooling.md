# Object Pooling Patterns

Complete guide to implementing object pools in Godot 4.x for performance optimization.

## When to Use Object Pooling

Use pooling when:
- Frequently spawning/despawning objects (bullets, particles, enemies)
- Instantiation causes noticeable stuttering
- Objects have expensive initialization
- Same object types are reused throughout gameplay

Don't use pooling when:
- Objects are spawned rarely
- Each instance needs unique setup
- Memory is more constrained than CPU
- Prototype/early development (premature optimization)

## Pattern 1: Simple Pool

Basic pool for a single object type:

```gdscript
class_name SimplePool
extends Node

@export var pooled_scene: PackedScene
@export var initial_size: int = 20
@export var max_size: int = 100

var _available: Array[Node] = []
var _in_use: Array[Node] = []


func _ready() -> void:
    _warm_pool()


func _warm_pool() -> void:
    for i in initial_size:
        var obj := _create_instance()
        _available.append(obj)


func _create_instance() -> Node:
    var obj := pooled_scene.instantiate()
    obj.process_mode = Node.PROCESS_MODE_DISABLED
    add_child(obj)

    # Connect to auto-release if object has a "finished" signal
    if obj.has_signal("finished"):
        obj.finished.connect(_on_object_finished.bind(obj))

    return obj


func acquire() -> Node:
    var obj: Node

    if _available.is_empty():
        if _in_use.size() >= max_size:
            push_warning("Pool exhausted: %s" % pooled_scene.resource_path)
            return null
        obj = _create_instance()
    else:
        obj = _available.pop_back()

    obj.process_mode = Node.PROCESS_MODE_INHERIT
    obj.show()
    _in_use.append(obj)

    # Call reset if available
    if obj.has_method("reset"):
        obj.reset()

    return obj


func release(obj: Node) -> void:
    if obj not in _in_use:
        push_warning("Releasing object not from this pool")
        return

    _in_use.erase(obj)
    obj.process_mode = Node.PROCESS_MODE_DISABLED
    obj.hide()
    _available.append(obj)


func _on_object_finished(obj: Node) -> void:
    release(obj)


func get_stats() -> Dictionary:
    return {
        "available": _available.size(),
        "in_use": _in_use.size(),
        "total": _available.size() + _in_use.size()
    }
```

## Pattern 2: Pool Manager (Autoload)

Central manager for multiple pool types:

```gdscript
# pool_manager.gd - Autoload singleton
class_name PoolManager
extends Node

var _pools: Dictionary = {}  # scene_path -> SimplePool


func register_pool(scene: PackedScene, initial_size: int = 20, max_size: int = 100) -> void:
    var path := scene.resource_path
    if _pools.has(path):
        push_warning("Pool already registered: %s" % path)
        return

    var pool := SimplePool.new()
    pool.pooled_scene = scene
    pool.initial_size = initial_size
    pool.max_size = max_size
    pool.name = path.get_file().get_basename() + "_Pool"
    add_child(pool)
    _pools[path] = pool


func acquire(scene: PackedScene) -> Node:
    var path := scene.resource_path
    if not _pools.has(path):
        push_error("Pool not registered: %s" % path)
        return null
    return _pools[path].acquire()


func release(scene: PackedScene, obj: Node) -> void:
    var path := scene.resource_path
    if not _pools.has(path):
        push_error("Pool not registered: %s" % path)
        return
    _pools[path].release(obj)


func get_pool(scene: PackedScene) -> SimplePool:
    return _pools.get(scene.resource_path)


func clear_all() -> void:
    for pool in _pools.values():
        pool.queue_free()
    _pools.clear()
```

**Usage:**
```gdscript
# In game initialization
const BULLET_SCENE := preload("res://scenes/bullet.tscn")
const ENEMY_SCENE := preload("res://scenes/enemy.tscn")

func _ready() -> void:
    PoolManager.register_pool(BULLET_SCENE, 50, 200)
    PoolManager.register_pool(ENEMY_SCENE, 10, 50)


# When spawning
func fire_bullet(position: Vector2, direction: Vector2) -> void:
    var bullet := PoolManager.acquire(BULLET_SCENE) as Bullet
    if bullet:
        bullet.global_position = position
        bullet.direction = direction
        bullet.activate()


# Bullet auto-releases via "finished" signal when it hits something or expires
```

## Pattern 3: Poolable Interface

Standard interface for pooled objects:

```gdscript
# poolable.gd - Interface that pooled objects should implement
class_name Poolable
extends Node

signal finished  # Emitted when object should return to pool

var _pool_origin: SimplePool  # Reference to owning pool


## Called when acquired from pool. Reset state here.
func reset() -> void:
    pass


## Called when object should return to pool.
func finish() -> void:
    finished.emit()
```

```gdscript
# bullet.gd - Example poolable object
class_name Bullet
extends Poolable

@export var speed: float = 500.0
@export var lifetime: float = 2.0

var direction: Vector2 = Vector2.RIGHT
var _timer: float = 0.0


func reset() -> void:
    _timer = 0.0
    direction = Vector2.RIGHT
    $CollisionShape2D.disabled = false


func activate() -> void:
    show()
    set_physics_process(true)


func _physics_process(delta: float) -> void:
    position += direction * speed * delta

    _timer += delta
    if _timer >= lifetime:
        _deactivate()


func _on_body_entered(_body: Node2D) -> void:
    # Hit something
    _deactivate()


func _deactivate() -> void:
    $CollisionShape2D.disabled = true
    hide()
    set_physics_process(false)
    finish()  # Signal pool to reclaim this object
```

## Pattern 4: Component-Based Pool

Pool that manages components rather than full scenes:

```gdscript
class_name ComponentPool
extends Node

var _available: Array[Node] = []
var _component_script: GDScript


func _init(script: GDScript, initial_size: int = 10) -> void:
    _component_script = script
    for i in initial_size:
        _available.append(script.new())


func acquire() -> Node:
    if _available.is_empty():
        return _component_script.new()
    return _available.pop_back()


func release(component: Node) -> void:
    if component.has_method("reset"):
        component.reset()
    _available.append(component)
```

## Pool Sizing Strategies

```gdscript
class_name AdaptivePool
extends SimplePool

@export var growth_rate: float = 1.5  # Grow by 50%
@export var shrink_threshold: float = 0.25  # Shrink if <25% used
@export var shrink_delay: float = 30.0  # Seconds before shrinking

var _shrink_timer: float = 0.0
var _peak_usage: int = 0


func _process(delta: float) -> void:
    _track_usage(delta)


func _track_usage(delta: float) -> void:
    var current_usage := _in_use.size()
    _peak_usage = max(_peak_usage, current_usage)

    var total := _available.size() + _in_use.size()
    var usage_ratio := float(current_usage) / total if total > 0 else 0.0

    if usage_ratio < shrink_threshold:
        _shrink_timer += delta
        if _shrink_timer >= shrink_delay:
            _shrink_pool()
            _shrink_timer = 0.0
    else:
        _shrink_timer = 0.0


func _grow_pool() -> void:
    var current_size := _available.size() + _in_use.size()
    var new_objects := int(current_size * (growth_rate - 1.0))
    new_objects = max(1, new_objects)

    for i in new_objects:
        if _available.size() + _in_use.size() >= max_size:
            break
        _available.append(_create_instance())


func _shrink_pool() -> void:
    var target_size := int(_peak_usage * 1.5)  # Keep 50% buffer
    target_size = max(initial_size, target_size)

    while _available.size() + _in_use.size() > target_size and not _available.is_empty():
        var obj := _available.pop_back()
        obj.queue_free()

    _peak_usage = _in_use.size()  # Reset peak
```

## Integration with Scene Tree

Pooled objects often need to be children of specific nodes:

```gdscript
# Spawn pooled object as child of another node
func spawn_effect(parent: Node, position: Vector2) -> void:
    var effect := PoolManager.acquire(EFFECT_SCENE)
    if effect:
        # Reparent to desired location
        effect.get_parent().remove_child(effect)
        parent.add_child(effect)
        effect.global_position = position
        effect.play()


# Alternative: Pool keeps objects, they draw at world positions
func spawn_bullet(world_pos: Vector2) -> void:
    var bullet := PoolManager.acquire(BULLET_SCENE)
    if bullet:
        bullet.global_position = world_pos
        # Bullet stays child of pool but renders at world position
```

## Best Practices

1. **Warm pools at load time** - Pre-instantiate during loading screens
2. **Use signals for auto-release** - Objects signal when they're done
3. **Reset completely** - Clear all state in `reset()` to avoid bugs
4. **Size appropriately** - Profile to find right initial/max sizes
5. **Handle exhaustion gracefully** - Log warnings, don't crash
6. **Clear on scene change** - Release all objects when changing levels
7. **Disable processing** - Pooled objects shouldn't run `_process` when inactive

## Common Gotchas

- **Transform not reset**: Always reset position, rotation, scale in `reset()`
- **Signals still connected**: Disconnect custom signals in `reset()` or `finish()`
- **Physics still active**: Disable collision shapes when pooled
- **Timers still running**: Stop or reset any Timer nodes
- **Animation state**: Reset AnimationPlayer to initial state
