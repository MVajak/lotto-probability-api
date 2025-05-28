module.exports = {
  plugins: ['simple-import-sort'],
  extends: [
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // Use this instead of `import/order`
    'simple-import-sort/imports': [
      'warn',
      {
        // Customize grouping if needed
        groups: [
          // Side effect imports (e.g., polyfills)
          ['^\\u0000'],

          // Node.js built-ins
          ['^node:'],

          // Packages from npm (external)
          ['^@?\\w'],

          // Internal alias paths (e.g., @models, @utils)
          ['^@'],

          // Relative imports: shorter paths first
          ['^\\.\\.(?!/?$)', '^\\.\\./?$'], // up a directory
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'], // same directory
        ],
      },
    ],
    // Optional: disable import/order to avoid conflicts
    'import/order': 'off',
  },
  settings: {
    'import/resolver': {
      typescript: {}, // support TS paths
    },
  },
};
