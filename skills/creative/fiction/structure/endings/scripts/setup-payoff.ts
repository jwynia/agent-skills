#!/usr/bin/env -S deno run --allow-read

/**
 * Setup-Payoff Tracker
 *
 * Tracks setups (Chekhov's guns) and payoffs across a story.
 * Helps identify unresolved setups and payoffs without setup.
 *
 * Usage:
 *   deno run --allow-read setup-payoff.ts --analyze story.txt
 *   deno run --allow-read setup-payoff.ts --setup "rusty key" --file story.txt
 *   deno run --allow-read setup-payoff.ts --list story.txt
 */

interface SetupPayoffAnalysis {
  fileName: string;
  wordCount: number;

  // Detected patterns
  potentialSetups: SetupItem[];
  potentialPayoffs: PayoffItem[];

  // Tracking results
  matchedPairs: MatchedPair[];
  unresolvedSetups: SetupItem[];
  orphanedPayoffs: PayoffItem[];

  // Assessment
  setupPayoffHealth: "good" | "issues" | "problems";
  issues: string[];
  recommendations: string[];
}

interface SetupItem {
  text: string;
  position: number; // character position in text
  positionPercent: number; // 0-100
  type: SetupType;
  lineContext: string;
}

interface PayoffItem {
  text: string;
  position: number;
  positionPercent: number;
  type: SetupType;
  lineContext: string;
}

interface MatchedPair {
  setup: SetupItem;
  payoff: PayoffItem;
  distance: number; // characters between
  distancePercent: number;
}

type SetupType = "object" | "skill" | "character" | "information" | "threat" | "promise" | "foreshadow";

// Setup patterns - things introduced that might need payoff
const SETUP_PATTERNS: { type: SetupType; patterns: RegExp[] }[] = [
  {
    type: "object",
    patterns: [
      /\b(noticed|saw|spotted|found|discovered|picked up|grabbed|took|carried|kept|hidden|concealed)\s+(a|an|the)\s+([a-z]+\s+)?([a-z]+)/gi,
      /\b(the|a|an)\s+([a-z]+\s+)?(key|gun|knife|sword|letter|photograph|ring|necklace|book|box|bag|case|weapon|tool)\b/gi,
    ],
  },
  {
    type: "skill",
    patterns: [
      /\b(knew how to|could|was able to|trained in|learned|practiced|mastered|skilled at|expert in)\b/gi,
      /\b(years of|experience with|background in|history of)\b/gi,
    ],
  },
  {
    type: "character",
    patterns: [
      /\b(had\s+a\s+(brother|sister|friend|enemy|rival|ally)|someone\s+who|a\s+person\s+from)\b/gi,
      /\b(old\s+(friend|enemy|acquaintance)|former\s+(colleague|partner|lover))\b/gi,
    ],
  },
  {
    type: "information",
    patterns: [
      /\b(secret|knew\s+that|heard\s+that|remembered|recalled|once\s+told|mentioned)\b/gi,
      /\b(no\s+one\s+knew|only\s+\w+\s+knew|hidden\s+truth|the\s+real\s+reason)\b/gi,
    ],
  },
  {
    type: "threat",
    patterns: [
      /\b(would\s+return|wasn't\s+over|still\s+out\s+there|waiting|watching|someday)\b/gi,
      /\b(warned|threatened|promised\s+to|swore\s+to|vowed)\b/gi,
    ],
  },
  {
    type: "promise",
    patterns: [
      /\b(promised|swore|vowed|committed|pledged|gave\s+\w+\s+word)\b/gi,
      /\b(would\s+never|would\s+always|one\s+day|someday)\b/gi,
    ],
  },
  {
    type: "foreshadow",
    patterns: [
      /\b(little\s+did|if\s+only|would\s+later|couldn't\s+have\s+known|foreshadow)\b/gi,
      /\b(ominous|foreboding|sense\s+of|feeling\s+that|premonition)\b/gi,
    ],
  },
];

// Payoff patterns - things that might be resolving setups
const PAYOFF_PATTERNS: { type: SetupType; patterns: RegExp[] }[] = [
  {
    type: "object",
    patterns: [
      /\b(used|pulled\s+out|reached\s+for|grabbed|produced|wielded|fired|unlocked|opened\s+with)\b/gi,
      /\b(the\s+(key|gun|knife|sword|letter|ring|weapon)\s+(worked|opened|saved|killed|revealed))\b/gi,
    ],
  },
  {
    type: "skill",
    patterns: [
      /\b(finally\s+could|now\s+knew\s+how|training\s+paid\s+off|skills\s+saved|experience\s+told)\b/gi,
      /\b(years\s+of\s+\w+\s+paid\s+off|remembered\s+how\s+to)\b/gi,
    ],
  },
  {
    type: "character",
    patterns: [
      /\b(arrived|appeared|returned|showed\s+up|came\s+back|was\s+there)\b/gi,
      /\b(unexpected\s+ally|old\s+friend\s+\w+|recognized)\b/gi,
    ],
  },
  {
    type: "information",
    patterns: [
      /\b(realized|understood|finally\s+knew|the\s+truth\s+was|now\s+it\s+made\s+sense)\b/gi,
      /\b(revealed|exposed|came\s+to\s+light|discovered\s+that)\b/gi,
    ],
  },
  {
    type: "threat",
    patterns: [
      /\b(returned|came\s+back|finally\s+struck|made\s+good|carried\s+out)\b/gi,
      /\b(defeated|destroyed|overcame|escaped|survived|confronted)\b/gi,
    ],
  },
  {
    type: "promise",
    patterns: [
      /\b(kept\s+\w+\s+promise|fulfilled|honored|made\s+good|finally\s+could)\b/gi,
      /\b(as\s+promised|true\s+to\s+\w+\s+word|never\s+forgot)\b/gi,
    ],
  },
  {
    type: "foreshadow",
    patterns: [
      /\b(just\s+as|as\s+foretold|the\s+prophecy|finally|inevitable)\b/gi,
      /\b(now\s+understood|saw\s+it\s+coming|knew\s+it\s+would)\b/gi,
    ],
  },
];

function getLineContext(text: string, position: number, windowSize: number = 50): string {
  const start = Math.max(0, position - windowSize);
  const end = Math.min(text.length, position + windowSize);
  let context = text.slice(start, end).replace(/\n/g, " ").trim();
  if (start > 0) context = "..." + context;
  if (end < text.length) context = context + "...";
  return context;
}

function findSetups(text: string): SetupItem[] {
  const setups: SetupItem[] = [];
  const textLength = text.length;

  for (const { type, patterns } of SETUP_PATTERNS) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        // Only consider setups in first 70% of text
        const positionPercent = (match.index / textLength) * 100;
        if (positionPercent <= 70) {
          setups.push({
            text: match[0].toLowerCase().trim(),
            position: match.index,
            positionPercent: Math.round(positionPercent),
            type,
            lineContext: getLineContext(text, match.index),
          });
        }
      }
    }
  }

  // Deduplicate by text similarity
  const unique: SetupItem[] = [];
  for (const setup of setups) {
    const isDuplicate = unique.some(
      u => u.text === setup.text && Math.abs(u.position - setup.position) < 100
    );
    if (!isDuplicate) {
      unique.push(setup);
    }
  }

  return unique.sort((a, b) => a.position - b.position);
}

function findPayoffs(text: string): PayoffItem[] {
  const payoffs: PayoffItem[] = [];
  const textLength = text.length;

  for (const { type, patterns } of PAYOFF_PATTERNS) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        // Only consider payoffs in last 50% of text
        const positionPercent = (match.index / textLength) * 100;
        if (positionPercent >= 50) {
          payoffs.push({
            text: match[0].toLowerCase().trim(),
            position: match.index,
            positionPercent: Math.round(positionPercent),
            type,
            lineContext: getLineContext(text, match.index),
          });
        }
      }
    }
  }

  // Deduplicate
  const unique: PayoffItem[] = [];
  for (const payoff of payoffs) {
    const isDuplicate = unique.some(
      u => u.text === payoff.text && Math.abs(u.position - payoff.position) < 100
    );
    if (!isDuplicate) {
      unique.push(payoff);
    }
  }

  return unique.sort((a, b) => a.position - b.position);
}

function matchSetupsToPayoffs(
  setups: SetupItem[],
  payoffs: PayoffItem[],
  textLength: number
): { matched: MatchedPair[]; unresolved: SetupItem[]; orphaned: PayoffItem[] } {
  const matched: MatchedPair[] = [];
  const usedSetups = new Set<number>();
  const usedPayoffs = new Set<number>();

  // Match by type and position
  for (let i = 0; i < setups.length; i++) {
    const setup = setups[i];
    for (let j = 0; j < payoffs.length; j++) {
      if (usedPayoffs.has(j)) continue;

      const payoff = payoffs[j];
      if (setup.type === payoff.type && payoff.position > setup.position) {
        matched.push({
          setup,
          payoff,
          distance: payoff.position - setup.position,
          distancePercent: Math.round(((payoff.position - setup.position) / textLength) * 100),
        });
        usedSetups.add(i);
        usedPayoffs.add(j);
        break;
      }
    }
  }

  const unresolved = setups.filter((_, i) => !usedSetups.has(i));
  const orphaned = payoffs.filter((_, i) => !usedPayoffs.has(i));

  return { matched, unresolved, orphaned };
}

function searchForTerm(text: string, term: string): { found: boolean; occurrences: { position: number; percent: number; context: string }[] } {
  const termLower = term.toLowerCase();
  const textLower = text.toLowerCase();
  const occurrences: { position: number; percent: number; context: string }[] = [];

  let pos = 0;
  while ((pos = textLower.indexOf(termLower, pos)) !== -1) {
    occurrences.push({
      position: pos,
      percent: Math.round((pos / text.length) * 100),
      context: getLineContext(text, pos, 60),
    });
    pos += termLower.length;
  }

  return { found: occurrences.length > 0, occurrences };
}

function analyzeSetupPayoff(text: string, fileName: string = "input"): SetupPayoffAnalysis {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const setups = findSetups(text);
  const payoffs = findPayoffs(text);
  const { matched, unresolved, orphaned } = matchSetupsToPayoffs(setups, payoffs, text.length);

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Assess health
  let health: "good" | "issues" | "problems" = "good";

  if (unresolved.length > 3) {
    health = "problems";
    issues.push(`${unresolved.length} potential setups without payoffs detected`);
    recommendations.push("Review unresolved setups - either pay them off or remove them");
  } else if (unresolved.length > 0) {
    health = "issues";
    issues.push(`${unresolved.length} potential unresolved setup(s)`);
  }

  if (orphaned.length > 2) {
    health = health === "good" ? "issues" : health;
    issues.push(`${orphaned.length} potential payoffs without clear setup (deus ex machina risk)`);
    recommendations.push("Ensure late-story resolutions are established earlier");
  }

  if (matched.length === 0 && setups.length > 0) {
    issues.push("No setup-payoff matches detected - story may lack satisfying resolution");
    recommendations.push("Track your setups and ensure they pay off by the end");
  }

  // Check for setups too close to payoff
  const quickPayoffs = matched.filter(m => m.distancePercent < 10);
  if (quickPayoffs.length > 0) {
    issues.push("Some setups pay off very quickly (may reduce impact)");
    recommendations.push("Consider more distance between setup and payoff for greater impact");
  }

  return {
    fileName,
    wordCount: words.length,
    potentialSetups: setups,
    potentialPayoffs: payoffs,
    matchedPairs: matched,
    unresolvedSetups: unresolved,
    orphanedPayoffs: orphaned,
    setupPayoffHealth: health,
    issues,
    recommendations,
  };
}

function formatReport(analysis: SetupPayoffAnalysis): string {
  const lines: string[] = [];

  lines.push("# Setup-Payoff Analysis\n");
  lines.push(`File: ${analysis.fileName}`);
  lines.push(`Words: ${analysis.wordCount}`);
  lines.push(`Health: ${analysis.setupPayoffHealth.toUpperCase()}\n`);

  lines.push("## Summary\n");
  lines.push(`  Potential setups detected: ${analysis.potentialSetups.length}`);
  lines.push(`  Potential payoffs detected: ${analysis.potentialPayoffs.length}`);
  lines.push(`  Matched pairs: ${analysis.matchedPairs.length}`);
  lines.push(`  Unresolved setups: ${analysis.unresolvedSetups.length}`);
  lines.push(`  Orphaned payoffs: ${analysis.orphanedPayoffs.length}`);
  lines.push("");

  if (analysis.matchedPairs.length > 0) {
    lines.push("## Matched Setup-Payoff Pairs\n");
    for (const pair of analysis.matchedPairs.slice(0, 10)) {
      lines.push(`  [${pair.setup.type}] Setup at ${pair.setup.positionPercent}% → Payoff at ${pair.payoff.positionPercent}%`);
      lines.push(`    Setup: "${pair.setup.text}"`);
      lines.push(`    Payoff: "${pair.payoff.text}"`);
      lines.push("");
    }
    if (analysis.matchedPairs.length > 10) {
      lines.push(`  ... and ${analysis.matchedPairs.length - 10} more pairs\n`);
    }
  }

  if (analysis.unresolvedSetups.length > 0) {
    lines.push("## Unresolved Setups (Chekhov's Guns Unfired)\n");
    for (const setup of analysis.unresolvedSetups.slice(0, 10)) {
      lines.push(`  [${setup.type}] at ${setup.positionPercent}%: "${setup.text}"`);
      lines.push(`    Context: ${setup.lineContext}`);
      lines.push("");
    }
  }

  if (analysis.orphanedPayoffs.length > 0) {
    lines.push("## Orphaned Payoffs (Possible Deus Ex Machina)\n");
    for (const payoff of analysis.orphanedPayoffs.slice(0, 10)) {
      lines.push(`  [${payoff.type}] at ${payoff.positionPercent}%: "${payoff.text}"`);
      lines.push(`    Context: ${payoff.lineContext}`);
      lines.push("");
    }
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
    console.log(`Setup-Payoff Tracker

Usage:
  deno run --allow-read setup-payoff.ts --analyze <file>
  deno run --allow-read setup-payoff.ts --setup "term" --file <file>
  deno run --allow-read setup-payoff.ts --list <file>

Modes:
  --analyze      Full setup-payoff analysis
  --setup "X"    Search for specific term throughout story
  --list         List all detected setups and payoffs

Options:
  --file <f>     Specify input file
  --json         Output as JSON
  --help         Show this message

Detects:
  - Objects (Chekhov's gun)
  - Skills (training/ability)
  - Characters (allies, enemies)
  - Information (secrets, knowledge)
  - Threats (warnings, foreshadowing)
  - Promises (commitments)
`);
    Deno.exit(0);
  }

  const jsonOutput = args.includes("--json");
  let text = "";
  let fileName = "input";

  // Get file
  const fileIndex = args.indexOf("--file");
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    fileName = args[fileIndex + 1];
    try {
      text = await Deno.readTextFile(fileName);
    } catch (e) {
      console.error(`Error reading file: ${e}`);
      Deno.exit(1);
    }
  } else {
    // Try to find file as positional arg
    const file = args.find(a => !a.startsWith("--") && a !== args[args.indexOf("--setup") + 1]);
    if (file) {
      fileName = file;
      try {
        text = await Deno.readTextFile(file);
      } catch (e) {
        console.error(`Error reading file: ${e}`);
        Deno.exit(1);
      }
    }
  }

  if (!text.trim()) {
    console.error("Error: No file provided. Use --file <path> or provide path as argument.");
    Deno.exit(1);
  }

  // Search for specific setup
  if (args.includes("--setup")) {
    const setupIndex = args.indexOf("--setup");
    const term = args[setupIndex + 1];
    if (!term) {
      console.error("Error: --setup requires a search term");
      Deno.exit(1);
    }

    const result = searchForTerm(text, term);
    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\n# Search for "${term}"\n`);
      if (result.found) {
        console.log(`Found ${result.occurrences.length} occurrence(s):\n`);
        for (const occ of result.occurrences) {
          console.log(`  At ${occ.percent}%: ${occ.context}\n`);
        }
      } else {
        console.log("Term not found in text.");
      }
    }
    Deno.exit(0);
  }

  // List mode
  if (args.includes("--list")) {
    const setups = findSetups(text);
    const payoffs = findPayoffs(text);

    if (jsonOutput) {
      console.log(JSON.stringify({ setups, payoffs }, null, 2));
    } else {
      console.log("\n# Detected Setups (first 70%)\n");
      for (const s of setups) {
        console.log(`  [${s.type}] ${s.positionPercent}%: "${s.text}"`);
      }
      console.log("\n# Detected Payoffs (last 50%)\n");
      for (const p of payoffs) {
        console.log(`  [${p.type}] ${p.positionPercent}%: "${p.text}"`);
      }
    }
    Deno.exit(0);
  }

  // Full analysis
  const analysis = analyzeSetupPayoff(text, fileName);

  if (jsonOutput) {
    console.log(JSON.stringify(analysis, null, 2));
  } else {
    console.log(formatReport(analysis));
  }
}

main();
