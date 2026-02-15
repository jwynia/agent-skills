import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['dist/', 'node_modules/', '*.config.*'],
	},
	{
		files: ['src/**/*.ts'],
		extends: [tseslint.configs.strictTypeChecked],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			// Disabled — Biome covers these
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/consistent-type-imports': 'off',

			// Type-aware rules — Biome cannot do these
			'@typescript-eslint/no-misused-promises': 'error',
			'@typescript-eslint/await-thenable': 'error',
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-unsafe-assignment': 'error',
			'@typescript-eslint/no-unsafe-return': 'error',
			'@typescript-eslint/no-unsafe-call': 'error',
			'@typescript-eslint/no-unsafe-member-access': 'error',
			'@typescript-eslint/no-unsafe-argument': 'error',
			'@typescript-eslint/no-unnecessary-condition': 'error',
			'@typescript-eslint/strict-boolean-expressions': 'warn',
			'@typescript-eslint/prefer-readonly': 'error',
			'@typescript-eslint/require-await': 'error',
			'@typescript-eslint/return-await': ['error', 'always'],
		},
	},
);
