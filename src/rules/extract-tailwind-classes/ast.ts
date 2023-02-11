import { TSESTree } from '@typescript-eslint/utils';
import { RuleContext } from '@typescript-eslint/utils/dist/ts-eslint';
import {
  TClassNameExtraction,
  TClassNameExtractionTree,
  TMessageIds,
  TOptions,
} from './types';

const { extractClassNamesDeep } = (() => {
  /**
   * Constructs ClassNameExtraction based on provided Literal Node.
   *
   * @param node - Literal Node
   */
  function getLiteralValue(node: TSESTree.Literal): TClassNameExtraction {
    return {
      type: 'Node',
      start: node.range[0] + 1,
      end: node.range[1] - 1,
      value: `${node.value}`,
      prefix: '',
      suffix: '',
      node,
    };
  }

  /**
   * Constructs ClassNameExtraction based on provided Template Element Node.
   *
   * @param node - TemplateElement Node
   * @param context - ESLint RuleContext
   */
  function getTemplateElementValue(
    node: TSESTree.TemplateElement,
    context?: RuleContext<TMessageIds, TOptions>
  ): TClassNameExtraction | null {
    const nodeValue = context?.getSourceCode().getText(node);
    const raw = node.value.raw;
    if (nodeValue == null || raw == null) return null;

    // https://github.com/eslint/eslint/issues/13360
    // The problem is that range computation includes the backticks
    // but value.raw does not include them, so there is a mismatch.
    // nodeValue: '`          w-full h-10 rounded          ${'
    // raw: '\n          w-full h-10 rounded\n          '
    // -> start/end does not include the backticks, therefore it matches value.raw.
    const prefix = getTemplateElementPrefix(nodeValue, raw);
    const suffix = getTemplateElementSuffix(nodeValue, raw);

    return {
      type: 'Node',
      start: node.range[0],
      end: node.range[1],
      value: raw,
      prefix,
      suffix,
      node,
    };
  }

  function getTemplateElementPrefix(value: string, raw: string): string {
    const idx = value.indexOf(raw);
    return idx === 0 ? '' : value.slice(0, idx);
  }

  function getTemplateElementSuffix(value: string, raw: string): string {
    const idx = value.indexOf(raw);
    return idx === -1 ? '' : value.slice(idx + raw.length);
  }

  /**
   * Extract class names in deep manner
   * and constructs a tree based on the extracted class names.
   * This tree basically contains all class names in hierarchical order.
   *
   * @param node - Node to find class names in.
   * @param topLevelNodeTree - Top level Node Tree to determine any special handling
   * for specific enclosures such as 'classnames'.
   * @param context - ESLint Rule Context for context information
   */
  function extractClassNamesDeep(
    node: TSESTree.Node,
    topLevelNodeTree: TClassNameExtractionTree | null = null,
    context: RuleContext<TMessageIds, TOptions>
  ): TClassNameExtractionTree | TClassNameExtraction {
    const classNameExtractionTree: TClassNameExtractionTree = {
      type: 'NodeTree',
      node,
      children: [],
    };
    let classNameExtraction: TClassNameExtraction | null = null;

    // Handle special case 'classnames' where the class names are actually the object key
    // https://www.npmjs.com/package/classnames
    const extractObjectKey =
      topLevelNodeTree?.node.type === TSESTree.AST_NODE_TYPES.CallExpression &&
      topLevelNodeTree.node.callee.type ===
        TSESTree.AST_NODE_TYPES.Identifier &&
      topLevelNodeTree.node.callee.name === 'classnames';

    switch (node.type) {
      // "jeff"
      // .value: "jeff"
      case TSESTree.AST_NODE_TYPES.Literal:
        classNameExtraction = getLiteralValue(node);
        break;

      // `flex ${fullWidth ? 'w-4' : 'w-2'} container lg:py8`
      // .expressions: "${fullWidth ? 'w-4' : 'w-2'}"
      // .quasis: "flex", "container lg:py8"
      case TSESTree.AST_NODE_TYPES.TemplateLiteral:
        node.expressions.forEach((expression) => {
          classNameExtractionTree.children.push(
            extractClassNamesDeep(expression, classNameExtractionTree, context)
          );
        });
        node.quasis.forEach((quasis) => {
          classNameExtractionTree.children.push(
            extractClassNamesDeep(quasis, classNameExtractionTree, context)
          );
        });
        break;

      case TSESTree.AST_NODE_TYPES.TemplateElement:
        classNameExtraction = getTemplateElementValue(node, context);
        break;

      // "fullWidth ? 'w-4' : 'w-2'"
      // .test: "fullWidth"
      // .consequent: "w-4"
      // .alternate: "w-2"
      case TSESTree.AST_NODE_TYPES.ConditionalExpression:
        classNameExtractionTree.children.push(
          extractClassNamesDeep(
            node.consequent,
            classNameExtractionTree,
            context
          )
        );
        classNameExtractionTree.children.push(
          extractClassNamesDeep(
            node.alternate,
            classNameExtractionTree,
            context
          )
        );
        break;

      // "hasError && 'bg-red'"
      // .left: "hasError"
      // .operator: "&&"
      // .right: "b-red"
      case TSESTree.AST_NODE_TYPES.LogicalExpression:
        classNameExtractionTree.children.push(
          extractClassNamesDeep(node.right, classNameExtractionTree, context)
        );
        break;

      // "['bg-green', 'w-4']"
      // .elements: "bg-green", "w-4"
      case TSESTree.AST_NODE_TYPES.ArrayExpression:
        node.elements.forEach((element) => {
          if (element != null) {
            classNameExtractionTree.children.push(
              extractClassNamesDeep(element, classNameExtractionTree, context)
            );
          }
        });
        break;

      // "{ background: 'red', apple: 'green' }"
      // .properties: "background: 'red'", "apple: 'green'"
      // .properties[0].key: "background"
      // .properties[0].value: "red"
      case TSESTree.AST_NODE_TYPES.ObjectExpression:
        node.properties.forEach((property) => {
          if (property.type === TSESTree.AST_NODE_TYPES.Property) {
            classNameExtractionTree.children.push(
              extractClassNamesDeep(
                extractObjectKey ? property.key : property.value,
                classNameExtractionTree,
                context
              )
            );
          }
        });
        break;

      default:
      // do nothing
    }

    return classNameExtraction ?? classNameExtractionTree;
  }

  return { extractClassNamesDeep };
})();

/**
 * Flattens a tree of class name extractions into a linear array.
 *
 * @param value - ClassNameExtractionTree or ClassNameExtraction
 */
export function flattenClassNameExtractionTree(
  value: TClassNameExtractionTree | TClassNameExtraction | null
): TClassNameExtraction[] {
  if (value == null) return [];

  const classNameExtractions: TClassNameExtraction[] = [];

  if (value.type === 'NodeTree') {
    for (const child of value.children) {
      if (child.type === 'Node') {
        classNameExtractions.push(child);
      } else {
        classNameExtractions.push(...flattenClassNameExtractionTree(child));
      }
    }
  } else {
    classNameExtractions.push(value);
  }

  return classNameExtractions;
}

export const { extractClassNamesFromJSXAttribute } = (() => {
  /**
   * Extract class names from JSXAttribute Node that need to be sorted.
   * Thereby it goes deep and returns a constructed class name extraction tree.
   * This tree basically contains all class names in hierarchical order.
   *
   * Note that this only handles Template Attributes
   * as Call Expressions are handled differently.
   *
   * @param node - JSXAttribute Node
   * @param context - ESLint Rule Context for context information
   */
  function extractClassNamesFromJSXAttribute(
    node: TSESTree.JSXAttribute,
    context: RuleContext<TMessageIds, TOptions>
  ): TClassNameExtraction | TClassNameExtractionTree | null {
    // Extract Literal Node from JSXAttribute Node
    // Only Literal Nodes as CallExpression Nodes, .. are handled in another listener
    const literal = getLiteralNodeFromJSXAttribute(node);

    // Extract value and its position from the Literal Node deep
    if (literal != null) {
      return extractClassNamesDeep(literal, null, context);
    }

    return null;
  }

  /**
   * Extracts Literal from JSXAttribute Node.
   *
   * @param node - JSXAttribute Node
   */
  function getLiteralNodeFromJSXAttribute(
    node: TSESTree.JSXAttribute
  ): TSESTree.Node | null {
    if (node.value == null) return null;

    switch (node.value.type) {
      // Case if "<div className='...' />"
      case TSESTree.AST_NODE_TYPES.Literal:
        return node.value;
      // Case if "<div className={...} />"
      case TSESTree.AST_NODE_TYPES.JSXExpressionContainer:
        if (
          // Case if "<div className={'...'} />"
          node.value.expression.type === TSESTree.AST_NODE_TYPES.Literal ||
          // Case if "<div className={`...`} />"
          node.value.expression.type === TSESTree.AST_NODE_TYPES.TemplateLiteral
        ) {
          return node.value.expression;
        }
        break;
      default:
      // do nothing
    }

    return null;
  }

  return { extractClassNamesFromJSXAttribute };
})();

/**
 * Checks wether the JSXAttribute Node might contain TailwindCSS class names.
 *
 * @param node - JSXAttribute Node
 * @param classNameRegex - Regex the Node has to match
 */
export function isClassAttribute(
  node: TSESTree.JSXAttribute,
  classNameRegex: RegExp[] | RegExp
): { match: boolean; name: string } {
  const regexArray = Array.isArray(classNameRegex)
    ? classNameRegex
    : [classNameRegex];

  // Extract attribute name
  let attributeName = '';
  if (node.name.type === TSESTree.AST_NODE_TYPES.JSXIdentifier) {
    attributeName = node.name.name;
  }

  // Check whether match
  let match = false;
  for (const regex of regexArray) {
    match = new RegExp(regex).test(attributeName);
    if (match) break;
  }

  return { match, name: attributeName };
}
