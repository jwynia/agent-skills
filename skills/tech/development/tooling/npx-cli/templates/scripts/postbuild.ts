#!/usr/bin/env bun

/**
 * Post-build script: adds shebang to CLI binary and makes it executable.
 *
 * Bunup's `banner` option applies to ALL output files. Since this package
 * has both a library entry (index.js) and a CLI entry (cli.js), we add
 * the shebang only to cli.js after the build.
 */

import { readFileSync, writeFileSync, chmodSync } from 'node:fs';

const CLI_PATH = 'dist/cli.js';
const SHEBANG = '#!/usr/bin/env node\n';

const content = readFileSync(CLI_PATH, 'utf-8');

if (!content.startsWith('#!')) {
	writeFileSync(CLI_PATH, SHEBANG + content, 'utf-8');
}

chmodSync(CLI_PATH, 0o755);

console.log('✓ Added shebang and set executable: dist/cli.js');
