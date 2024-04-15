module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  plugins: ['sort-imports-es6-autofix'],
  rules: {
    'sort-imports-es6-autofix/sort-imports-es6': [
      2,
      {
        ignoreCase: false,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
      },
    ],
  },
  ignorePatterns: ['node_modules/', '.eslintrc.cjs'],
};
