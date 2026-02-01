#!/usr/bin/env python3
"""
extract-scene-boundaries.py - Extract scene timing boundaries from transcript.

After generating audio with narrate-full.py and transcribing with transcribe-full.py,
this script finds where each scene starts in the audio by matching the opening
words of each scene text file against the transcript.

Usage:
    python extract-scene-boundaries.py ./narration/scenes/ ./narration/full-narration.json

    # Output as JSON for programmatic use
    python extract-scene-boundaries.py ./narration/scenes/ ./narration/full-narration.json --json

    # Output TypeScript code for Video.tsx
    python extract-scene-boundaries.py ./narration/scenes/ ./narration/full-narration.json --typescript
"""
import argparse
import json
import re
import sys
from pathlib import Path


def load_transcript(json_path: Path) -> list[dict]:
    """Load word-level timestamps from transcript JSON."""
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    words = []
    for seg in data.get("segments", []):
        for w in seg.get("words", []):
            words.append({
                "word": w["word"].strip(),
                "start": w["start"],
                "end": w["end"],
            })

    return words


def get_scene_opening_phrases(scenes_dir: Path) -> list[tuple[str, str]]:
    """Get opening phrase from each scene file. Returns list of (filename, phrase)."""
    scene_files = sorted(scenes_dir.glob("*.txt"))
    phrases = []

    for f in scene_files:
        text = f.read_text(encoding="utf-8").strip()
        # Get first ~5 words as opening phrase
        words = text.split()[:5]
        phrase = " ".join(words)
        phrases.append((f.stem, phrase))

    return phrases


def normalize_word(word: str) -> str:
    """Normalize word for matching (lowercase, remove punctuation)."""
    return re.sub(r"[^\w]", "", word.lower())


def find_phrase_in_transcript(phrase: str, words: list[dict], start_from: int = 0) -> float | None:
    """Find where a phrase starts in the transcript. Returns start time or None."""
    phrase_words = phrase.split()
    phrase_normalized = [normalize_word(w) for w in phrase_words]

    # Search through transcript
    for i in range(start_from, len(words) - len(phrase_normalized) + 1):
        match = True
        for j, pw in enumerate(phrase_normalized):
            transcript_word = normalize_word(words[i + j]["word"])
            # Allow partial match (phrase word is prefix of transcript word)
            if not transcript_word.startswith(pw[:3]):  # Match at least first 3 chars
                match = False
                break

        if match:
            return words[i]["start"]

    return None


def extract_boundaries(scenes_dir: Path, transcript_path: Path) -> list[dict]:
    """Extract scene boundaries from transcript."""
    words = load_transcript(transcript_path)
    phrases = get_scene_opening_phrases(scenes_dir)

    if not words:
        print("Error: No words found in transcript", file=sys.stderr)
        sys.exit(1)

    if not phrases:
        print("Error: No scene files found", file=sys.stderr)
        sys.exit(1)

    boundaries = []
    last_end = 0
    search_from = 0

    for i, (slug, phrase) in enumerate(phrases):
        start_time = find_phrase_in_transcript(phrase, words, search_from)

        if start_time is None:
            print(f"Warning: Could not find scene '{slug}' starting with '{phrase}'", file=sys.stderr)
            # Use last known position
            start_time = last_end
        else:
            # Update search position to avoid finding same phrase twice
            search_from = next(
                (j for j, w in enumerate(words) if w["start"] >= start_time + 1),
                search_from
            )

        boundaries.append({
            "number": i + 1,
            "slug": slug,
            "start_seconds": start_time,
            "opening_phrase": phrase,
        })

        last_end = start_time

    # Calculate durations
    total_duration = words[-1]["end"] if words else 0

    for i, b in enumerate(boundaries):
        if i + 1 < len(boundaries):
            b["duration_seconds"] = round(boundaries[i + 1]["start_seconds"] - b["start_seconds"], 2)
        else:
            b["duration_seconds"] = round(total_duration - b["start_seconds"], 2)

    return boundaries


def format_table(boundaries: list[dict], total_duration: float) -> str:
    """Format boundaries as readable table."""
    lines = [
        "Scene Boundaries",
        "=" * 60,
        f"{'#':<4} {'Slug':<30} {'Start':>8} {'Duration':>10}",
        "-" * 60,
    ]

    for b in boundaries:
        lines.append(
            f"{b['number']:<4} {b['slug']:<30} {b['start_seconds']:>7.2f}s {b['duration_seconds']:>9.2f}s"
        )

    lines.append("-" * 60)
    lines.append(f"{'Total':<35} {total_duration:>18.2f}s")

    return "\n".join(lines)


def format_json(boundaries: list[dict]) -> str:
    """Format boundaries as JSON."""
    return json.dumps(boundaries, indent=2)


def format_typescript(boundaries: list[dict]) -> str:
    """Format boundaries as TypeScript for Video.tsx."""
    lines = [
        "// Scene timing data (at 30fps)",
        "// Timings extracted from full-narration.wav transcript",
        "const FPS = 30;",
        "const scenes = [",
    ]

    for b in boundaries:
        # Convert slug to component name
        parts = b["slug"].split("-")
        # Handle numbered prefix (e.g., "01-kitchen-opening" -> "Scene01KitchenOpening")
        if parts[0].isdigit():
            num = parts[0]
            name_parts = parts[1:]
        else:
            num = str(b["number"]).zfill(2)
            name_parts = parts

        component_name = f"Scene{num}{''.join(p.title() for p in name_parts)}"

        lines.append(f"  {{")
        lines.append(f"    number: {b['number']},")
        lines.append(f"    slug: '{'-'.join(name_parts)}',")
        lines.append(f"    durationSeconds: {b['duration_seconds']},  // {b['start_seconds']:.2f}s - {b['start_seconds'] + b['duration_seconds']:.2f}s")
        lines.append(f"    component: {component_name},")
        lines.append(f"  }},")

    lines.append("];")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Extract scene timing boundaries from transcript",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python extract-scene-boundaries.py ./narration/scenes/ ./narration/full-narration.json
    python extract-scene-boundaries.py ./narration/scenes/ ./narration/full-narration.json --json
    python extract-scene-boundaries.py ./narration/scenes/ ./narration/full-narration.json --typescript
        """,
    )
    parser.add_argument(
        "scenes_dir",
        type=Path,
        help="Directory containing scene .txt files",
    )
    parser.add_argument(
        "transcript",
        type=Path,
        help="Path to transcript JSON file (from transcribe-full.py)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output as JSON",
    )
    parser.add_argument(
        "--typescript",
        action="store_true",
        help="Output as TypeScript for Video.tsx",
    )
    args = parser.parse_args()

    scenes_dir = args.scenes_dir.resolve()
    transcript_path = args.transcript.resolve()

    if not scenes_dir.exists():
        print(f"Error: Scenes directory not found: {scenes_dir}", file=sys.stderr)
        sys.exit(1)

    if not transcript_path.exists():
        print(f"Error: Transcript not found: {transcript_path}", file=sys.stderr)
        sys.exit(1)

    # Extract boundaries
    boundaries = extract_boundaries(scenes_dir, transcript_path)

    # Calculate total
    total_duration = sum(b["duration_seconds"] for b in boundaries)

    # Output
    if args.json:
        print(format_json(boundaries))
    elif args.typescript:
        print(format_typescript(boundaries))
    else:
        print(format_table(boundaries, total_duration))


if __name__ == "__main__":
    main()
