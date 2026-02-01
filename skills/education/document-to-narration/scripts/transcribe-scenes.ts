#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * transcribe-scenes.ts
 *
 * Transcribe audio files to get word-level timestamps using Whisper.
 * Outputs VTT files and updates the manifest with caption data.
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-run scripts/transcribe-scenes.ts ./output/scenes/
 *   deno run --allow-read --allow-write --allow-run scripts/transcribe-scenes.ts ./output/scenes/ --model large-v3-turbo
 *   deno run --allow-read --allow-write --allow-run scripts/transcribe-scenes.ts ./output/scenes/ --whisper-path ./whisper.cpp
 */

// ============================================================================
// Types
// ============================================================================

interface WhisperToken {
  t_dtw: number;
  text: string;
  timestamps: { from: string; to: string };
  offsets: { from: number; to: number };
  id: number;
  p: number;
}

interface WhisperTranscriptionItem {
  timestamps: { from: string; to: string };
  offsets: { from: number; to: number };
  text: string;
  tokens: WhisperToken[];
}

interface WhisperOutput {
  transcription: WhisperTranscriptionItem[];
}

interface Caption {
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

interface ManifestScene {
  number: number;
  slug: string;
  word_count: number;
  audio_duration_seconds?: number;
  files: {
    text: string;
    audio?: string;
    captions?: string;
  };
  captions?: Caption[];
}

interface Manifest {
  source: string;
  created_at: string;
  total_scenes: number;
  total_duration_seconds?: number;
  scenes: ManifestScene[];
}

// ============================================================================
// Audio Conversion
// ============================================================================

async function convertTo16kHz(
  inputPath: string,
  outputPath: string
): Promise<boolean> {
  console.log(`  Converting to 16kHz: ${inputPath}`);

  const cmd = new Deno.Command('ffmpeg', {
    args: [
      '-i',
      inputPath,
      '-ar',
      '16000',
      '-ac',
      '1',
      '-y',
      outputPath,
    ],
    stdout: 'piped',
    stderr: 'piped',
  });

  const result = await cmd.output();

  if (!result.success) {
    const stderr = new TextDecoder().decode(result.stderr);
    console.error(`  ffmpeg error: ${stderr}`);
    return false;
  }

  return true;
}

// ============================================================================
// Whisper Transcription
// ============================================================================

async function transcribeWithWhisper(
  wavPath: string,
  whisperPath: string,
  model: string
): Promise<WhisperOutput | null> {
  const modelPath = `${whisperPath}/models/ggml-${model}.bin`;
  const mainPath = `${whisperPath}/main`;

  // Check if whisper is installed
  try {
    await Deno.stat(mainPath);
  } catch {
    console.error(`  Whisper not found at: ${mainPath}`);
    console.error('  Install with: npx @remotion/install-whisper-cpp');
    return null;
  }

  // Check if model exists
  try {
    await Deno.stat(modelPath);
  } catch {
    console.error(`  Model not found: ${modelPath}`);
    console.error(`  Download with: npx @remotion/install-whisper-cpp --model ${model}`);
    return null;
  }

  const tmpJsonPath = `${wavPath}.json`;

  const cmd = new Deno.Command(mainPath, {
    args: [
      '-f',
      wavPath,
      '--output-file',
      tmpJsonPath,
      '--output-json',
      '-ojf',
      '--dtw',
      model.replace('-', '.'),
      '-m',
      modelPath,
      '-pp',
      '-l',
      'en',
    ],
    cwd: whisperPath,
    stdout: 'piped',
    stderr: 'piped',
  });

  console.log(`  Running Whisper transcription...`);
  const result = await cmd.output();

  // Read the output JSON
  const jsonPath = `${tmpJsonPath}.json`;
  try {
    const jsonContent = await Deno.readTextFile(jsonPath);
    await Deno.remove(jsonPath);
    return JSON.parse(jsonContent);
  } catch (e) {
    if (!result.success) {
      const stderr = new TextDecoder().decode(result.stderr);
      console.error(`  Whisper error: ${stderr}`);
    }
    console.error(`  Could not read transcription output: ${e}`);
    return null;
  }
}

// ============================================================================
// Caption Processing
// ============================================================================

function whisperToCaptions(whisperOutput: WhisperOutput): Caption[] {
  const captions: Caption[] = [];

  for (const item of whisperOutput.transcription) {
    if (item.text === '' || !item.tokens) continue;

    // Get word-level timing from tokens
    for (const token of item.tokens) {
      const text = token.text.trim();
      if (!text) continue;

      // t_dtw is in centiseconds (10ms units)
      const startMs = token.t_dtw >= 0 ? token.t_dtw * 10 : item.offsets.from;
      const endMs = token.offsets.to;

      captions.push({
        text,
        startMs,
        endMs,
        confidence: token.p,
      });
    }
  }

  return captions;
}

function captionsToVTT(captions: Caption[]): string {
  const lines: string[] = ['WEBVTT', ''];

  for (const caption of captions) {
    const startTime = formatVTTTime(caption.startMs);
    const endTime = formatVTTTime(caption.endMs);
    lines.push(`${startTime} --> ${endTime}`);
    lines.push(caption.text);
    lines.push('');
  }

  return lines.join('\n');
}

function formatVTTTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

// ============================================================================
// Main Processing
// ============================================================================

async function processScene(
  wavPath: string,
  whisperPath: string,
  model: string
): Promise<{ vttPath: string; captions: Caption[] } | null> {
  // Convert to 16kHz if needed
  const wav16kPath = wavPath.replace('.wav', '_16k.wav');

  if (!(await convertTo16kHz(wavPath, wav16kPath))) {
    return null;
  }

  // Transcribe
  const whisperOutput = await transcribeWithWhisper(wav16kPath, whisperPath, model);

  // Clean up temp file
  try {
    await Deno.remove(wav16kPath);
  } catch {
    // Ignore cleanup errors
  }

  if (!whisperOutput) {
    return null;
  }

  // Convert to captions
  const captions = whisperToCaptions(whisperOutput);

  // Write VTT
  const vttPath = wavPath.replace('.wav', '.vtt');
  const vttContent = captionsToVTT(captions);
  await Deno.writeTextFile(vttPath, vttContent);

  console.log(`  Wrote: ${vttPath} (${captions.length} words)`);

  return { vttPath, captions };
}

async function updateManifest(
  manifestPath: string,
  sceneResults: Map<string, Caption[]>
): Promise<void> {
  let manifest: Manifest;

  try {
    const content = await Deno.readTextFile(manifestPath);
    manifest = JSON.parse(content);
  } catch {
    console.error(`Warning: Could not read manifest: ${manifestPath}`);
    return;
  }

  for (const scene of manifest.scenes) {
    const audioFile = scene.files.audio;
    if (!audioFile) continue;

    const wavName = audioFile.split('/').pop()!;
    const captions = sceneResults.get(wavName);

    if (captions) {
      scene.files.captions = audioFile.replace('.wav', '.vtt');
      scene.captions = captions;
    }
  }

  await Deno.writeTextFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nUpdated manifest: ${manifestPath}`);
}

// ============================================================================
// Main
// ============================================================================

function printHelp() {
  console.log(`
transcribe-scenes.ts - Transcribe audio for word-level timing

USAGE:
  deno run --allow-read --allow-write --allow-run scripts/transcribe-scenes.ts <scenes-dir> [options]

OPTIONS:
  --model <name>         Whisper model (default: medium)
                         Options: tiny, base, small, medium, large-v2, large-v3, large-v3-turbo
  --whisper-path <dir>   Path to whisper.cpp installation (default: ./whisper.cpp)
  --force                Re-transcribe even if VTT exists
  --help, -h             Show this help

REQUIREMENTS:
  - ffmpeg installed and in PATH
  - whisper.cpp installed (use @remotion/install-whisper-cpp)
  - Whisper model downloaded

EXAMPLE:
  # First install whisper
  npx @remotion/install-whisper-cpp --to ./whisper.cpp
  npx @remotion/install-whisper-cpp --download-model --model medium --to ./whisper.cpp

  # Then transcribe
  deno run -A scripts/transcribe-scenes.ts ./output/scenes/ --whisper-path ./whisper.cpp
`);
}

async function main() {
  const args = Deno.args;

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printHelp();
    Deno.exit(0);
  }

  // Parse arguments
  const scenesDir = args.find((a) => !a.startsWith('--'));
  const force = args.includes('--force');

  const modelIdx = args.indexOf('--model');
  const model = modelIdx >= 0 ? args[modelIdx + 1] : 'medium';

  const whisperIdx = args.indexOf('--whisper-path');
  const whisperPath = whisperIdx >= 0 ? args[whisperIdx + 1] : './whisper.cpp';

  if (!scenesDir) {
    console.error('Error: No scenes directory specified');
    Deno.exit(1);
  }

  // Find WAV files
  const wavFiles: string[] = [];
  for await (const entry of Deno.readDir(scenesDir)) {
    if (entry.isFile && entry.name.endsWith('.wav')) {
      const vttPath = `${scenesDir}/${entry.name.replace('.wav', '.vtt')}`;
      const vttExists = await Deno.stat(vttPath).then(() => true).catch(() => false);

      if (!vttExists || force) {
        wavFiles.push(`${scenesDir}/${entry.name}`);
      } else {
        console.log(`Skipping (VTT exists): ${entry.name}`);
      }
    }
  }

  wavFiles.sort();

  if (wavFiles.length === 0) {
    console.log('No WAV files to process. Use --force to re-transcribe.');
    Deno.exit(0);
  }

  console.log(`\nFiles to transcribe: ${wavFiles.length}`);
  console.log(`Model: ${model}`);
  console.log(`Whisper path: ${whisperPath}`);
  console.log('-'.repeat(40));

  // Process each file
  const sceneResults = new Map<string, Caption[]>();

  for (const wavPath of wavFiles) {
    const filename = wavPath.split('/').pop()!;
    console.log(`\nProcessing: ${filename}`);

    const result = await processScene(wavPath, whisperPath, model);
    if (result) {
      sceneResults.set(filename, result.captions);
    }
  }

  // Update manifest
  const manifestPath = `${scenesDir}/../manifest.json`;
  await updateManifest(manifestPath, sceneResults);

  console.log(`\nCompleted: ${sceneResults.size}/${wavFiles.length} files`);
}

main();
