#!/usr/bin/env -S deno run --allow-read

/**
 * revision-audit.ts - Track revision pass progress and scene decisions
 *
 * Helps with:
 * - Scene count and word count per scene
 * - Scene decision tracking (keep/cut/combine)
 * - Pass completion checklist
 * - Progress summary
 *
 * Usage:
 *   deno run --allow-read revision-audit.ts --scenes manuscript.txt
 *   deno run --allow-read revision-audit.ts --pass structural
 *   deno run --allow-read revision-audit.ts --checklist
 */

interface SceneInfo {
  number: number;
  wordCount: number;
  preview: string;
  decision?: 'keep' | 'cut' | 'combine' | 'revise' | 'pending';
}

interface PassChecklist {
  name: string;
  items: { question: string; checked: boolean }[];
}

const PASS_CHECKLISTS: Record<string, PassChecklist> = {
  structural: {
    name: 'Structural Pass',
    items: [
      { question: 'Does the story have a clear dramatic question?', checked: false },
      { question: 'Is the protagonist\'s goal clear from the start?', checked: false },
      { question: 'Does the protagonist drive the resolution?', checked: false },
      { question: 'Does each scene advance plot or character?', checked: false },
      { question: 'Are there plot holes or logic failures?', checked: false },
      { question: 'Is pacing appropriate (not too slow, not too rushed)?', checked: false },
      { question: 'Does tension escalate toward climax?', checked: false },
      { question: 'Is the climax the highest tension point?', checked: false },
      { question: 'Does the ending satisfy and emerge from the story?', checked: false },
      { question: 'Do all major character arcs complete?', checked: false },
    ],
  },
  scene: {
    name: 'Scene Pass',
    items: [
      { question: 'Does each scene have a clear POV character goal?', checked: false },
      { question: 'Does each scene have conflict preventing the goal?', checked: false },
      { question: 'Does each scene end with disaster or outcome?', checked: false },
      { question: 'Do scenes start late enough (no excessive setup)?', checked: false },
      { question: 'Do scenes end early enough (no wrap-up drag)?', checked: false },
      { question: 'Are scene-sequel rhythms creating good pacing?', checked: false },
      { question: 'Could any scenes be cut without loss?', checked: false },
      { question: 'Could any scenes be combined for efficiency?', checked: false },
      { question: 'Are transitions between scenes clear?', checked: false },
    ],
  },
  character: {
    name: 'Character Pass',
    items: [
      { question: 'Does protagonist have clear lie/false belief at start?', checked: false },
      { question: 'Does protagonist learn truth by end?', checked: false },
      { question: 'Are key transformation moments visible?', checked: false },
      { question: 'Does each major character have consistent voice?', checked: false },
      { question: 'Are character motivations clear for major actions?', checked: false },
      { question: 'Is motivation consistent with established character?', checked: false },
      { question: 'Can you identify who\'s speaking without tags?', checked: false },
      { question: 'Is character arc progress visible in choices/behavior?', checked: false },
    ],
  },
  dialogue: {
    name: 'Dialogue Pass',
    items: [
      { question: 'Does dialogue have subtext (meaning beneath surface)?', checked: false },
      { question: 'Do characters avoid saying exactly what they mean?', checked: false },
      { question: 'Is there tension between speakers?', checked: false },
      { question: 'Does each exchange advance plot, reveal character, or build dynamics?', checked: false },
      { question: 'Does each character sound distinct?', checked: false },
      { question: 'Are speech patterns consistent per character?', checked: false },
      { question: 'Is dialogue free of exposition dumps?', checked: false },
      { question: 'Are dialogue tags unobtrusive?', checked: false },
    ],
  },
  prose: {
    name: 'Prose Pass',
    items: [
      { question: 'Is passive voice used intentionally, not by default?', checked: false },
      { question: 'Are weak verbs (is, was, had, got) minimized?', checked: false },
      { question: 'Are filter words (saw, felt, noticed) minimized?', checked: false },
      { question: 'Are adverbs used sparingly?', checked: false },
      { question: 'Are pronoun references clear?', checked: false },
      { question: 'Do paragraphs vary in length?', checked: false },
      { question: 'Do sentences vary in length and structure?', checked: false },
      { question: 'Is description integrated with action?', checked: false },
      { question: 'Are specific details used rather than generic?', checked: false },
      { question: 'Does prose read well aloud?', checked: false },
    ],
  },
  polish: {
    name: 'Polish Pass',
    items: [
      { question: 'Is spelling correct (especially names)?', checked: false },
      { question: 'Is grammar correct throughout?', checked: false },
      { question: 'Is punctuation consistent and correct?', checked: false },
      { question: 'Is formatting consistent (chapters, breaks)?', checked: false },
      { question: 'Are character name spellings consistent?', checked: false },
      { question: 'Are place name spellings consistent?', checked: false },
      { question: 'Is timeline internally consistent?', checked: false },
      { question: 'Are physical descriptions consistent?', checked: false },
      { question: 'Have you done a final read-aloud?', checked: false },
    ],
  },
};

// Scene break patterns (common markers)
const SCENE_BREAK_PATTERNS = [
  /^#{1,3}\s+/m,              // Markdown headers
  /^\*{3,}$/m,                // *** scene breaks
  /^-{3,}$/m,                 // --- scene breaks
  /^~{3,}$/m,                 // ~~~ scene breaks
  /^\s*\*\s*\*\s*\*\s*$/m,    // * * * scene breaks
  /^Chapter\s+\d+/im,         // Chapter markers
  /^CHAPTER\s+/m,             // CHAPTER markers
  /^\[Scene\s+\d+\]/im,       // [Scene n] markers
];

function splitIntoScenes(text: string): string[] {
  // Try each pattern
  for (const pattern of SCENE_BREAK_PATTERNS) {
    if (pattern.test(text)) {
      const scenes = text.split(pattern).filter(s => s.trim().length > 0);
      if (scenes.length > 1) {
        return scenes;
      }
    }
  }

  // Fallback: split by double newlines if very long
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (paragraphs.length > 20) {
    // Group into approximate scenes of 5-10 paragraphs
    const scenes: string[] = [];
    const groupSize = 7;
    for (let i = 0; i < paragraphs.length; i += groupSize) {
      scenes.push(paragraphs.slice(i, i + groupSize).join('\n\n'));
    }
    return scenes;
  }

  // Otherwise treat whole text as one scene
  return [text];
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function analyzeScenes(text: string): SceneInfo[] {
  const scenes = splitIntoScenes(text);
  return scenes.map((scene, i) => {
    const words = countWords(scene);
    const preview = scene.trim().slice(0, 100).replace(/\n/g, ' ') + (scene.length > 100 ? '...' : '');
    return {
      number: i + 1,
      wordCount: words,
      preview,
      decision: 'pending' as const,
    };
  });
}

function formatSceneReport(scenes: SceneInfo[]): string {
  const totalWords = scenes.reduce((sum, s) => sum + s.wordCount, 0);
  const avgWords = scenes.length > 0 ? totalWords / scenes.length : 0;

  let report = `
SCENE AUDIT
===========

Summary:
  Total scenes: ${scenes.length}
  Total words: ${totalWords.toLocaleString()}
  Average scene length: ${Math.round(avgWords).toLocaleString()} words

Scenes:
`;

  for (const scene of scenes) {
    report += `
  Scene ${scene.number}: ${scene.wordCount.toLocaleString()} words
    "${scene.preview}"
    Decision: ${scene.decision}
`;
  }

  report += `
SCENE DECISION GUIDE
--------------------
For each scene, ask:
  1. What is the POV character's goal?
  2. What conflict prevents it?
  3. What is the disaster/outcome?
  4. Does this advance plot or character?
  5. Could the story survive without it?

Decisions:
  KEEP - Scene is essential, working well
  CUT - Scene adds nothing essential
  COMBINE - Merge with another scene
  REVISE - Scene needed but not working

Mark your decisions and re-run to track progress.
`;

  return report;
}

function formatPassChecklist(pass: string): string {
  const checklist = PASS_CHECKLISTS[pass.toLowerCase()];
  if (!checklist) {
    return `Unknown pass: ${pass}\n\nAvailable passes: ${Object.keys(PASS_CHECKLISTS).join(', ')}`;
  }

  let report = `
${checklist.name.toUpperCase()} CHECKLIST
${'='.repeat(checklist.name.length + 10)}

`;

  for (let i = 0; i < checklist.items.length; i++) {
    const item = checklist.items[i];
    report += `  ${i + 1}. [ ] ${item.question}\n`;
  }

  report += `
Instructions:
  - Print this checklist
  - Work through your manuscript with these questions
  - Check off each item when addressed
  - Don't proceed to next pass until all items checked

`;

  return report;
}

function formatFullChecklist(): string {
  let report = `
FULL REVISION CHECKLIST
=======================

Work through these passes in order. Complete each before moving to the next.

`;

  const passOrder = ['structural', 'scene', 'character', 'dialogue', 'prose', 'polish'];

  for (const pass of passOrder) {
    const checklist = PASS_CHECKLISTS[pass];
    report += `
## ${checklist.name}
`;
    for (let i = 0; i < checklist.items.length; i++) {
      report += `  [ ] ${checklist.items[i].question}\n`;
    }
  }

  report += `
REVISION PRINCIPLES
-------------------
- Work from large to small (structure before prose)
- Complete one pass before starting the next
- Don't polish prose in scenes you might cut
- Take time away between passes when possible
- Get external feedback after structural and prose passes

`;

  return report;
}

function showUsage(): void {
  console.log(`
Usage:
  deno run --allow-read revision-audit.ts --scenes <file>
    Analyze scenes in manuscript file

  deno run --allow-read revision-audit.ts --pass <passname>
    Show checklist for a specific pass
    Passes: structural, scene, character, dialogue, prose, polish

  deno run --allow-read revision-audit.ts --checklist
    Show full revision checklist (all passes)

Examples:
  deno run --allow-read revision-audit.ts --scenes manuscript.txt
  deno run --allow-read revision-audit.ts --pass structural
  deno run --allow-read revision-audit.ts --checklist
`);
}

async function main() {
  const args = Deno.args;

  if (args.includes('--scenes')) {
    const fileIndex = args.indexOf('--scenes') + 1;
    if (fileIndex >= args.length) {
      console.error('Error: --scenes requires a filename');
      Deno.exit(1);
    }
    const filename = args[fileIndex];
    try {
      const text = await Deno.readTextFile(filename);
      const scenes = analyzeScenes(text);
      console.log(formatSceneReport(scenes));
    } catch (e) {
      console.error(`Error reading file: ${filename}`);
      console.error(e);
      Deno.exit(1);
    }
  } else if (args.includes('--pass')) {
    const passIndex = args.indexOf('--pass') + 1;
    if (passIndex >= args.length) {
      console.error('Error: --pass requires a pass name');
      console.error('Available: structural, scene, character, dialogue, prose, polish');
      Deno.exit(1);
    }
    const pass = args[passIndex];
    console.log(formatPassChecklist(pass));
  } else if (args.includes('--checklist')) {
    console.log(formatFullChecklist());
  } else {
    showUsage();
  }
}

main();
