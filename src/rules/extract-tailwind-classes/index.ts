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
import { resolveTailwindContext } from './tailwindcss';
import { TOptions, TMessageIds, TConfig } from './types';
import { TSESTree } from '@typescript-eslint/utils';
import {
  extractClassNamesDeep,
  extractClassNamesFromJSXAttribute,
  flattenClassNameExtractionTree,
  isClassAttribute as isClassNameAttribute,
} from './ast';
import { handleExtractedClassNames } from './extractedClassNameHandler';

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

    // Get TailwindCSS context based on TailwindCSS config path specified in config
    const tailwindContext = resolveTailwindContext(
      context,
      config ?? undefined
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

    return {
      // "className='flex container'"
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
        handleExtractedClassNames({
          node,
          classNameExtractions,
          tailwindContext,
          context,
          classNameAttributeName,
          supportExtraction: true,
        });
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
          const classNameExtractionTree = extractClassNamesDeep(
            argument,
            null,
            context
          );
          const classNameExtractions = flattenClassNameExtractionTree(
            classNameExtractionTree
          );

          // Format class names
          handleExtractedClassNames({
            node,
            classNameExtractions,
            tailwindContext,
            context,
            supportExtraction: false,
          });
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
        const classNameExtractionTree = extractClassNamesDeep(
          node.quasi,
          null,
          context
        );
        const classNameExtractions = flattenClassNameExtractionTree(
          classNameExtractionTree
        );

        // Format class names
        handleExtractedClassNames({
          node,
          classNameExtractions,
          tailwindContext,
          context,
          supportExtraction: false,
        });
      },
    };
  },
});

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

export * from './constants';
export * from './types';
