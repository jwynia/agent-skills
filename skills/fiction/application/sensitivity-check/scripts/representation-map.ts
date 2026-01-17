#!/usr/bin/env -S deno run --allow-read

/**
 * representation-map.ts - Map and analyze character representation
 *
 * Analyzes character data to identify:
 * - Identity distribution
 * - Agency/centrality patterns
 * - Potential trope risks
 * - Diversity within identity groups
 *
 * Usage:
 *   deno run --allow-read representation-map.ts characters.json
 *   deno run --allow-read representation-map.ts --interactive
 *
 * Character JSON format:
 * [
 *   {
 *     "name": "Character Name",
 *     "role": "protagonist|antagonist|supporting|minor",
 *     "identities": {
 *       "race": "...",
 *       "gender": "...",
 *       "sexuality": "...",
 *       "disability": "...",
 *       "other": ["..."]
 *     },
 *     "agency": "high|medium|low",
 *     "arc": "positive|negative|flat|none",
 *     "survives": true|false,
 *     "notes": "..."
 *   }
 * ]
 */

interface CharacterIdentities {
  race?: string;
  gender?: string;
  sexuality?: string;
  disability?: string;
  mentalHealth?: string;
  religion?: string;
  class?: string;
  other?: string[];
}

interface Character {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  identities: CharacterIdentities;
  agency: 'high' | 'medium' | 'low';
  arc: 'positive' | 'negative' | 'flat' | 'none';
  survives: boolean;
  notes?: string;
}

interface AnalysisResult {
  characterCount: number;
  roleDistribution: Record<string, number>;
  identityDistribution: Record<string, Record<string, number>>;
  agencyAnalysis: {
    byIdentity: Record<string, { high: number; medium: number; low: number }>;
    concerns: string[];
  };
  survivalAnalysis: {
    byIdentity: Record<string, { survives: number; dies: number }>;
    concerns: string[];
  };
  tropeRisks: string[];
  diversityNotes: string[];
}

const MARGINALIZED_IDENTITIES = {
  race: ['black', 'asian', 'latino', 'latina', 'latinx', 'indigenous', 'native', 'middle eastern', 'south asian', 'pacific islander', 'mixed', 'biracial', 'multiracial'],
  gender: ['woman', 'female', 'trans', 'transgender', 'non-binary', 'nonbinary', 'genderqueer', 'agender', 'genderfluid'],
  sexuality: ['gay', 'lesbian', 'bisexual', 'pansexual', 'queer', 'asexual', 'ace'],
  disability: ['disabled', 'blind', 'deaf', 'wheelchair', 'chronic', 'neurodivergent', 'autistic', 'adhd'],
  mentalHealth: ['depression', 'anxiety', 'ptsd', 'bipolar', 'schizophrenia', 'ocd', 'eating disorder'],
};

function isMarginalized(category: string, value: string): boolean {
  const categoryList = MARGINALIZED_IDENTITIES[category as keyof typeof MARGINALIZED_IDENTITIES];
  if (!categoryList) return false;
  const lowerValue = value.toLowerCase();
  return categoryList.some(term => lowerValue.includes(term));
}

function analyzeCharacters(characters: Character[]): AnalysisResult {
  const result: AnalysisResult = {
    characterCount: characters.length,
    roleDistribution: {},
    identityDistribution: {},
    agencyAnalysis: { byIdentity: {}, concerns: [] },
    survivalAnalysis: { byIdentity: {}, concerns: [] },
    tropeRisks: [],
    diversityNotes: [],
  };

  // Role distribution
  for (const char of characters) {
    result.roleDistribution[char.role] = (result.roleDistribution[char.role] || 0) + 1;
  }

  // Identity distribution
  const identityCategories = ['race', 'gender', 'sexuality', 'disability', 'mentalHealth', 'religion'];
  for (const category of identityCategories) {
    result.identityDistribution[category] = {};
  }

  for (const char of characters) {
    for (const category of identityCategories) {
      const value = char.identities[category as keyof CharacterIdentities];
      if (value && typeof value === 'string') {
        result.identityDistribution[category][value] =
          (result.identityDistribution[category][value] || 0) + 1;
      }
    }
  }

  // Agency analysis by identity
  for (const char of characters) {
    for (const [category, value] of Object.entries(char.identities)) {
      if (value && typeof value === 'string') {
        const key = `${category}:${value}`;
        if (!result.agencyAnalysis.byIdentity[key]) {
          result.agencyAnalysis.byIdentity[key] = { high: 0, medium: 0, low: 0 };
        }
        result.agencyAnalysis.byIdentity[key][char.agency]++;
      }
    }
  }

  // Agency concerns
  for (const [identity, counts] of Object.entries(result.agencyAnalysis.byIdentity)) {
    const total = counts.high + counts.medium + counts.low;
    if (total >= 2) {
      const lowPercentage = (counts.low / total) * 100;
      if (lowPercentage > 50) {
        const [category, value] = identity.split(':');
        if (isMarginalized(category, value)) {
          result.agencyAnalysis.concerns.push(
            `${identity}: ${lowPercentage.toFixed(0)}% low agency (${counts.low}/${total} characters)`
          );
        }
      }
    }
  }

  // Survival analysis
  for (const char of characters) {
    for (const [category, value] of Object.entries(char.identities)) {
      if (value && typeof value === 'string') {
        const key = `${category}:${value}`;
        if (!result.survivalAnalysis.byIdentity[key]) {
          result.survivalAnalysis.byIdentity[key] = { survives: 0, dies: 0 };
        }
        if (char.survives) {
          result.survivalAnalysis.byIdentity[key].survives++;
        } else {
          result.survivalAnalysis.byIdentity[key].dies++;
        }
      }
    }
  }

  // Survival concerns
  for (const [identity, counts] of Object.entries(result.survivalAnalysis.byIdentity)) {
    const total = counts.survives + counts.dies;
    if (counts.dies > 0) {
      const deathPercentage = (counts.dies / total) * 100;
      const [category, value] = identity.split(':');
      if (isMarginalized(category, value)) {
        if (deathPercentage > 50 || (category === 'sexuality' && counts.dies > 0)) {
          result.survivalAnalysis.concerns.push(
            `${identity}: ${counts.dies}/${total} characters die (${deathPercentage.toFixed(0)}%)`
          );
        }
      }
    }
  }

  // Trope risk detection
  const lgbtqChars = characters.filter(c =>
    isMarginalized('sexuality', c.identities.sexuality || '') ||
    (c.identities.gender && isMarginalized('gender', c.identities.gender) && c.identities.gender.toLowerCase().includes('trans'))
  );
  const lgbtqDeaths = lgbtqChars.filter(c => !c.survives);
  if (lgbtqDeaths.length > 0) {
    result.tropeRisks.push(
      `BURY YOUR GAYS RISK: ${lgbtqDeaths.length} LGBTQ+ character(s) die: ${lgbtqDeaths.map(c => c.name).join(', ')}`
    );
  }

  // Magical minority detection
  const marginalizedSupportingWithHighAgency = characters.filter(c =>
    c.role === 'supporting' &&
    c.agency === 'high' &&
    Object.entries(c.identities).some(([cat, val]) =>
      val && typeof val === 'string' && isMarginalized(cat, val)
    )
  );
  const protagonists = characters.filter(c => c.role === 'protagonist');
  const defaultProtagonists = protagonists.filter(c =>
    !Object.entries(c.identities).some(([cat, val]) =>
      val && typeof val === 'string' && isMarginalized(cat, val)
    )
  );

  if (marginalizedSupportingWithHighAgency.length > 0 && defaultProtagonists.length > 0) {
    result.tropeRisks.push(
      `MAGICAL MINORITY RISK: Marginalized supporting characters with high agency serving default protagonist(s). Check: ${marginalizedSupportingWithHighAgency.map(c => c.name).join(', ')}`
    );
  }

  // Mental health + antagonist
  const mentalHealthAntagonists = characters.filter(c =>
    c.role === 'antagonist' && c.identities.mentalHealth
  );
  if (mentalHealthAntagonists.length > 0) {
    result.tropeRisks.push(
      `MENTAL ILLNESS = VILLAIN RISK: Antagonist(s) with mental health conditions: ${mentalHealthAntagonists.map(c => `${c.name} (${c.identities.mentalHealth})`).join(', ')}`
    );
  }

  // Diversity notes
  const identityCounts: Record<string, number> = {};
  for (const char of characters) {
    for (const [category, value] of Object.entries(char.identities)) {
      if (value && typeof value === 'string') {
        const key = `${category}:${value}`;
        identityCounts[key] = (identityCounts[key] || 0) + 1;
      }
    }
  }

  for (const [identity, count] of Object.entries(identityCounts)) {
    if (count === 1) {
      const [category, value] = identity.split(':');
      if (isMarginalized(category, value)) {
        result.diversityNotes.push(
          `Only one ${value} character - consider if tokenism risk`
        );
      }
    }
  }

  return result;
}

function formatReport(result: AnalysisResult): string {
  let report = `
REPRESENTATION MAP
==================

Characters analyzed: ${result.characterCount}

ROLE DISTRIBUTION
`;
  for (const [role, count] of Object.entries(result.roleDistribution)) {
    report += `  ${role}: ${count}\n`;
  }

  report += `
IDENTITY DISTRIBUTION
`;
  for (const [category, values] of Object.entries(result.identityDistribution)) {
    if (Object.keys(values).length > 0) {
      report += `\n  ${category}:\n`;
      for (const [value, count] of Object.entries(values)) {
        report += `    ${value}: ${count}\n`;
      }
    }
  }

  if (result.agencyAnalysis.concerns.length > 0) {
    report += `
AGENCY CONCERNS
`;
    for (const concern of result.agencyAnalysis.concerns) {
      report += `  ! ${concern}\n`;
    }
  }

  if (result.survivalAnalysis.concerns.length > 0) {
    report += `
SURVIVAL CONCERNS
`;
    for (const concern of result.survivalAnalysis.concerns) {
      report += `  ! ${concern}\n`;
    }
  }

  if (result.tropeRisks.length > 0) {
    report += `
TROPE RISKS
`;
    for (const risk of result.tropeRisks) {
      report += `  !! ${risk}\n`;
    }
  }

  if (result.diversityNotes.length > 0) {
    report += `
DIVERSITY NOTES
`;
    for (const note of result.diversityNotes) {
      report += `  * ${note}\n`;
    }
  }

  report += `
RECOMMENDATIONS

1. Review any flagged trope risks carefully
2. Consider agency distribution across identities
3. If only one character of an identity, consider tokenism
4. Ensure marginalized characters have their own stories/arcs
5. Engage sensitivity readers for identities represented

This analysis is based on data provided and cannot assess:
  - Quality of representation within the narrative
  - Stereotyping through characterization
  - Authentic voice and experience
  - Reception by affected communities
`;

  return report;
}

function showExampleFormat(): string {
  return `
CHARACTER JSON FORMAT
=====================

Create a JSON file with this structure:

[
  {
    "name": "Maya Chen",
    "role": "protagonist",
    "identities": {
      "race": "Chinese-American",
      "gender": "woman",
      "sexuality": "bisexual",
      "disability": null,
      "mentalHealth": null,
      "religion": null
    },
    "agency": "high",
    "arc": "positive",
    "survives": true,
    "notes": "Main character, drives the plot"
  },
  {
    "name": "James Wright",
    "role": "supporting",
    "identities": {
      "race": "white",
      "gender": "man",
      "sexuality": "straight"
    },
    "agency": "medium",
    "arc": "flat",
    "survives": true
  },
  {
    "name": "Dr. Amara Okonkwo",
    "role": "supporting",
    "identities": {
      "race": "Nigerian",
      "gender": "woman",
      "sexuality": "lesbian"
    },
    "agency": "high",
    "arc": "positive",
    "survives": false,
    "notes": "Dies in chapter 15"
  }
]

FIELDS:
  name: Character name
  role: protagonist | antagonist | supporting | minor
  identities: Object with identity categories
    - race: ethnic/racial identity
    - gender: gender identity
    - sexuality: sexual orientation
    - disability: any disability
    - mentalHealth: any mental health condition
    - religion: religious identity
    - class: socioeconomic class
  agency: high | medium | low (how much they drive events)
  arc: positive | negative | flat | none
  survives: true | false (do they survive the story?)
  notes: optional additional context
`;
}

function showUsage(): void {
  console.log(`
Representation Map Tool
=======================

Analyzes character data to identify representation patterns.

Usage:
  deno run --allow-read representation-map.ts <characters.json>
  deno run --allow-read representation-map.ts --format

Options:
  --format    Show the expected JSON format for character data

Detects:
  - Identity distribution across characters
  - Agency imbalances by identity
  - Survival disparities (Bury Your Gays, etc.)
  - Trope risks (Magical Minority, etc.)
  - Tokenism indicators

See --format for character JSON structure.
`);
}

async function main() {
  const args = Deno.args;

  if (args.includes('--format')) {
    console.log(showExampleFormat());
    Deno.exit(0);
  }

  if (args.length === 0 || args[0].startsWith('--')) {
    showUsage();
    Deno.exit(0);
  }

  const filename = args[0];
  try {
    const text = await Deno.readTextFile(filename);
    const characters: Character[] = JSON.parse(text);

    if (!Array.isArray(characters)) {
      console.error('Error: JSON must be an array of character objects');
      Deno.exit(1);
    }

    const result = analyzeCharacters(characters);
    console.log(formatReport(result));
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error('Error: Invalid JSON format');
      console.error(e.message);
    } else {
      console.error(`Error reading file: ${filename}`);
      console.error(e);
    }
    Deno.exit(1);
  }
}

main();
