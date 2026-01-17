#!/usr/bin/env -S deno run --allow-read

/**
 * prose-check.ts - Analyze prose for common issues
 *
 * Detects:
 * - Passive voice percentage
 * - Weak verb frequency
 * - Adverb density
 * - Filter word usage
 * - Adjective stacking
 *
 * Usage:
 *   deno run --allow-read prose-check.ts <file>
 *   deno run --allow-read prose-check.ts --text "Text to analyze..."
 */

// Passive voice indicators
const PASSIVE_PATTERNS = [
  /\b(is|are|was|were|be|been|being)\s+(\w+ed|written|done|made|taken|given|seen|shown|known|found)\b/gi,
  /\b(has|have|had)\s+been\s+\w+/gi,
  /\bget(s|ting)?\s+\w+ed\b/gi,
];

// Weak verbs to flag
const WEAK_VERBS = [
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'has', 'have', 'had',
  'do', 'does', 'did',
  'get', 'gets', 'got', 'gotten',
  'make', 'makes', 'made',
  'seem', 'seems', 'seemed',
  'appear', 'appears', 'appeared',
  'become', 'becomes', 'became',
];

// Filter words (distance readers from experience)
const FILTER_WORDS = [
  'saw', 'see', 'sees', 'seen',
  'heard', 'hear', 'hears',
  'felt', 'feel', 'feels',
  'noticed', 'notice', 'notices',
  'realized', 'realize', 'realizes',
  'thought', 'think', 'thinks',
  'knew', 'know', 'knows',
  'watched', 'watch', 'watches',
  'wondered', 'wonder', 'wonders',
  'decided', 'decide', 'decides',
];

// Common adverb endings and specific adverbs to flag
const ADVERB_PATTERN = /\b\w+ly\b/gi;
const DIALOGUE_ADVERBS = [
  'quickly', 'slowly', 'softly', 'loudly', 'quietly',
  'angrily', 'sadly', 'happily', 'nervously', 'anxiously',
  'suddenly', 'immediately', 'finally', 'really', 'very',
  'actually', 'basically', 'literally', 'definitely', 'certainly',
];

interface AnalysisResult {
  totalSentences: number;
  totalWords: number;
  passiveCount: number;
  passivePercentage: number;
  passiveExamples: string[];
  weakVerbCount: number;
  weakVerbPercentage: number;
  adverbCount: number;
  adverbDensity: number;
  adverbExamples: string[];
  filterWordCount: number;
  filterExamples: string[];
  adjectiveStackCount: number;
  stackExamples: string[];
}

function splitIntoSentences(text: string): string[] {
  // Simple sentence splitter
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function findPassiveVoice(text: string): { count: number; examples: string[] } {
  const examples: string[] = [];
  let count = 0;

  const sentences = splitIntoSentences(text);

  for (const sentence of sentences) {
    for (const pattern of PASSIVE_PATTERNS) {
      pattern.lastIndex = 0;
      const matches = sentence.match(pattern);
      if (matches) {
        count += matches.length;
        if (examples.length < 5) {
          examples.push(sentence.trim().slice(0, 80) + (sentence.length > 80 ? '...' : ''));
        }
      }
    }
  }

  return { count, examples: [...new Set(examples)] };
}

function countWeakVerbs(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  return words.filter(w => WEAK_VERBS.includes(w.replace(/[^a-z]/g, ''))).length;
}

function findAdverbs(text: string): { count: number; examples: string[] } {
  const matches = text.match(ADVERB_PATTERN) || [];
  const examples = matches
    .filter(m => DIALOGUE_ADVERBS.includes(m.toLowerCase()))
    .slice(0, 10);
  return { count: matches.length, examples };
}

function findFilterWords(text: string): { count: number; examples: string[] } {
  const words = text.toLowerCase().split(/\s+/);
  const found = words.filter(w => FILTER_WORDS.includes(w.replace(/[^a-z]/g, '')));
  return {
    count: found.length,
    examples: [...new Set(found)].slice(0, 10)
  };
}

function findAdjectiveStacks(text: string): { count: number; examples: string[] } {
  // Pattern: 2+ adjectives before a noun (simplified)
  const pattern = /\b((\w+,?\s+){2,})(man|woman|person|thing|place|room|house|building|sky|day|night|face|eyes|voice|hand|way|time|door|wall|street|car|sun|moon|tree|water)\b/gi;
  const matches = text.match(pattern) || [];

  // Also check for comma-separated adjective lists
  const commaPattern = /\b\w+,\s+\w+,\s+\w+\s+(and\s+)?\w+\b/gi;
  const commaMatches = text.match(commaPattern) || [];

  const examples = [...matches, ...commaMatches].slice(0, 5);
  return { count: matches.length + commaMatches.length, examples };
}

function analyzeText(text: string): AnalysisResult {
  const sentences = splitIntoSentences(text);
  const totalWords = countWords(text);
  const passive = findPassiveVoice(text);
  const weakVerbCount = countWeakVerbs(text);
  const adverbs = findAdverbs(text);
  const filters = findFilterWords(text);
  const stacks = findAdjectiveStacks(text);

  return {
    totalSentences: sentences.length,
    totalWords,
    passiveCount: passive.count,
    passivePercentage: sentences.length > 0 ? (passive.count / sentences.length) * 100 : 0,
    passiveExamples: passive.examples,
    weakVerbCount,
    weakVerbPercentage: totalWords > 0 ? (weakVerbCount / totalWords) * 100 : 0,
    adverbCount: adverbs.count,
    adverbDensity: totalWords > 0 ? (adverbs.count / totalWords) * 100 : 0,
    adverbExamples: adverbs.examples,
    filterWordCount: filters.count,
    filterExamples: filters.examples,
    adjectiveStackCount: stacks.count,
    stackExamples: stacks.examples,
  };
}

function getVerdict(result: AnalysisResult): string {
  const issues: string[] = [];

  if (result.passivePercentage > 20) {
    issues.push('High passive voice usage (>20%)');
  }
  if (result.weakVerbPercentage > 15) {
    issues.push('High weak verb frequency (>15%)');
  }
  if (result.adverbDensity > 4) {
    issues.push('High adverb density (>4%)');
  }
  if (result.filterWordCount > result.totalSentences * 0.1) {
    issues.push('Frequent filter words');
  }
  if (result.adjectiveStackCount > 3) {
    issues.push('Multiple adjective stacks detected');
  }

  if (issues.length === 0) {
    return 'Prose patterns look healthy';
  } else if (issues.length <= 2) {
    return 'Minor issues: ' + issues.join('; ');
  } else {
    return 'Multiple issues detected: ' + issues.join('; ');
  }
}

function formatReport(result: AnalysisResult): string {
  let report = `
PROSE ANALYSIS
==============

Overview:
  Sentences: ${result.totalSentences}
  Words: ${result.totalWords}

PASSIVE VOICE
  Count: ${result.passiveCount}
  Percentage: ${result.passivePercentage.toFixed(1)}% of sentences
  Target: <20%`;

  if (result.passiveExamples.length > 0) {
    report += `\n  Examples:\n${result.passiveExamples.map(e => '    - "' + e + '"').join('\n')}`;
  }

  report += `

WEAK VERBS (is/was/had/got/made/seemed)
  Count: ${result.weakVerbCount}
  Percentage: ${result.weakVerbPercentage.toFixed(1)}% of words
  Target: <15%

ADVERBS
  Count: ${result.adverbCount}
  Density: ${result.adverbDensity.toFixed(1)}% of words
  Target: <4%`;

  if (result.adverbExamples.length > 0) {
    report += `\n  Flagged: ${result.adverbExamples.join(', ')}`;
  }

  report += `

FILTER WORDS (saw/felt/noticed/realized/etc.)
  Count: ${result.filterWordCount}`;

  if (result.filterExamples.length > 0) {
    report += `\n  Found: ${result.filterExamples.join(', ')}`;
  }

  report += `

ADJECTIVE STACKING
  Count: ${result.adjectiveStackCount}`;

  if (result.stackExamples.length > 0) {
    report += `\n  Examples:\n${result.stackExamples.map(e => '    - "' + e + '"').join('\n')}`;
  }

  report += `

VERDICT
  ${getVerdict(result)}

RECOMMENDATIONS:
  - Passive voice: Use intentionally for emphasis or unknown agents
  - Weak verbs: Replace with specific, active verbs where possible
  - Adverbs: Cut or replace with stronger verbs
  - Filter words: Remove to bring reader closer to experience
  - Adjective stacks: Choose one precise adjective over many vague ones
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
  deno run --allow-read prose-check.ts <file>
  deno run --allow-read prose-check.ts --text "Text to analyze..."

Analyzes prose for:
  - Passive voice percentage
  - Weak verb frequency
  - Adverb density
  - Filter word usage
  - Adjective stacking
`);
    Deno.exit(0);
  }

  const result = analyzeText(text);
  console.log(formatReport(result));
}

main();
