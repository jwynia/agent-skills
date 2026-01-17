# Autoload Manager Template

Template for global singleton managers in Godot 4.x.

## Usage

Register as autoload in Project Settings > Autoload. Keep autoloads thin - services only, not game logic.

## Basic Manager Template

```gdscript
class_name ${ManagerName}Manager
extends Node
## Global ${description} manager.
##
## Access via ${ManagerName}Manager singleton.


# === Signals ===

signal ${event_occurred}(${data}: ${Type})


# === Private Variables ===

var _${internal_state}: ${Type}


# === Lifecycle ===

func _ready() -> void:
    # Initialize manager state
    pass


# === Public API ===

## ${Description of this method}
func ${public_method}(${param}: ${Type}) -> ${ReturnType}:
    # Implementation
    pass
```

## Audio Manager Example

```gdscript
class_name AudioManager
extends Node
## Global audio playback manager.
##
## Handles music and sound effects with volume control.


# === Signals ===

signal music_changed(track_name: String)


# === Constants ===

const MUSIC_FADE_DURATION: float = 1.0


# === Exports ===

@export var music_bus: StringName = &"Music"
@export var sfx_bus: StringName = &"SFX"


# === Private Variables ===

var _music_player: AudioStreamPlayer
var _sfx_players: Array[AudioStreamPlayer] = []
var _current_music: String = ""


# === Lifecycle ===

func _ready() -> void:
    _setup_music_player()
    _setup_sfx_pool()


func _setup_music_player() -> void:
    _music_player = AudioStreamPlayer.new()
    _music_player.bus = music_bus
    add_child(_music_player)


func _setup_sfx_pool() -> void:
    for i in 8:  # Pool of 8 SFX players
        var player := AudioStreamPlayer.new()
        player.bus = sfx_bus
        add_child(player)
        _sfx_players.append(player)


# === Music ===

func play_music(stream: AudioStream, fade_in: bool = true) -> void:
    if _music_player.stream == stream and _music_player.playing:
        return

    _current_music = stream.resource_path

    if fade_in and _music_player.playing:
        await _fade_out_music()

    _music_player.stream = stream
    _music_player.play()

    if fade_in:
        await _fade_in_music()

    music_changed.emit(_current_music)


func stop_music(fade_out: bool = true) -> void:
    if fade_out:
        await _fade_out_music()
    _music_player.stop()
    _current_music = ""


func _fade_out_music() -> void:
    var tween := create_tween()
    tween.tween_property(_music_player, "volume_db", -40.0, MUSIC_FADE_DURATION)
    await tween.finished


func _fade_in_music() -> void:
    _music_player.volume_db = -40.0
    var tween := create_tween()
    tween.tween_property(_music_player, "volume_db", 0.0, MUSIC_FADE_DURATION)
    await tween.finished


# === Sound Effects ===

func play_sfx(stream: AudioStream, volume_db: float = 0.0) -> void:
    var player := _get_available_sfx_player()
    if player:
        player.stream = stream
        player.volume_db = volume_db
        player.play()


func _get_available_sfx_player() -> AudioStreamPlayer:
    for player in _sfx_players:
        if not player.playing:
            return player
    return _sfx_players[0]  # Fallback to first


# === Volume Control ===

func set_music_volume(linear: float) -> void:
    AudioServer.set_bus_volume_db(
        AudioServer.get_bus_index(music_bus),
        linear_to_db(linear)
    )


func set_sfx_volume(linear: float) -> void:
    AudioServer.set_bus_volume_db(
        AudioServer.get_bus_index(sfx_bus),
        linear_to_db(linear)
    )


func get_music_volume() -> float:
    return db_to_linear(AudioServer.get_bus_volume_db(
        AudioServer.get_bus_index(music_bus)
    ))


func get_sfx_volume() -> float:
    return db_to_linear(AudioServer.get_bus_volume_db(
        AudioServer.get_bus_index(sfx_bus)
    ))
```

## Event Bus Example

```gdscript
class_name EventBus
extends Node
## Global event bus for decoupled communication.
##
## Use for game-wide events that multiple systems care about.


# === Game State Events ===

signal game_started
signal game_paused
signal game_resumed
signal game_over


# === Player Events ===

signal player_spawned(player: Node2D)
signal player_died
signal player_respawned
signal player_health_changed(current: int, maximum: int)


# === Level Events ===

signal level_started(level_name: String)
signal level_completed(level_name: String)
signal checkpoint_reached(checkpoint_id: String)


# === Combat Events ===

signal damage_dealt(source: Node, target: Node, amount: int)
signal enemy_killed(enemy: Node, killer: Node)


# === UI Events ===

signal show_dialogue(dialogue_id: String)
signal hide_dialogue
signal show_notification(message: String)


# === Economy Events ===

signal currency_changed(amount: int, total: int)
signal item_purchased(item_id: String)


# Usage example:
# EventBus.player_died.emit()
# EventBus.damage_dealt.connect(_on_damage_dealt)
```

## Save Manager Example

```gdscript
class_name SaveManager
extends Node
## Global save/load manager.


signal save_completed(slot: int)
signal load_completed(slot: int)
signal save_failed(slot: int, error: String)


const SAVE_DIR := "user://saves/"
const SAVE_EXT := ".tres"


var current_slot: int = -1


func _ready() -> void:
    DirAccess.make_dir_recursive_absolute(SAVE_DIR)


func save(slot: int, data: SaveData) -> Error:
    var path := _get_save_path(slot)
    var error := ResourceSaver.save(data, path)

    if error == OK:
        current_slot = slot
        save_completed.emit(slot)
    else:
        save_failed.emit(slot, error_string(error))

    return error


func load_save(slot: int) -> SaveData:
    var path := _get_save_path(slot)

    if not FileAccess.file_exists(path):
        return null

    var data := ResourceLoader.load(path) as SaveData
    if data:
        current_slot = slot
        load_completed.emit(slot)

    return data


func delete_save(slot: int) -> Error:
    var path := _get_save_path(slot)
    if FileAccess.file_exists(path):
        return DirAccess.remove_absolute(path)
    return OK


func save_exists(slot: int) -> bool:
    return FileAccess.file_exists(_get_save_path(slot))


func get_all_saves() -> Array[Dictionary]:
    var saves: Array[Dictionary] = []
    for slot in range(1, 10):
        if save_exists(slot):
            var data := load_save(slot)
            if data:
                saves.append({
                    "slot": slot,
                    "timestamp": data.timestamp,
                    "level": data.current_level
                })
    return saves


func _get_save_path(slot: int) -> String:
    return SAVE_DIR + "save_%02d%s" % [slot, SAVE_EXT]
```

## Best Practices

1. **Keep autoloads thin** - Logic goes in components, not managers
2. **Use signals for events** - Don't tightly couple systems
3. **Avoid storing game state** - Player health belongs on Player
4. **Initialize in _ready** - Not in _init
5. **Document public API** - What methods are for external use
6. **Consider alternatives** - Maybe you don't need an autoload
