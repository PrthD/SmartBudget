import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['build', 'node_modules', 'coverage'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always'],
      // Apostrophes in JSX text are fine; only flag characters that break markup.
      'react/no-unescaped-entities': ['error', { forbid: ['>', '}'] }],
    },
  },
  {
    // Generated shadcn/ui primitives: keep them as upstream ships them.
    files: ['src/components/ui/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react/no-unknown-property': 'off',
      'no-unused-vars': 'off',
      eqeqeq: 'off',
      'react-hooks/purity': 'off',
    },
  },
  {
    files: ['**/*.test.{js,jsx}', 'src/test/**', 'vite.config.js'],
    languageOptions: { globals: { ...globals.node, ...globals.vitest } },
  },
  prettier,
];
