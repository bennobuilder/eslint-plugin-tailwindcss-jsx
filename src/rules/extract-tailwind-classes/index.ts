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
import { TOptions, TMessageIds, TConfig } from './types';
import { TSESTree } from '@typescript-eslint/utils';
import { AstHelper } from '../../utils/ast/AstHelper';
import { TailwindHelper } from '../../utils/tailwind/TailwindHelper';
import { ExtractedClassNamesTree } from '../../utils/ast/ExtractedClassNamesTree';
import { ExtractedClassNamesNode } from '../../utils/ast/ExtractedClassNamesNode';
import { ClassNameBuilder } from '../../utils/ast/ClassNameBuilder';
import {
  getIdentifierFromClassName,
  sortTailwindClassList,
} from './tailwindcss';
import { areArraysEquals } from '../../utils/helper';
import { RuleFix } from '@typescript-eslint/utils/dist/ts-eslint';

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
          tags: {
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
        'Invalid inline TailwindCSS class names with extract identifier present!',
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
    const astHelper = new AstHelper<TMessageIds, TOptions>(context);
    const tailwindHelper = new TailwindHelper<TMessageIds, TOptions>(context);
    const classNameBuilder = new ClassNameBuilder();

    // Get TailwindCSS context based on TailwindCSS config path specified in config
    const tailwindContext = tailwindHelper.getTailwindContext(
      config?.tailwindConfigPath
    );
    if (tailwindContext == null) {
      console.warn(
        "No TailwindCSS context present! Thus the sort functionality won't become active."
      );
      return {};
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
    const tags: string[] = config?.tags ?? ['tss'];

    // TODO optimize and split
    function handleExtractedClassNames(options: {
      node: TSESTree.Node;
      classNameExtractions: ExtractedClassNamesNode[];
      classNameAttributeName?: string;
      supportExtraction: boolean;
    }) {
      const {
        node,
        classNameAttributeName,
        classNameExtractions,
        supportExtraction = false,
      } = options;

      for (const classNameExtraction of classNameExtractions) {
        const start = classNameExtraction.start;
        const end = classNameExtraction.end;

        // Extract identifier from className
        const { newClassName, identifier } = getIdentifierFromClassName(
          classNameExtraction.getValue()
        );
        classNameExtraction.setValue(newClassName);

        // Split className to classes and whitespaces
        const splitted = classNameExtraction.split();
        if (splitted == null || splitted.classes.length <= 0) {
          continue;
        }
        const prefix = classNameExtraction.prefix + splitted.prefix;
        const suffix = splitted.suffix + classNameExtraction.suffix;

        // Sort classes
        const sortedClasses = sortTailwindClassList(
          splitted.classes,
          tailwindContext!
        );

        // Just report sorting of TailwindCSS class names if no identifier present
        if (identifier == null) {
          if (!areArraysEquals(splitted.classes, sortedClasses)) {
            context.report({
              node, // TODO not report entire node just class names
              messageId: 'invalidOrder',
              fix: (fixer) => {
                return fixer.replaceTextRange(
                  [start, end],
                  classNameBuilder.buildInlineClassName(
                    sortedClasses,
                    splitted.whitespaces,
                    prefix,
                    suffix
                  )
                );
              },
            });
          }
        }

        // Report required extraction of TailwindCSS class names
        if (identifier != null && supportExtraction) {
          context.report({
            node, // TODO not report entire node just 'extract' part
            messageId: 'invalidInline',
            fix: (fixer) => {
              const fixers: RuleFix[] = [];

              // TODO check whether such identifier already exists

              // Replace inline class names with identifier
              // Note needs to be inserted hardcoded as its not possible
              // to figure out where the attribute value starts to ensure inserting the identifier value correctly
              fixers.push(
                fixer.replaceText(
                  node,
                  `${classNameAttributeName}={${identifier}}`
                )
              );

              // Extract class names to identifier
              const ast = context.getSourceCode().ast;
              const lastNode = ast.body[ast.body.length - 1];
              const toInsertCode = `\n\n${classNameBuilder.buildOutsourcedClassName(
                sortedClasses,
                identifier,
                lastNode.loc.start.column + 1
              )}`;
              fixers.push(fixer.insertTextAfter(lastNode, toInsertCode));

              return fixers;
            },
          });
        }
      }
    }

    return {
      // "className='flex container'"
      JSXAttribute: (node) => {
        // Check whether JSXAttribute Node contains class names
        const { match, name: classNameAttributeName } =
          astHelper.isClassNameAttribute(node, classNameRegex);
        if (!match) return;

        // Extract class names from Node
        const extractedClassNamesNodeOrTree =
          astHelper.extractClassNamesFromJSXAttribute(node);
        if (extractedClassNamesNodeOrTree != null) {
          const extractedClassNamesNodes =
            extractedClassNamesNodeOrTree instanceof ExtractedClassNamesTree
              ? extractedClassNamesNodeOrTree.flatten()
              : [extractedClassNamesNodeOrTree];

          // Format class names
          handleExtractedClassNames({
            node,
            classNameExtractions: extractedClassNamesNodes,
            classNameAttributeName,
            supportExtraction: true,
          });
        }
      },

      // "clsx('flex container')"
      // https://astexplorer.net/#/gist/52d251afc60f45058d0d84a5f33cfd7e/373699cd666d160d5a14ecdbb9391ada9be91593
      CallExpression: function (node) {
        const identifier = node.callee;

        // Check whether its a relevant callee
        if (
          identifier.type !== TSESTree.AST_NODE_TYPES.Identifier ||
          callees.findIndex((name) => identifier.name === name) === -1
        ) {
          return;
        }

        for (const argument of node.arguments) {
          // Extract class names from CallExpression call argument
          const extractedClassNamesNodeOrTree =
            astHelper.extractClassNamesDeep(argument);
          if (extractedClassNamesNodeOrTree != null) {
            const extractedClassNamesNodes =
              extractedClassNamesNodeOrTree instanceof ExtractedClassNamesTree
                ? extractedClassNamesNodeOrTree.flatten()
                : [extractedClassNamesNodeOrTree];

            // Format class names
            handleExtractedClassNames({
              node,
              classNameExtractions: extractedClassNamesNodes,
              supportExtraction: false,
            });
          }
        }
      },

      // "myTag`flex container`""
      // https://astexplorer.net/#/gist/378ddb10b13de3653f972efa3af2fc0d/d2388cf4f8d9a55a7b3e905e4b704a8e983d0e31
      TaggedTemplateExpression: function (node) {
        const identifier = node.tag;

        // Check whether its a relevant tag
        if (
          identifier.type !== TSESTree.AST_NODE_TYPES.Identifier ||
          tags.findIndex((name) => identifier.name === name) === -1
        ) {
          return;
        }

        // Extract class names from TemplateExpression
        const extractedClassNamesNodeOrTree = astHelper.extractClassNamesDeep(
          node.quasi
        );
        if (extractedClassNamesNodeOrTree != null) {
          const extractedClassNamesNodes =
            extractedClassNamesNodeOrTree instanceof ExtractedClassNamesTree
              ? extractedClassNamesNodeOrTree.flatten()
              : [extractedClassNamesNodeOrTree];

          // Format class names
          handleExtractedClassNames({
            node,
            classNameExtractions: extractedClassNamesNodes,
            supportExtraction: false,
          });
        }
      },
    };
  },
});

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

export * from './constants';
export * from './types';
