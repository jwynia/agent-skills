#!/usr/bin/env -S deno run --allow-read

/**
 * Constraint Entropy Generator
 *
 * Randomly selects constraints from curated lists to force divergent thinking.
 * Use when brainstorming converges to obvious solutions.
 *
 * Usage:
 *   deno run --allow-read constraint-entropy.ts actors           # Random actor constraint
 *   deno run --allow-read constraint-entropy.ts domains --count 3 # Three domain prompts
 *   deno run --allow-read constraint-entropy.ts --list           # Show categories
 *   deno run --allow-read constraint-entropy.ts --combo          # One from each category
 *   deno run --allow-read constraint-entropy.ts --file data.json # Use external file
 */

// Built-in constraint lists
const CONSTRAINTS: Record<string, string[]> = {
  // Actor constraints - WHO must use/benefit/implement
  actors: [
    "A 10-year-old must be able to use it",
    "Someone actively hostile to the idea must still benefit",
    "The implementer has never done anything like this before",
    "The user has unlimited budget but only 5 minutes",
    "The user has unlimited time but zero budget",
    "Someone who doesn't want it must find it valuable anyway",
    "A complete stranger must understand it in 30 seconds",
    "Your harshest critic must admit it works",
    "Someone from 1950 must be able to grasp the core concept",
    "A competitor must be unable to easily copy it",
    "The person who benefits is not the person who pays",
    "It must work for someone with the opposite personality type",
    "A non-native speaker must find it intuitive",
    "Someone exhausted at 3 AM must be able to use it",
    "The most junior person on the team must be able to maintain it",
    "Someone who tried and failed before must succeed this time",
    "A person who hates technology must prefer this over the alternative",
    "The CEO and the intern must both find it useful",
    "Someone with conflicting incentives must still participate honestly",
    "A person who will only use it once must get value immediately",
    "The user's boss must see clear value without explanation",
    "Someone who has already given up must be re-engaged",
    "A perfectionist must be satisfied with the output",
    "Someone impatient must not abandon it halfway through",
    "The person responsible for outcomes has no direct control",
    "A skeptic must become an advocate",
    "Someone who prefers the old way must choose this instead",
    "The user has physical constraints (one hand, poor vision, etc.)",
    "A person who lies about their usage must still be served",
    "Someone who actively tries to break it must fail",
    "The beneficiary is several steps removed from the user",
    "A person in crisis must find it calming",
    "Someone with analysis paralysis must be able to decide",
    "The user has been burned by similar solutions before",
    "A person who refuses to read instructions must succeed",
    "Someone who will judge harshly in hindsight must approve",
    "The most distracted person in the room must engage",
    "A user who will never give feedback must be understood",
    "Someone with exactly the wrong background must adapt quickly",
    "The person implementing it will never meet the end user",
  ],

  // Resource constraints
  resources: [
    "You have 1/10th the typical budget",
    "You have 10x the budget but 1/10th the time",
    "You cannot use the most obvious technology or approach",
    "You can only use what's already owned or freely available",
    "It must be completely reversible within 24 hours",
    "You can only make changes that require no approval",
    "It must work if the key person quits tomorrow",
    "You cannot add anything—only remove or recombine",
    "It must work during a complete infrastructure outage",
    "You have one hour to implement the first version",
    "The solution cannot require any training",
    "You cannot hire anyone or buy anything",
    "It must be maintainable by one person part-time",
    "You must be able to explain it in one sentence",
    "It cannot depend on any external service",
    "The entire solution must fit on one page",
    "You cannot use any solution that's been tried before",
    "It must work at 100x the current scale",
    "It must work at 1/100th the current scale",
    "You cannot measure anything new",
    "You must reuse at least 80% of existing work",
    "It must be completely free to operate",
    "You cannot add any ongoing obligations",
    "The entire implementation must be deletable in one action",
    "You cannot introduce any new concepts or vocabulary",
    "It must work with zero network connectivity",
    "You have infinite compute but zero storage",
    "You cannot change anything that's already working",
    "It must survive the departure of institutional knowledge",
    "You can only use tools that existed 10 years ago",
    "The solution cannot be longer than the problem statement",
    "You must launch in public on day one",
    "You cannot iterate—it must work first time",
    "It must work even if everyone forgets it exists",
    "You cannot create any new artifacts or documents",
    "It must be explainable to an auditor",
    "You have unlimited resources but can only keep one result",
    "The solution must be portable to a completely different context",
    "You cannot automate anything—all steps must be manual",
    "It must continue working if you lose access to everything digital",
  ],

  // Forced combinations
  combinations: [
    "This must simultaneously solve a completely unrelated problem",
    "The solution must explicitly NOT do the most expected thing",
    "It must work even if a core assumption turns out to be false",
    "This must be the opposite of your first idea in at least two dimensions",
    "The solution must create a new problem worth solving",
    "It must make the status quo impossible to return to",
    "The byproduct must be more valuable than the main output",
    "It must work for both the best-case and worst-case scenarios",
    "The solution must be useful even if it completely fails",
    "It must solve the problem by eliminating the need for it",
    "The approach must come from combining two unrelated domains",
    "It must work whether users cooperate or resist",
    "The solution must make success and failure equally informative",
    "It must be better for the person who currently opposes it",
    "The implementation must improve something unrelated",
    "It must work if you're completely wrong about the cause",
    "The solution must be more valuable incomplete than complete",
    "It must succeed by doing less than currently done",
    "The approach must make competing solutions better too",
    "It must work even if no one believes it will work",
    "The solution must be strengthened by criticism",
    "It must solve yesterday's problem and tomorrow's simultaneously",
    "The mechanism must be visible to everyone involved",
    "It must work if the timeline is cut in half or doubled",
    "The approach must create options rather than commitment",
    "It must benefit from being copied",
    "The solution must make the problem more interesting to solve",
    "It must work whether you have permission or forgiveness",
    "The approach must be equally valid if you're the first or last",
    "It must solve the problem while making you redundant",
  ],

  // Perspective inversions
  inversions: [
    "What if failure was the explicit goal?",
    "What if the audience was the performer?",
    "What if the constraint was the feature?",
    "What if the side effect was the main effect?",
    "What if you couldn't measure success?",
    "What if the problem was the solution?",
    "What if you had to make it worse to make it better?",
    "What if the bottleneck was the value?",
    "What if friction was desirable?",
    "What if everyone already had the solution?",
    "What if the obstacle was the path?",
    "What if doing nothing was the best action?",
    "What if you optimized for the wrong thing on purpose?",
    "What if success created a bigger problem?",
    "What if the user's goal was to fail?",
    "What if you had to explain why NOT to do this?",
    "What if the process was more valuable than the outcome?",
    "What if transparency was the competitive advantage?",
    "What if you designed for the exception, not the rule?",
    "What if you couldn't improve—only maintain?",
    "What if adoption was the problem, not the solution?",
    "What if complexity was the feature?",
    "What if the person with the most to lose led the change?",
    "What if you optimized for the last user, not the first?",
    "What if you had to make it harder to use?",
    "What if you could only subtract, never add?",
    "What if the deadline was the starting point?",
    "What if you designed for abandonment?",
    "What if you assumed everyone was lying?",
    "What if the incentives were reversed?",
    "What if you had to sell the problem, not the solution?",
    "What if quality was inversely related to effort?",
    "What if you optimized for learning, not results?",
    "What if the competitor's success was your success?",
    "What if you designed it to be copied?",
  ],

  // Domain import prompts
  domains: [
    "How would military logistics solve this?",
    "How would a kindergarten teacher approach this?",
    "How would a disease approach this? (spread, adapt, survive)",
    "How would a farmer approach this? (seasons, cycles, patience)",
    "How would a game designer approach this?",
    "How would an archaeologist approach this? (evidence, reconstruction)",
    "How would an emergency room triage this?",
    "How would a chess grandmaster think about this?",
    "How would an ecosystem solve this? (no central control)",
    "How would a virus approach this? (minimal, self-replicating)",
    "How would a jazz musician approach this? (improvisation, listening)",
    "How would an insurance actuary approach this?",
    "How would a hostage negotiator approach this?",
    "How would a forest fire spread through this problem?",
    "How would a standup comedian approach this?",
    "How would airport security approach this?",
    "How would a colony of ants solve this?",
    "How would a con artist approach this? (trust, misdirection)",
    "How would a librarian organize this?",
    "How would evolution solve this? (variation, selection, time)",
    "How would a therapist approach this?",
    "How would a detective investigate this?",
    "How would a chef approach this? (ingredients, timing, presentation)",
    "How would a sculptor approach this? (removing, not adding)",
    "How would a smuggler approach this?",
    "How would a theater director approach this?",
    "How would a gardener approach this? (nurturing, pruning, patience)",
    "How would a virus hunter (epidemiologist) approach this?",
    "How would an auctioneer approach this?",
    "How would a sports coach approach this?",
    "How would a pilot approach this? (checklists, redundancy)",
    "How would a janitor approach this?",
    "How would a diplomat approach this?",
    "How would a street magician approach this? (misdirection, timing)",
    "How would a midwife approach this?",
    "How would a cartographer approach this?",
    "How would a bouncer approach this?",
    "How would a museum curator approach this?",
    "How would a firefighter approach this? (triage, containment)",
    "How would a translator approach this?",
    "How would an improv actor approach this? (yes-and, building)",
    "How would a referee approach this?",
    "How would a sommelier approach this?",
    "How would a survivalist approach this?",
    "How would a wedding planner approach this?",
    "How would a debt collector approach this?",
    "How would a mountain guide approach this?",
    "How would a matchmaker approach this?",
    "How would a waste management engineer approach this?",
    "How would a prison architect approach this?",
  ],
};

function randomFrom<T>(arr: T[], count: number = 1): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

function generateCombo(lists: Record<string, string[]>): Record<string, string> {
  const combo: Record<string, string> = {};
  for (const [name, items] of Object.entries(lists)) {
    combo[name] = randomFrom(items, 1)[0];
  }
  return combo;
}

async function loadExternalLists(filepath: string): Promise<Record<string, string[]>> {
  try {
    const text = await Deno.readTextFile(filepath);
    return JSON.parse(text);
  } catch (e) {
    console.error(`Error loading ${filepath}: ${e}`);
    Deno.exit(1);
  }
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Constraint Entropy Generator - Random constraints for divergent thinking

Usage:
  deno run --allow-read constraint-entropy.ts <category>           # Random constraint
  deno run --allow-read constraint-entropy.ts <category> --count N # N constraints
  deno run --allow-read constraint-entropy.ts --list               # Show categories
  deno run --allow-read constraint-entropy.ts --combo              # One from each
  deno run --allow-read constraint-entropy.ts --file custom.json   # Custom lists

Categories:
  actors        - Who constraints (40 items)
  resources     - Resource constraints (40 items)
  combinations  - Forced combinations (30 items)
  inversions    - Perspective flips (35 items)
  domains       - Domain import prompts (50 items)

Options:
  --count N     Return N random items
  --json        Output as JSON
  --list        Show all categories with counts
  --combo       Generate one item from each category
  --file F      Load additional lists from JSON file
`);
    Deno.exit(0);
  }

  let lists = { ...CONSTRAINTS };

  // Load external file if specified
  const fileIndex = args.indexOf("--file");
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    const external = await loadExternalLists(args[fileIndex + 1]);
    lists = { ...lists, ...external };
  }

  const jsonOutput = args.includes("--json");

  // Show available categories
  if (args.includes("--list")) {
    console.log("Available categories:\n");
    for (const [name, items] of Object.entries(lists)) {
      console.log(`  ${name.padEnd(15)} (${items.length} items)`);
    }
    console.log(`\nTotal: ${Object.values(lists).reduce((sum, arr) => sum + arr.length, 0)} constraints`);
    Deno.exit(0);
  }

  // Generate combo from all categories
  if (args.includes("--combo")) {
    const combo = generateCombo(lists);
    if (jsonOutput) {
      console.log(JSON.stringify(combo, null, 2));
    } else {
      console.log("Random constraint combo:\n");
      for (const [name, value] of Object.entries(combo)) {
        console.log(`  ${name}:`);
        console.log(`    ${value}\n`);
      }
    }
    Deno.exit(0);
  }

  // Get count (defaults to 1)
  const countIndex = args.indexOf("--count");
  const count = countIndex !== -1 ? parseInt(args[countIndex + 1]) || 1 : 1;

  // Build set of arg indices to skip
  const skipIndices = new Set<number>();
  if (fileIndex !== -1) {
    skipIndices.add(fileIndex);
    skipIndices.add(fileIndex + 1);
  }
  if (countIndex !== -1) {
    skipIndices.add(countIndex);
    skipIndices.add(countIndex + 1);
  }

  // Get category (first arg that's not a flag or flag value)
  let category: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--") && !skipIndices.has(i)) {
      category = args[i];
      break;
    }
  }

  if (!category) {
    // Default: pick random from all categories combined
    const allConstraints = Object.values(lists).flat();
    const selected = randomFrom(allConstraints, count);
    if (jsonOutput) {
      console.log(JSON.stringify(selected, null, 2));
    } else {
      for (const item of selected) {
        console.log(`${item}`);
        if (count > 1) console.log();
      }
    }
    Deno.exit(0);
  }

  if (!lists[category]) {
    console.error(`Error: Unknown category "${category}". Use --list to see options.`);
    Deno.exit(1);
  }

  const selected = randomFrom(lists[category], count);

  if (jsonOutput) {
    console.log(JSON.stringify(selected, null, 2));
  } else {
    if (count === 1) {
      console.log(selected[0]);
    } else {
      for (const item of selected) {
        console.log(`${item}`);
        console.log();
      }
    }
  }
}

main();
