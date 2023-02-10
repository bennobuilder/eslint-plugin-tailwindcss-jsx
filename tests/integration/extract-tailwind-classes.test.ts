import { RuleTester } from 'eslint';
import rule, {
  RULE_NAME,
  TOptions,
} from '../../src/rules/extract-tailwind-classes';

const dummyText = 'dummyText';
const testClassName = 'sm:p-0 p-0 container';
const testClassNameSorted = 'container p-0 sm:p-0';

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
    code: `<div class="${testClassName}">${dummyText}</div>`,
    output: `<div class="${testClassNameSorted}">${dummyText}</div>`,
    errors: [{ messageId: 'invalidOrder' }],
  },
  {
    code: `<div class={"${testClassName}"}>${dummyText}</div>`,
    output: `<div class={"${testClassNameSorted}"}>${dummyText}</div>`,
    errors: [{ messageId: 'invalidOrder' }],
  },

  // It should sort class names at className
  {
    code: `<div className="${testClassName}">${dummyText}</div>`,
    output: `<div className="${testClassNameSorted}">${dummyText}</div>`,
    errors: [{ messageId: 'invalidOrder' }],
  },
  {
    code: `<div className={"${testClassName}"}>${dummyText}</div>`,
    output: `<div className={"${testClassNameSorted}"}>${dummyText}</div>`,
    errors: [{ messageId: 'invalidOrder' }],
  },

  // It should sort class names at specified class name identifier
  {
    code: `<div jeff="${testClassName}">${dummyText}</div>`,
    output: `<div jeff="${testClassNameSorted}">${dummyText}</div>`,
    options: [
      {
        classNameRegex: /\b(jeff)\b/g,
      },
    ] as TOptions,
    errors: [{ messageId: 'invalidOrder' }],
  },

  // It should sort class names in TemplateLiteral
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

  // It should sort conditional & nested class names in TemplateLiteral
  {
    code: `
      <div
        className={\`
          w-full
          h-8
          rounded
          container
          \${name === "white"
            ? "${testClassName}"
            : undefined}
        \`}
      />
      `,
    output: `
      <div
        className={\`
          container
          h-8
          w-full
          rounded
          \${name === "white"
            ? "${testClassNameSorted}"
            : undefined}
        \`}
      />
      `,
    errors: [{ messageId: 'invalidOrder' }, { messageId: 'invalidOrder' }],
  },

  // It should outsource class names if extract identifier present
  {
    code: `
         import React from 'react';
         const About: React.FC = () => {
           return (
             <div>
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
             <div>
               <p id="text1" className={Text1}>About</p>
               <p id="text2" className="lg:box-border box-content">Me</p>
             </div>
           );
         };
         export default About;

         const Text1 = \`
           p-4
           sm:py-5
           sm:px-7
           lg:p-8
         \`;
      `,
    errors: [{ messageId: 'invalidInline' }, { messageId: 'invalidOrder' }],
  },
];

ruleTester.run(RULE_NAME, rule as any, {
  valid: [
    // TODO
  ],
  invalid: [
    ...invalidTestCases,

    // WIP
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
  ],
});
