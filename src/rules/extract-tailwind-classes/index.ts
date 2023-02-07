/**
 * @fileoverview Rule to extract TailwindCss class names
 * @author BennoDev
 *
 * Structure based on: https://eslint.org/docs/latest/extend/custom-rules
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import { createEslintRule } from '../../utils/create-eslint-rule';
import { RULE_NAME } from './constants';
import {
  buildInlineClassName,
  buildOutsourcedClassName,
  getOutsourceIdentifierFromClassName,
  getTailwindConfigPath,
  getTailwindContext,
  sortTailwindClassList,
  splitClassName,
} from './tailwindcss';
import { TOptions, TMessageIds } from './types';
import { TTailwindContext } from 'tailwindcss/lib/lib/setupContextUtils';
import { RuleFix } from '@typescript-eslint/utils/dist/ts-eslint';
import { TSESTree } from '@typescript-eslint/utils';
import { extractClassNamesFromJSXAttribute } from './ast';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

export default createEslintRule<TOptions, TMessageIds>({
  name: RULE_NAME,
  // https://eslint.org/docs/latest/extend/custom-rules#rule-basics
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Extract Tailwind classes from className HTML attribute.',
      recommended: 'warn',
    },
    schema: [
      {
        type: 'object',
        properties: {
          tailwindConfig: {
            type: 'string',
          },
        },
        additionalProperties: false,
      },
    ], // No options
    messages: {
      invalidInline:
        'Invalid inline TailwindCSS class names with extracted key.',
      invalidOrder: 'Invalid TailwindCSS class names order!',
    },
    fixable: 'code',
  },
  defaultOptions: [{}],
  create: (context) => {
    const extractedTailwindClasses: Record<string, string[]> = {};

    // Get Tailwind Context
    const tailwindConfigPath = getTailwindConfigPath(context.options);
    let tailwindContext: TTailwindContext | null = null;
    if (tailwindConfigPath != null) {
      tailwindContext = getTailwindContext(tailwindConfigPath);
    } else {
      console.warn("Failed to resolve path to 'tailwind.config.js'!");
    }
    if (tailwindContext == null) {
      console.warn(
        `Failed to load 'tailwind.config.js' from '${tailwindConfigPath}'!`
      );
    }

    return {
      // Start at the "JSXAttribute" AST Node Type,
      // as we know that the "className" is a JSX attribute
      JSXAttribute: (node) => {
        const classNameObjects = extractClassNamesFromJSXAttribute(node);

        // TODO outsourcing Template Literals won't work this way
        // https://astexplorer.net/#/gist/5228f6df207afd9abdc39f94ad8a3f03/f6d8d3e11fe2470ed123dbedde717727fe5b8f0a
        for (const classNameObject of classNameObjects) {
          // Split className into classes & spaces and extract outsource identifier
          const { className, identifier } = getOutsourceIdentifierFromClassName(
            classNameObject.value
          );

          const splitted = splitClassName(className);
          if (splitted == null || splitted.classes.length <= 0) {
            continue;
          }

          // Just sort if no identifier present
          if (identifier == null && tailwindContext != null) {
            const sortedClasses = sortTailwindClassList(
              splitted.classes,
              tailwindContext
            );

            if (sortedClasses.join('') !== splitted.classes.join('')) {
              context.report({
                node,
                messageId: 'invalidOrder',
                fix: (fixer) => {
                  return fixer.replaceTextRange(
                    [classNameObject.start, classNameObject.end],
                    `"${buildInlineClassName(
                      sortedClasses,
                      splitted.whitespaces
                    )}"`
                  );
                },
              });
            }
          }

          // Sort and extract if identifier present
          if (identifier != null) {
            // Store classes to extract them in another event listener
            if (tailwindContext != null) {
              extractedTailwindClasses[identifier] = sortTailwindClassList(
                splitted.classes,
                tailwindContext
              );
            } else {
              extractedTailwindClasses[identifier] = splitted.classes;
            }

            // Report the required extraction
            context.report({
              node,
              messageId: 'invalidInline',
              fix: (fixer) => {
                const fixers: RuleFix[] = [];

                // Fix "Replace class names with identifier"
                fixers.push(
                  fixer.replaceText(node, `className={${identifier}}`)
                );

                // Fix "Extract class names to identifier"
                const ast = context.getSourceCode().ast;
                const lastNode = ast.body[ast.body.length - 1];
                const toInsertCode = `\n\n${buildOutsourcedClassName(
                  splitted.classes,
                  identifier,
                  lastNode.loc.start.column + 1
                )}`;

                fixers.push(fixer.insertTextAfter(lastNode, toInsertCode));

                return fixers;
              },
            });
          }
        }
      },
      // Adding the TailwindCSS classes to the end of the file in each JSXAttribute Listener fix() method,
      // didn't work properly if there where multiple fixes to do,
      // so I collect the to do fixes and then add them at the end of the file in a batch on 'Program:exit'.
      // https://github.com/eslint/eslint/discussions/16855
      // 'Program:exit': (node) => {
      //   if (Object.keys(extractedTailwindClasses).length > 0) {
      //     context.report({
      //       node,
      //       messageId: 'invalidInline',
      //       fix: (fixer) => {
      //         const ast = context.getSourceCode().ast;

      //         // Add TailwindCss classes to end of the file (in a batch)
      //         const lastNode = ast.body[ast.body.length - 1];
      //         const toInsertCode = Object.keys(extractedTailwindClasses).reduce(
      //           (previousValue, identifier) => {
      //             const classes = extractedTailwindClasses[identifier];

      //             // Add new code block with a constant declaration for the extracted Tailwind class
      //             if (classes != null) {
      //               previousValue =
      //                 previousValue +
      //                 `\n\n${buildOutsourcedClassName(
      //                   classes,
      //                   identifier,
      //                   lastNode.loc.start.column + 1
      //                 )}`;
      //             }

      //             // Remove the extracted Tailwind class entry from the stored list
      //             delete extractedTailwindClasses[identifier];

      //             return previousValue;
      //           },
      //           ''
      //         );

      //         return fixer.insertTextAfter(lastNode, toInsertCode);
      //       },
      //     });
      //   }
      // },
    };
  },
});

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

export * from './constants';
export * from './types';
