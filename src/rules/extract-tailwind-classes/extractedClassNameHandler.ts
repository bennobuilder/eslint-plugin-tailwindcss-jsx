import { TSESTree } from '@typescript-eslint/utils';
import { RuleContext, RuleFix } from '@typescript-eslint/utils/dist/ts-eslint';
import { TTailwindContext } from 'tailwindcss/lib/lib/setupContextUtils';
import { areArraysEquals } from '../../utils/helper';
import {
  buildInlineClassName,
  buildOutsourcedClassName,
  getIdentifierFromClassName,
  sortTailwindClassList,
  splitClassName,
} from './tailwindcss';
import { TClassNameExtraction, TMessageIds, TOptions } from './types';

// TODO This currently supports no deep extraction
export function handleExtractedClassNames(options: {
  node: TSESTree.Node;
  classNameAttributeName?: string;
  classNameExtractions: TClassNameExtraction[];
  tailwindContext: TTailwindContext;
  context: RuleContext<TMessageIds, TOptions>;
  supportExtraction?: boolean;
}) {
  const {
    node,
    classNameAttributeName,
    classNameExtractions,
    tailwindContext,
    context,
    supportExtraction = false,
  } = options;

  for (const classNameExtraction of classNameExtractions) {
    const start = classNameExtraction.start;
    const end = classNameExtraction.end;

    // Extract identifier from className
    const { newClassName: className, identifier } = getIdentifierFromClassName(
      classNameExtraction.value
    );

    // Split className to classes and whitespaces
    const splitted = splitClassName(className);
    if (splitted == null || splitted.classes.length <= 0) {
      continue;
    }
    const prefix = classNameExtraction.prefix + splitted.prefix;
    const suffix = splitted.suffix + classNameExtraction.suffix;

    // Sort classes
    const sortedClasses = sortTailwindClassList(
      splitted.classes,
      tailwindContext
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
              buildInlineClassName(
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
            fixer.replaceText(node, `${classNameAttributeName}={${identifier}}`)
          );

          // Extract class names to identifier
          const ast = context.getSourceCode().ast;
          const lastNode = ast.body[ast.body.length - 1];
          const toInsertCode = `\n\n${buildOutsourcedClassName(
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
