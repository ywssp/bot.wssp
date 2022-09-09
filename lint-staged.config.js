module.exports = {
  '**/*.(ts|tsx)': () => 'tsc --noEmit',

  '**/*.(ts|tsx|js)': (filenames) => [
    `eslint --fix ${filenames.map((filename) => `"${filename}"`).join(' ')}`,
    `prettier --write ${filenames.map((filename) => `"${filename}"`).join(' ')}`
  ]
};
