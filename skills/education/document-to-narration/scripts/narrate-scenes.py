#!/usr/bin/env python3
"""
narrate-scenes.py - Generate TTS audio for scene files.

Converts scene .txt files to .wav audio using the bundled fine-tuned voice model.

Usage:
    # Process all txt files in scenes directory
    python narrate-scenes.py ./output/scenes/

    # Force regeneration of existing outputs
    python narrate-scenes.py ./output/scenes/ --force

    # Use a different speaker
    python narrate-scenes.py ./output/scenes/ --speaker other_voice
"""
import argparse
import json
import os
import sys
from pathlib import Path

import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel


# Directory setup (relative to script location)
SCRIPT_DIR = Path(__file__).parent.resolve()
SKILL_DIR = SCRIPT_DIR.parent
MODEL_DIR = SKILL_DIR / "tts" / "model"

# Default speaker name (from fine-tuning)
DEFAULT_SPEAKER = "jwynia"


def load_model():
    """Load the fine-tuned TTS model."""
    print("Loading TTS model...")
    print(f"  Model path: {MODEL_DIR}")

    if not MODEL_DIR.exists():
        print(f"Error: Model directory not found at {MODEL_DIR}")
        print("Make sure the model has been moved from inbox/portable-narrator/model/")
        sys.exit(1)

    # Determine device
    if torch.backends.mps.is_available():
        device = "mps"
    elif torch.cuda.is_available():
        device = "cuda"
    else:
        device = "cpu"

    print(f"  Device: {device}")

    tts = Qwen3TTSModel.from_pretrained(
        str(MODEL_DIR),
        device_map=device,
        dtype=torch.float32,
        attn_implementation="sdpa",
    )

    print("Model loaded!\n")
    return tts


def find_scene_files(scenes_dir: Path) -> list[Path]:
    """Find all .txt scene files in the directory."""
    files = list(scenes_dir.glob("*.txt"))
    # Sort by scene number (assumes NN-slug.txt format)
    files.sort(key=lambda f: f.name)
    return files


def get_output_path(input_path: Path) -> Path:
    """Get the output path for an input file."""
    return input_path.with_suffix(".wav")


def read_text_file(filepath: Path) -> str:
    """Read and return the contents of a text file."""
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read().strip()


def narrate_file(tts, input_path: Path, output_path: Path, speaker: str) -> dict | None:
    """Generate speech for a single file. Returns metadata or None on error."""
    print(f"Processing: {input_path.name}")

    # Read text
    text = read_text_file(input_path)
    if not text:
        print(f"  Skipping: file is empty")
        return None

    # Show text preview
    preview = text[:100].replace("\n", " ")
    if len(text) > 100:
        preview += "..."
    print(f"  Text: {preview}")

    # Generate speech
    print(f"  Generating speech...")
    try:
        wavs, sr = tts.generate_custom_voice(
            text=text,
            speaker=speaker,
        )
    except Exception as e:
        print(f"  Error generating speech: {e}")
        return None

    # Save output
    sf.write(str(output_path), wavs[0], sr)
    duration = len(wavs[0]) / sr
    print(f"  Saved: {output_path.name} ({duration:.1f}s)")

    return {
        "duration_seconds": duration,
        "sample_rate": sr,
        "samples": len(wavs[0]),
    }


def update_manifest(scenes_dir: Path, audio_metadata: dict[str, dict]):
    """Update manifest.json with audio information."""
    manifest_path = scenes_dir.parent / "manifest.json"

    if not manifest_path.exists():
        print(f"Warning: No manifest.json found at {manifest_path}")
        return

    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    # Update each scene with audio info
    for scene in manifest.get("scenes", []):
        text_file = scene.get("files", {}).get("text", "")
        if text_file:
            # Convert text filename to audio filename
            txt_name = Path(text_file).name
            wav_name = txt_name.replace(".txt", ".wav")

            if wav_name in audio_metadata:
                meta = audio_metadata[wav_name]
                scene["audio_duration_seconds"] = meta["duration_seconds"]
                scene["files"]["audio"] = f"scenes/{wav_name}"

    # Calculate total duration
    total_duration = sum(
        s.get("audio_duration_seconds", 0) for s in manifest.get("scenes", [])
    )
    manifest["total_duration_seconds"] = total_duration

    # Write updated manifest
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"\nUpdated manifest: {manifest_path}")
    print(f"Total audio duration: {total_duration:.1f}s")


def main():
    parser = argparse.ArgumentParser(
        description="Generate TTS audio for scene files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python narrate-scenes.py ./output/scenes/
    python narrate-scenes.py ./output/scenes/ --force
    python narrate-scenes.py ./output/scenes/ --speaker custom_voice
        """,
    )
    parser.add_argument(
        "scenes_dir",
        type=Path,
        help="Directory containing scene .txt files",
    )
    parser.add_argument(
        "--force",
        "-f",
        action="store_true",
        help="Force regeneration even if output exists",
    )
    parser.add_argument(
        "--speaker",
        "-s",
        type=str,
        default=DEFAULT_SPEAKER,
        help=f"Speaker name (default: {DEFAULT_SPEAKER})",
    )
    args = parser.parse_args()

    scenes_dir = args.scenes_dir.resolve()

    if not scenes_dir.exists():
        print(f"Error: Directory not found: {scenes_dir}")
        sys.exit(1)

    # Find scene files
    scene_files = find_scene_files(scenes_dir)

    if not scene_files:
        print(f"No .txt files found in: {scenes_dir}")
        sys.exit(0)

    # Filter out files that already have output (unless --force)
    files_to_process = []
    for input_path in scene_files:
        output_path = get_output_path(input_path)
        if output_path.exists() and not args.force:
            print(f"Skipping (output exists): {input_path.name}")
        else:
            files_to_process.append((input_path, output_path))

    if not files_to_process:
        print("\nNo new files to process. Use --force to regenerate.")
        sys.exit(0)

    print(f"\nFiles to process: {len(files_to_process)}")
    print("-" * 40)

    # Load model
    tts = load_model()

    # Process each file
    audio_metadata = {}
    success_count = 0

    for input_path, output_path in files_to_process:
        try:
            result = narrate_file(tts, input_path, output_path, args.speaker)
            if result:
                audio_metadata[output_path.name] = result
                success_count += 1
        except Exception as e:
            print(f"  Error: {e}")
        print()

    print("-" * 40)
    print(f"Completed: {success_count}/{len(files_to_process)} files")

    # Update manifest with audio info
    if audio_metadata:
        update_manifest(scenes_dir, audio_metadata)


if __name__ == "__main__":
    main()
