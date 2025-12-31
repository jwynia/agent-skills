# Coroutines and Await

Guide to asynchronous programming with `await` in GDScript 2.0 (Godot 4.x).

## Await Basics

`await` pauses function execution until a signal is emitted or coroutine completes.

```gdscript
# Wait for signal
await some_signal

# Wait for timer
await get_tree().create_timer(1.0).timeout

# Wait for animation
await $AnimationPlayer.animation_finished

# Wait for coroutine
await some_async_function()
```

## Pattern 1: Simple Delays

```gdscript
func flash_damage() -> void:
    $Sprite.modulate = Color.RED
    await get_tree().create_timer(0.1).timeout
    $Sprite.modulate = Color.WHITE

func spawn_with_delay(delay: float) -> void:
    await get_tree().create_timer(delay).timeout
    var enemy := ENEMY_SCENE.instantiate()
    add_child(enemy)

func countdown() -> void:
    for i in range(3, 0, -1):
        $Label.text = str(i)
        await get_tree().create_timer(1.0).timeout
    $Label.text = "GO!"
```

## Pattern 2: Animation Sequences

```gdscript
func play_attack_sequence() -> void:
    # Play animation and wait for it
    $AnimationPlayer.play("wind_up")
    await $AnimationPlayer.animation_finished

    # Deal damage at the right moment
    deal_damage()

    $AnimationPlayer.play("swing")
    await $AnimationPlayer.animation_finished

    $AnimationPlayer.play("recover")
    await $AnimationPlayer.animation_finished

    # Animation sequence complete
    attack_finished.emit()


func death_sequence() -> void:
    # Disable gameplay
    set_physics_process(false)
    $CollisionShape2D.disabled = true

    # Play death animation
    $AnimationPlayer.play("death")
    await $AnimationPlayer.animation_finished

    # Fade out
    var tween := create_tween()
    tween.tween_property($Sprite, "modulate:a", 0.0, 0.5)
    await tween.finished

    queue_free()
```

## Pattern 3: Tweens

```gdscript
func move_to(target_pos: Vector2) -> void:
    var tween := create_tween()
    tween.tween_property(self, "position", target_pos, 0.5)
    await tween.finished

func fade_in() -> void:
    modulate.a = 0.0
    var tween := create_tween()
    tween.tween_property(self, "modulate:a", 1.0, 0.3)
    await tween.finished

func bounce_scale() -> void:
    var tween := create_tween()
    tween.tween_property(self, "scale", Vector2(1.2, 1.2), 0.1)
    tween.tween_property(self, "scale", Vector2(1.0, 1.0), 0.1)
    await tween.finished
```

## Pattern 4: Waiting for Signals

```gdscript
func wait_for_player_input() -> void:
    # Pause until player presses button
    await $Button.pressed
    continue_dialogue()

func wait_for_any_key() -> void:
    # Custom signal from input handling
    await any_key_pressed
    start_game()

func wait_for_player_death() -> void:
    var player := get_tree().get_first_node_in_group("player")
    await player.died
    show_game_over()
```

## Pattern 5: Chained Coroutines

```gdscript
# Coroutines can await other coroutines
func level_transition() -> void:
    await fade_out()
    await load_next_level()
    await fade_in()

func fade_out() -> void:
    var tween := create_tween()
    tween.tween_property($FadeOverlay, "modulate:a", 1.0, 0.5)
    await tween.finished

func load_next_level() -> void:
    # Simulate loading
    await get_tree().create_timer(0.5).timeout
    get_tree().change_scene_to_file(_next_level_path)

func fade_in() -> void:
    var tween := create_tween()
    tween.tween_property($FadeOverlay, "modulate:a", 0.0, 0.5)
    await tween.finished
```

## Pattern 6: Parallel Operations

```gdscript
# Wait for multiple things using signals
func spawn_wave() -> void:
    var enemies: Array[Enemy] = []

    # Spawn all enemies
    for i in 5:
        var enemy := spawn_enemy()
        enemies.append(enemy)

    # Wait for all to die
    for enemy in enemies:
        await enemy.died

    wave_complete.emit()


# Or use a counter
var _enemies_alive: int = 0

func spawn_wave_with_counter() -> void:
    for i in 5:
        var enemy := spawn_enemy()
        enemy.died.connect(_on_enemy_died)
        _enemies_alive += 1

func _on_enemy_died() -> void:
    _enemies_alive -= 1
    if _enemies_alive == 0:
        wave_complete.emit()
```

## Pattern 7: Interruptible Coroutines

```gdscript
var _current_tween: Tween

func move_to_interruptible(target: Vector2) -> void:
    # Cancel previous movement
    if _current_tween and _current_tween.is_valid():
        _current_tween.kill()

    _current_tween = create_tween()
    _current_tween.tween_property(self, "position", target, 0.5)
    await _current_tween.finished


# Using a flag
var _is_dashing: bool = false

func dash() -> void:
    if _is_dashing:
        return

    _is_dashing = true
    var dash_target := position + facing * DASH_DISTANCE

    var tween := create_tween()
    tween.tween_property(self, "position", dash_target, DASH_DURATION)
    await tween.finished

    _is_dashing = false
```

## Pattern 8: Timeout Pattern

```gdscript
# Wait for signal with timeout
func wait_with_timeout(sig: Signal, timeout: float) -> bool:
    var timer := get_tree().create_timer(timeout)

    # Race between signal and timeout
    var result = await Promise.race([sig, timer.timeout])

    return result != timer  # True if signal won


# Simpler approach with custom signal
signal _timeout_or_result(succeeded: bool)

func wait_for_response(timeout: float) -> bool:
    # Start timeout timer
    var timer := get_tree().create_timer(timeout)
    timer.timeout.connect(func(): _timeout_or_result.emit(false))

    # Connect to actual signal
    response_received.connect(func(): _timeout_or_result.emit(true), CONNECT_ONE_SHOT)

    var result: bool = await _timeout_or_result
    return result
```

## Common Gotchas

### Gotcha 1: Node Freed During Await

```gdscript
# Dangerous - node might be freed
func risky_function() -> void:
    await get_tree().create_timer(5.0).timeout
    $Sprite.visible = false  # Crash if node freed!

# Safe - check validity
func safe_function() -> void:
    await get_tree().create_timer(5.0).timeout
    if is_instance_valid(self):
        $Sprite.visible = false
```

### Gotcha 2: Multiple Awaits on Same Coroutine

```gdscript
# Each await creates new execution
func do_thing() -> void:
    await get_tree().create_timer(1.0).timeout
    print("Done")

# Calling multiple times runs concurrently!
func _ready() -> void:
    do_thing()  # Starts coroutine 1
    do_thing()  # Starts coroutine 2 immediately
    do_thing()  # Starts coroutine 3 immediately
    # All three print "Done" after 1 second
```

### Gotcha 3: Await in _process

```gdscript
# BAD - creates new coroutine every frame
func _process(_delta: float) -> void:
    await get_tree().create_timer(1.0).timeout  # Don't do this!

# GOOD - use flag or state
var _is_waiting: bool = false

func _process(_delta: float) -> void:
    if not _is_waiting and should_wait:
        _start_wait()

func _start_wait() -> void:
    _is_waiting = true
    await get_tree().create_timer(1.0).timeout
    _is_waiting = false
```

### Gotcha 4: Return Value from Coroutine

```gdscript
# Coroutines can return values
func load_data() -> Dictionary:
    await get_tree().create_timer(0.1).timeout  # Simulate load
    return {"key": "value"}

# Must await to get return value
func _ready() -> void:
    var data: Dictionary = await load_data()
    print(data)  # {"key": "value"}

    # Without await, you get a coroutine object
    var wrong = load_data()  # GDScriptFunctionState, not Dictionary!
```

## Best Practices

1. **Check `is_instance_valid()`** after long awaits
2. **Use flags** to prevent concurrent coroutines
3. **Cancel tweens** before starting new ones
4. **Avoid await in `_process()`** - use states instead
5. **Keep coroutines short** - long chains are hard to debug
6. **Use signals** for complex async flows
7. **Handle interruption** - what happens if node freed?

## Migration from Godot 3.x

| Godot 3.x | Godot 4.x |
|-----------|-----------|
| `yield(timer, "timeout")` | `await timer.timeout` |
| `yield(anim, "animation_finished")` | `await anim.animation_finished` |
| `yield(get_tree().create_timer(1), "timeout")` | `await get_tree().create_timer(1).timeout` |
| `yield(coroutine())` | `await coroutine()` |
| Returns `GDScriptFunctionState` | Returns signal or coroutine |
