#!/usr/bin/env python3
"""
narrate-full.py - Generate a single TTS audio file from all scene files.

Combines all scene .txt files and generates a single consistent audio file,
avoiding volume inconsistencies that occur when concatenating separately
generated audio files.

Usage:
    python narrate-full.py ./output/scenes/
    python narrate-full.py ./output/scenes/ --force
    python narrate-full.py ./output/scenes/ --speaker other_voice
"""
import argparse
import json
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


def combine_scene_texts(scene_files: list[Path]) -> str:
    """Combine all scene texts into a single string with paragraph breaks."""
    texts = []
    for f in scene_files:
        text = f.read_text(encoding="utf-8").strip()
        if text:
            texts.append(text)
            print(f"  Added: {f.name} ({len(text.split())} words)")

    # Join with double newline for natural pause between scenes
    combined = "\n\n".join(texts)
    total_words = len(combined.split())
    print(f"\nCombined: {len(texts)} scenes, {total_words} words total")

    return combined


def narrate_text(tts, text: str, output_path: Path, speaker: str) -> dict | None:
    """Generate speech for the combined text. Returns metadata or None on error."""
    print(f"\nGenerating speech for {len(text.split())} words...")
    print("(This may take a few minutes for longer texts)")

    try:
        wavs, sr = tts.generate_custom_voice(
            text=text,
            speaker=speaker,
        )
    except Exception as e:
        print(f"Error generating speech: {e}")
        return None

    # Save output
    sf.write(str(output_path), wavs[0], sr)
    duration = len(wavs[0]) / sr

    print(f"\nSaved: {output_path}")
    print(f"Duration: {duration:.1f}s ({duration/60:.1f} minutes)")
    print(f"Sample rate: {sr} Hz")

    return {
        "duration_seconds": duration,
        "sample_rate": sr,
        "samples": len(wavs[0]),
    }


def main():
    parser = argparse.ArgumentParser(
        description="Generate single TTS audio from all scene files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python narrate-full.py ./output/scenes/
    python narrate-full.py ./output/scenes/ --force
    python narrate-full.py ./output/scenes/ --speaker custom_voice
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
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=None,
        help="Output file path (default: <scenes_dir>/../full-narration.wav)",
    )
    args = parser.parse_args()

    scenes_dir = args.scenes_dir.resolve()

    if not scenes_dir.exists():
        print(f"Error: Directory not found: {scenes_dir}")
        sys.exit(1)

    # Determine output path
    if args.output:
        output_path = args.output.resolve()
    else:
        output_path = scenes_dir.parent / "full-narration.wav"

    # Check if output exists
    if output_path.exists() and not args.force:
        print(f"Output already exists: {output_path}")
        print("Use --force to regenerate.")
        sys.exit(0)

    # Find scene files
    scene_files = find_scene_files(scenes_dir)

    if not scene_files:
        print(f"No .txt files found in: {scenes_dir}")
        sys.exit(1)

    print(f"Found {len(scene_files)} scene files:")

    # Combine all scene texts
    combined_text = combine_scene_texts(scene_files)

    if not combined_text.strip():
        print("Error: No text content found in scene files")
        sys.exit(1)

    # Load model
    tts = load_model()

    # Generate audio
    result = narrate_text(tts, combined_text, output_path, args.speaker)

    if result:
        print("\n" + "=" * 40)
        print("SUCCESS: Full narration generated!")
        print(f"Output: {output_path}")
        print(f"Duration: {result['duration_seconds']:.1f}s")
    else:
        print("\nFailed to generate narration")
        sys.exit(1)


if __name__ == "__main__":
    main()
