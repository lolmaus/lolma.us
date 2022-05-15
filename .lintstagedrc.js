module.exports = {
  '*.{js,ts}': 'eslint --cache --fix',
  '*.ts?(x)': () => "tsc -p tsconfig.json --noEmit'",
  '*.hbs': 'ember-template-lint',
};
