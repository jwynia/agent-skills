#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env

/**
 * full-pipeline.ts
 *
 * Orchestrate the complete document-to-narration pipeline:
 * 1. Split document into scenes
 * 2. Generate TTS audio for each scene
 * 3. Transcribe audio for word-level timing
 *
 * Usage:
 *   deno run -A scripts/full-pipeline.ts input.md --output ./output/project-name/
 *   deno run -A scripts/full-pipeline.ts input.md --output ./output/ --skip-tts
 *   deno run -A scripts/full-pipeline.ts input.md --output ./output/ --by-headings
 */

import { dirname, fromFileUrl, join } from 'https://deno.land/std@0.208.0/path/mod.ts';

// ============================================================================
// Configuration
// ============================================================================

const SCRIPT_DIR = dirname(fromFileUrl(import.meta.url));
const SKILL_DIR = join(SCRIPT_DIR, '..');
const TTS_DIR = join(SKILL_DIR, 'tts');

// ============================================================================
// Utilities
// ============================================================================

async function runCommand(
  cmd: string,
  args: string[],
  options: { cwd?: string; env?: Record<string, string> } = {}
): Promise<{ success: boolean; stdout: string; stderr: string }> {
  const command = new Deno.Command(cmd, {
    args,
    cwd: options.cwd,
    env: options.env,
    stdout: 'piped',
    stderr: 'piped',
  });

  const result = await command.output();
  return {
    success: result.success,
    stdout: new TextDecoder().decode(result.stdout),
    stderr: new TextDecoder().decode(result.stderr),
  };
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Pipeline Steps
// ============================================================================

async function splitDocument(
  inputFile: string,
  outputDir: string,
  byHeadings: boolean,
  boundariesFile?: string
): Promise<boolean> {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: Splitting document into scenes');
  console.log('='.repeat(60));

  const splitScript = join(SCRIPT_DIR, 'split-to-scenes.ts');
  const args = [
    'run',
    '--allow-read',
    '--allow-write',
    splitScript,
    inputFile,
    '--output',
    outputDir,
  ];

  if (boundariesFile) {
    args.push('--boundaries', boundariesFile);
  } else if (byHeadings) {
    args.push('--by-headings');
  } else {
    // Default to by-headings if no boundaries specified
    console.log('  Using default: splitting by H2 headings');
    args.push('--by-headings');
  }

  const result = await runCommand('deno', args);

  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);

  return result.success;
}

async function generateAudio(outputDir: string, force: boolean): Promise<boolean> {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: Generating TTS audio');
  console.log('='.repeat(60));

  const scenesDir = join(outputDir, 'scenes');
  const narrateScript = join(SCRIPT_DIR, 'narrate-scenes.py');

  // Check for Python venv
  const venvPython = join(TTS_DIR, '.venv', 'bin', 'python');
  const hasPythonVenv = await fileExists(venvPython);

  let pythonCmd: string;
  if (hasPythonVenv) {
    pythonCmd = venvPython;
    console.log(`  Using venv Python: ${venvPython}`);
  } else {
    console.log('  Warning: No venv found at tts/.venv');
    console.log('  Trying system Python...');
    pythonCmd = 'python3';
  }

  const args = [narrateScript, scenesDir];
  if (force) {
    args.push('--force');
  }

  const result = await runCommand(pythonCmd, args);

  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);

  return result.success;
}

async function transcribeAudio(
  outputDir: string,
  whisperPath: string,
  model: string,
  force: boolean
): Promise<boolean> {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: Transcribing audio for word-level timing');
  console.log('='.repeat(60));

  const scenesDir = join(outputDir, 'scenes');
  const transcribeScript = join(SCRIPT_DIR, 'transcribe-scenes.ts');

  const args = [
    'run',
    '--allow-read',
    '--allow-write',
    '--allow-run',
    transcribeScript,
    scenesDir,
    '--whisper-path',
    whisperPath,
    '--model',
    model,
  ];

  if (force) {
    args.push('--force');
  }

  const result = await runCommand('deno', args);

  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);

  return result.success;
}

// ============================================================================
// Main
// ============================================================================

function printHelp() {
  console.log(`
full-pipeline.ts - Complete document-to-narration pipeline

USAGE:
  deno run -A scripts/full-pipeline.ts <input.md> --output <dir> [options]

OPTIONS:
  --output <dir>           Output directory (required)
  --by-headings            Split by H2 headings (default if no boundaries)
  --boundaries <file>      Use agent-specified scene boundaries
  --skip-tts               Skip audio generation
  --skip-transcribe        Skip Whisper transcription
  --force                  Force regeneration of all files
  --whisper-path <dir>     Path to whisper.cpp (default: ./whisper.cpp)
  --whisper-model <name>   Whisper model (default: medium)
  --help, -h               Show this help

PREREQUISITES:
  1. Python venv at tts/.venv with requirements installed
  2. whisper.cpp installed with model downloaded

EXAMPLE:
  # Full pipeline with default settings
  deno run -A scripts/full-pipeline.ts essay.md --output ./output/my-essay/

  # Split only (no audio)
  deno run -A scripts/full-pipeline.ts essay.md --output ./output/ --skip-tts --skip-transcribe

  # With custom whisper settings
  deno run -A scripts/full-pipeline.ts essay.md --output ./output/ --whisper-model large-v3-turbo

PIPELINE:
  1. Split document into scene .txt files
  2. Generate .wav audio for each scene (TTS)
  3. Transcribe .wav to .vtt with word-level timing
  4. Update manifest.json with complete data
`);
}

async function main() {
  const args = Deno.args;

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printHelp();
    Deno.exit(0);
  }

  // Parse arguments
  const inputFile = args.find((a) => !a.startsWith('--'));
  const byHeadings = args.includes('--by-headings');
  const skipTTS = args.includes('--skip-tts');
  const skipTranscribe = args.includes('--skip-transcribe');
  const force = args.includes('--force');

  const outputIdx = args.indexOf('--output');
  const outputDir = outputIdx >= 0 ? args[outputIdx + 1] : null;

  const boundariesIdx = args.indexOf('--boundaries');
  const boundariesFile = boundariesIdx >= 0 ? args[boundariesIdx + 1] : undefined;

  const whisperPathIdx = args.indexOf('--whisper-path');
  const whisperPath = whisperPathIdx >= 0 ? args[whisperPathIdx + 1] : './whisper.cpp';

  const whisperModelIdx = args.indexOf('--whisper-model');
  const whisperModel = whisperModelIdx >= 0 ? args[whisperModelIdx + 1] : 'medium';

  // Validate
  if (!inputFile) {
    console.error('Error: No input file specified');
    Deno.exit(1);
  }

  if (!outputDir) {
    console.error('Error: --output directory required');
    Deno.exit(1);
  }

  if (!(await fileExists(inputFile))) {
    console.error(`Error: Input file not found: ${inputFile}`);
    Deno.exit(1);
  }

  // Create output directory
  await Deno.mkdir(outputDir, { recursive: true });

  console.log('Document to Narration Pipeline');
  console.log('='.repeat(60));
  console.log(`Input: ${inputFile}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Skip TTS: ${skipTTS}`);
  console.log(`Skip Transcribe: ${skipTranscribe}`);

  // Step 1: Split document
  const splitSuccess = await splitDocument(inputFile, outputDir, byHeadings, boundariesFile);
  if (!splitSuccess) {
    console.error('\nError: Document splitting failed');
    Deno.exit(1);
  }

  // Step 2: Generate audio
  if (!skipTTS) {
    const audioSuccess = await generateAudio(outputDir, force);
    if (!audioSuccess) {
      console.error('\nWarning: Audio generation had errors');
      // Continue anyway - some files may have succeeded
    }
  } else {
    console.log('\n[Skipping TTS audio generation]');
  }

  // Step 3: Transcribe
  if (!skipTTS && !skipTranscribe) {
    const transcribeSuccess = await transcribeAudio(outputDir, whisperPath, whisperModel, force);
    if (!transcribeSuccess) {
      console.error('\nWarning: Transcription had errors');
    }
  } else if (skipTranscribe) {
    console.log('\n[Skipping Whisper transcription]');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('PIPELINE COMPLETE');
  console.log('='.repeat(60));
  console.log(`Output directory: ${outputDir}`);
  console.log(`\nGenerated files:`);

  const scenesDir = join(outputDir, 'scenes');
  if (await fileExists(scenesDir)) {
    for await (const entry of Deno.readDir(scenesDir)) {
      console.log(`  ${entry.name}`);
    }
  }

  const manifestPath = join(outputDir, 'manifest.json');
  if (await fileExists(manifestPath)) {
    console.log(`\nManifest: ${manifestPath}`);
  }
}

main();
