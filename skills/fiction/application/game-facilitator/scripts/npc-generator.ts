#!/usr/bin/env -S deno run --allow-read

/**
 * npc-generator.ts - Generate NPCs on demand for game sessions
 *
 * Creates NPCs with:
 * - Name fitting the tone
 * - Immediate want and method
 * - Distinctive trait
 * - Potential hook
 *
 * Usage:
 *   deno run --allow-read npc-generator.ts
 *   deno run --allow-read npc-generator.ts --tone dark-fantasy
 *   deno run --allow-read npc-generator.ts --role merchant --trait suspicious
 */

interface NPC {
  name: string;
  role: string;
  want: string;
  method: string;
  trait: string;
  voice: string;
  hook: string;
}

const TONES: Record<string, { names: string[]; flavor: string }> = {
  'dark-fantasy': {
    names: ['Grimwald', 'Sera', 'Thorne', 'Ashlyn', 'Mordecai', 'Lilith', 'Cain', 'Isolde', 'Raven', 'Dusk'],
    flavor: 'grim, desperate, haunted'
  },
  'high-fantasy': {
    names: ['Aldric', 'Elara', 'Thorin', 'Lyanna', 'Galen', 'Seraphina', 'Bram', 'Mira', 'Cedric', 'Faye'],
    flavor: 'noble, questing, legendary'
  },
  'urban-fantasy': {
    names: ['Jack', 'Maya', 'Dante', 'Zara', 'Marcus', 'Luna', 'Ash', 'Vera', 'Cole', 'Iris'],
    flavor: 'street-smart, hidden, dual-life'
  },
  'sci-fi': {
    names: ['Kira', 'Dex', 'Nova', 'Zane', 'Echo', 'Ryn', 'Jax', 'Vera', 'Orion', 'Cass'],
    flavor: 'pragmatic, augmented, frontier'
  },
  'historical': {
    names: ['Edmund', 'Catherine', 'William', 'Elizabeth', 'Thomas', 'Margaret', 'John', 'Anne', 'Henry', 'Mary'],
    flavor: 'formal, hierarchical, tradition-bound'
  },
  'modern': {
    names: ['Sam', 'Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Taylor', 'Jamie', 'Quinn', 'Blake'],
    flavor: 'contemporary, relatable, grounded'
  },
};

const ROLES = [
  'merchant', 'guard', 'innkeeper', 'scholar', 'priest', 'criminal', 'noble',
  'peasant', 'artisan', 'soldier', 'healer', 'entertainer', 'messenger',
  'hunter', 'sailor', 'servant', 'beggar', 'traveler', 'official', 'mystic'
];

const WANTS = [
  'money to pay a debt',
  'information about someone',
  'protection from a threat',
  'revenge for a wrong',
  'escape from this place',
  'to find a missing person',
  'to keep a secret hidden',
  'to expose a secret',
  'power over others',
  'to be left alone',
  'recognition for their work',
  'to help someone they love',
  'to destroy something',
  'to preserve something',
  'to prove themselves',
  'to atone for past actions',
  'to acquire a specific item',
  'to prevent a coming disaster',
  'to complete a dying wish',
  'to sabotage a rival'
];

const METHODS = [
  'manipulation and lies',
  'direct confrontation',
  'bargaining and deals',
  'pleading and sympathy',
  'threats and intimidation',
  'seduction and charm',
  'deception and disguise',
  'patience and observation',
  'bribery and corruption',
  'violence as last resort',
  'gathering allies',
  'undermining rivals',
  'leveraging connections',
  'exploiting weaknesses',
  'offering genuine help'
];

const TRAITS = [
  'nervous, fidgeting constantly',
  'overly friendly, too eager to please',
  'suspicious, watches everyone',
  'exhausted, barely holding on',
  'arrogant, dismissive of others',
  'grieving, heavy with loss',
  'cheerful despite circumstances',
  'bitter about past failures',
  'devoutly religious',
  'secretly terrified',
  'calculating every angle',
  'genuinely kind-hearted',
  'barely concealed anger',
  'mysterious, speaks in riddles',
  'blunt to the point of rudeness',
  'drunk or intoxicated',
  'physically distinctive (scar, limp)',
  'clearly lying about something',
  'desperately hiding something',
  'nostalgic for better times'
];

const VOICE_PATTERNS = [
  'speaks in short, clipped sentences',
  'rambles and loses track of thoughts',
  'formal and overly polite',
  'casual, uses slang and curses',
  'whispers conspiratorially',
  'loud and commanding',
  'hesitant, lots of pauses',
  'rapid-fire, barely pauses for breath',
  'asks too many questions',
  'never quite answers directly',
  'uses elaborate vocabulary',
  'speaks in platitudes and sayings',
  'nervous laughter between phrases',
  'sighs heavily before speaking',
  'interrupts constantly'
];

const HOOKS = [
  'knows something about a player\'s background',
  'has an item the players need',
  'is being hunted by the same enemy',
  'witnessed something the players need to know',
  'owes a debt to someone the players know',
  'recognizes a player from somewhere',
  'is pretending to be someone else',
  'has a job that needs doing',
  'is dying and needs one last thing',
  'is working for the opposition secretly',
  'can provide access to a restricted area',
  'has a missing family member to find',
  'carries a curse that affects others',
  'knows the location of something valuable',
  'is the last survivor of something significant'
];

function random<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateNPC(options: {
  tone?: string;
  role?: string;
  trait?: string;
}): NPC {
  const tone = options.tone && TONES[options.tone] ? options.tone : random(Object.keys(TONES));
  const toneData = TONES[tone];

  return {
    name: random(toneData.names),
    role: options.role || random(ROLES),
    want: random(WANTS),
    method: random(METHODS),
    trait: options.trait || random(TRAITS),
    voice: random(VOICE_PATTERNS),
    hook: random(HOOKS),
  };
}

function formatNPC(npc: NPC): string {
  return `
NPC GENERATED
=============

Name: ${npc.name}
Role: ${npc.role}

MOTIVATION
  Want: ${npc.want}
  Method: ${npc.method}

PORTRAYAL
  Trait: ${npc.trait}
  Voice: ${npc.voice}

STORY HOOK
  ${npc.hook}

QUICK REFERENCE
  "${npc.name} the ${npc.role} wants ${npc.want}
   and will use ${npc.method} to get it."

NOTES FOR PLAY
  - Play the want actively—they're always pursuing it
  - The trait is visible; the want may be hidden
  - The hook creates connection—use when the moment is right
`;
}

function showUsage() {
  console.log(`
NPC Generator
=============

Generate NPCs on demand for game sessions.

Usage:
  deno run --allow-read npc-generator.ts [options]

Options:
  --tone <tone>     Set the tone/setting
  --role <role>     Specify role/occupation
  --trait <trait>   Specify personality trait
  --count <n>       Generate multiple NPCs

Tones: ${Object.keys(TONES).join(', ')}

Roles: ${ROLES.slice(0, 10).join(', ')}...

Examples:
  deno run --allow-read npc-generator.ts
  deno run --allow-read npc-generator.ts --tone dark-fantasy
  deno run --allow-read npc-generator.ts --role merchant --trait suspicious
  deno run --allow-read npc-generator.ts --count 3
`);
}

function main() {
  const args = Deno.args;

  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    Deno.exit(0);
  }

  const options: { tone?: string; role?: string; trait?: string } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tone' && args[i + 1]) {
      options.tone = args[++i];
    } else if (args[i] === '--role' && args[i + 1]) {
      options.role = args[++i];
    } else if (args[i] === '--trait' && args[i + 1]) {
      options.trait = args[++i];
    }
  }

  // Check for count
  const countIdx = args.indexOf('--count');
  const count = countIdx > -1 && args[countIdx + 1] ? parseInt(args[countIdx + 1]) : 1;

  for (let i = 0; i < count; i++) {
    const npc = generateNPC(options);
    console.log(formatNPC(npc));
    if (i < count - 1) {
      console.log('\n' + '─'.repeat(50) + '\n');
    }
  }
}

main();
