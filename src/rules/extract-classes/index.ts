import { TSESTree } from '@typescript-eslint/utils';
import { RuleFix } from '@typescript-eslint/utils/dist/ts-eslint';
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
import { sortTailwindClassList } from '../../utils/tailwind/helper';
import { TailwindHelper } from '../../utils/tailwind/TailwindHelper';
import { getIdentifierFromClassName } from './helper';

// ------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------

export const RULE_NAME = 'extract-classes';
export const RULE_MESSAGES = {
  invalidInline:
    'Invalid inline TailwindCSS class names with extract identifier present!',
};
export const DEFAULT_CONFIG: TConfig = {
  ...TAILWIND_SCHEMA_DEFAULTS,
  sort: true,
};
export const EXTRACT_IDENTIFIER_REGEX = /extract-\[.+\]/;

export type TConfig = TSharedTailwindSchema & {
  sort?: boolean;
};
export type TOptions = [TConfig];
export type TMessageIds = 'invalidInline';

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
    schema: [
      {
        type: 'object',
        // required: [],
        properties: {
          ...SHARED_TAILWIND_SCHEMA.properties,
          sort: {
            type: 'boolean',
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidInline: RULE_MESSAGES.invalidInline,
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

    function extract(options: {
      node: TSESTree.Node;
      extractedClassNamesNodes: ExtractedClassNamesNode[];
      classNameAttributeName: string;
    }) {
      const { node, extractedClassNamesNodes, classNameAttributeName } =
        options;

      for (const extractedClassNamesNode of extractedClassNamesNodes) {
        // Extract identifier from className
        const { newClassName, identifier } = getIdentifierFromClassName(
          extractedClassNamesNode.getValue(),
          EXTRACT_IDENTIFIER_REGEX
        );
        extractedClassNamesNode.setValue(newClassName);
        if (identifier == null) continue;

        // Split className to classes and whitespaces
        const splitted = extractedClassNamesNode.split();
        if (splitted == null || splitted.classes.length <= 0) {
          continue;
        }
        let updateClasses: string[] = [...splitted.classes];

        // Sort classes
        if (config.sort) {
          updateClasses = sortTailwindClassList(
            updateClasses,
            tailwindContext ?? undefined
          );
        }

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
              updateClasses,
              identifier,
              lastNode.loc.start.column + 1
            )}`;
            fixers.push(fixer.insertTextAfter(lastNode, toInsertCode));

            return fixers;
          },
        });
      }
    }

    return {
      // "className='flex container'"
      JSXAttribute: (node) => {
        // Check whether JSXAttribute Node contains class names
        const { match, name } = astHelper.isClassNameJSXAttribute(
          node,
          new RegExp(config.classNameRegex, 'g')
        );
        if (!match) return;

        // Extract class names from TemplateExpression
        const extractedClassNamesNodes = ExtractedClassNamesTree.flattenDeep(
          astHelper.extractClassNamesFromJSXAttribute(node)
        );

        // Sort class names
        extract({
          node,
          extractedClassNamesNodes,
          classNameAttributeName: name,
        });
      },
    };
  },
});
