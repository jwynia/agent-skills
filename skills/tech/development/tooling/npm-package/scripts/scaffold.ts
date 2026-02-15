#!/usr/bin/env bun

/**
 * npm-package scaffold script
 *
 * Usage: bun run <skill-path>/scripts/scaffold.ts <project-dir> [options]
 *
 * Options:
 *   --name <name>          Package name (defaults to directory name)
 *   --description <desc>   Package description
 *   --author <author>      Author name
 *   --license <license>    License (default: MIT)
 *   --dual                 Generate dual CJS/ESM output (default: ESM-only)
 *   --no-eslint            Skip ESLint setup (Biome only)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, chmodSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function getFlag(name: string): boolean {
	const idx = args.indexOf(`--${name}`);
	if (idx !== -1) {
		args.splice(idx, 1);
		return true;
	}
	return false;
}

function getOption(name: string, fallback: string): string {
	const idx = args.indexOf(`--${name}`);
	if (idx !== -1 && idx + 1 < args.length) {
		const val = args[idx + 1]!;
		args.splice(idx, 2);
		return val;
	}
	return fallback;
}

const projectDir = resolve(args[0] ?? '.');
const dirName = basename(projectDir);

const packageName = getOption('name', dirName);
const description = getOption('description', '');
const author = getOption('author', '');
const license = getOption('license', 'MIT');
const dual = getFlag('dual');
const noEslint = getFlag('no-eslint');

// ---------------------------------------------------------------------------
// Handlebars-lite template engine (just {{variable}} replacement)
// ---------------------------------------------------------------------------

interface TemplateContext {
	packageName: string;
	description: string;
	author: string;
	license: string;
	[key: string]: string;
}

function render(template: string, ctx: TemplateContext): string {
	return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => ctx[key] ?? '');
}

// ---------------------------------------------------------------------------
// Resolve paths
// ---------------------------------------------------------------------------

const scriptDir = dirname(new URL(import.meta.url).pathname);
const skillRoot = resolve(scriptDir, '..');
const templatesDir = join(skillRoot, 'templates');

const ctx: TemplateContext = { packageName, description, author, license };

// ---------------------------------------------------------------------------
// Create project directory
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
}

function writeTemplate(templatePath: string, outputPath: string): void {
	const raw = readFileSync(templatePath, 'utf-8');
	const content = templatePath.endsWith('.hbs') ? render(raw, ctx) : raw;
	ensureDir(dirname(outputPath));
	writeFileSync(outputPath, content, 'utf-8');
}

function copyFile(src: string, dest: string): void {
	ensureDir(dirname(dest));
	copyFileSync(src, dest);
}

console.log(`\nScaffolding npm package: ${packageName}`);
console.log(`Directory: ${projectDir}\n`);

ensureDir(projectDir);
ensureDir(join(projectDir, 'src'));

// ---------------------------------------------------------------------------
// Static templates (no Handlebars)
// ---------------------------------------------------------------------------

copyFile(join(templatesDir, 'tsconfig.json'), join(projectDir, 'tsconfig.json'));
copyFile(join(templatesDir, 'biome.json'), join(projectDir, 'biome.json'));
copyFile(join(templatesDir, 'vitest.config.ts'), join(projectDir, 'vitest.config.ts'));
copyFile(join(templatesDir, 'gitignore'), join(projectDir, '.gitignore'));

if (!noEslint) {
	copyFile(join(templatesDir, 'eslint.config.ts'), join(projectDir, 'eslint.config.ts'));
}

// ---------------------------------------------------------------------------
// Handlebars templates
// ---------------------------------------------------------------------------

writeTemplate(join(templatesDir, 'src', 'index.ts.hbs'), join(projectDir, 'src', 'index.ts'));
writeTemplate(join(templatesDir, 'src', 'index.test.ts.hbs'), join(projectDir, 'src', 'index.test.ts'));

// ---------------------------------------------------------------------------
// package.json — needs conditional modification for dual output
// ---------------------------------------------------------------------------

const pkgRaw = readFileSync(join(templatesDir, 'package.json.hbs'), 'utf-8');
let pkgContent = render(pkgRaw, ctx);
let pkg = JSON.parse(pkgContent) as Record<string, unknown>;

if (dual) {
	pkg['exports'] = {
		'.': {
			'module-sync': { types: './dist/index.d.ts', default: './dist/index.js' },
			import: { types: './dist/index.d.ts', default: './dist/index.js' },
			require: { types: './dist/index.d.cts', default: './dist/index.cjs' },
		},
		'./package.json': './package.json',
	};
}

if (noEslint) {
	const scripts = pkg['scripts'] as Record<string, string>;
	scripts['lint'] = 'biome check .';
	scripts['lint:fix'] = 'biome check --write .';
}

writeFileSync(join(projectDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf-8');

// ---------------------------------------------------------------------------
// bunup.config.ts — conditional for dual
// ---------------------------------------------------------------------------

const bunupConfig = dual
	? `import { defineConfig } from 'bunup';

export default defineConfig({
\tentry: ['src/index.ts'],
\tformat: ['esm', 'cjs'],
\tdts: true,
\tclean: true,
});
`
	: readFileSync(join(templatesDir, 'bunup.config.ts'), 'utf-8');

writeFileSync(join(projectDir, 'bunup.config.ts'), bunupConfig, 'utf-8');

// ---------------------------------------------------------------------------
// .changeset/config.json
// ---------------------------------------------------------------------------

ensureDir(join(projectDir, '.changeset'));
writeFileSync(
	join(projectDir, '.changeset', 'config.json'),
	JSON.stringify(
		{
			$schema: 'https://unpkg.com/@changesets/config@3.1.1/schema.json',
			changelog: '@changesets/cli/changelog',
			commit: false,
			fixed: [],
			linked: [],
			access: 'public',
			baseBranch: 'main',
			updateInternalDependencies: 'patch',
			ignore: [],
		},
		null,
		2,
	) + '\n',
	'utf-8',
);

// ---------------------------------------------------------------------------
// README.md
// ---------------------------------------------------------------------------

const readme = `# ${packageName}

${description}

## Installation

\`\`\`bash
npm install ${packageName}
\`\`\`

## Usage

\`\`\`typescript
import { hello } from '${packageName}';

console.log(hello('World'));
\`\`\`

## Development

\`\`\`bash
bun install
bun run test
bun run build
\`\`\`

## License

${license}
`;

writeFileSync(join(projectDir, 'README.md'), readme, 'utf-8');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('Created files:');
console.log('  package.json');
console.log('  tsconfig.json');
console.log('  bunup.config.ts');
console.log('  biome.json');
if (!noEslint) console.log('  eslint.config.ts');
console.log('  vitest.config.ts');
console.log('  .gitignore');
console.log('  .changeset/config.json');
console.log('  README.md');
console.log('  src/index.ts');
console.log('  src/index.test.ts');
console.log('');
console.log('Next steps:');
console.log(`  cd ${projectDir}`);
console.log('  bun install');
console.log('  bun add -d bunup typescript vitest @vitest/coverage-v8 @biomejs/biome @changesets/cli');
if (!noEslint) console.log('  bun add -d eslint typescript-eslint');
console.log('  bun run test');
console.log('  bun run build');
