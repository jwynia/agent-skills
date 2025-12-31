# Save/Load System Patterns

Complete guide to implementing save systems in Godot 4.x.

## Save System Approaches

| Approach | Best For | Pros | Cons |
|----------|----------|------|------|
| Custom Resource | Structured game data | Type-safe, fast, editor preview | Binary format, version migration |
| JSON | Config, web games | Human-readable, portable | No type safety, slower |
| ConfigFile | Settings, simple saves | Built-in, INI format | Limited structure |
| Binary | Large datasets | Compact, fast | Not human-readable |

## Pattern 1: Resource-Based Save System

Type-safe saves using custom Resources:

```gdscript
# save_data.gd - Custom resource for save data
class_name SaveData
extends Resource

@export var version: int = 1
@export var timestamp: int = 0

# Player data
@export var player_position: Vector2
@export var player_health: int = 100
@export var player_max_health: int = 100

# Inventory
@export var inventory: Array[String] = []
@export var equipped_weapon: String = ""
@export var gold: int = 0

# Progress
@export var current_level: String = "res://levels/level_01.tscn"
@export var unlocked_levels: Array[String] = []
@export var completed_quests: Array[String] = []

# Settings (could be separate resource)
@export var music_volume: float = 1.0
@export var sfx_volume: float = 1.0


static func create_new() -> SaveData:
    var data := SaveData.new()
    data.timestamp = int(Time.get_unix_time_from_system())
    return data
```

```gdscript
# save_manager.gd - Autoload for save/load operations
class_name SaveManager
extends Node

signal save_completed(slot: int)
signal load_completed(slot: int, data: SaveData)
signal save_failed(slot: int, error: String)

const SAVE_DIR := "user://saves/"
const SAVE_EXTENSION := ".tres"  # Or ".res" for binary

var current_save: SaveData


func _ready() -> void:
    _ensure_save_directory()


func _ensure_save_directory() -> void:
    DirAccess.make_dir_recursive_absolute(SAVE_DIR)


func get_save_path(slot: int) -> String:
    return SAVE_DIR + "save_%02d%s" % [slot, SAVE_EXTENSION]


func save_exists(slot: int) -> bool:
    return FileAccess.file_exists(get_save_path(slot))


func save_game(slot: int) -> Error:
    if not current_save:
        current_save = SaveData.create_new()

    current_save.timestamp = int(Time.get_unix_time_from_system())
    _collect_save_data()

    var path := get_save_path(slot)
    var error := ResourceSaver.save(current_save, path)

    if error == OK:
        save_completed.emit(slot)
    else:
        save_failed.emit(slot, error_string(error))

    return error


func load_game(slot: int) -> SaveData:
    var path := get_save_path(slot)

    if not FileAccess.file_exists(path):
        push_error("Save file not found: %s" % path)
        return null

    var loaded := ResourceLoader.load(path) as SaveData
    if not loaded:
        push_error("Failed to load save: %s" % path)
        return null

    current_save = loaded
    _apply_save_data()
    load_completed.emit(slot, current_save)

    return current_save


func delete_save(slot: int) -> Error:
    var path := get_save_path(slot)
    if FileAccess.file_exists(path):
        return DirAccess.remove_absolute(path)
    return OK


func get_save_info(slot: int) -> Dictionary:
    var path := get_save_path(slot)
    if not FileAccess.file_exists(path):
        return {}

    var data := ResourceLoader.load(path) as SaveData
    if not data:
        return {}

    return {
        "slot": slot,
        "timestamp": data.timestamp,
        "level": data.current_level,
        "playtime": data.timestamp  # Could track actual playtime
    }


func get_all_saves() -> Array[Dictionary]:
    var saves: Array[Dictionary] = []
    for slot in range(1, 10):  # Slots 1-9
        var info := get_save_info(slot)
        if not info.is_empty():
            saves.append(info)
    return saves


# Override these to customize what gets saved/loaded
func _collect_save_data() -> void:
    # Collect data from game state
    var player := get_tree().get_first_node_in_group("player") as Player
    if player:
        current_save.player_position = player.global_position
        current_save.player_health = player.health

    # Collect from other systems
    if has_node("/root/Inventory"):
        current_save.inventory = get_node("/root/Inventory").get_items()


func _apply_save_data() -> void:
    # Apply saved data to game state
    # Usually called after loading the saved level
    pass
```

## Pattern 2: JSON Save System

Human-readable saves with JSON:

```gdscript
# json_save_manager.gd
class_name JsonSaveManager
extends Node

const SAVE_DIR := "user://saves/"


func save_to_json(slot: int, data: Dictionary) -> Error:
    var path := SAVE_DIR + "save_%02d.json" % slot
    var json_string := JSON.stringify(data, "\t")

    var file := FileAccess.open(path, FileAccess.WRITE)
    if not file:
        return FileAccess.get_open_error()

    file.store_string(json_string)
    file.close()
    return OK


func load_from_json(slot: int) -> Dictionary:
    var path := SAVE_DIR + "save_%02d.json" % slot

    if not FileAccess.file_exists(path):
        return {}

    var file := FileAccess.open(path, FileAccess.READ)
    if not file:
        return {}

    var json_string := file.get_as_text()
    file.close()

    var json := JSON.new()
    var error := json.parse(json_string)
    if error != OK:
        push_error("JSON parse error: %s" % json.get_error_message())
        return {}

    return json.get_data()


# Serialize game state to dictionary
func collect_game_state() -> Dictionary:
    var player := get_tree().get_first_node_in_group("player")

    return {
        "version": 1,
        "timestamp": int(Time.get_unix_time_from_system()),
        "player": {
            "position": {"x": player.position.x, "y": player.position.y},
            "health": player.health,
            "inventory": player.inventory.duplicate()
        },
        "level": get_tree().current_scene.scene_file_path,
        "enemies": _serialize_enemies(),
        "pickups": _serialize_pickups()
    }


func _serialize_enemies() -> Array:
    var enemies := []
    for enemy in get_tree().get_nodes_in_group("enemies"):
        enemies.append({
            "type": enemy.enemy_type,
            "position": {"x": enemy.position.x, "y": enemy.position.y},
            "health": enemy.health
        })
    return enemies


func _serialize_pickups() -> Array:
    var pickups := []
    for pickup in get_tree().get_nodes_in_group("pickups"):
        pickups.append({
            "id": pickup.pickup_id,
            "collected": pickup.is_collected
        })
    return pickups
```

## Pattern 3: Node-Based Serialization

Save/load individual nodes using groups:

```gdscript
# saveable.gd - Interface for saveable nodes
class_name Saveable
extends Node

## Unique ID for this saveable object
@export var save_id: String

## Return dictionary of data to save
func get_save_data() -> Dictionary:
    return {}

## Restore state from saved data
func load_save_data(data: Dictionary) -> void:
    pass
```

```gdscript
# Example saveable implementations

# saveable_chest.gd
class_name SaveableChest
extends Saveable

var is_opened: bool = false
var contents: Array[String] = []

func get_save_data() -> Dictionary:
    return {
        "is_opened": is_opened,
        "contents": contents.duplicate()
    }

func load_save_data(data: Dictionary) -> void:
    is_opened = data.get("is_opened", false)
    contents = data.get("contents", [])
    if is_opened:
        $AnimatedSprite2D.play("opened")
```

```gdscript
# scene_save_manager.gd
class_name SceneSaveManager
extends Node

func collect_scene_data() -> Dictionary:
    var data := {}
    for saveable in get_tree().get_nodes_in_group("saveable"):
        if saveable is Saveable and not saveable.save_id.is_empty():
            data[saveable.save_id] = saveable.get_save_data()
    return data


func apply_scene_data(data: Dictionary) -> void:
    for saveable in get_tree().get_nodes_in_group("saveable"):
        if saveable is Saveable and data.has(saveable.save_id):
            saveable.load_save_data(data[saveable.save_id])
```

## Save Data Versioning

Handle save format changes between game versions:

```gdscript
class_name SaveMigrator
extends RefCounted

const CURRENT_VERSION := 3

static func migrate(data: SaveData) -> SaveData:
    var version := data.version

    while version < CURRENT_VERSION:
        match version:
            1:
                data = _migrate_v1_to_v2(data)
            2:
                data = _migrate_v2_to_v3(data)
        version += 1

    data.version = CURRENT_VERSION
    return data


static func _migrate_v1_to_v2(data: SaveData) -> SaveData:
    # v1 -> v2: Split health into current and max
    if data.player_max_health == 0:
        data.player_max_health = 100
    return data


static func _migrate_v2_to_v3(data: SaveData) -> SaveData:
    # v2 -> v3: Rename level paths
    data.current_level = data.current_level.replace("levels/", "worlds/")
    return data
```

## Autosave System

```gdscript
class_name AutosaveManager
extends Node

signal autosave_started
signal autosave_completed

@export var autosave_interval: float = 300.0  # 5 minutes
@export var autosave_slot: int = 0  # Slot 0 for autosave

var _timer: float = 0.0
var _enabled: bool = true


func _process(delta: float) -> void:
    if not _enabled:
        return

    _timer += delta
    if _timer >= autosave_interval:
        _timer = 0.0
        autosave()


func autosave() -> void:
    autosave_started.emit()

    # Don't autosave during certain states
    if _is_safe_to_save():
        SaveManager.save_game(autosave_slot)

    autosave_completed.emit()


func _is_safe_to_save() -> bool:
    # Don't save during:
    # - Combat
    # - Cutscenes
    # - Menu screens
    # - Loading
    return not get_tree().paused


func pause_autosave() -> void:
    _enabled = false


func resume_autosave() -> void:
    _enabled = true
    _timer = 0.0
```

## Save File Security

Basic encryption for save files:

```gdscript
const SAVE_KEY := "your-game-secret-key"  # Store securely

func save_encrypted(slot: int, data: Dictionary) -> Error:
    var json := JSON.stringify(data)
    var encrypted := json.to_utf8_buffer()

    var file := FileAccess.open_encrypted_with_pass(
        get_save_path(slot),
        FileAccess.WRITE,
        SAVE_KEY
    )
    if not file:
        return FileAccess.get_open_error()

    file.store_buffer(encrypted)
    file.close()
    return OK


func load_encrypted(slot: int) -> Dictionary:
    var file := FileAccess.open_encrypted_with_pass(
        get_save_path(slot),
        FileAccess.READ,
        SAVE_KEY
    )
    if not file:
        return {}

    var buffer := file.get_buffer(file.get_length())
    file.close()

    var json_string := buffer.get_string_from_utf8()
    var json := JSON.new()
    if json.parse(json_string) != OK:
        return {}

    return json.get_data()
```

## Best Practices

1. **Use Resources for structured data** - Type safety and editor support
2. **Version your saves** - Always include version number for migration
3. **Validate on load** - Check for corrupt or tampered data
4. **Separate settings from progress** - Different update frequencies
5. **Use user:// for saves** - Platform-independent save location
6. **Test save/load early** - Add system before too much game logic exists
7. **Handle missing data gracefully** - Use defaults for missing fields
8. **Autosave at safe points** - Not during combat or cutscenes

## Common Gotchas

- **Resource paths change**: Store relative paths, not absolute
- **Scene structure changes**: Use IDs, not node paths
- **Circular references**: Resources can't have circular refs
- **Large saves**: Consider splitting into multiple files
- **Cloud saves**: Account for sync conflicts
