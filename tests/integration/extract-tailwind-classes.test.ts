import { RuleTester } from 'eslint';
import rule, {
  RULE_NAME,
  TOptions,
} from '../../src/rules/extract-tailwind-classes';
import { createGenerateErrors } from '../utils';

const dummyText = 'dummyText';
const testClassName = 'sm:p-0 p-0 container';
const testClassNameSorted = 'container p-0 sm:p-0';

const generateInvalidOrderErrors = createGenerateErrors('invalidOrder');
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
  // It should sort class names at class
  {
    code: `<div class="${testClassName}">${dummyText}</div>`,
    output: `<div class="${testClassNameSorted}">${dummyText}</div>`,
    errors: [...generateInvalidOrderErrors(1)],
  },
  {
    code: `<div class={"${testClassName}"}>${dummyText}</div>`,
    output: `<div class={"${testClassNameSorted}"}>${dummyText}</div>`,
    errors: [...generateInvalidOrderErrors(1)],
  },

  // It should sort class names at className
  {
    code: `<div className="${testClassName}">${dummyText}</div>`,
    output: `<div className="${testClassNameSorted}">${dummyText}</div>`,
    errors: [...generateInvalidOrderErrors(1)],
  },
  {
    code: `<div className={"${testClassName}"}>${dummyText}</div>`,
    output: `<div className={"${testClassNameSorted}"}>${dummyText}</div>`,
    errors: [...generateInvalidOrderErrors(1)],
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
    errors: [...generateInvalidOrderErrors(1)],
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
    errors: [...generateInvalidOrderErrors(1)],
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
    errors: [...generateInvalidOrderErrors(2)],
  },

  // It should outsource class names if extract identifier present
  {
    code: `
         import React from 'react';
         const About: React.FC = () => {
           return (
             <div className="${testClassName}">
               <p id="text1" className="text-xl p-4 lg:p-8 font-bold extract-[Text1]">About</p>
             </div>
           );
         };
         export default About;
      `,
    output: `
         import React from 'react';
         const About: React.FC = () => {
           return (
             <div className="${testClassNameSorted}">
               <p id="text1" className={Text1}>About</p>
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
    errors: [
      ...generateInvalidOrderErrors(1),
      ...generateInvalidInlineErrors(1),
    ],
  },

  // It should sort class names nested in a function
  {
    code: `
        const buttonClasses = ctl(\`
          \${fullWidth ? "${testClassName}" : "${testClassName}"}
          flex
          container
          \${fullWidth ? "${testClassName}" : "${testClassName}"}
          lg:py-4
          sm:py-6
          \${hasError && "${testClassName}"}
        \`);`,
    output: `
        const buttonClasses = ctl(\`
          \${fullWidth ? "${testClassNameSorted}" : "${testClassNameSorted}"}
          container
          flex
          \${fullWidth ? "${testClassNameSorted}" : "${testClassNameSorted}"}
          sm:py-6
          lg:py-4
          \${hasError && "${testClassNameSorted}"}
        \`);`,
    errors: [...generateInvalidOrderErrors(7)],
  },
  {
    code: `ctl(\`${testClassName} \${"some other stuff"}\`)`,
    output: `ctl(\`${testClassNameSorted} \${"some other stuff"}\`)`,
    errors: [...generateInvalidOrderErrors(1)],
  },
  {
    code: `
      const buttonClasses = jeff\`
          \${fullWidth ? "${testClassName}" : "${testClassName}"}
          flex
          container
          \${fullWidth ? "${testClassName}" : "${testClassName}"}
          lg:py-4
          sm:py-6
          \${hasError && "${testClassName}"}
      \`;`,
    output: `
      const buttonClasses = jeff\`
          \${fullWidth ? "${testClassNameSorted}" : "${testClassNameSorted}"}
          container
          flex
          \${fullWidth ? "${testClassNameSorted}" : "${testClassNameSorted}"}
          sm:py-6
          lg:py-4
          \${hasError && "${testClassNameSorted}"}
      \`;`,
    options: [
      {
        tags: ['jeff'],
      },
    ],
    errors: [...generateInvalidOrderErrors(7)],
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
