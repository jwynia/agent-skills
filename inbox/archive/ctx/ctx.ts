#!/usr/bin/env bun
/**
 * Context CLI - Standalone development context network
 *
 * This CLI is independent of the web app and stores context in the project root.
 *
 * Usage:
 *   bun ctx.ts store <type> <content> [--tags tag1,tag2]
 *   bun ctx.ts query <search term>
 *   bun ctx.ts insights
 *   bun ctx.ts list [--limit N] [--type TYPE]
 *   bun ctx.ts get <id>
 *   bun ctx.ts delete <id>
 *
 * Or with npm script: bun run ctx store decision "Use TypeScript"
 */

import { resolve, dirname } from 'path';
import { RuntimeContext } from '@mastra/core/runtime-context';
import {
  contextStoreTools,
  contextQueryTools,
  contextAnalysisTools,
} from '@jwynia/corticai/context/tools';

// Get project root (two levels up: scripts/ctx -> scripts -> project root)
const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname);
const PROJECT_ROOT = resolve(SCRIPT_DIR, '..', '..');

// Development context storage - stored at project root, independent of app
const STORAGE_CONFIG = {
  type: 'json' as const,
  json: {
    filePath: resolve(PROJECT_ROOT, 'data', 'dev-context.json'),
    pretty: true,
  },
};

// Valid entry types
const VALID_TYPES = ['decision', 'code', 'discussion', 'documentation', 'todo', 'pattern', 'relationship'] as const;
type EntryType = typeof VALID_TYPES[number];

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

function parseFlags(args: string[]): { positional: string[]; flags: Record<string, string> } {
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      flags[key] = args[i + 1] || 'true';
      i++;
    } else {
      positional.push(args[i]);
    }
  }

  return { positional, flags };
}

function createRuntimeContext() {
  return new RuntimeContext();
}

async function main() {
  const { positional, flags } = parseFlags(args.slice(1));

  switch (command) {
    case 'store':
    case 's': {
      let [type, ...contentParts] = positional;
      const content = contentParts.join(' ');

      if (!type || !content) {
        console.error('Usage: ctx store <type> <content> [--tags tag1,tag2]');
        console.error('Types:', VALID_TYPES.join(', '));
        process.exit(1);
      }

      // Map shorthand types
      const typeMap: Record<string, EntryType> = {
        dec: 'decision',
        doc: 'documentation',
        disc: 'discussion',
        rel: 'relationship',
        pat: 'pattern',
      };
      type = typeMap[type] || type;

      if (!VALID_TYPES.includes(type as EntryType)) {
        console.error('Invalid type:', type);
        console.error('Valid types:', VALID_TYPES.join(', '));
        process.exit(1);
      }

      const tags = flags.tags?.split(',') || [];

      const result = await contextStoreTools.storeContext.execute({
        context: {
          entry: {
            type: type as EntryType,
            content,
            metadata: tags.length ? { tags } : undefined,
          },
          storageConfig: STORAGE_CONFIG,
          deduplicate: true,
        },
        runtimeContext: createRuntimeContext(),
      });

      if (result.duplicate) {
        console.log('Duplicate found:', result.duplicateId);
      } else {
        console.log('Stored:', result.id);
      }
      break;
    }

    case 'query':
    case 'q': {
      const searchTerm = positional.join(' ');
      if (!searchTerm) {
        console.error('Usage: ctx query <search term>');
        process.exit(1);
      }

      const result = await contextQueryTools.searchContext.execute({
        context: {
          searchTerm,
          fields: ['content', 'type'],
          storageConfig: STORAGE_CONFIG,
        },
        runtimeContext: createRuntimeContext(),
      });

      if (!result.results?.length) {
        console.log('No results found.');
        break;
      }

      console.log(`Found ${result.results.length} results:\n`);
      for (const item of result.results.slice(0, 10)) {
        console.log(`[${item.id}] (${item.type})`);
        if (typeof item.content === 'string') {
          console.log(`  ${item.content.slice(0, 100)}${item.content.length > 100 ? '...' : ''}`);
        } else if (item.content) {
          const preview = JSON.stringify(item.content).slice(0, 100);
          console.log(`  ${preview}${preview.length >= 100 ? '...' : ''}`);
        }
        if (item.metadata?.tags?.length) {
          console.log(`  Tags: ${item.metadata.tags.join(', ')}`);
        }
        console.log();
      }
      break;
    }

    case 'insights':
    case 'i': {
      // Get quality analysis
      const quality = await contextAnalysisTools.analyzeContextQuality.execute({
        context: {
          storageConfig: STORAGE_CONFIG,
        },
        runtimeContext: createRuntimeContext(),
      });

      // Get patterns
      const patterns = await contextAnalysisTools.analyzeContextPatterns.execute({
        context: {
          storageConfig: STORAGE_CONFIG,
        },
        runtimeContext: createRuntimeContext(),
      });

      console.log('=== Dev Context Insights ===\n');
      console.log(`Total Entries: ${quality.totalEntries || 0}`);
      console.log(`Quality Score: ${quality.qualityScore}/100`);
      console.log(`Complete Entries: ${quality.completeEntries || 0}`);
      console.log(`Entries With Metadata: ${quality.entriesWithMetadata || 0}`);

      console.log('\nType Distribution:');
      for (const [type, count] of Object.entries(quality.typeDistribution || {})) {
        console.log(`  ${type}: ${count}`);
      }

      if (patterns.patterns?.length) {
        console.log('\nPatterns Found:');
        for (const pat of patterns.patterns.slice(0, 5)) {
          console.log(`  - ${pat.pattern} (${pat.count} occurrences)`);
        }
      }

      if (quality.recommendations?.length) {
        console.log('\nRecommendations:');
        for (const rec of quality.recommendations) {
          console.log(`  - ${rec}`);
        }
      }
      break;
    }

    case 'list':
    case 'ls': {
      const limit = parseInt(flags.limit || '10', 10);
      const typeFilter = flags.type;

      // Get all entries via queryContext with empty conditions
      const result = await contextQueryTools.queryContext.execute({
        context: {
          query: typeFilter
            ? { conditions: [{ field: 'type', operator: '=' as const, value: typeFilter }] }
            : {},
          storageConfig: STORAGE_CONFIG,
        },
        runtimeContext: createRuntimeContext(),
      });

      console.log('=== Dev Context Entries ===\n');

      if (!result.results?.length) {
        console.log('No entries found.');
        break;
      }

      for (const item of result.results.slice(0, limit)) {
        let preview = '';
        if (typeof item.content === 'string') {
          preview = item.content.slice(0, 50);
        } else if (item.content) {
          preview = JSON.stringify(item.content).slice(0, 50);
        }
        console.log(`- [${item.type}] ${preview}${preview.length >= 50 ? '...' : ''}`);
      }

      if (result.results.length > limit) {
        console.log(`\n... and ${result.results.length - limit} more`);
      }
      break;
    }

    case 'get':
    case 'g': {
      const id = positional[0];
      if (!id) {
        console.error('Usage: ctx get <id>');
        process.exit(1);
      }

      const result = await contextQueryTools.queryContext.execute({
        context: {
          query: {
            conditions: [{ field: 'id', operator: '=' as const, value: id }],
          },
          storageConfig: STORAGE_CONFIG,
        },
        runtimeContext: createRuntimeContext(),
      });

      if (!result.results?.length) {
        console.error('Entry not found:', id);
        process.exit(1);
      }

      console.log(JSON.stringify(result.results[0], null, 2));
      break;
    }

    case 'delete':
    case 'd': {
      const id = positional[0];
      if (!id) {
        console.error('Usage: ctx delete <id>');
        process.exit(1);
      }

      const result = await contextStoreTools.deleteContext.execute({
        context: {
          id,
          storageConfig: STORAGE_CONFIG,
        },
        runtimeContext: createRuntimeContext(),
      });

      console.log(result.deleted ? 'Deleted' : 'Not found');
      break;
    }

    case 'bootstrap':
    case 'b': {
      // Load static project config
      const configPath = resolve(SCRIPT_DIR, 'bootstrap.json');
      let config: {
        project?: { name?: string; description?: string; purpose?: string };
        structure?: Record<string, string>;
        keyFiles?: string[];
        conventions?: string[];
      } = {};

      try {
        const configFile = await Bun.file(configPath).text();
        config = JSON.parse(configFile);
      } catch {
        console.error('Warning: bootstrap.json not found, using defaults');
      }

      // Current date
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Get all entries and filter in code (corticai query conditions don't work reliably)
      const allEntries = await contextQueryTools.queryContext.execute({
        context: { query: {}, storageConfig: STORAGE_CONFIG },
        runtimeContext: createRuntimeContext(),
      });

      const entries = allEntries.results || [];
      const decisions = entries.filter((e: { type: string }) => e.type === 'decision');
      const todos = entries.filter((e: { type: string }) => e.type === 'todo');
      const docs = entries.filter((e: { type: string }) => e.type === 'documentation');

      // Output session primer
      console.log('═'.repeat(60));
      console.log(`SESSION BOOTSTRAP - ${dateStr}`);
      console.log('═'.repeat(60));

      if (config.project) {
        console.log(`\n## Project: ${config.project.name || 'Unknown'}\n`);
        if (config.project.description) {
          console.log(config.project.description);
        }
        if (config.project.purpose) {
          console.log(`\nPurpose: ${config.project.purpose}`);
        }
      }

      if (config.structure && Object.keys(config.structure).length) {
        console.log('\n## Structure\n');
        for (const [path, desc] of Object.entries(config.structure)) {
          console.log(`  ${path.padEnd(20)} ${desc}`);
        }
      }

      if (config.keyFiles?.length) {
        console.log('\n## Key Files\n');
        for (const file of config.keyFiles) {
          console.log(`  - ${file}`);
        }
      }

      if (config.conventions?.length) {
        console.log('\n## Conventions\n');
        for (const conv of config.conventions) {
          console.log(`  - ${conv}`);
        }
      }

      // Dynamic context
      console.log('\n## Context Network Status\n');
      console.log(`  Total entries: ${entries.length}`);
      console.log(`  Decisions: ${decisions.length}`);
      console.log(`  Documentation: ${docs.length}`);
      console.log(`  Todos: ${todos.length}`);

      if (decisions.length) {
        console.log('\n## Recent Decisions\n');
        // Sort by timestamp descending and take last 5
        const sorted = [...decisions].sort((a, b) => {
          const ta = a.metadata?.timestamp || '';
          const tb = b.metadata?.timestamp || '';
          return tb.localeCompare(ta);
        });
        for (const dec of sorted.slice(0, 5)) {
          const content = typeof dec.content === 'string' ? dec.content : JSON.stringify(dec.content);
          console.log(`  - ${content.slice(0, 70)}${content.length > 70 ? '...' : ''}`);
        }
      }

      if (todos.length) {
        console.log('\n## Open Todos\n');
        for (const todo of todos.slice(0, 5)) {
          const content = typeof todo.content === 'string' ? todo.content : JSON.stringify(todo.content);
          console.log(`  - ${content.slice(0, 70)}${content.length > 70 ? '...' : ''}`);
        }
      }

      // Git status summary (if available)
      try {
        const gitProc = Bun.spawn(['git', 'log', '--oneline', '-5'], {
          cwd: PROJECT_ROOT,
          stdout: 'pipe',
          stderr: 'pipe',
        });
        const gitOutput = await new Response(gitProc.stdout).text();
        if (gitOutput.trim()) {
          console.log('\n## Recent Git Activity\n');
          for (const line of gitOutput.trim().split('\n')) {
            console.log(`  ${line}`);
          }
        }
      } catch {
        // Git not available or not a repo, skip
      }

      console.log('\n' + '═'.repeat(60));
      console.log('Run `bun ctx.ts query <topic>` to search context');
      console.log('Run `bun ctx.ts store dec "decision"` to record decisions');
      console.log('═'.repeat(60));
      break;
    }

    case 'help':
    case '-h':
    case '--help':
    default:
      console.log(`
Context CLI - Standalone development context network

Storage: ${STORAGE_CONFIG.json.filePath}

Commands:
  bootstrap, b                                 Session primer (start here!)
  store, s   <type> <content> [--tags t1,t2]  Store a context entry
  query, q   <search term>                     Search context
  insights, i                                  Show context metrics
  list, ls   [--limit N] [--type TYPE]         List entries
  get, g     <id>                              Get entry by ID
  delete, d  <id>                              Delete entry by ID
  help                                         Show this help

Types for store:
  decision (dec)     Architectural or design decisions
  documentation (doc) Documentation and notes
  discussion (disc)  Discussion points
  code               Code snippets or references
  todo               Task items
  pattern (pat)      Patterns and conventions
  relationship (rel) Relationships between concepts

Examples:
  bun ctx.ts store decision "Use JSON storage for persistence" --tags architecture
  bun ctx.ts store doc "ripgrep (rg) - fast regex search tool"
  bun ctx.ts query "how to handle storage"
  bun ctx.ts list --type decision
  bun ctx.ts insights
`);
      break;
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
