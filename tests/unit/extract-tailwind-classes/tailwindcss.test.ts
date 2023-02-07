import { splitClassName } from '../../../src/rules/extract-tailwind-classes/tailwindcss';
import { describe, test, expect } from '@jest/globals';

describe('splitClassName() function tests', () => {
  test.each(
    // Given
    [
      { input: '', expected: null },
      { input: ' \n', expected: null },
      {
        input: 'w-12 lg:w-6 w-12',
        expected: {
          classes: ['w-12', 'lg:w-6', 'w-12'],
          whitespaces: [' ', ' '],
          prefix: '',
          suffix: '',
        },
      },
      {
        input: 'w-12  lg:w-6   w-12 ',
        expected: {
          classes: ['w-12', 'lg:w-6', 'w-12'],
          whitespaces: ['  ', '   '],
          prefix: '',
          suffix: ' ',
        },
      },
      {
        input: `
        invalid
        sm:w-6
        container
        flex
      `,
        expected: {
          classes: ['invalid', 'sm:w-6', 'container', 'flex'],
          whitespaces: [`\n        `, `\n        `, `\n        `],
          prefix: `
        `,
          suffix: `
      `,
        },
      },
      {
        input: `
        \${fullWidth ? "w-12" : "w-6"}
        flex
        \${hasError && "bg-red"}
        sm:py-6
      `,
        expected: {
          classes: [
            '${fullWidth ? "w-12" : "w-6"}',
            'flex',
            '${hasError && "bg-red"}',
            'sm:py-6',
          ],
          whitespaces: [`\n        `, `\n        `, `\n        `],
          prefix: `
        `,
          suffix: `
      `,
        },
      },
    ]
  )(
    'it should split classes & whitespaces as expected',
    ({ input, expected }) => {
      // When
      const result = splitClassName(input);

      // Then
      expect(result).toStrictEqual(expected);
    }
  );

  // Then
});
