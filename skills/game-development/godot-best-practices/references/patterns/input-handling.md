# Input Handling Patterns

Complete guide to implementing robust input systems in Godot 4.x.

## Input System Basics

Godot's input system provides:
- **Input Map**: Named actions mapped to keys/buttons
- **Input singleton**: Query current input state
- **_input()/_unhandled_input()**: Event-based handling

## Pattern 1: Action-Based Input

Always use Input Map actions instead of raw key codes:

```gdscript
# Project Settings > Input Map defines:
# - move_left: A, Left Arrow, Gamepad Left
# - move_right: D, Right Arrow, Gamepad Right
# - jump: Space, Gamepad A
# - attack: Mouse Left, Gamepad X

func _physics_process(_delta: float) -> void:
    # Axis input (returns -1 to 1)
    var input_dir := Input.get_axis("move_left", "move_right")
    velocity.x = input_dir * speed

    # 2D vector input
    var move_vector := Input.get_vector(
        "move_left", "move_right",
        "move_up", "move_down"
    )

    # Button states
    if Input.is_action_just_pressed("jump"):
        jump()

    if Input.is_action_pressed("attack"):
        charge_attack()

    if Input.is_action_just_released("attack"):
        release_attack()


func _unhandled_input(event: InputEvent) -> void:
    # Event-based handling (good for one-shot actions)
    if event.is_action_pressed("pause"):
        toggle_pause()
        get_viewport().set_input_as_handled()
```

## Pattern 2: Input Buffer

Buffer inputs for responsive controls (fighting games, platformers):

```gdscript
class_name InputBuffer
extends Node

## How long inputs stay in buffer (seconds)
@export var buffer_duration: float = 0.15

var _buffer: Dictionary = {}  # action_name -> timestamp


func _process(_delta: float) -> void:
    _update_buffer()


func _update_buffer() -> void:
    var current_time := Time.get_ticks_msec() / 1000.0

    # Add new inputs to buffer
    for action in ["jump", "attack", "dash"]:
        if Input.is_action_just_pressed(action):
            _buffer[action] = current_time

    # Remove expired inputs
    var expired: Array[String] = []
    for action in _buffer:
        if current_time - _buffer[action] > buffer_duration:
            expired.append(action)

    for action in expired:
        _buffer.erase(action)


## Check if action is buffered (and consume it)
func consume(action: String) -> bool:
    if _buffer.has(action):
        _buffer.erase(action)
        return true
    return false


## Check if action is buffered (without consuming)
func is_buffered(action: String) -> bool:
    return _buffer.has(action)


## Clear specific action from buffer
func clear(action: String) -> void:
    _buffer.erase(action)


## Clear all buffered inputs
func clear_all() -> void:
    _buffer.clear()
```

**Usage:**
```gdscript
@onready var input_buffer: InputBuffer = $InputBuffer

func _physics_process(_delta: float) -> void:
    # Player can press jump slightly before landing
    if is_on_floor() and input_buffer.consume("jump"):
        jump()

    # Coyote time: Can jump briefly after leaving platform
    if _was_on_floor and not is_on_floor():
        _coyote_timer = COYOTE_TIME

    if _coyote_timer > 0 and input_buffer.consume("jump"):
        jump()
```

## Pattern 3: Input State Machine

Different input contexts for different game states:

```gdscript
class_name InputContext
extends RefCounted

var _actions: Dictionary = {}  # action_name -> Callable


func bind(action: String, callback: Callable) -> InputContext:
    _actions[action] = callback
    return self


func handle_input(event: InputEvent) -> bool:
    for action in _actions:
        if event.is_action_pressed(action):
            _actions[action].call()
            return true
    return false


func handle_process() -> void:
    # For continuous input (movement)
    pass
```

```gdscript
class_name InputManager
extends Node

var _contexts: Array[InputContext] = []
var _active_context: InputContext


func push_context(context: InputContext) -> void:
    _contexts.push_back(context)
    _active_context = context


func pop_context() -> InputContext:
    if _contexts.is_empty():
        return null
    var popped := _contexts.pop_back()
    _active_context = _contexts.back() if not _contexts.is_empty() else null
    return popped


func _unhandled_input(event: InputEvent) -> void:
    if _active_context and _active_context.handle_input(event):
        get_viewport().set_input_as_handled()
```

**Usage:**
```gdscript
# Define contexts
var gameplay_context := InputContext.new() \
    .bind("jump", _on_jump) \
    .bind("attack", _on_attack) \
    .bind("pause", _on_pause)

var menu_context := InputContext.new() \
    .bind("ui_accept", _on_menu_select) \
    .bind("ui_cancel", _on_menu_back) \
    .bind("pause", _on_unpause)

func _ready() -> void:
    InputManager.push_context(gameplay_context)

func _on_pause() -> void:
    InputManager.push_context(menu_context)
    get_tree().paused = true

func _on_unpause() -> void:
    InputManager.pop_context()
    get_tree().paused = false
```

## Pattern 4: Rebindable Controls

Allow players to customize controls:

```gdscript
class_name InputRemapper
extends Node

const SAVE_PATH := "user://input_config.cfg"

# Default mappings backup
var _default_mappings: Dictionary = {}


func _ready() -> void:
    _save_defaults()
    load_custom_mappings()


func _save_defaults() -> void:
    for action in InputMap.get_actions():
        if action.begins_with("ui_"):
            continue  # Skip built-in UI actions
        _default_mappings[action] = InputMap.action_get_events(action).duplicate()


func remap_action(action: String, event: InputEvent) -> void:
    # Clear existing mappings
    InputMap.action_erase_events(action)
    # Add new mapping
    InputMap.action_add_event(action, event)
    # Save to disk
    save_custom_mappings()


func reset_action(action: String) -> void:
    if _default_mappings.has(action):
        InputMap.action_erase_events(action)
        for event in _default_mappings[action]:
            InputMap.action_add_event(action, event)
    save_custom_mappings()


func reset_all() -> void:
    for action in _default_mappings:
        reset_action(action)


func save_custom_mappings() -> void:
    var config := ConfigFile.new()

    for action in InputMap.get_actions():
        if action.begins_with("ui_"):
            continue

        var events := InputMap.action_get_events(action)
        for i in events.size():
            var event := events[i]
            var key := "%s_%d" % [action, i]

            if event is InputEventKey:
                config.set_value("keys", key, event.keycode)
            elif event is InputEventMouseButton:
                config.set_value("mouse", key, event.button_index)
            elif event is InputEventJoypadButton:
                config.set_value("joypad_button", key, event.button_index)
            elif event is InputEventJoypadMotion:
                config.set_value("joypad_axis", key, {
                    "axis": event.axis,
                    "value": event.axis_value
                })

    config.save(SAVE_PATH)


func load_custom_mappings() -> void:
    var config := ConfigFile.new()
    if config.load(SAVE_PATH) != OK:
        return

    # Clear current and apply saved
    for action in _default_mappings:
        InputMap.action_erase_events(action)

    # Load keyboard
    for key in config.get_section_keys("keys"):
        var action := key.rsplit("_", true, 1)[0]
        var keycode: int = config.get_value("keys", key)
        var event := InputEventKey.new()
        event.keycode = keycode
        InputMap.action_add_event(action, event)

    # Load mouse buttons
    for key in config.get_section_keys("mouse"):
        var action := key.rsplit("_", true, 1)[0]
        var button: int = config.get_value("mouse", key)
        var event := InputEventMouseButton.new()
        event.button_index = button
        InputMap.action_add_event(action, event)

    # Similar for joypad...
```

## Pattern 5: Combo System

Detect input sequences (fighting game combos):

```gdscript
class_name ComboDetector
extends Node

signal combo_detected(combo_name: String)

@export var combo_window: float = 0.5  # Time between inputs

var _input_history: Array[Dictionary] = []  # {action, timestamp}
var _combos: Dictionary = {}  # combo_name -> Array[String]


func register_combo(name: String, sequence: Array[String]) -> void:
    _combos[name] = sequence


func _unhandled_input(event: InputEvent) -> void:
    for action in ["up", "down", "left", "right", "punch", "kick"]:
        if event.is_action_pressed(action):
            _record_input(action)
            _check_combos()


func _record_input(action: String) -> void:
    var current_time := Time.get_ticks_msec() / 1000.0

    # Remove old inputs
    _input_history = _input_history.filter(
        func(entry): return current_time - entry.timestamp < combo_window
    )

    _input_history.append({
        "action": action,
        "timestamp": current_time
    })


func _check_combos() -> void:
    var recent_actions: Array[String] = []
    for entry in _input_history:
        recent_actions.append(entry.action)

    for combo_name in _combos:
        var sequence: Array = _combos[combo_name]
        if _ends_with_sequence(recent_actions, sequence):
            combo_detected.emit(combo_name)
            _input_history.clear()  # Consume inputs
            break


func _ends_with_sequence(history: Array, sequence: Array) -> bool:
    if history.size() < sequence.size():
        return false

    var start := history.size() - sequence.size()
    for i in sequence.size():
        if history[start + i] != sequence[i]:
            return false
    return true
```

**Usage:**
```gdscript
@onready var combo_detector: ComboDetector = $ComboDetector

func _ready() -> void:
    combo_detector.register_combo("hadouken", ["down", "right", "punch"])
    combo_detector.register_combo("shoryuken", ["right", "down", "right", "punch"])
    combo_detector.combo_detected.connect(_on_combo)

func _on_combo(combo_name: String) -> void:
    match combo_name:
        "hadouken":
            spawn_fireball()
        "shoryuken":
            perform_uppercut()
```

## Touch Input

Handle touch for mobile:

```gdscript
func _input(event: InputEvent) -> void:
    if event is InputEventScreenTouch:
        if event.pressed:
            _on_touch_start(event.position, event.index)
        else:
            _on_touch_end(event.position, event.index)

    elif event is InputEventScreenDrag:
        _on_touch_drag(event.position, event.relative, event.index)


# Virtual joystick example
var _touch_origin: Vector2
var _touch_current: Vector2
const JOYSTICK_RADIUS := 100.0

func _on_touch_start(pos: Vector2, _index: int) -> void:
    _touch_origin = pos
    _touch_current = pos

func _on_touch_drag(pos: Vector2, _relative: Vector2, _index: int) -> void:
    _touch_current = pos

func get_virtual_joystick() -> Vector2:
    var diff := _touch_current - _touch_origin
    if diff.length() > JOYSTICK_RADIUS:
        diff = diff.normalized() * JOYSTICK_RADIUS
    return diff / JOYSTICK_RADIUS  # -1 to 1
```

## Best Practices

1. **Always use Input Map** - Never hardcode key constants
2. **Use actions semantically** - "jump" not "space_pressed"
3. **Buffer important inputs** - Especially for action games
4. **Support multiple input methods** - Keyboard, gamepad, touch
5. **Allow rebinding** - Players expect customization
6. **Consider accessibility** - One-handed modes, toggle vs hold
7. **Handle focus** - Disable input when window loses focus

## Common Gotchas

- **Input not detected in paused game**: Set `process_mode` to `PROCESS_MODE_ALWAYS`
- **Double input**: Check both `_input` and `_process` aren't handling same action
- **Gamepad not working**: Ensure device is connected before InputMap check
- **UI consuming input**: Use `_unhandled_input` for gameplay
- **Mouse position wrong**: Use `get_global_mouse_position()` for world space
