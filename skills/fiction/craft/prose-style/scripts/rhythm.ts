#!/usr/bin/env -S deno run --allow-read

/**
 * rhythm.ts - Analyze prose rhythm and variety
 *
 * Reports:
 * - Sentence length distribution
 * - Paragraph length variation
 * - Opening word variety
 * - Rhythm score (variety metric)
 *
 * Usage:
 *   deno run --allow-read rhythm.ts <file>
 *   deno run --allow-read rhythm.ts --text "Short. Then longer. Short again."
 */

interface RhythmAnalysis {
  sentences: SentenceStats;
  paragraphs: ParagraphStats;
  openings: OpeningStats;
  rhythmScore: number;
  verdict: string;
}

interface SentenceStats {
  total: number;
  lengths: number[];
  short: number;      // < 10 words
  medium: number;     // 10-20 words
  long: number;       // 21-35 words
  veryLong: number;   // > 35 words
  avgLength: number;
  stdDev: number;
  varietyScore: number;
}

interface ParagraphStats {
  total: number;
  lengths: number[];  // sentences per paragraph
  short: number;      // 1-2 sentences
  medium: number;     // 3-5 sentences
  long: number;       // 6+ sentences
  avgLength: number;
  varietyScore: number;
}

interface OpeningStats {
  openings: Map<string, number>;
  uniqueRatio: number;
  topOpenings: [string, number][];
  repetitionWarnings: string[];
}

function splitIntoParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
}

function splitIntoSentences(text: string): string[] {
  // Handle common abbreviations
  const cleanText = text
    .replace(/Mr\./g, 'Mr')
    .replace(/Mrs\./g, 'Mrs')
    .replace(/Dr\./g, 'Dr')
    .replace(/Ms\./g, 'Ms')
    .replace(/\.\.\./g, '…');

  return cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function getOpeningWord(sentence: string): string {
  const words = sentence.trim().split(/\s+/);
  if (words.length === 0) return '';
  return words[0].toLowerCase().replace(/[^a-z]/g, '');
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

function analyzeSentences(sentences: string[]): SentenceStats {
  const lengths = sentences.map(s => countWords(s));

  let short = 0, medium = 0, long = 0, veryLong = 0;
  for (const len of lengths) {
    if (len < 10) short++;
    else if (len <= 20) medium++;
    else if (len <= 35) long++;
    else veryLong++;
  }

  const avgLength = lengths.length > 0
    ? lengths.reduce((a, b) => a + b, 0) / lengths.length
    : 0;

  const stdDev = calculateStdDev(lengths, avgLength);

  // Variety score: higher std dev = more variety
  // Normalize to 0-100 where 10+ std dev = 100
  const varietyScore = Math.min(100, (stdDev / 10) * 100);

  return {
    total: sentences.length,
    lengths,
    short,
    medium,
    long,
    veryLong,
    avgLength,
    stdDev,
    varietyScore,
  };
}

function analyzeParagraphs(paragraphs: string[]): ParagraphStats {
  const lengths = paragraphs.map(p => splitIntoSentences(p).length);

  let short = 0, medium = 0, long = 0;
  for (const len of lengths) {
    if (len <= 2) short++;
    else if (len <= 5) medium++;
    else long++;
  }

  const avgLength = lengths.length > 0
    ? lengths.reduce((a, b) => a + b, 0) / lengths.length
    : 0;

  // Variety score based on distribution across categories
  const total = paragraphs.length;
  let varietyScore = 0;
  if (total > 0) {
    const hasShort = short > 0;
    const hasMedium = medium > 0;
    const hasLong = long > 0;
    const categoryCount = [hasShort, hasMedium, hasLong].filter(Boolean).length;
    varietyScore = (categoryCount / 3) * 100;
  }

  return {
    total: paragraphs.length,
    lengths,
    short,
    medium,
    long,
    avgLength,
    varietyScore,
  };
}

function analyzeOpenings(sentences: string[]): OpeningStats {
  const openings = new Map<string, number>();

  for (const sentence of sentences) {
    const opening = getOpeningWord(sentence);
    if (opening) {
      openings.set(opening, (openings.get(opening) || 0) + 1);
    }
  }

  // Sort by frequency
  const sorted = [...openings.entries()].sort((a, b) => b[1] - a[1]);
  const topOpenings = sorted.slice(0, 10);

  // Calculate unique ratio
  const uniqueRatio = sentences.length > 0
    ? openings.size / sentences.length
    : 0;

  // Flag repetition warnings (same opening 4+ times, or >15% of sentences)
  const repetitionWarnings: string[] = [];
  const threshold = Math.max(4, sentences.length * 0.15);
  for (const [word, count] of sorted) {
    if (count >= threshold) {
      repetitionWarnings.push(`"${word}" starts ${count} sentences (${((count / sentences.length) * 100).toFixed(0)}%)`);
    }
  }

  return {
    openings,
    uniqueRatio,
    topOpenings,
    repetitionWarnings,
  };
}

function calculateRhythmScore(
  sentences: SentenceStats,
  paragraphs: ParagraphStats,
  openings: OpeningStats
): number {
  // Weighted average of variety metrics
  const sentenceWeight = 0.4;
  const paragraphWeight = 0.3;
  const openingWeight = 0.3;

  const openingScore = openings.uniqueRatio * 100;

  return (
    sentences.varietyScore * sentenceWeight +
    paragraphs.varietyScore * paragraphWeight +
    openingScore * openingWeight
  );
}

function getVerdict(analysis: RhythmAnalysis): string {
  const issues: string[] = [];

  // Check sentence variety
  if (analysis.sentences.varietyScore < 30) {
    issues.push('Low sentence length variety (monotonous)');
  }

  // Check for all-same-length issue
  if (analysis.sentences.short === 0 && analysis.sentences.total > 5) {
    issues.push('No short punchy sentences');
  }
  if (analysis.sentences.long === 0 && analysis.sentences.veryLong === 0 && analysis.sentences.total > 5) {
    issues.push('No long flowing sentences');
  }

  // Check paragraph variety
  if (analysis.paragraphs.varietyScore < 50) {
    issues.push('Limited paragraph length variety');
  }

  // Check openings
  if (analysis.openings.repetitionWarnings.length > 0) {
    issues.push('Repetitive sentence openings');
  }

  if (issues.length === 0) {
    return 'Good rhythm variety';
  } else if (issues.length <= 2) {
    return 'Some rhythm issues: ' + issues.join('; ');
  } else {
    return 'Monotonous prose: ' + issues.join('; ');
  }
}

function analyzeText(text: string): RhythmAnalysis {
  const paragraphs = splitIntoParagraphs(text);
  const sentences = splitIntoSentences(text);

  const sentenceStats = analyzeSentences(sentences);
  const paragraphStats = analyzeParagraphs(paragraphs);
  const openingStats = analyzeOpenings(sentences);

  const rhythmScore = calculateRhythmScore(sentenceStats, paragraphStats, openingStats);
  const verdict = getVerdict({
    sentences: sentenceStats,
    paragraphs: paragraphStats,
    openings: openingStats,
    rhythmScore,
    verdict: '', // placeholder
  });

  return {
    sentences: sentenceStats,
    paragraphs: paragraphStats,
    openings: openingStats,
    rhythmScore,
    verdict,
  };
}

function formatLengthHistogram(lengths: number[], bucketSize: number = 5): string {
  const buckets = new Map<number, number>();
  for (const len of lengths) {
    const bucket = Math.floor(len / bucketSize) * bucketSize;
    buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
  }

  const sortedBuckets = [...buckets.entries()].sort((a, b) => a[0] - b[0]);
  const maxCount = Math.max(...sortedBuckets.map(b => b[1]));
  const scale = Math.min(30, maxCount);

  let histogram = '';
  for (const [bucket, count] of sortedBuckets) {
    const barLength = Math.round((count / maxCount) * scale);
    const bar = '█'.repeat(barLength);
    histogram += `    ${String(bucket).padStart(2)}-${String(bucket + bucketSize - 1).padEnd(2)}: ${bar} (${count})\n`;
  }

  return histogram;
}

function formatReport(analysis: RhythmAnalysis): string {
  const { sentences, paragraphs, openings, rhythmScore, verdict } = analysis;

  let report = `
RHYTHM ANALYSIS
===============

OVERALL RHYTHM SCORE: ${rhythmScore.toFixed(0)}/100
${verdict}

SENTENCE LENGTH
  Total sentences: ${sentences.total}
  Average length: ${sentences.avgLength.toFixed(1)} words
  Standard deviation: ${sentences.stdDev.toFixed(1)}
  Variety score: ${sentences.varietyScore.toFixed(0)}/100

  Distribution:
    Short (<10 words):    ${sentences.short} (${((sentences.short / sentences.total) * 100).toFixed(0)}%)
    Medium (10-20 words): ${sentences.medium} (${((sentences.medium / sentences.total) * 100).toFixed(0)}%)
    Long (21-35 words):   ${sentences.long} (${((sentences.long / sentences.total) * 100).toFixed(0)}%)
    Very long (>35):      ${sentences.veryLong} (${((sentences.veryLong / sentences.total) * 100).toFixed(0)}%)

  Histogram (words per sentence):
${formatLengthHistogram(sentences.lengths, 5)}
PARAGRAPH LENGTH
  Total paragraphs: ${paragraphs.total}
  Average length: ${paragraphs.avgLength.toFixed(1)} sentences
  Variety score: ${paragraphs.varietyScore.toFixed(0)}/100

  Distribution:
    Short (1-2 sentences): ${paragraphs.short} (${paragraphs.total > 0 ? ((paragraphs.short / paragraphs.total) * 100).toFixed(0) : 0}%)
    Medium (3-5 sentences): ${paragraphs.medium} (${paragraphs.total > 0 ? ((paragraphs.medium / paragraphs.total) * 100).toFixed(0) : 0}%)
    Long (6+ sentences): ${paragraphs.long} (${paragraphs.total > 0 ? ((paragraphs.long / paragraphs.total) * 100).toFixed(0) : 0}%)

SENTENCE OPENINGS
  Unique ratio: ${(openings.uniqueRatio * 100).toFixed(0)}% (${openings.openings.size} unique / ${sentences.total} sentences)

  Most common openings:
${openings.topOpenings.map(([word, count]) => `    "${word}": ${count} times (${((count / sentences.total) * 100).toFixed(0)}%)`).join('\n')}
`;

  if (openings.repetitionWarnings.length > 0) {
    report += `
  WARNINGS:
${openings.repetitionWarnings.map(w => `    ! ${w}`).join('\n')}
`;
  }

  report += `
RECOMMENDATIONS:
  - If monotonous: vary sentence lengths consciously
  - Short sentences punch, long sentences flow
  - Use single-sentence paragraphs for emphasis
  - Vary sentence openings (not all "The" or "He/She")
  - Mix simple, compound, and complex sentences
`;

  return report;
}

async function main() {
  const args = Deno.args;
  let text: string;

  if (args.includes('--text')) {
    const textIndex = args.indexOf('--text');
    text = args.slice(textIndex + 1).join(' ');
  } else if (args.length > 0) {
    const filename = args[0];
    try {
      text = await Deno.readTextFile(filename);
    } catch (e) {
      console.error(`Error reading file: ${filename}`);
      console.error(e);
      Deno.exit(1);
    }
  } else {
    console.log(`
Usage:
  deno run --allow-read rhythm.ts <file>
  deno run --allow-read rhythm.ts --text "Short. Then longer. Short again."

Analyzes prose rhythm for:
  - Sentence length distribution
  - Paragraph length variation
  - Opening word variety
  - Overall rhythm score
`);
    Deno.exit(0);
  }

  const analysis = analyzeText(text);
  console.log(formatReport(analysis));
}

main();
