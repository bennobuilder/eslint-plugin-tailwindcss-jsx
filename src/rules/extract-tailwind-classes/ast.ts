import { TSESTree } from '@typescript-eslint/utils';
import { TClassNameExtraction, TClassNameExtractionTree } from './types';

function extractClassNamesDeep(
  node: TSESTree.Node,
  topLevelNodeTree: TClassNameExtractionTree | null = null
): TClassNameExtractionTree | TClassNameExtraction {
  const classNameExtractionTree: TClassNameExtractionTree = {
    type: 'ClassNameExtractionTree',
    node,
    children: [],
  };
  let classNameExtraction: TClassNameExtraction | null = null;

  // Handle special case 'classnames' where the class names are actually the object key
  // https://www.npmjs.com/package/classnames
  const extractObjectKey =
    topLevelNodeTree?.node.type === TSESTree.AST_NODE_TYPES.CallExpression &&
    topLevelNodeTree.node.callee.type === TSESTree.AST_NODE_TYPES.Identifier &&
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
          extractClassNamesDeep(expression, classNameExtractionTree)
        );
      });
      node.quasis.forEach((quasis) => {
        classNameExtractionTree.children.push(
          extractClassNamesDeep(quasis, classNameExtractionTree)
        );
      });
      break;

    case TSESTree.AST_NODE_TYPES.TemplateElement:
      // TODO
      break;

    // "fullWidth ? 'w-4' : 'w-2'"
    // .test: "fullWidth"
    // .consequent: "w-4"
    // .alternate: "w-2"
    case TSESTree.AST_NODE_TYPES.ConditionalExpression:
      classNameExtractionTree.children.push(
        extractClassNamesDeep(node.consequent, classNameExtractionTree)
      );
      classNameExtractionTree.children.push(
        extractClassNamesDeep(node.alternate, classNameExtractionTree)
      );
      break;

    // "hasError && 'bg-red'"
    // .left: "hasError"
    // .operator: "&&"
    // .right: "b-red"
    case TSESTree.AST_NODE_TYPES.LogicalExpression:
      classNameExtractionTree.children.push(
        extractClassNamesDeep(node.right, classNameExtractionTree)
      );
      break;

    // "['bg-green', 'w-4']"
    // .elements: "bg-green", "w-4"
    case TSESTree.AST_NODE_TYPES.ArrayExpression:
      node.elements.forEach((element) => {
        if (element != null) {
          classNameExtractionTree.children.push(
            extractClassNamesDeep(element, classNameExtractionTree)
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
              classNameExtractionTree
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

export function getLiteralValue(node: TSESTree.Literal): TClassNameExtraction {
  return {
    type: 'ClassNameExtraction',
    start: node.range[0] + 1,
    end: node.range[1] - 1,
    value: `${node.value}`,
    node,
  };
}

/**
 * Extract class names from JSXAttribute Node that need to be sorted.
 *
 * @param node - JSXAttribute Node
 */
export function extractClassNamesFromJSXAttribute(
  node: TSESTree.JSXAttribute
): TClassNameExtraction | TClassNameExtractionTree | null {
  // Extract Literal Node from JSXAttribute Node
  // Only Literal Nodes as CallExpression Nodes, .. are handled in another listener
  const literal = getLiteralNodeFromJSXAttribute(node);

  // Extract value and its position from the Literal Node deep
  if (literal != null) {
    return extractClassNamesDeep(literal);
  }

  return null;
}

/**
 * Extracts Literal from JSXAttribute Node
 *
 * @param node - JSXAttribute Node
 * @returns
 */
function getLiteralNodeFromJSXAttribute(
  node: TSESTree.JSXAttribute
): TSESTree.Node | null {
  if (node.value != null) {
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
  }

  return null;
}

/**
 * Checks wether the JSXAttribute Node might contain TailwindCSS class names.
 *
 * @param node - JSXAttribute Node
 * @param classNameRegex - Regex the Node has to match
 * @returns
 */
export function isClassAttribute(
  node: TSESTree.JSXAttribute,
  classNameRegex: RegExp[]
): { match: boolean; name: string } {
  let name = '';

  // Extract attribute name
  if (node.name.type === TSESTree.AST_NODE_TYPES.JSXIdentifier) {
    name = node.name.name;
  }

  // Check whether match
  let match = false;
  for (const regex of classNameRegex) {
    match = new RegExp(regex).test(name);
    if (match) break;
  }

  return { match, name };
}
