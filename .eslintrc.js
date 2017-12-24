module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module'
  },
  plugins: ['ember'],
  extends: [
    "eslint:recommended",
    'plugin:ember/recommended',
    "standard"
  ],
  env: {
    browser: true
  },
  "rules": {
    "arrow-parens": "off",
    "camelcase": "off",
    "comma-dangle": ["error", "always-multiline"],
    "ember/no-global-jquery": "off",
    "ember/no-on-calls-in-components": "off",
    "func-call-spacing": "off",
    "generator-star-spacing": "off",
    "key-spacing": ["error", { beforeColon: true, afterColon: true, align: "colon" }],
    "new-cap": "off",
    "no-console": "off",
    "no-mixed-operators": "off",
    "no-multi-spaces": "off",
    "no-multiple-empty-lines": "off",
    "no-return-assign": "off",
    "no-sequences": "off",
    "no-template-curly-in-string": "off",
    "no-whitespace-before-property": "off",
    "object-curly-spacing": ["error", "never"],
    "operator-linebreak": "off",
    "padded-blocks": "off",
    "quote-props": ["error", "as-needed"],
    "quotes": ["error", "single", {avoidEscape: true}],
    "spaced-comment": "off",
    "standard/object-curly-even-spacing": "off",
    "standard/no-callback-literal": "off",
  },

  "globals": {
    "showdown": false,
    // "d3": false,
    // "dc": false,
    // "crossfilter": false
  },
  overrides: [
    // node files
    {
      files: [
        'index.js',
        'testem.js',
        'ember-cli-build.js',
        'config/**/*.js',
        'tests/dummy/config/**/*.js'
      ],
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2015
      },
      env: {
        browser: false,
        node: true
      }
    },

    // test files
    {
      files: ['tests/**/*.js'],
      excludedFiles: ['tests/dummy/**/*.js'],
      env: {
        embertest: true
      }
    }
  ]
}
