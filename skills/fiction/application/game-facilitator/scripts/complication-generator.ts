#!/usr/bin/env -S deno run --allow-read

/**
 * complication-generator.ts - Generate complications when the game needs a push
 *
 * Creates:
 * - New obstacles
 * - Unexpected connections
 * - Time pressures
 * - Resource problems
 * - NPC interventions
 *
 * Usage:
 *   deno run --allow-read complication-generator.ts
 *   deno run --allow-read complication-generator.ts --type obstacle
 *   deno run --allow-read complication-generator.ts --current "searching the mansion"
 */

interface Complication {
  type: string;
  description: string;
  escalation: string;
  question: string;
}

const COMPLICATION_TYPES = [
  'obstacle',
  'revelation',
  'time-pressure',
  'resource',
  'npc-intervention',
  'environment',
  'betrayal',
  'opportunity'
];

const COMPLICATIONS: Record<string, Complication[]> = {
  'obstacle': [
    {
      type: 'obstacle',
      description: 'The direct path is blocked—guards, locks, or physical barrier',
      escalation: 'Someone notices them trying to get past',
      question: 'How do they bypass it without drawing attention?'
    },
    {
      type: 'obstacle',
      description: 'They need something they don\'t have to proceed',
      escalation: 'Time is running out to acquire it',
      question: 'Who has what they need, and what will it cost?'
    },
    {
      type: 'obstacle',
      description: 'Someone they need is unavailable, missing, or unwilling',
      escalation: 'The person is in danger themselves',
      question: 'Can they find them or accomplish the goal another way?'
    },
    {
      type: 'obstacle',
      description: 'Their reputation precedes them—doors are closing',
      escalation: 'Active efforts to stop them are beginning',
      question: 'Who\'s spreading information and why?'
    },
    {
      type: 'obstacle',
      description: 'The skill required is beyond any of them',
      escalation: 'Failed attempts draw attention or worsen the situation',
      question: 'Who can they recruit, and can they be trusted?'
    },
  ],
  'revelation': [
    {
      type: 'revelation',
      description: 'They learn their goal is not what they thought',
      escalation: 'Someone else knows the truth and is using it',
      question: 'Does this change what they want, or just how they pursue it?'
    },
    {
      type: 'revelation',
      description: 'An ally has been working against them',
      escalation: 'The betrayer has already reported to someone',
      question: 'How much damage has been done, and can it be undone?'
    },
    {
      type: 'revelation',
      description: 'The enemy has a sympathetic motivation',
      escalation: 'Defeating them will cause collateral harm',
      question: 'Is there a solution that doesn\'t require their destruction?'
    },
    {
      type: 'revelation',
      description: 'Two things they thought separate are connected',
      escalation: 'The connection explains a pattern they missed',
      question: 'What else is connected that they haven\'t seen?'
    },
    {
      type: 'revelation',
      description: 'They are not the only ones pursuing this goal',
      escalation: 'The competition is ahead of them',
      question: 'Compete, cooperate, or eliminate the rivals?'
    },
  ],
  'time-pressure': [
    {
      type: 'time-pressure',
      description: 'A deadline they didn\'t know about is imminent',
      escalation: 'Missing it will close their path permanently',
      question: 'Can they make it, and what corners must be cut?'
    },
    {
      type: 'time-pressure',
      description: 'Someone important is dying or in immediate danger',
      escalation: 'Each moment of delay reduces survival chances',
      question: 'Drop everything or trust others to handle it?'
    },
    {
      type: 'time-pressure',
      description: 'Help is coming—but so is opposition',
      escalation: 'It\'s unclear which will arrive first',
      question: 'Prepare for help, prepare for attack, or flee?'
    },
    {
      type: 'time-pressure',
      description: 'A ritual, event, or process is counting down',
      escalation: 'Completion will change everything irreversibly',
      question: 'Stop it, redirect it, or embrace what\'s coming?'
    },
    {
      type: 'time-pressure',
      description: 'They\'re being hunted and the pursuit is closing in',
      escalation: 'Their safe havens are being compromised one by one',
      question: 'Run, hide, or turn and face the pursuers?'
    },
  ],
  'resource': [
    {
      type: 'resource',
      description: 'A crucial resource runs out (money, supplies, energy)',
      escalation: 'Alternatives are expensive, dangerous, or compromising',
      question: 'What are they willing to sacrifice to continue?'
    },
    {
      type: 'resource',
      description: 'Something they rely on breaks or is taken',
      escalation: 'Operating without it puts them at serious disadvantage',
      question: 'Repair, replace, or adapt to the loss?'
    },
    {
      type: 'resource',
      description: 'An ally cannot continue (injured, called away, arrested)',
      escalation: 'The ally knows things that could be extracted',
      question: 'Rescue them, find replacement, or proceed alone?'
    },
    {
      type: 'resource',
      description: 'The safe place is no longer safe',
      escalation: 'They may have been compromised before leaving',
      question: 'Where can they go, and who can they still trust?'
    },
    {
      type: 'resource',
      description: 'Their reputation/credibility takes a major hit',
      escalation: 'Former allies are distancing themselves',
      question: 'Clear their name, work from shadows, or accept the label?'
    },
  ],
  'npc-intervention': [
    {
      type: 'npc-intervention',
      description: 'A powerful figure takes interest in the situation',
      escalation: 'Their interest comes with strings attached',
      question: 'Accept help that comes with obligations?'
    },
    {
      type: 'npc-intervention',
      description: 'An old contact appears with urgent need',
      escalation: 'Ignoring them will burn the bridge permanently',
      question: 'Help them now, or prioritize current goals?'
    },
    {
      type: 'npc-intervention',
      description: 'Someone offers a shortcut—suspiciously convenient',
      escalation: 'The offer has a deadline',
      question: 'Too good to be true, or genuine opportunity?'
    },
    {
      type: 'npc-intervention',
      description: 'An enemy wants to negotiate',
      escalation: 'They have something valuable to offer or threaten',
      question: 'Hear them out, or reject any dealing?'
    },
    {
      type: 'npc-intervention',
      description: 'An innocent gets caught in the crossfire',
      escalation: 'Saving them will compromise the mission',
      question: 'Mission or conscience?'
    },
  ],
  'environment': [
    {
      type: 'environment',
      description: 'Weather or natural conditions turn dangerous',
      escalation: 'The conditions are worsening rapidly',
      question: 'Push through, shelter, or find another route?'
    },
    {
      type: 'environment',
      description: 'The location is more dangerous than expected',
      escalation: 'They\'re deeper in than they realized',
      question: 'Retreat while possible, or commit to the danger?'
    },
    {
      type: 'environment',
      description: 'Something awakens, activates, or notices them',
      escalation: 'It\'s mobile and interested',
      question: 'Communicate, hide, fight, or flee?'
    },
    {
      type: 'environment',
      description: 'The terrain or structure is unstable',
      escalation: 'Movement may trigger collapse',
      question: 'Slow and careful, or race through before it fails?'
    },
    {
      type: 'environment',
      description: 'They become separated or disoriented',
      escalation: 'One group encounters danger alone',
      question: 'Reunite first, or trust both groups to handle their situations?'
    },
  ],
  'betrayal': [
    {
      type: 'betrayal',
      description: 'Information was leaked—someone talked',
      escalation: 'The leak is ongoing, not past',
      question: 'Find the leak, or change plans entirely?'
    },
    {
      type: 'betrayal',
      description: 'An ally chose a side, and it wasn\'t theirs',
      escalation: 'The ally is actively working against them now',
      question: 'Confront, avoid, or turn them back?'
    },
    {
      type: 'betrayal',
      description: 'They were set up—the situation was a trap',
      escalation: 'The trap is closing',
      question: 'How did they not see it, and who orchestrated it?'
    },
    {
      type: 'betrayal',
      description: 'Something they were promised isn\'t delivered',
      escalation: 'They\'ve already given their end of the bargain',
      question: 'Pursue compensation, or write off the loss?'
    },
    {
      type: 'betrayal',
      description: 'They discover they were manipulated into helping the wrong side',
      escalation: 'Their actions have caused harm they must face',
      question: 'Make amends, deny responsibility, or embrace the new alignment?'
    },
  ],
  'opportunity': [
    {
      type: 'opportunity',
      description: 'A distraction creates an unexpected opening',
      escalation: 'The window is closing fast',
      question: 'Take the risky opportunity, or stick to the plan?'
    },
    {
      type: 'opportunity',
      description: 'They discover something valuable while pursuing the goal',
      escalation: 'Taking it will complicate the main mission',
      question: 'Side objective worth the risk?'
    },
    {
      type: 'opportunity',
      description: 'An enemy is vulnerable, but attacking means exposure',
      escalation: 'The vulnerability won\'t last',
      question: 'Strike now, or preserve cover for later?'
    },
    {
      type: 'opportunity',
      description: 'They could solve a bigger problem than they planned',
      escalation: 'It requires abandoning the current approach',
      question: 'Bigger win with bigger risk, or stay the course?'
    },
    {
      type: 'opportunity',
      description: 'They find unlikely allies in the situation',
      escalation: 'The allies have their own agenda',
      question: 'Temporary alliance worth the complications?'
    },
  ],
};

function random<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateComplication(type?: string): Complication {
  const selectedType = type && COMPLICATIONS[type] ? type : random(COMPLICATION_TYPES);
  return random(COMPLICATIONS[selectedType]);
}

function formatComplication(comp: Complication, current?: string): string {
  let output = `
COMPLICATION GENERATED
======================

Type: ${comp.type.toUpperCase()}

`;

  if (current) {
    output += `While: ${current}\n\n`;
  }

  output += `WHAT HAPPENS
  ${comp.description}

IF IGNORED / ESCALATION
  ${comp.escalation}

QUESTION FOR PLAYERS
  ${comp.question}

HOW TO USE
  - Drop this in when the scene needs energy
  - Present through NPC announcement, discovery, or event
  - Let players react—don't predetermine their response
  - The escalation triggers if they delay or ignore
`;

  return output;
}

function showUsage() {
  console.log(`
Complication Generator
======================

Generate complications to inject energy into stalled scenes.

Usage:
  deno run --allow-read complication-generator.ts [options]

Options:
  --type <type>       Specific complication type
  --current <desc>    Description of current situation
  --count <n>         Generate multiple complications

Types: ${COMPLICATION_TYPES.join(', ')}

Examples:
  deno run --allow-read complication-generator.ts
  deno run --allow-read complication-generator.ts --type time-pressure
  deno run --allow-read complication-generator.ts --current "investigating the crime scene"
  deno run --allow-read complication-generator.ts --count 3
`);
}

function main() {
  const args = Deno.args;

  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    Deno.exit(0);
  }

  let type: string | undefined;
  let current: string | undefined;
  let count = 1;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' && args[i + 1]) {
      type = args[++i];
    } else if (args[i] === '--current' && args[i + 1]) {
      current = args[++i];
    } else if (args[i] === '--count' && args[i + 1]) {
      count = parseInt(args[++i]);
    }
  }

  for (let i = 0; i < count; i++) {
    const comp = generateComplication(type);
    console.log(formatComplication(comp, current));
    if (i < count - 1) {
      console.log('\n' + '─'.repeat(50) + '\n');
    }
  }
}

main();
