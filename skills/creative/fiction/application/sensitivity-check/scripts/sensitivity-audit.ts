#!/usr/bin/env -S deno run --allow-read

/**
 * sensitivity-audit.ts - Pattern scanner for potential representation concerns
 *
 * IMPORTANT: This tool flags patterns for HUMAN REVIEW. It cannot determine
 * context, intent, or whether a pattern is actually problematic. Every flag
 * requires human evaluation.
 *
 * Detects:
 * - Potential stereotyping language patterns
 * - Uneven physical description patterns
 * - Common harmful trope markers
 * - Agency/voice distribution indicators
 *
 * Usage:
 *   deno run --allow-read sensitivity-audit.ts manuscript.txt
 *   deno run --allow-read sensitivity-audit.ts --text "Sample passage..."
 */

interface PatternMatch {
  category: string;
  pattern: string;
  line: number;
  text: string;
  note: string;
}

interface AuditResult {
  totalLines: number;
  flags: PatternMatch[];
  summary: Record<string, number>;
}

// Physical description patterns that may indicate gendered gaze
const PHYSICAL_DESCRIPTION_PATTERNS = [
  { pattern: /\b(her|she|woman's|girl's)\s+(body|figure|curves|breasts|legs|hips|waist|lips|skin)\b/gi, note: "Physical description of female body - check for male gaze" },
  { pattern: /\b(beautiful|gorgeous|stunning|sexy|attractive)\s+(woman|girl|she|her)\b/gi, note: "Appearance-focused female description - check balance with male characters" },
  { pattern: /\bher\s+(ample|full|heaving|soft)\s+/gi, note: "Potentially objectifying description - review context" },
];

// Stereotyping language patterns (require context review)
const STEREOTYPE_PATTERNS = [
  // General
  { pattern: /\b(exotic|oriental)\b/gi, note: "Potentially othering language - review context" },
  { pattern: /\b(tribe|tribal)\b/gi, note: "May be appropriate or stereotyping - review context" },
  { pattern: /\bbroken\s+english\b/gi, note: "Dialect representation - check if respectful or mocking" },

  // Agency markers
  { pattern: /\bsaved\s+(her|him|them)\s+from\b/gi, note: "Savior dynamic - check who saves whom" },
  { pattern: /\bteach\s+(her|him|them)\s+(about|how)\b/gi, note: "Teaching dynamic - check power dynamics" },
  { pattern: /\bexplain(ed|ing)?\s+(to|for)\s+(her|him|them)\b/gi, note: "Explaining dynamic - check condescension" },
];

// Trope markers (require context review)
const TROPE_PATTERNS = [
  // Death/suffering
  { pattern: /\b(died|killed|death)\b.*\b(gay|lesbian|bisexual|trans|queer)\b/gi, note: "LGBTQ+ character death - check for Bury Your Gays pattern" },
  { pattern: /\b(gay|lesbian|bisexual|trans|queer)\b.*\b(died|killed|death)\b/gi, note: "LGBTQ+ character death - check for Bury Your Gays pattern" },

  // Magical/mystical minority
  { pattern: /\b(wise|wisdom|ancient|mystical|spiritual)\s+(elder|grandmother|grandfather|old\s+(man|woman))\b/gi, note: "Wisdom figure - check for Magical Minority trope" },

  // Mental health
  { pattern: /\b(crazy|insane|psycho|lunatic|mental)\s+(killer|murderer|villain)\b/gi, note: "Mental illness = violence pattern - review carefully" },
  { pattern: /\b(schizophren|bipolar|psychotic)\b.*\b(dangerous|violent|killer)\b/gi, note: "Specific diagnosis linked to violence - major concern" },
];

// Disability language patterns
const DISABILITY_PATTERNS = [
  { pattern: /\b(wheelchair\s*bound|confined\s+to\s+(a\s+)?wheelchair)\b/gi, note: "Outdated disability language - prefer 'uses a wheelchair'" },
  { pattern: /\b(suffer(s|ed|ing)?\s+from|afflicted\s+(with|by))\b/gi, note: "Suffering framing - may be othering; review context" },
  { pattern: /\b(despite\s+(his|her|their)\s+disability)\b/gi, note: "Inspiration porn marker - review for 'overcoming' narrative" },
  { pattern: /\b(special\s+needs)\b/gi, note: "Euphemism - consider if 'disabled' is more direct and preferred" },
  { pattern: /\bthe\s+(blind|deaf|disabled|crippled|handicapped)\b/gi, note: "Group-noun usage - prefer person-first or identity-first per community" },
];

// Body size patterns
const BODY_PATTERNS = [
  { pattern: /\b(fat|obese|overweight)\s+(and|but)\s+(lazy|slovenly|gross|disgusting)\b/gi, note: "Weight + negative trait - check for fatphobic stereotyping" },
  { pattern: /\blet\s+(herself|himself|themselves)\s+go\b/gi, note: "Weight judgment - review for moralizing body size" },
  { pattern: /\b(thin|slim|slender)\s+(and|but)\s+(beautiful|attractive|healthy)\b/gi, note: "Thin = positive pattern - review for anti-fat bias" },
];

// Dialogue patterns that might indicate same-voice issues across identities
const DIALOGUE_PATTERNS = [
  { pattern: /\b(yes,?\s+massa|yessir|lawdy|chile)\b/gi, note: "Dialect representation - verify authenticity, check for minstrelsy" },
  { pattern: /\bme\s+(love|want|no\s+understand)\b/gi, note: "Broken speech pattern - check for mocking vs. authentic ESL" },
];

function matchPatterns(text: string, patterns: { pattern: RegExp; note: string }[], category: string): PatternMatch[] {
  const lines = text.split('\n');
  const matches: PatternMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { pattern, note } of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        matches.push({
          category,
          pattern: match[0],
          line: i + 1,
          text: line.trim().slice(0, 100) + (line.length > 100 ? '...' : ''),
          note,
        });
      }
    }
  }

  return matches;
}

function analyzeText(text: string): AuditResult {
  const lines = text.split('\n');
  const flags: PatternMatch[] = [];

  flags.push(...matchPatterns(text, PHYSICAL_DESCRIPTION_PATTERNS, 'Physical Description'));
  flags.push(...matchPatterns(text, STEREOTYPE_PATTERNS, 'Stereotyping Language'));
  flags.push(...matchPatterns(text, TROPE_PATTERNS, 'Harmful Tropes'));
  flags.push(...matchPatterns(text, DISABILITY_PATTERNS, 'Disability Language'));
  flags.push(...matchPatterns(text, BODY_PATTERNS, 'Body Size'));
  flags.push(...matchPatterns(text, DIALOGUE_PATTERNS, 'Dialogue Patterns'));

  // Sort by line number
  flags.sort((a, b) => a.line - b.line);

  // Summarize by category
  const summary: Record<string, number> = {};
  for (const flag of flags) {
    summary[flag.category] = (summary[flag.category] || 0) + 1;
  }

  return {
    totalLines: lines.length,
    flags,
    summary,
  };
}

function formatReport(result: AuditResult): string {
  let report = `
SENSITIVITY AUDIT
=================

IMPORTANT: This tool flags patterns for HUMAN REVIEW.
It cannot determine context, intent, or actual harm.
Every flag requires thoughtful human evaluation.

Lines scanned: ${result.totalLines}
Patterns flagged: ${result.flags.length}

`;

  if (Object.keys(result.summary).length > 0) {
    report += `SUMMARY BY CATEGORY\n`;
    for (const [category, count] of Object.entries(result.summary)) {
      report += `  ${category}: ${count} flag(s)\n`;
    }
    report += '\n';
  }

  if (result.flags.length === 0) {
    report += `No patterns flagged. This does NOT mean the text is free of concerns.
Pattern matching cannot catch:
  - Stereotyping through characterization (not language)
  - Agency imbalances in plot structure
  - Tropes enacted through events rather than words
  - Subtle or contextual issues

Consider full human sensitivity reading for thorough evaluation.
`;
  } else {
    report += `FLAGGED PATTERNS\n`;
    report += `${'='.repeat(50)}\n\n`;

    let currentCategory = '';
    for (const flag of result.flags) {
      if (flag.category !== currentCategory) {
        currentCategory = flag.category;
        report += `\n## ${currentCategory}\n\n`;
      }

      report += `Line ${flag.line}: "${flag.pattern}"\n`;
      report += `  Context: ${flag.text}\n`;
      report += `  Note: ${flag.note}\n\n`;
    }

    report += `
${'='.repeat(50)}

NEXT STEPS

1. Review each flag in context - many may be appropriate
2. For concerning patterns, consider:
   - Is this character/scene necessary?
   - Could this be written differently?
   - What might affected readers experience?
3. Consider engaging sensitivity readers for identities represented
4. Pattern absence doesn't mean concern absence - structural issues
   (plot, character agency, tropes) require human analysis

This tool supplements but does NOT replace human sensitivity reading.
`;
  }

  return report;
}

function showUsage(): void {
  console.log(`
Sensitivity Audit Tool
======================

Scans text for patterns that may indicate representation concerns.
Flags for HUMAN REVIEW - cannot determine actual harm.

Usage:
  deno run --allow-read sensitivity-audit.ts <file>
  deno run --allow-read sensitivity-audit.ts --text "Text to analyze..."

Pattern Categories:
  - Physical Description: Gendered gaze, objectification
  - Stereotyping Language: Othering, power dynamics
  - Harmful Tropes: Known problematic patterns
  - Disability Language: Outdated or othering terms
  - Body Size: Fatphobic patterns
  - Dialogue Patterns: Accent/dialect representation

IMPORTANT: This tool cannot catch:
  - Characterization-based stereotyping
  - Plot-level agency imbalances
  - Tropes enacted through events
  - Contextual or subtle issues

Always engage human sensitivity readers for thorough evaluation.
`);
}

async function main() {
  const args = Deno.args;
  let text: string;

  if (args.includes('--text')) {
    const textIndex = args.indexOf('--text');
    text = args.slice(textIndex + 1).join(' ');
  } else if (args.length > 0 && !args[0].startsWith('--')) {
    const filename = args[0];
    try {
      text = await Deno.readTextFile(filename);
    } catch (e) {
      console.error(`Error reading file: ${filename}`);
      console.error(e);
      Deno.exit(1);
    }
  } else {
    showUsage();
    Deno.exit(0);
  }

  const result = analyzeText(text);
  console.log(formatReport(result));
}

main();
