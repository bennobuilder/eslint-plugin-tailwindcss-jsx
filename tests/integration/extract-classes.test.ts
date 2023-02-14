import { RuleTester } from 'eslint';
import rule, { RULE_NAME, TOptions } from '../../src/rules/extract-classes';
import { createGenerateErrors } from '../utils';

const dummyText = 'dummyText';
const testClassName = 'sm:p-0 p-0 container';
const testClassNameSorted = 'container p-0 sm:p-0';

const generateInvalidInlineErrors = createGenerateErrors('invalidInline');

const ruleTester: RuleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
});

// Invalid Test Cases
const invalidTestCases: RuleTester.InvalidTestCase[] = [
  // It should outsource class names if extract identifier present and sort by default
  {
    code: `
         import React from 'react';

         const About: React.FC = () => {
           return (
             <div className="${testClassName}">
               <p id="text1" className="text-xl p-4 lg:p-8 font-bold extract-[Text1]">${dummyText}</p>
             </div>
           );
         };
         export default About;
      `,
    output: `
         import React from 'react';

         const About: React.FC = () => {
           return (
             <div className="${
               testClassName // Same as before as no extraction happened
             }">
               <p id="text1" className={Text1}>${dummyText}</p>
             </div>
           );
         };
         export default About;

         const Text1 = \`
           p-4
           text-xl
           font-bold
           lg:p-8
         \`;
      `,
    errors: [...generateInvalidInlineErrors(1)],
  },

  // It should outsource class names if extract identifier present and shouldn't sort if specified
  {
    code: `
         import React from 'react';

         const About: React.FC = () => {
           return (
             <div className="${testClassName}">
               <p id="text1" className="text-xl p-4 lg:p-8 font-bold extract-[Text1]">${dummyText}</p>
             </div>
           );
         };
         export default About;
      `,
    output: `
         import React from 'react';

         const About: React.FC = () => {
           return (
             <div className="${testClassName}">
               <p id="text1" className={Text1}>${dummyText}</p>
             </div>
           );
         };
         export default About;

         const Text1 = \`
           text-xl
           p-4
           lg:p-8
           font-bold
         \`;
      `,
    options: [
      {
        sort: false,
      },
    ] as TOptions,
    errors: [...generateInvalidInlineErrors(1)],
  },
];

ruleTester.run(RULE_NAME, rule as any, {
  valid: [
    // TODO
  ],
  invalid: [
    ...invalidTestCases,

    // WIP
  ],
});
