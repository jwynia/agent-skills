# Story-Zoom Templates

Templates for initializing story-state in a new project.

## story-state/

The `story-state/` directory is created by `init.ts` and contains:

- `state.md` - Dashboard showing sync status across levels (LLM-maintained)
- `change-log.jsonl` - Append-only log of file changes (daemon-maintained)
- `last-review.json` - Timestamp of last LLM review

## Standard Story Directory Structure

```
story-project/
├── story-state/          # Auto-managed
│   ├── state.md          # Dashboard
│   ├── change-log.jsonl  # Change log
│   └── last-review.json  # Last review timestamp
├── pitch/                # L1: High-level story docs
│   ├── tagline.md
│   ├── logline.md
│   └── synopsis.md
├── structure/            # L2: Story skeleton
│   ├── outline.md
│   ├── beats.md
│   └── act-1.md, act-2.md, act-3.md
├── scenes/               # L3: Scene breakdowns
│   └── scene-01.md, scene-02.md, ...
├── entities/             # L4: Story elements
│   ├── characters/
│   │   └── protagonist.md, antagonist.md, ...
│   ├── locations/
│   │   └── main-setting.md, ...
│   └── items/
│       └── macguffin.md, ...
└── manuscript/           # L5: Actual prose
    └── chapter-01.md, chapter-02.md, ...
```

## Wiki-Link Convention

Reference entities using wiki-links: `[[entity-name]]`

The entity name should match the filename (without .md extension):
- `[[protagonist]]` → `entities/characters/protagonist.md`
- `[[main-setting]]` → `entities/locations/main-setting.md`

These create implicit bindings that story-zoom uses to find related files.
