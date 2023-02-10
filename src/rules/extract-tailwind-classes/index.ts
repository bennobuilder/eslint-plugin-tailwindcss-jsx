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
  outsourceIdentifierFromClassName as outsourceExtractIdentifierFromClassName,
  getTailwindConfigPath,
  getTailwindContext,
  sortTailwindClassList,
  splitClassName,
  newClassNamesEqualToPreviousClassNames,
} from './tailwindcss';
import { TOptions, TMessageIds, TConfig } from './types';
import { TTailwindContext } from 'tailwindcss/lib/lib/setupContextUtils';
import { RuleFix } from '@typescript-eslint/utils/dist/ts-eslint';
import { TSESTree } from '@typescript-eslint/utils';
import {
  extractClassNamesFromJSXAttribute,
  flattenClassNameExtractionTree,
  isClassAttribute as isClassNameAttribute,
} from './ast';

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
        // required: [],
        properties: {
          tailwindConfigPath: {
            type: 'string',
          },
          classNameRegex: {
            type: 'object',
            oneOf: [
              {
                type: 'object',
                required: ['regex'],
                properties: {
                  regex: {
                    type: 'array',
                    items: {
                      instanceof: 'RegExp',
                    },
                  },
                  overwrite: {
                    type: 'boolean',
                  },
                },
              },
              {
                instanceof: 'RegExp',
              },
            ],
          },
          callees: {
            type: 'array',
            items: { type: 'string', minLength: 0 },
            uniqueItems: true,
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
    let config: TConfig | null = null;
    if (context.options.length > 0) {
      config = context.options[0];
    }

    // TODO
    const extractedTailwindClasses: Record<string, string[]> = {};

    // Get TailwindCSS context based on TailwindCSS config path specified in config
    const tailwindConfigPath = getTailwindConfigPath(
      config?.tailwindConfigPath,
      context?.getCwd != null ? context.getCwd() : undefined
    );
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

    // Get class name regex from config
    let classNameRegex: RegExp[] = [/\b(class|className)\b/g];
    if (config != null && config.classNameRegex != null) {
      const configClassRegex = config.classNameRegex;
      if (configClassRegex instanceof RegExp) {
        classNameRegex = [configClassRegex];
      } else {
        classNameRegex = configClassRegex.overwrite
          ? configClassRegex.regex
          : classNameRegex.concat(configClassRegex.regex);
      }
    }

    // Get callees from config
    const callees: string[] = config?.callees ?? ['clsx', 'ctl', 'classnames'];

    // Get tags from config
    const tags: string[] = [];

    return {
      // Start at the "JSXAttribute" AST Node Type,
      // as "className" is a JSX attribute
      JSXAttribute: (node) => {
        // Check whether JSXAttribute Node contains class names
        const { match, name: classNameAttributeName } = isClassNameAttribute(
          node,
          classNameRegex
        );
        if (!match) return;

        // Extract class names from Node
        const classNameExtractionTree = extractClassNamesFromJSXAttribute(
          node,
          context
        );
        const classNameExtractions = flattenClassNameExtractionTree(
          classNameExtractionTree
        );

        // Format class names
        for (const classNameExtraction of classNameExtractions) {
          const start = classNameExtraction.start;
          const end = classNameExtraction.end;

          // Split className into classes & spaces and extract outsource identifier
          const { className, identifier } =
            outsourceExtractIdentifierFromClassName(classNameExtraction.value);

          // Split className to classes and whitespaces
          const splitted = splitClassName(className);
          if (splitted == null || splitted.classes.length <= 0) {
            return;
          }

          // Just sort if no identifier present
          if (identifier == null && tailwindContext != null) {
            const sortedClasses = sortTailwindClassList(
              splitted.classes,
              tailwindContext
            );

            if (
              !newClassNamesEqualToPreviousClassNames(
                splitted.classes,
                sortedClasses
              )
            ) {
              context.report({
                node,
                messageId: 'invalidOrder',
                fix: (fixer) => {
                  return fixer.replaceTextRange(
                    [start, end],
                    classNameExtraction.prefix +
                      buildInlineClassName(
                        sortedClasses,
                        splitted.whitespaces,
                        splitted.prefix,
                        splitted.suffix
                      ) +
                      classNameExtraction.suffix
                  );
                },
              });
            }
          }

          // TODO fix
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
                  fixer.replaceText(
                    node,
                    `${classNameAttributeName}={${identifier}}`
                  )
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
      CallExpression: function (node) {
        const identifier = node.callee;

        // Check whether its a relevant callee
        if (
          identifier.type !== TSESTree.AST_NODE_TYPES.Identifier ||
          callees.findIndex((name) => identifier.name === name) === -1
        ) {
          return;
        }

        // TODO
        // https://astexplorer.net/#/gist/52d251afc60f45058d0d84a5f33cfd7e/373699cd666d160d5a14ecdbb9391ada9be91593
      },
      TaggedTemplateExpression: function (node) {
        const identifier = node.tag;

        // Check whether its a relevant tag
        if (
          identifier.type !== TSESTree.AST_NODE_TYPES.Identifier ||
          tags.findIndex((name) => identifier.name === name) === -1
        ) {
          return;
        }

        // TODO
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
