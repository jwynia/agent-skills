import { defineConfig } from 'bunup';

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		cli: 'src/cli.ts',
	},
	format: ['esm'],
	dts: {
		entry: ['src/index.ts'],
	},
	clean: true,
	// NOTE: Shebang is added to dist/cli.js via the build script's post-build step
	// rather than using `banner`, which would add it to ALL output files including index.js.
});
