# Base Script Template

Standard template for new GDScript files in Godot 4.x.

## Usage

Copy and customize for new scripts. Replace all `${placeholders}` with actual values. Remove unused sections.

## Template

```gdscript
class_name ${ClassName}
extends ${ParentClass}
## ${Brief one-line description of this class.}
##
## ${Optional longer description explaining purpose, usage, and any
## important notes about how this class should be used.}


# === Signals ===

## Emitted when ${describe when signal fires}
signal ${signal_name}(${param}: ${Type})


# === Enums ===

enum ${EnumName} {
    ${VALUE_ONE},
    ${VALUE_TWO},
    ${VALUE_THREE},
}


# === Exports ===

@export_group("${Group Name}")
## ${Description of this property}
@export var ${property_name}: ${Type} = ${default_value}

@export_group("${Another Group}")
@export var ${another_property}: ${Type}


# === Constants ===

const ${CONSTANT_NAME}: ${Type} = ${value}


# === Public Variables ===

## ${Description of this public variable}
var ${public_var}: ${Type} = ${default}


# === Private Variables ===

var _${private_var}: ${Type}
var _${another_private}: ${Type} = ${default}


# === Onready References ===

@onready var _${node_ref}: ${NodeType} = $${NodePath}
@onready var _${unique_ref}: ${NodeType} = %${UniqueName}


# === Lifecycle Methods ===

func _ready() -> void:
    ${# Initialize state, connect signals}
    pass


func _process(delta: float) -> void:
    ${# Called every frame}
    pass


func _physics_process(delta: float) -> void:
    ${# Called every physics frame (fixed timestep)}
    pass


func _input(event: InputEvent) -> void:
    ${# Handle input events}
    pass


func _unhandled_input(event: InputEvent) -> void:
    ${# Handle input not consumed by UI}
    pass


# === Public Methods ===

## ${Description of what this method does}
## ${param_name}: ${Description of parameter}
## Returns: ${Description of return value}
func ${public_method}(${param}: ${Type}) -> ${ReturnType}:
    ${# Implementation}
    return ${value}


# === Private Methods ===

func _${private_method}() -> void:
    ${# Internal implementation}
    pass


# === Signal Handlers ===

func _on_${signal_source}_${signal_name}(${params}) -> void:
    ${# Handle signal}
    pass
```

## Section Order

Keep sections in this order for consistency:

1. `class_name` and `extends`
2. Class documentation (##)
3. Signals
4. Enums
5. Exports (grouped with `@export_group`)
6. Constants
7. Public variables
8. Private variables (prefixed with `_`)
9. `@onready` references
10. Lifecycle methods (`_ready`, `_process`, etc.)
11. Public methods
12. Private methods (prefixed with `_`)
13. Signal handlers (prefixed with `_on_`)

## Minimal Template

For simple scripts:

```gdscript
class_name ${ClassName}
extends ${ParentClass}
## ${Brief description}


func _ready() -> void:
    pass
```

## Component Template

For reusable components:

```gdscript
class_name ${ComponentName}Component
extends Node
## ${Description of component purpose}


# === Signals ===

signal ${state_changed}(${new_value}: ${Type})


# === Exports ===

@export var ${configurable_value}: ${Type} = ${default}


# === Public Methods ===

func ${main_action}(${param}: ${Type}) -> void:
    ${# Component logic}
    ${state_changed}.emit(${new_value})
```

## Notes

- Always include `class_name` for discoverability
- Use `##` for documentation comments (shown in editor)
- Use `#` for implementation comments
- Type everything: variables, parameters, return values
- Prefix private members with `_`
- Use `@onready` for node references
- Prefer `%UniqueName` for stable references
