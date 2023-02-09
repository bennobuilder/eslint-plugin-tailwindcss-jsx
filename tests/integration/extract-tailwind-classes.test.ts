import { RuleTester } from 'eslint';
import rule, {
  RULE_NAME,
  TOptions,
} from '../../src/rules/extract-tailwind-classes';

const dummyText = '${dummyText}';
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
  // It should sort class names at class
  {
    code: `<div class="sm:w-6 container w-12">${dummyText}</div>`,
    output: `<div class="container w-12 sm:w-6">${dummyText}</div>`,
    errors: [{ messageId: 'invalidOrder' }],
  },
  {
    code: `<div class={"sm:py-5 p-4 sm:px-7 lg:p-8"}>${dummyText}</div>`,
    output: `<div class={"p-4 sm:py-5 sm:px-7 lg:p-8"}>${dummyText}</div>`,
    errors: [{ messageId: 'invalidOrder' }],
  },
  {
    code: `<div class="grid grid-cols-1 sm:grid-cols-2 sm:px-8 sm:py-12 sm:gap-x-8 md:py-16">${dummyText}</div>`,
    output: `<div class="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-8 sm:px-8 sm:py-12 md:py-16">${dummyText}</div>`,
    errors: [{ messageId: 'invalidOrder' }],
  },

  // It should sort class names at specified class name identifier
  {
    code: `<div tw="sm:py-5 p-4 sm:px-7 lg:p-8">${dummyText}</div>`,
    output: `<div tw="p-4 sm:py-5 sm:px-7 lg:p-8">${dummyText}</div>`,
    options: [
      {
        classNameRegex: /\b(tw)\b/g,
      },
    ] as TOptions,
    errors: [{ messageId: 'invalidOrder' }],
  },

  // It should sort class names at className
  {
    code: `<div className="w-12 lg:w-6 w-12">${dummyText}</div>`,
    output: `<div className="w-12 w-12 lg:w-6">${dummyText}</div>`,
    errors: [{ messageId: 'invalidOrder' }],
  },
  {
    code: `<div className={"w-12 lg:w-6 w-12"}>${dummyText}</div>`,
    output: `<div className={"w-12 w-12 lg:w-6"}>${dummyText}</div>`,
    errors: [{ messageId: 'invalidOrder' }],
  },

  // It should sort class names and shouldn't overwrite spacing
  {
    code: `
      <div
        className="
          fixed
          right-0
          top-0
          bottom-0
          left-0
          transition-all
          transform
        "
      >
        ${dummyText}
      </div>
      `,
    output: `
      <div
        className="
          fixed
          right-0
          top-0
          bottom-0
          left-0
          transform
          transition-all
        "
      >
        ${dummyText}
      </div>
      `,
    errors: [{ messageId: 'invalidOrder' }],
  },
];

ruleTester.run(RULE_NAME, rule as any, {
  valid: [
    // TODO
  ],
  invalid: [
    // ...invalidTestCases,
    // WIP
    {
      code: `
      <div
        className={\`
          w-full h-10 rounded
          \${name === "white"
            ? "ring-black flex"
            : undefined}
        \`}
      />
      `,
      output: `
      <div
        className={\`
          h-10 w-full rounded
          \${name === "white"
            ? "flex ring-black"
            : undefined}
        \`}
      />
      `,
      errors: [{ messageId: 'invalidOrder' }, { messageId: 'invalidOrder' }],
    },
    // {
    //   code: `
    //    const buttonClasses = ctl(\`
    //      \${fullWidth ? "w-12" : "w-6"}
    //      flex
    //      container
    //      \${fullWidth ? "sm:w-7" : "sm:w-4"}
    //      lg:py-4
    //      sm:py-6
    //      \${hasError && "bg-red"}
    //    \`);`,
    //   output: `
    //    const buttonClasses = ctl(\`
    //      \${fullWidth ? "w-12" : "w-6"}
    //      container
    //      flex
    //      \${fullWidth ? "sm:w-7" : "sm:w-4"}
    //      sm:py-6
    //      lg:py-4
    //      \${hasError && "bg-red"}
    //    \`);`,
    //   errors: [{ messageId: 'invalidOrder' }],
    // },
    // Wrapper function
    // {
    //   code: 'ctl(`p-10 w-full ${some}`)',
    //   output: 'ctl(`w-full p-10 ${some}`)',
    //   errors: [{ messageId: 'invalidOrder' }],
    // },
    // Outsourcing Tests
    // {
    //   code: `
    //       import React from 'react';
    //       const About: React.FC = () => {
    //         return (
    //           <div className="first:flex animate-spin custom container extract-[Container]">
    //             <p id="text1" className="sm:py-5 p-4 sm:px-7 lg:p-8 extract-[Text1]">About</p>
    //             <p id="text2" className="lg:box-border box-content">Me</p>
    //           </div>
    //         );
    //       };
    //       export default About;
    //    `,
    //   output: `
    //       import React from 'react';
    //       const About: React.FC = () => {
    //         return (
    //           <div className={Container}>
    //             <p id="text1" className={Text1}>About</p>
    //             <p id="text2" className="box-content lg:box-border">Me</p>
    //           </div>
    //         );
    //       };
    //       export default About;
    //       const Container = \`
    //         custom
    //         container
    //         animate-spin
    //         first:flex
    //       \`;
    //       const Text1 = \`
    //         p-4
    //         sm:py-5
    //         sm:px-7
    //         lg:p-8
    //       \`;
    //    `,
    //   errors: [
    //     { messageId: 'invalidInline' },
    //     { messageId: 'invalidInline' },
    //     // { messageId: 'invalidInline' },
    //     { messageId: 'invalidOrder' },
    //   ],
    // },
  ],
});
