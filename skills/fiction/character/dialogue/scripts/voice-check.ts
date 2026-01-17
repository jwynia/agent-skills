#!/usr/bin/env -S deno run --allow-read

/**
 * Voice Check - Dialogue Voice Distinctiveness Analyzer
 *
 * Analyzes dialogue to measure how distinct each speaker's voice is.
 * Compares vocabulary, sentence patterns, and speech characteristics.
 *
 * Usage:
 *   deno run --allow-read voice-check.ts dialogue.txt
 *   deno run --allow-read voice-check.ts --text "\"Hello,\" said Alice. \"Hi,\" said Bob."
 */

interface SpeakerStats {
  name: string;
  lineCount: number;
  wordCount: number;
  avgWordsPerLine: number;
  avgSentenceLength: number;
  vocabularySize: number;
  contractionRate: number;
  questionRate: number;
  exclamationRate: number;
  fragmentRate: number;
  uniqueWords: Set<string>;
  topWords: [string, number][];
}

interface VoiceAnalysis {
  speakers: Record<string, SpeakerStats>;
  overallDistinctiveness: number;
  vocabularyOverlap: number;
  patternsComparison: PatternComparison[];
  issues: string[];
  recommendations: string[];
}

interface PatternComparison {
  metric: string;
  values: Record<string, number>;
  variance: number;
  distinct: boolean;
}

// Common words to ignore in vocabulary analysis
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
  "be", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "must", "shall", "can", "need",
  "it", "its", "this", "that", "these", "those", "i", "you", "he",
  "she", "we", "they", "me", "him", "her", "us", "them", "my", "your",
  "his", "our", "their", "mine", "yours", "hers", "ours", "theirs",
  "what", "which", "who", "whom", "whose", "where", "when", "why", "how",
  "all", "each", "every", "both", "few", "more", "most", "other", "some",
  "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
  "very", "just", "also", "now", "here", "there", "then", "once",
]);

function extractDialogue(text: string): Map<string, string[]> {
  const speakers = new Map<string, string[]>();

  // Pattern: "dialogue" said/asked/replied Speaker or Speaker said "dialogue"
  // Also handles: "dialogue," Speaker said.

  // Find quoted text with nearby speaker attribution
  const patterns = [
    // "..." said Name
    /"([^"]+)"\s*(?:said|asked|replied|answered|whispered|shouted|muttered|called|cried|exclaimed|declared|announced|continued|added|interrupted|began|finished|concluded)\s+([A-Z][a-z]+)/gi,
    // "..." Name said
    /"([^"]+)"\s+([A-Z][a-z]+)\s+(?:said|asked|replied|answered|whispered|shouted|muttered|called|cried|exclaimed|declared|announced|continued|added|interrupted|began|finished|concluded)/gi,
    // Name said, "..."
    /([A-Z][a-z]+)\s+(?:said|asked|replied|answered|whispered|shouted|muttered|called|cried|exclaimed|declared|announced|continued|added|interrupted|began|finished|concluded),?\s+"([^"]+)"/gi,
  ];

  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      let speaker: string;
      let dialogue: string;

      if (match[0].startsWith('"')) {
        dialogue = match[1];
        speaker = match[2];
      } else {
        speaker = match[1];
        dialogue = match[2];
      }

      speaker = speaker.trim();
      dialogue = dialogue.trim();

      if (!speakers.has(speaker)) {
        speakers.set(speaker, []);
      }
      speakers.get(speaker)!.push(dialogue);
    }
  }

  // If no speaker attributions found, try to parse formatted dialogue
  // "Speaker: dialogue" format
  if (speakers.size === 0) {
    const colonPattern = /^([A-Z][A-Za-z]+):\s*"?([^"\n]+)"?/gm;
    let match;
    while ((match = colonPattern.exec(text)) !== null) {
      const speaker = match[1].trim();
      const dialogue = match[2].trim();
      if (!speakers.has(speaker)) {
        speakers.set(speaker, []);
      }
      speakers.get(speaker)!.push(dialogue);
    }
  }

  return speakers;
}

function analyzeVocabulary(lines: string[]): { unique: Set<string>; top: [string, number][] } {
  const wordCounts = new Map<string, number>();
  const unique = new Set<string>();

  for (const line of lines) {
    const words = line.toLowerCase().replace(/[^\w\s']/g, "").split(/\s+/);
    for (const word of words) {
      if (word.length > 1 && !STOP_WORDS.has(word)) {
        unique.add(word);
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
  }

  const sorted = [...wordCounts.entries()].sort((a, b) => b[1] - a[1]);
  return { unique, top: sorted.slice(0, 10) };
}

function countContractions(lines: string[]): number {
  let total = 0;
  let contractions = 0;
  const contractionPattern = /\b\w+'\w+\b/g;

  for (const line of lines) {
    const words = line.split(/\s+/);
    total += words.length;
    const matches = line.match(contractionPattern);
    if (matches) contractions += matches.length;
  }

  return total > 0 ? contractions / total : 0;
}

function countQuestions(lines: string[]): number {
  const questions = lines.filter(l => l.trim().endsWith("?")).length;
  return lines.length > 0 ? questions / lines.length : 0;
}

function countExclamations(lines: string[]): number {
  const exclamations = lines.filter(l => l.trim().endsWith("!")).length;
  return lines.length > 0 ? exclamations / lines.length : 0;
}

function countFragments(lines: string[]): number {
  // Simple heuristic: lines without verbs or very short
  let fragments = 0;
  const verbPatterns = /\b(is|are|was|were|am|be|been|being|have|has|had|do|does|did|will|would|could|should|can|may|might|must|shall|go|goes|went|gone|going|come|comes|came|coming|get|gets|got|getting|make|makes|made|making|know|knows|knew|knowing|think|thinks|thought|thinking|take|takes|took|taking|see|sees|saw|seeing|want|wants|wanted|wanting|say|says|said|saying|tell|tells|told|telling|ask|asks|asked|asking|need|needs|needed|needing|feel|feels|felt|feeling|try|tries|tried|trying|leave|leaves|left|leaving|call|calls|called|calling|keep|keeps|kept|keeping|let|lets|letting|begin|begins|began|begun|beginning|seem|seems|seemed|seeming|help|helps|helped|helping|show|shows|showed|showing|hear|hears|heard|hearing|play|plays|played|playing|run|runs|ran|running|move|moves|moved|moving|live|lives|lived|living|believe|believes|believed|believing|hold|holds|held|holding|bring|brings|brought|bringing|write|writes|wrote|writing|stand|stands|stood|standing|lose|loses|lost|losing|pay|pays|paid|paying|meet|meets|met|meeting|include|includes|included|including|continue|continues|continued|continuing|set|sets|setting|learn|learns|learned|learning|change|changes|changed|changing|lead|leads|led|leading|understand|understands|understood|understanding|watch|watches|watched|watching|follow|follows|followed|following|stop|stops|stopped|stopping|create|creates|created|creating|speak|speaks|spoke|speaking|read|reads|reading|allow|allows|allowed|allowing|add|adds|added|adding|spend|spends|spent|spending|grow|grows|grew|growing|open|opens|opened|opening|walk|walks|walked|walking|win|wins|won|winning|offer|offers|offered|offering|remember|remembers|remembered|remembering|love|loves|loved|loving|consider|considers|considered|considering|appear|appears|appeared|appearing|buy|buys|bought|buying|wait|waits|waited|waiting|serve|serves|served|serving|die|dies|died|dying|send|sends|sent|sending|expect|expects|expected|expecting|build|builds|built|building|stay|stays|stayed|staying|fall|falls|fell|fallen|falling|cut|cuts|cutting|reach|reaches|reached|reaching|kill|kills|killed|killing|remain|remains|remained|remaining)\b/i;

  for (const line of lines) {
    const wordCount = line.split(/\s+/).length;
    if (wordCount <= 3 || !verbPatterns.test(line)) {
      fragments++;
    }
  }

  return lines.length > 0 ? fragments / lines.length : 0;
}

function calculateSentenceLength(lines: string[]): number {
  let totalWords = 0;
  let totalSentences = 0;

  for (const line of lines) {
    const words = line.split(/\s+/).filter(w => w.length > 0);
    totalWords += words.length;
    // Count sentence-ending punctuation
    const sentences = (line.match(/[.!?]+/g) || []).length || 1;
    totalSentences += sentences;
  }

  return totalSentences > 0 ? totalWords / totalSentences : 0;
}

function analyzeSpeaker(name: string, lines: string[]): SpeakerStats {
  const vocab = analyzeVocabulary(lines);
  const wordCount = lines.reduce((sum, l) => sum + l.split(/\s+/).length, 0);

  return {
    name,
    lineCount: lines.length,
    wordCount,
    avgWordsPerLine: lines.length > 0 ? wordCount / lines.length : 0,
    avgSentenceLength: calculateSentenceLength(lines),
    vocabularySize: vocab.unique.size,
    contractionRate: countContractions(lines),
    questionRate: countQuestions(lines),
    exclamationRate: countExclamations(lines),
    fragmentRate: countFragments(lines),
    uniqueWords: vocab.unique,
    topWords: vocab.top,
  };
}

function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => (v - mean) ** 2);
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

function calculateOverlap(speakers: Map<string, SpeakerStats>): number {
  const allWords: Set<string>[] = [];
  for (const stats of speakers.values()) {
    allWords.push(stats.uniqueWords);
  }

  if (allWords.length < 2) return 0;

  // Calculate pairwise overlap
  let totalOverlap = 0;
  let pairs = 0;

  for (let i = 0; i < allWords.length; i++) {
    for (let j = i + 1; j < allWords.length; j++) {
      const intersection = new Set([...allWords[i]].filter(w => allWords[j].has(w)));
      const union = new Set([...allWords[i], ...allWords[j]]);
      totalOverlap += intersection.size / union.size;
      pairs++;
    }
  }

  return pairs > 0 ? totalOverlap / pairs : 0;
}

function analyzeVoices(speakerData: Map<string, string[]>): VoiceAnalysis {
  const speakers: Record<string, SpeakerStats> = {};
  const speakerStats = new Map<string, SpeakerStats>();

  for (const [name, lines] of speakerData) {
    const stats = analyzeSpeaker(name, lines);
    speakers[name] = stats;
    speakerStats.set(name, stats);
  }

  // Compare patterns
  const patterns: PatternComparison[] = [];
  const speakerNames = [...speakerStats.keys()];

  if (speakerNames.length >= 2) {
    const metrics = [
      { name: "avgWordsPerLine", label: "Words per line" },
      { name: "avgSentenceLength", label: "Sentence length" },
      { name: "contractionRate", label: "Contraction usage" },
      { name: "questionRate", label: "Question frequency" },
      { name: "exclamationRate", label: "Exclamation frequency" },
      { name: "fragmentRate", label: "Fragment frequency" },
    ];

    for (const metric of metrics) {
      const values: Record<string, number> = {};
      const nums: number[] = [];

      for (const name of speakerNames) {
        const val = speakerStats.get(name)![metric.name as keyof SpeakerStats] as number;
        values[name] = val;
        nums.push(val);
      }

      const variance = calculateVariance(nums);
      patterns.push({
        metric: metric.label,
        values,
        variance,
        distinct: variance > 0.01, // Threshold for "distinct enough"
      });
    }
  }

  const vocabularyOverlap = calculateOverlap(speakerStats);

  // Calculate overall distinctiveness (0-100)
  const distinctPatterns = patterns.filter(p => p.distinct).length;
  const patternScore = (distinctPatterns / Math.max(patterns.length, 1)) * 50;
  const overlapScore = (1 - vocabularyOverlap) * 50;
  const overallDistinctiveness = Math.round(patternScore + overlapScore);

  // Generate issues and recommendations
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (vocabularyOverlap > 0.6) {
    issues.push("High vocabulary overlap between speakers");
    recommendations.push("Give each character domain-specific vocabulary or verbal tics");
  }

  if (patterns.filter(p => !p.distinct).length > patterns.length / 2) {
    issues.push("Speech patterns too similar across speakers");
    recommendations.push("Vary sentence length, directness, or formality between characters");
  }

  const lowContraction = [...speakerStats.values()].filter(s => s.contractionRate < 0.05);
  if (lowContraction.length === speakerStats.size && speakerStats.size > 0) {
    issues.push("No speakers use contractions - may feel formal/wooden");
    recommendations.push("Add contractions for more natural speech patterns");
  }

  const allQuestions = [...speakerStats.values()].filter(s => s.questionRate > 0.5);
  if (allQuestions.length > speakerStats.size / 2) {
    issues.push("Most speakers ask many questions - may indicate exposition dump pattern");
  }

  if (speakerStats.size < 2) {
    issues.push("Need at least two speakers to compare voice distinctiveness");
  }

  return {
    speakers,
    overallDistinctiveness,
    vocabularyOverlap,
    patternsComparison: patterns,
    issues,
    recommendations,
  };
}

function formatReport(analysis: VoiceAnalysis): string {
  const lines: string[] = [];

  lines.push("# Voice Distinctiveness Analysis\n");
  lines.push(`Overall distinctiveness: ${analysis.overallDistinctiveness}/100`);
  lines.push(`Vocabulary overlap: ${(analysis.vocabularyOverlap * 100).toFixed(1)}%\n`);

  lines.push("## Speaker Profiles\n");
  for (const [name, stats] of Object.entries(analysis.speakers)) {
    lines.push(`### ${name}`);
    lines.push(`  Lines: ${stats.lineCount} | Words: ${stats.wordCount}`);
    lines.push(`  Avg words/line: ${stats.avgWordsPerLine.toFixed(1)}`);
    lines.push(`  Contractions: ${(stats.contractionRate * 100).toFixed(1)}%`);
    lines.push(`  Questions: ${(stats.questionRate * 100).toFixed(1)}%`);
    lines.push(`  Fragments: ${(stats.fragmentRate * 100).toFixed(1)}%`);
    if (stats.topWords.length > 0) {
      lines.push(`  Top words: ${stats.topWords.slice(0, 5).map(([w]) => w).join(", ")}`);
    }
    lines.push("");
  }

  if (analysis.patternsComparison.length > 0) {
    lines.push("## Pattern Comparison\n");
    for (const pattern of analysis.patternsComparison) {
      const status = pattern.distinct ? "+" : "-";
      const values = Object.entries(pattern.values)
        .map(([name, val]) => `${name}: ${typeof val === 'number' ? val.toFixed(2) : val}`)
        .join(", ");
      lines.push(`  ${status} ${pattern.metric}: ${values}`);
    }
    lines.push("");
  }

  if (analysis.issues.length > 0) {
    lines.push("## Issues\n");
    for (const issue of analysis.issues) {
      lines.push(`  - ${issue}`);
    }
    lines.push("");
  }

  if (analysis.recommendations.length > 0) {
    lines.push("## Recommendations\n");
    for (const rec of analysis.recommendations) {
      lines.push(`  - ${rec}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Voice Check - Dialogue Voice Distinctiveness Analyzer

Usage:
  deno run --allow-read voice-check.ts <file>
  deno run --allow-read voice-check.ts --text "dialogue here"

Options:
  --text "..."  Provide dialogue inline
  --json        Output as JSON
  --help        Show this message

Expected formats:
  - "Dialogue," said Speaker.
  - "Dialogue," Speaker said.
  - Speaker said, "Dialogue."
  - SPEAKER: Dialogue

The tool compares vocabulary, sentence patterns, and speech characteristics
to measure how distinct each speaker's voice is.
`);
    Deno.exit(0);
  }

  const jsonOutput = args.includes("--json");
  let text = "";

  if (args.includes("--text")) {
    const textIndex = args.indexOf("--text");
    text = args[textIndex + 1] || "";
  } else {
    const file = args.find(a => !a.startsWith("--"));
    if (file) {
      try {
        text = await Deno.readTextFile(file);
      } catch (e) {
        console.error(`Error reading file: ${e}`);
        Deno.exit(1);
      }
    }
  }

  if (!text.trim()) {
    console.error("Error: No text provided. Use --text or provide a file path.");
    Deno.exit(1);
  }

  const speakerData = extractDialogue(text);

  if (speakerData.size === 0) {
    console.error("Error: Could not extract dialogue. Check format (see --help).");
    Deno.exit(1);
  }

  const analysis = analyzeVoices(speakerData);

  if (jsonOutput) {
    // Convert Sets to arrays for JSON
    const jsonSafe = {
      ...analysis,
      speakers: Object.fromEntries(
        Object.entries(analysis.speakers).map(([k, v]) => [
          k,
          { ...v, uniqueWords: [...v.uniqueWords] },
        ])
      ),
    };
    console.log(JSON.stringify(jsonSafe, null, 2));
  } else {
    console.log(formatReport(analysis));
  }
}

main();
