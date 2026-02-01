#!/usr/bin/env python3
"""
transcribe-full.py - Generate word-level timestamps from audio using Whisper.

Transcribes an audio file and generates:
1. VTT file with word-level timestamps (for video players)
2. JSON file with captions (for Remotion CaptionRenderer)

Usage:
    python transcribe-full.py ./narration/full-narration.wav
    python transcribe-full.py ./narration/full-narration.wav --model medium
"""
import argparse
import json
import sys
from pathlib import Path

try:
    import whisper
except ImportError:
    print("Error: openai-whisper not installed")
    print("Install with: pip install openai-whisper")
    sys.exit(1)


def format_vtt_timestamp(seconds: float) -> str:
    """Convert seconds to VTT timestamp format (MM:SS.mmm)."""
    minutes = int(seconds // 60)
    secs = seconds % 60
    return f"{minutes:02d}:{secs:06.3f}"


def transcribe_with_timestamps(audio_path: Path, model_name: str = "medium") -> dict:
    """Transcribe audio with word-level timestamps."""
    print(f"Loading Whisper model '{model_name}'...")
    model = whisper.load_model(model_name)

    print(f"Transcribing: {audio_path}")
    print("(This may take a few minutes...)")

    result = model.transcribe(
        str(audio_path),
        word_timestamps=True,
        language="en",
        verbose=False,
    )

    return result


def to_vtt(result: dict, output_path: Path):
    """Convert whisper result to VTT format with word-level timestamps."""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("WEBVTT\n\n")

        cue_index = 1
        for segment in result.get("segments", []):
            words = segment.get("words", [])
            if not words:
                continue

            for word_info in words:
                word = word_info.get("word", "").strip()
                if not word:
                    continue

                start = format_vtt_timestamp(word_info["start"])
                end = format_vtt_timestamp(word_info["end"])

                f.write(f"{cue_index}\n")
                f.write(f"{start} --> {end}\n")
                f.write(f"{word}\n\n")
                cue_index += 1

    print(f"Saved VTT: {output_path} ({cue_index - 1} cues)")


def to_json(result: dict, output_path: Path):
    """Convert whisper result to JSON for Remotion captions."""
    captions = []

    for segment in result.get("segments", []):
        words = segment.get("words", [])
        if not words:
            continue

        for word_info in words:
            word = word_info.get("word", "").strip()
            if not word:
                continue

            captions.append({
                "text": word,
                "startMs": int(word_info["start"] * 1000),
                "endMs": int(word_info["end"] * 1000),
                "confidence": word_info.get("probability", 1.0),
            })

    output_data = {
        "segments": result.get("segments", []),
        "captions": captions,
        "text": result.get("text", ""),
        "language": result.get("language", "en"),
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"Saved JSON: {output_path} ({len(captions)} words)")


def main():
    parser = argparse.ArgumentParser(
        description="Transcribe audio with word-level timestamps using Whisper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python transcribe-full.py ./narration/full-narration.wav
    python transcribe-full.py ./narration/full-narration.wav --model large-v3
    python transcribe-full.py audio.wav --output-dir ./output/
        """,
    )
    parser.add_argument(
        "audio_path",
        type=Path,
        help="Path to audio file (WAV, MP3, etc.)",
    )
    parser.add_argument(
        "--model",
        "-m",
        type=str,
        default="medium",
        choices=["tiny", "base", "small", "medium", "large", "large-v2", "large-v3"],
        help="Whisper model size (default: medium)",
    )
    parser.add_argument(
        "--output-dir",
        "-o",
        type=Path,
        default=None,
        help="Output directory (default: same as audio file)",
    )
    args = parser.parse_args()

    audio_path = args.audio_path.resolve()

    if not audio_path.exists():
        print(f"Error: Audio file not found: {audio_path}")
        sys.exit(1)

    # Determine output paths
    if args.output_dir:
        output_dir = args.output_dir.resolve()
        output_dir.mkdir(parents=True, exist_ok=True)
    else:
        output_dir = audio_path.parent

    base_name = audio_path.stem
    vtt_path = output_dir / f"{base_name}.vtt"
    json_path = output_dir / f"{base_name}.json"

    # Transcribe
    result = transcribe_with_timestamps(audio_path, args.model)

    # Check if we got word-level timestamps
    has_words = any(
        segment.get("words")
        for segment in result.get("segments", [])
    )

    if not has_words:
        print("Warning: No word-level timestamps found in transcription")
        print("This may happen with some audio files or model versions")

    # Generate outputs
    print("\nGenerating output files...")
    to_vtt(result, vtt_path)
    to_json(result, json_path)

    # Summary
    print("\n" + "=" * 40)
    print("SUCCESS: Transcription complete!")
    print(f"VTT:  {vtt_path}")
    print(f"JSON: {json_path}")

    # Word count
    word_count = sum(
        len(segment.get("words", []))
        for segment in result.get("segments", [])
    )
    print(f"Words: {word_count}")


if __name__ == "__main__":
    main()
