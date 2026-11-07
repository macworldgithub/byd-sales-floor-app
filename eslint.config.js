const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
module.exports = defineConfig([expo, { ignores: ['ios/**', 'android/**', '.expo/**', 'node_modules/**'] }, {
  // Preserve visibility of pre-existing compiler/style findings in the legacy
  // screens while enforcing the full Expo rules on the new routed application.
  files: ['src/components/*.tsx', 'src/screens/*.tsx'],
  rules: { 'react-hooks/set-state-in-effect': 'warn', 'react-hooks/refs': 'warn', 'react/no-unescaped-entities': 'warn' },
}]);
