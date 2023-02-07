import { RuleTester } from 'eslint';
import rule, { RULE_NAME } from '../../src/rules/extract-tailwind-classes';

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

ruleTester.run(RULE_NAME, rule as any, {
  valid: [
    // {
    //   code: `
    //      import React from 'react';
    //
    //      const About: React.FC = () => {
    //        return (
    //          <div>
    //            <p id="text1" className="text-3xl text-green-500">About</p>
    //          </div>
    //        );
    //      };
    //
    //      export default About;
    //   `,
    // },
  ],
  invalid: [
    // Sorting Tests
    // {
    //   code: `<div className="w-12 lg:w-6 w-12">removeDuplicates: false</div>`,
    //   output: `<div className="w-12 w-12 lg:w-6">removeDuplicates: false</div>`,
    //   errors: [{ messageId: 'invalidOrder' }],
    // },

    // Outsourcing Tests
    {
      code: `
          import React from 'react';
  
          const About: React.FC = () => {
            return (
              <div className="first:flex animate-spin custom container extract-[Container]">
                <p id="text1" className="sm:py-5 p-4 sm:px-7 lg:p-8 extract-[Text1]">About</p>
                <p id="text2" className="lg:box-border box-content">Me</p>
              </div>
            );
          };
  
          export default About;
       `,
      output: `
          import React from 'react';
  
          const About: React.FC = () => {
            return (
              <div className={Container}>
                <p id="text1" className={Text1}>About</p>
                <p id="text2" className="box-content lg:box-border">Me</p>
              </div>
            );
          };
  
          export default About;

          const Container = \`
            custom
            container
            animate-spin
            first:flex
          \`;

          const Text1 = \`
            p-4
            sm:py-5
            sm:px-7
            lg:p-8
          \`;
       `,
      errors: [
        { messageId: 'invalidInline' },
        { messageId: 'invalidInline' },
        // { messageId: 'invalidInline' },
        { messageId: 'invalidOrder' },
      ],
    },
  ],
});
