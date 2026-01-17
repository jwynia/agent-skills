#!/usr/bin/env -S deno run --allow-read

/**
 * Entropy Injector
 *
 * Randomly selects elements from curated lists to introduce creative entropy.
 * Breaks default patterns by forcing unexpected combinations.
 *
 * Usage:
 *   deno run --allow-read entropy.ts lies              # Random character lie
 *   deno run --allow-read entropy.ts lies --count 3    # Three random lies
 *   deno run --allow-read entropy.ts --list            # Show available lists
 *   deno run --allow-read entropy.ts --combo           # Generate random combo
 *   deno run --allow-read entropy.ts --file data.json professions  # Use custom file
 */

// Built-in lists for immediate use
const BUILT_IN_LISTS: Record<string, string[]> = {
  // Character lies (for character-arc skill)
  lies: [
    "I'm not worthy of love",
    "Power is the only protection",
    "Trust leads to betrayal",
    "My value comes from achievement",
    "The world is fundamentally hostile",
    "I don't deserve happiness",
    "Being vulnerable is weakness",
    "I can only rely on myself",
    "If I'm perfect, I'll be loved",
    "My past defines my future",
    "Other people always leave",
    "I'm not smart/talented enough",
    "Asking for help is failure",
    "I must control everything",
    "Emotions are dangerous",
    "I'm fundamentally broken",
    "Success will make me happy",
    "I don't belong anywhere",
    "Love requires sacrifice of self",
    "The truth is too dangerous",
  ],

  // Ghost/wound types (backstory wounds that create lies)
  ghosts: [
    "Parental abandonment",
    "Public humiliation",
    "Betrayal by trusted figure",
    "Failure at crucial moment",
    "Loss of loved one",
    "Witnessed something terrible",
    "Rejected by community",
    "Survivor's guilt",
    "Childhood neglect",
    "Broken promise with consequences",
    "Identity revelation (adopted, etc.)",
    "Forced to make impossible choice",
    "Trusted someone unworthy",
    "Lost something irreplaceable",
    "Discovered painful truth about self",
    "Was complicit in harm",
    "Couldn't save someone",
    "Was used by someone they loved",
    "Escaped while others didn't",
    "Chose wrong at fork in road",
  ],

  // Disaster types (for scene-sequencing skill)
  disasters: [
    "Yes, but now a worse problem",
    "No, and the door is closed",
    "No, and they know you tried",
    "Yes, but it cost too much",
    "No, and time is running out",
    "Yes, but it's the wrong thing",
    "No, and you're exposed",
    "Yes, but someone else paid",
    "No, and you're trapped",
    "Yes, but trust is broken",
    "No, and help can't reach you",
    "Yes, but you became what you hate",
    "No, and the enemy adapts",
    "Yes, but innocent bystanders",
    "No, and your ally turns",
  ],

  // Dilemma structures (for scene-sequencing)
  dilemmas: [
    "Save friend vs. complete mission",
    "Tell truth vs. protect someone",
    "Personal goal vs. group need",
    "Quick risky path vs. slow safe path",
    "Certain small win vs. possible big win",
    "Principle vs. pragmatism",
    "Trust new ally vs. go alone",
    "Reveal secret vs. maintain cover",
    "Confront now vs. gather evidence",
    "Mercy vs. justice",
    "Loyalty to past vs. necessity of present",
    "Self-preservation vs. moral obligation",
    "Love vs. duty",
    "Honesty vs. kindness",
    "Individual vs. many",
  ],

  // Unexpected professions (for character cliché-breaking)
  professions: [
    "Elevator inspector",
    "Medical illustrator",
    "Voice actor for GPS systems",
    "Crime scene cleaner",
    "Ethical hacker",
    "Cult deprogrammer",
    "Prosthetic eye maker",
    "Patent examiner",
    "Foley artist",
    "Professional line-sitter",
    "Food stylist",
    "Escape room designer",
    "Wind turbine technician",
    "Crossword puzzle constructor",
    "Museum preparator",
    "Genealogist for hire",
    "Demolition consultant",
    "Wastewater treatment operator",
    "Cartographic surveyor",
    "Sleep study technician",
  ],

  // Unexpected locations (for setting cliché-breaking)
  locations: [
    "Toll booth at 3 AM",
    "Hospital chapel",
    "Closed water park",
    "Grain silo",
    "Furniture warehouse clearance sale",
    "Nuclear power plant visitor center",
    "Taxidermy workshop",
    "Airport interfaith chapel",
    "Underground parking garage, level 7",
    "Botanical garden at closing time",
    "Self-storage facility at midnight",
    "Casino surveillance room",
    "Dental office waiting room",
    "Beekeeper's apiary",
    "Radio transmission tower base",
    "Recycling center sorting floor",
    "Meat processing plant",
    "Weather research station",
    "Dog show grooming area",
    "Construction site trailer",
  ],

  // Orthogonal collisions (for cliche-transcendence)
  collisions: [
    "Their investigation accidentally overlaps with protagonist's secret",
    "They're solving a completely different case that uses same evidence",
    "Their mundane job puts them in protagonist's path repeatedly",
    "They're looking for someone else who happens to be with protagonist",
    "Their personal vendetta targets someone protagonist needs",
    "They have information they don't know is valuable",
    "They witnessed something they misinterpreted",
    "Their hobby intersects with the mystery",
    "They're enforcing a rule that blocks protagonist for boring reasons",
    "They want the same resource for completely different reasons",
    "They're cleaning up someone else's mess and protagonist is evidence",
    "They're testing equipment that detects protagonist's secret",
    "They're writing a story and researching the protagonist's situation",
    "They're a former victim of something adjacent to protagonist's problem",
    "They're running a scam that accidentally mimics the real conspiracy",
  ],

  // Scene openings (for drafting prompts)
  openings: [
    "In the middle of an argument that's clearly been going for hours",
    "Someone arriving where they're not supposed to be",
    "Two people pretending they don't know each other",
    "The aftermath of violence, not the violence itself",
    "A routine that's about to be broken",
    "Someone working while processing bad news",
    "A forced politeness between enemies",
    "The moment before a reveal",
    "Someone doing their job badly because distracted",
    "Two conversations happening simultaneously",
    "Someone waiting and trying not to show impatience",
    "A goodbye that might be final",
    "Discovery of something that changes everything",
    "The last normal moment before disruption",
    "Someone maintaining composure while falling apart",
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
    console.log(`Entropy Injector - Random elements for creative work

Usage:
  deno run --allow-read entropy.ts <list-name>           # Random element
  deno run --allow-read entropy.ts <list-name> --count N # N random elements
  deno run --allow-read entropy.ts --list                # Show available lists
  deno run --allow-read entropy.ts --combo               # One from each list
  deno run --allow-read entropy.ts --combo-small         # Subset combo
  deno run --allow-read entropy.ts --file custom.json <list>  # Custom lists

Built-in lists:
  lies        - Character false beliefs (for arcs)
  ghosts      - Backstory wounds
  disasters   - Scene endings
  dilemmas    - Choice structures
  professions - Unexpected jobs
  locations   - Unusual places
  collisions  - Orthogonal intersections
  openings    - Scene start prompts

Options:
  --count N   Return N random items
  --json      Output as JSON
  --list      Show all available lists
  --combo     Generate one item from each list
  --file F    Load additional lists from JSON file
`);
    Deno.exit(0);
  }

  let lists = { ...BUILT_IN_LISTS };

  // Load external file if specified
  const fileIndex = args.indexOf("--file");
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    const external = await loadExternalLists(args[fileIndex + 1]);
    lists = { ...lists, ...external };
  }

  const jsonOutput = args.includes("--json");

  // Show available lists
  if (args.includes("--list")) {
    console.log("Available lists:\n");
    for (const [name, items] of Object.entries(lists)) {
      console.log(`  ${name.padEnd(15)} (${items.length} items)`);
    }
    Deno.exit(0);
  }

  // Generate combo from all or subset of lists
  if (args.includes("--combo")) {
    const combo = generateCombo(lists);
    if (jsonOutput) {
      console.log(JSON.stringify(combo, null, 2));
    } else {
      console.log("Random combination:\n");
      for (const [name, value] of Object.entries(combo)) {
        console.log(`  ${name}: ${value}`);
      }
    }
    Deno.exit(0);
  }

  if (args.includes("--combo-small")) {
    const small = {
      lies: lists.lies,
      disasters: lists.disasters,
      locations: lists.locations,
    };
    const combo = generateCombo(small);
    if (jsonOutput) {
      console.log(JSON.stringify(combo, null, 2));
    } else {
      console.log("Random seed:\n");
      for (const [name, value] of Object.entries(combo)) {
        console.log(`  ${name}: ${value}`);
      }
    }
    Deno.exit(0);
  }

  // Get count first (need to know which args to skip)
  const countIndex = args.indexOf("--count");
  const count = countIndex !== -1 ? parseInt(args[countIndex + 1]) || 1 : 1;

  // Build set of arg indices to skip (flags and their values)
  const skipIndices = new Set<number>();
  if (fileIndex !== -1) {
    skipIndices.add(fileIndex);
    skipIndices.add(fileIndex + 1);
  }
  if (countIndex !== -1) {
    skipIndices.add(countIndex);
    skipIndices.add(countIndex + 1);
  }

  // Get specific list (first arg that's not a flag or flag value)
  let listName: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--") && !skipIndices.has(i)) {
      listName = args[i];
      break;
    }
  }

  if (!listName) {
    console.error("Error: No list specified. Use --list to see options.");
    Deno.exit(1);
  }

  if (!lists[listName]) {
    console.error(`Error: Unknown list "${listName}". Use --list to see options.`);
    Deno.exit(1);
  }

  const selected = randomFrom(lists[listName], count);

  if (jsonOutput) {
    console.log(JSON.stringify(selected, null, 2));
  } else {
    if (count === 1) {
      console.log(selected[0]);
    } else {
      for (const item of selected) {
        console.log(`• ${item}`);
      }
    }
  }
}

main();
