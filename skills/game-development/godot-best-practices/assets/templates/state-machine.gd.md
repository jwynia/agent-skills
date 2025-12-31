# State Machine Template

Enum-based state machine pattern for Godot 4.x.

## Usage

Use for entities with distinct behavioral modes (idle, walking, attacking, etc.).

## Template

```gdscript
class_name ${ClassName}
extends ${ParentClass}
## ${Description} with state machine behavior.


# === Signals ===

## Emitted when state changes
signal state_changed(old_state: State, new_state: State)


# === Enums ===

enum State {
    ${IDLE},
    ${MOVING},
    ${ATTACKING},
    ${HURT},
}


# === Exports ===

@export var initial_state: State = State.${IDLE}


# === Public Variables ===

var current_state: State:
    set(value):
        if current_state == value:
            return
        var old_state := current_state
        _exit_state(current_state)
        current_state = value
        _enter_state(current_state)
        state_changed.emit(old_state, current_state)


# === Private Variables ===

var _state_time: float = 0.0


# === Onready References ===

@onready var _animation_player: AnimationPlayer = $AnimationPlayer
@onready var _sprite: Sprite2D = $Sprite2D


# === Lifecycle Methods ===

func _ready() -> void:
    current_state = initial_state


func _physics_process(delta: float) -> void:
    _state_time += delta
    _process_state(delta)


# === State Machine Core ===

func _enter_state(state: State) -> void:
    _state_time = 0.0

    match state:
        State.${IDLE}:
            _animation_player.play("idle")
        State.${MOVING}:
            _animation_player.play("move")
        State.${ATTACKING}:
            _animation_player.play("attack")
        State.${HURT}:
            _animation_player.play("hurt")


func _exit_state(state: State) -> void:
    match state:
        State.${IDLE}:
            pass
        State.${MOVING}:
            pass
        State.${ATTACKING}:
            pass
        State.${HURT}:
            pass


func _process_state(delta: float) -> void:
    match current_state:
        State.${IDLE}:
            _process_${idle}(delta)
        State.${MOVING}:
            _process_${moving}(delta)
        State.${ATTACKING}:
            _process_${attacking}(delta)
        State.${HURT}:
            _process_${hurt}(delta)


# === State Processors ===

func _process_${idle}(_delta: float) -> void:
    # Check for transitions
    if ${should_move}:
        current_state = State.${MOVING}
    elif ${should_attack}:
        current_state = State.${ATTACKING}


func _process_${moving}(delta: float) -> void:
    # Movement logic
    ${# velocity = direction * speed}

    # Check for transitions
    if ${should_stop}:
        current_state = State.${IDLE}
    elif ${should_attack}:
        current_state = State.${ATTACKING}


func _process_${attacking}(_delta: float) -> void:
    # Attack logic (usually wait for animation)
    pass


func _process_${hurt}(_delta: float) -> void:
    # Hurt logic (usually wait for animation)
    pass


# === Signal Handlers ===

func _on_animation_player_animation_finished(anim_name: StringName) -> void:
    match anim_name:
        "attack":
            current_state = State.${IDLE}
        "hurt":
            current_state = State.${IDLE}


# === Public Methods ===

## Force state change (useful for external events like taking damage)
func force_state(new_state: State) -> void:
    current_state = new_state


## Check if entity is in a specific state
func is_in_state(state: State) -> bool:
    return current_state == state
```

## Player Example

Complete player controller with state machine:

```gdscript
class_name Player
extends CharacterBody2D
## Player character with state machine movement.


signal died


enum State { IDLE, WALK, JUMP, ATTACK, HURT, DEAD }


@export var move_speed: float = 200.0
@export var jump_force: float = -400.0
@export var gravity: float = 980.0


var current_state: State = State.IDLE:
    set(value):
        if current_state == value:
            return
        _exit_state(current_state)
        current_state = value
        _enter_state(current_state)


var _input_direction: float = 0.0


@onready var _anim: AnimationPlayer = $AnimationPlayer
@onready var _sprite: Sprite2D = $Sprite2D


func _physics_process(delta: float) -> void:
    _input_direction = Input.get_axis("move_left", "move_right")
    _apply_gravity(delta)
    _process_state(delta)
    move_and_slide()


func _apply_gravity(delta: float) -> void:
    if not is_on_floor():
        velocity.y += gravity * delta


func _enter_state(state: State) -> void:
    match state:
        State.IDLE:
            _anim.play("idle")
        State.WALK:
            _anim.play("walk")
        State.JUMP:
            velocity.y = jump_force
            _anim.play("jump")
        State.ATTACK:
            velocity.x = 0
            _anim.play("attack")
        State.HURT:
            velocity = Vector2(-_sprite.scale.x * 100, -200)
            _anim.play("hurt")
        State.DEAD:
            velocity = Vector2.ZERO
            _anim.play("death")
            died.emit()


func _exit_state(_state: State) -> void:
    pass


func _process_state(_delta: float) -> void:
    match current_state:
        State.IDLE:
            velocity.x = 0
            if _input_direction != 0:
                current_state = State.WALK
            elif Input.is_action_just_pressed("jump") and is_on_floor():
                current_state = State.JUMP
            elif Input.is_action_just_pressed("attack"):
                current_state = State.ATTACK

        State.WALK:
            velocity.x = _input_direction * move_speed
            _sprite.scale.x = sign(_input_direction) if _input_direction != 0 else _sprite.scale.x
            if _input_direction == 0:
                current_state = State.IDLE
            elif Input.is_action_just_pressed("jump") and is_on_floor():
                current_state = State.JUMP
            elif Input.is_action_just_pressed("attack"):
                current_state = State.ATTACK

        State.JUMP:
            velocity.x = _input_direction * move_speed
            if is_on_floor():
                current_state = State.IDLE

        State.ATTACK, State.HURT:
            pass  # Wait for animation

        State.DEAD:
            pass  # No processing


func take_damage(amount: int) -> void:
    if current_state == State.DEAD:
        return
    # Apply damage, check death, etc.
    current_state = State.HURT


func _on_animation_player_animation_finished(anim_name: StringName) -> void:
    if anim_name == "attack" or anim_name == "hurt":
        current_state = State.IDLE
```

## Notes

- State changes through property setter for consistency
- `_enter_state` handles setup (animations, effects)
- `_exit_state` handles cleanup
- `_process_state` handles per-frame logic and transitions
- Signal handlers can trigger state changes (animation finished)
- Consider extracting to separate State nodes for complex behavior
