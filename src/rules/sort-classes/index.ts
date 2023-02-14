import { TSESTree } from '@typescript-eslint/utils';
import { SharedConfigurationSettings } from '@typescript-eslint/utils/dist/ts-eslint';
import { mergeOptionsWithSharedSettings } from '../../options/optionsHelper';
import {
  SHARED_TAILWIND_SCHEMA,
  TAILWIND_SCHEMA_DEFAULTS,
  TSharedTailwindSchema,
} from '../../options/shared/schema';
import { AstHelper } from '../../utils/ast/AstHelper';
import { ClassNameBuilder } from '../../utils/ast/ClassNameBuilder';
import { ExtractedClassNamesNode } from '../../utils/ast/ExtractedClassNamesNode';
import { ExtractedClassNamesTree } from '../../utils/ast/ExtractedClassNamesTree';
import { createEslintRule } from '../../utils/eslint/create-eslint-rule';
import { docsUrl } from '../../utils/eslint/doc-url';
import { areArraysEquals } from '../../utils/helper';
import { sortTailwindClassList } from '../../utils/tailwind/helper';
import { TailwindHelper } from '../../utils/tailwind/TailwindHelper';

// ------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------

export const RULE_NAME = 'sort-classes';
export const RULE_MESSAGES = {
  invalidOrder: 'Invalid TailwindCSS class names order!',
};
export const DEFAULT_CONFIG: TConfig = TAILWIND_SCHEMA_DEFAULTS;

export type TConfig = TSharedTailwindSchema;
export type TOptions = [TConfig];
export type TMessageIds = 'invalidOrder';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

export default createEslintRule<TOptions, TMessageIds>({
  name: RULE_NAME,
  // https://eslint.org/docs/latest/extend/custom-rules#rule-basics
  meta: {
    type: 'suggestion',
    docs: {
      description: 'todo',
      recommended: 'warn',
      url: docsUrl(RULE_NAME),
    } as any,
    schema: [SHARED_TAILWIND_SCHEMA],
    messages: {
      invalidOrder: RULE_MESSAGES.invalidOrder,
    },
    fixable: 'code',
  },
  defaultOptions: [DEFAULT_CONFIG],
  create: (context) => {
    const config = mergeOptionsWithSharedSettings<Required<TConfig>>(
      context.options,
      context.settings,
      DEFAULT_CONFIG // Merge default config as 'defaultOptions' doesn't seem to work
    );
    const astHelper = new AstHelper<TMessageIds, TOptions>(context);
    const tailwindHelper = new TailwindHelper<TMessageIds, TOptions>(context);
    const classNameBuilder = new ClassNameBuilder();

    // Get TailwindCSS context based on TailwindCSS config path specified in config
    const tailwindContext = tailwindHelper.getTailwindContext(
      config.tailwindConfigPath
    );
    if (tailwindContext == null) {
      console.warn(
        "No TailwindCSS context present! Thus the sort functionality won't become active."
      );
      return {};
    }

    function sort(options: {
      node: TSESTree.Node;
      extractedClassNamesNodes: ExtractedClassNamesNode[];
    }) {
      const { node, extractedClassNamesNodes } = options;

      for (const extractedClassNamesNode of extractedClassNamesNodes) {
        const start = extractedClassNamesNode.start;
        const end = extractedClassNamesNode.end;

        // Split className to classes and whitespaces
        const splitted = extractedClassNamesNode.split();
        if (splitted == null || splitted.classes.length <= 0) {
          continue;
        }
        const prefix = extractedClassNamesNode.prefix + splitted.prefix;
        const suffix = splitted.suffix + extractedClassNamesNode.suffix;
        let updateClasses: string[] = [...splitted.classes];

        // Sort classes
        updateClasses = sortTailwindClassList(
          updateClasses,
          tailwindContext ?? undefined
        );

        if (!areArraysEquals(splitted.classes, updateClasses)) {
          context.report({
            node, // TODO not report entire node just class names
            messageId: 'invalidOrder',
            fix: (fixer) => {
              return fixer.replaceTextRange(
                [start, end],
                classNameBuilder.buildInlineClassName(
                  updateClasses,
                  splitted.whitespaces,
                  prefix,
                  suffix
                )
              );
            },
          });
        }
      }
    }

    return {
      // "className='flex container'"
      JSXAttribute: (node) => {
        // Check whether JSXAttribute Node contains class names
        const { match } = astHelper.isClassNameJSXAttribute(
          node,
          new RegExp(config.attributeRegex, 'g')
        );
        if (!match) return;

        // Extract class names from TemplateExpression
        const extractedClassNamesNodes = ExtractedClassNamesTree.flattenDeep(
          astHelper.extractClassNamesFromJSXAttribute(node)
        );

        // Sort class names
        sort({ node, extractedClassNamesNodes });
      },

      // "clsx('flex container')"
      // https://astexplorer.net/#/gist/52d251afc60f45058d0d84a5f33cfd7e/373699cd666d160d5a14ecdbb9391ada9be91593
      CallExpression: function (node) {
        // Check whether CallExpression Node contains class names
        const { match } = astHelper.isClassNameCallExpression(
          node,
          new RegExp(config.calleesRegex, 'g')
        );
        if (!match) return;

        for (const argumentNode of node.arguments) {
          // Extract class names from TemplateExpression
          const extractedClassNamesNodes = ExtractedClassNamesTree.flattenDeep(
            astHelper.extractClassNamesDeep(argumentNode)
          );

          // Sort class names
          sort({ node, extractedClassNamesNodes });
        }
      },

      // "myTag`flex container`""
      // https://astexplorer.net/#/gist/378ddb10b13de3653f972efa3af2fc0d/d2388cf4f8d9a55a7b3e905e4b704a8e983d0e31
      TaggedTemplateExpression: function (node) {
        // Check whether TaggedTemplateExpression Node contains class names
        const { match } = astHelper.isClassNameTaggedTemplateExpression(
          node,
          new RegExp(config.tagsRegex, 'g')
        );
        if (!match) return;

        // Extract class names from TemplateExpression
        const extractedClassNamesNodes = ExtractedClassNamesTree.flattenDeep(
          astHelper.extractClassNamesDeep(node.quasi)
        );

        // Sort class names
        sort({ node, extractedClassNamesNodes });
      },
    };
  },
});
