#!/usr/bin/env bun

/**
 * npx-cli scaffold script
 *
 * Usage: bun run <skill-path>/scripts/scaffold.ts <project-dir> [options]
 *
 * Options:
 *   --name <n>            Package name (defaults to directory name)
 *   --bin <name>          Binary name for npx (defaults to package name without scope)
 *   --description <desc>  Package description
 *   --author <author>     Author name
 *   --license <license>   License (default: MIT)
 *   --cli-only            No library exports, CLI binary only
 *   --no-eslint           Skip ESLint setup (Biome only)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
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
// Strip scope from package name for binary name: @scope/my-cli -> my-cli
const defaultBin = packageName.startsWith('@') ? packageName.split('/')[1] ?? dirName : packageName;
const binName = getOption('bin', defaultBin);
const description = getOption('description', '');
const author = getOption('author', '');
const license = getOption('license', 'MIT');
const cliOnly = getFlag('cli-only');
const noEslint = getFlag('no-eslint');

// ---------------------------------------------------------------------------
// Handlebars-lite template engine
// ---------------------------------------------------------------------------

interface TemplateContext {
	packageName: string;
	binName: string;
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

const ctx: TemplateContext = { packageName, binName, description, author, license };

// ---------------------------------------------------------------------------
// File helpers
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

console.log(`\nScaffolding npx CLI package: ${packageName}`);
console.log(`Binary name: ${binName}`);
console.log(`Directory: ${projectDir}\n`);

ensureDir(projectDir);
ensureDir(join(projectDir, 'src'));

// ---------------------------------------------------------------------------
// Static templates
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

writeTemplate(join(templatesDir, 'src', 'cli.ts.hbs'), join(projectDir, 'src', 'cli.ts'));
writeTemplate(join(templatesDir, 'src', 'cli.test.ts.hbs'), join(projectDir, 'src', 'cli.test.ts'));

if (!cliOnly) {
	writeTemplate(join(templatesDir, 'src', 'index.ts.hbs'), join(projectDir, 'src', 'index.ts'));
	writeTemplate(join(templatesDir, 'src', 'index.test.ts.hbs'), join(projectDir, 'src', 'index.test.ts'));
	// Post-build script to add shebang only to cli.js (not index.js)
	copyFile(join(templatesDir, 'scripts', 'postbuild.ts'), join(projectDir, 'scripts', 'postbuild.ts'));
}

// ---------------------------------------------------------------------------
// package.json
// ---------------------------------------------------------------------------

const pkgRaw = readFileSync(join(templatesDir, 'package.json.hbs'), 'utf-8');
let pkgContent = render(pkgRaw, ctx);
let pkg = JSON.parse(pkgContent) as Record<string, unknown>;

if (cliOnly) {
	// Remove library exports, keep only bin
	delete pkg['exports'];
	// CLI-only uses banner for shebang, so simpler build script
	const scripts = pkg['scripts'] as Record<string, string>;
	scripts['build'] = 'bunup && chmod +x dist/cli.js';
}

if (noEslint) {
	const scripts = pkg['scripts'] as Record<string, string>;
	scripts['lint'] = 'biome check .';
	scripts['lint:fix'] = 'biome check --write .';
}

writeFileSync(join(projectDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf-8');

// ---------------------------------------------------------------------------
// bunup.config.ts
// ---------------------------------------------------------------------------

let bunupConfig: string;

if (cliOnly) {
	bunupConfig = `import { defineConfig } from 'bunup';

export default defineConfig({
\tentry: ['src/cli.ts'],
\tformat: ['esm'],
\tdts: false,
\tclean: true,
\tbanner: {
\t\tjs: '#!/usr/bin/env node',
\t},
});
`;
} else {
	bunupConfig = readFileSync(join(templatesDir, 'bunup.config.ts'), 'utf-8');
}

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

const cliUsage = cliOnly
	? `## Usage

\`\`\`bash
npx ${packageName} <input>
\`\`\`

Or install globally:

\`\`\`bash
npm install -g ${packageName}
${binName} <input>
\`\`\``
	: `## CLI Usage

\`\`\`bash
npx ${packageName} <input>
\`\`\`

## Programmatic Usage

\`\`\`typescript
import { process } from '${packageName}';

console.log(process('hello'));
\`\`\``;

const readme = `# ${packageName}

${description}

## Installation

\`\`\`bash
npm install ${cliOnly ? '-g ' : ''}${packageName}
\`\`\`

${cliUsage}

## Development

\`\`\`bash
bun install
bun run build
bun run test
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
console.log('  src/cli.ts');
console.log('  src/cli.test.ts');
if (!cliOnly) {
	console.log('  src/index.ts');
	console.log('  src/index.test.ts');
	console.log('  scripts/postbuild.ts');
}
console.log('');
console.log('Next steps:');
console.log(`  cd ${projectDir}`);
console.log('  bun install');
console.log('  bun add -d bunup typescript vitest @vitest/coverage-v8 @biomejs/biome @changesets/cli');
console.log('  bun add citty picocolors');
if (!noEslint) console.log('  bun add -d eslint typescript-eslint');
console.log('  bun run build');
console.log('  bun run test');
