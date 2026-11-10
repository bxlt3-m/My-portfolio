import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.browser, gsap: 'readonly', ScrollTrigger: 'readonly' }
    },
    rules: {
      'no-unused-vars': ['error', { args: 'none' }],
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-var': 'error'
    }
  }
];
