import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: false,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
			thresholds: {
				branches: 80,
				functions: 80,
				lines: 80,
				statements: 80,
			},
		},
		include: ['src/**/*.test.ts'],
		typecheck: {
			enabled: true,
		},
	},
});
