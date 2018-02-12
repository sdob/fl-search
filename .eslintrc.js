module.exports = {
  extends: ['last', 'eslint:recommended', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'no-use-before-define': ['error', { 'functions': false, 'classes': true }],
    'prettier/prettier': [
      'error',
      { singleQuote: true, trailingComma: 'all' },
    ],
    eqeqeq: ['error', 'always'],
  },
  'env': {
    'browser': true,
    'webextensions': true,
  },
};
