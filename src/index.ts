//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import requireIndex from 'requireindex';

// Get absolute path of the 'rules' directory
const rulesObject = requireIndex(__dirname + '/rules');

// Add default exports of each file (ESLint Rule) to the rules object
const rules: Record<string, any> = {};
Object.keys(rulesObject).forEach(
  (ruleName) => (rules[ruleName] = rulesObject[ruleName].default)
);

const config = {
  recommended: {
    plugins: ['tailwindcss-jsx'],
  },
};

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

export {
  rules,
  // config,
};
