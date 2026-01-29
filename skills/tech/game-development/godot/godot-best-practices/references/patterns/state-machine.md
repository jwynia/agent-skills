# State Machine Patterns

Complete guide to implementing state machines in Godot 4.x GDScript.

## When to Use State Machines

Use state machines when:
- Entity has distinct behavioral modes (idle, walking, attacking)
- Transitions between modes have specific rules
- State-specific logic would clutter a single script
- You need clear visual representation of behavior flow

## Pattern 1: Enum-Based State Machine

Simplest approach for entities with few states:

```gdscript
class_name Player
extends CharacterBody2D

enum State { IDLE, WALK, JUMP, ATTACK, HURT }

signal state_changed(old_state: State, new_state: State)

@export var move_speed: float = 200.0
@export var jump_force: float = -400.0

var current_state: State = State.IDLE:
    set(value):
        if current_state == value:
            return
        var old := current_state
        _exit_state(current_state)
        current_state = value
        _enter_state(current_state)
        state_changed.emit(old, current_state)

var _velocity: Vector2 = Vector2.ZERO


func _physics_process(delta: float) -> void:
    _process_state(delta)
    move_and_slide()


func _process_state(delta: float) -> void:
    match current_state:
        State.IDLE:
            _process_idle(delta)
        State.WALK:
            _process_walk(delta)
        State.JUMP:
            _process_jump(delta)
        State.ATTACK:
            _process_attack(delta)
        State.HURT:
            _process_hurt(delta)


func _enter_state(state: State) -> void:
    match state:
        State.IDLE:
            $AnimationPlayer.play("idle")
        State.WALK:
            $AnimationPlayer.play("walk")
        State.JUMP:
            velocity.y = jump_force
            $AnimationPlayer.play("jump")
        State.ATTACK:
            $AnimationPlayer.play("attack")
        State.HURT:
            $AnimationPlayer.play("hurt")
            velocity = Vector2.ZERO


func _exit_state(state: State) -> void:
    match state:
        State.ATTACK:
            $Hitbox.monitoring = false


func _process_idle(_delta: float) -> void:
    var input_dir := Input.get_axis("move_left", "move_right")
    if input_dir != 0:
        current_state = State.WALK
    elif Input.is_action_just_pressed("jump") and is_on_floor():
        current_state = State.JUMP
    elif Input.is_action_just_pressed("attack"):
        current_state = State.ATTACK


func _process_walk(delta: float) -> void:
    var input_dir := Input.get_axis("move_left", "move_right")
    velocity.x = input_dir * move_speed

    if input_dir == 0:
        current_state = State.IDLE
    elif Input.is_action_just_pressed("jump") and is_on_floor():
        current_state = State.JUMP
    elif Input.is_action_just_pressed("attack"):
        current_state = State.ATTACK


func _process_jump(_delta: float) -> void:
    velocity.y += get_gravity().y * _delta

    if is_on_floor():
        current_state = State.IDLE


func _process_attack(_delta: float) -> void:
    # Wait for animation to finish
    pass


func _process_hurt(_delta: float) -> void:
    # Wait for hurt animation
    pass


# Called by AnimationPlayer at end of attack/hurt animations
func _on_animation_finished(anim_name: StringName) -> void:
    if anim_name == "attack" or anim_name == "hurt":
        current_state = State.IDLE
```

## Pattern 2: State Node Pattern

Each state is a child node. Better for complex states with their own resources:

```gdscript
# state_machine.gd - Parent node managing state transitions
class_name StateMachine
extends Node

signal state_changed(old_state: State, new_state: State)

@export var initial_state: State

var current_state: State
var states: Dictionary = {}


func _ready() -> void:
    # Register all State children
    for child in get_children():
        if child is State:
            states[child.name] = child
            child.state_machine = self
            child.process_mode = Node.PROCESS_MODE_DISABLED

    # Start initial state
    if initial_state:
        current_state = initial_state
        current_state.process_mode = Node.PROCESS_MODE_INHERIT
        current_state.enter()


func _process(delta: float) -> void:
    if current_state:
        current_state.update(delta)


func _physics_process(delta: float) -> void:
    if current_state:
        current_state.physics_update(delta)


func transition_to(state_name: String) -> void:
    if not states.has(state_name):
        push_error("State not found: " + state_name)
        return

    var new_state: State = states[state_name]
    if current_state == new_state:
        return

    var old_state := current_state

    if current_state:
        current_state.exit()
        current_state.process_mode = Node.PROCESS_MODE_DISABLED

    current_state = new_state
    current_state.process_mode = Node.PROCESS_MODE_INHERIT
    current_state.enter()

    state_changed.emit(old_state, new_state)
```

```gdscript
# state.gd - Base class for all states
class_name State
extends Node

var state_machine: StateMachine


func enter() -> void:
    pass


func exit() -> void:
    pass


func update(_delta: float) -> void:
    pass


func physics_update(_delta: float) -> void:
    pass
```

```gdscript
# idle_state.gd - Concrete state implementation
class_name IdleState
extends State

@onready var player: Player = get_parent().get_parent()


func enter() -> void:
    player.animation_player.play("idle")


func physics_update(_delta: float) -> void:
    var input_dir := Input.get_axis("move_left", "move_right")

    if input_dir != 0:
        state_machine.transition_to("Walk")
    elif Input.is_action_just_pressed("jump") and player.is_on_floor():
        state_machine.transition_to("Jump")
```

**Scene Tree Structure:**
```
Player (CharacterBody2D)
├── Sprite2D
├── CollisionShape2D
├── AnimationPlayer
└── StateMachine (Node)
    ├── Idle (State)
    ├── Walk (State)
    ├── Jump (State)
    └── Attack (State)
```

## Pattern 3: Pushdown Automaton

Stack-based state machine for states that need to "return" (menus, pause):

```gdscript
class_name PushdownStateMachine
extends Node

signal state_pushed(state: State)
signal state_popped(state: State)

var _stack: Array[State] = []

var current_state: State:
    get:
        return _stack.back() if not _stack.is_empty() else null


func _process(delta: float) -> void:
    if current_state:
        current_state.update(delta)


func push_state(state: State) -> void:
    if current_state:
        current_state.pause()

    _stack.push_back(state)
    state.enter()
    state_pushed.emit(state)


func pop_state() -> State:
    if _stack.is_empty():
        return null

    var popped := _stack.pop_back()
    popped.exit()
    state_popped.emit(popped)

    if current_state:
        current_state.resume()

    return popped


func replace_state(state: State) -> void:
    pop_state()
    push_state(state)
```

```gdscript
# Pauseable state base class
class_name PushdownState
extends State

func pause() -> void:
    pass

func resume() -> void:
    pass
```

## Pattern 4: Hierarchical State Machine

States can have substates (e.g., Grounded contains Idle and Walk):

```gdscript
class_name HierarchicalState
extends State

@export var initial_substate: HierarchicalState

var active_substate: HierarchicalState
var substates: Dictionary = {}


func _ready() -> void:
    for child in get_children():
        if child is HierarchicalState:
            substates[child.name] = child
            child.parent_state = self


func enter() -> void:
    if initial_substate:
        transition_to_substate(initial_substate.name)


func exit() -> void:
    if active_substate:
        active_substate.exit()
        active_substate = null


func update(delta: float) -> void:
    if active_substate:
        active_substate.update(delta)


func transition_to_substate(state_name: String) -> void:
    if not substates.has(state_name):
        return

    if active_substate:
        active_substate.exit()

    active_substate = substates[state_name]
    active_substate.enter()
```

**Example hierarchy:**
```
StateMachine
├── Grounded (HierarchicalState)
│   ├── Idle (State)
│   └── Walk (State)
├── Airborne (HierarchicalState)
│   ├── Jump (State)
│   └── Fall (State)
└── Combat (HierarchicalState)
    ├── Attack (State)
    └── Block (State)
```

## Transition Helpers

Utility for defining valid transitions:

```gdscript
class_name StateTransitions
extends RefCounted

var _transitions: Dictionary = {}

func allow(from: int, to: int) -> StateTransitions:
    if not _transitions.has(from):
        _transitions[from] = []
    _transitions[from].append(to)
    return self

func allow_from_any(to: int) -> StateTransitions:
    # Mark as "any" transition
    if not _transitions.has(-1):
        _transitions[-1] = []
    _transitions[-1].append(to)
    return self

func can_transition(from: int, to: int) -> bool:
    # Check "any" transitions first
    if _transitions.has(-1) and to in _transitions[-1]:
        return true
    # Check specific transitions
    return _transitions.has(from) and to in _transitions[from]
```

```gdscript
# Usage
var transitions := StateTransitions.new()
transitions \
    .allow(State.IDLE, State.WALK) \
    .allow(State.IDLE, State.JUMP) \
    .allow(State.WALK, State.IDLE) \
    .allow(State.WALK, State.JUMP) \
    .allow(State.JUMP, State.IDLE) \
    .allow_from_any(State.HURT)  # Can be hurt from any state

func change_state(new_state: State) -> bool:
    if not transitions.can_transition(current_state, new_state):
        return false
    current_state = new_state
    return true
```

## Best Practices

1. **Keep states focused** - One state, one responsibility
2. **Use signals for external communication** - States shouldn't directly modify other systems
3. **Validate transitions** - Not all state changes should be allowed
4. **Handle animation in enter/exit** - Keeps animation logic centralized
5. **Consider state history** - Sometimes you need to return to previous state
6. **Test state transitions** - Use unit tests for transition logic
