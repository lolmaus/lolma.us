module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module'
  },
  env: {
    browser: true
  },
  extends: [
    "eslint:recommended",
    "standard"
  ],
  "rules": {
    "comma-dangle": "off",
    "spaced-comment": "off",
    "no-multiple-empty-lines": "off",
    "generator-star-spacing": "off",
    "no-sequences": "off",
    "key-spacing": "off",
    "no-multi-spaces": "off",
    "func-call-spacing": "off",
    "no-console": "off",
    "quotes": "off",
    "camelcase": "off",
    "padded-blocks": "off",
    "operator-linebreak": "off",
    "no-return-assign": "off",
    "new-cap": "off",
    "arrow-parens": "off",
    "no-template-curly-in-string": "off",
    "no-whitespace-before-property": "off",
  },

  "globals": {
    // "d3": false,
    // "dc": false,
    // "crossfilter": false
  }
};
