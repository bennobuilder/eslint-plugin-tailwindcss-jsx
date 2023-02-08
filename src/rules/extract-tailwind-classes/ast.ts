import { TSESTree } from '@typescript-eslint/utils';
import { TClassNameExtractionObject } from './types';

function goDeep(
  node: TSESTree.Node,
  childNode: TSESTree.Node | null
): TClassNameExtractionObject[] {
  const classNameExtractions: TClassNameExtractionObject[] = [];

  if (childNode != null) {
    switch (childNode.type) {
      case 'Identifier':
        // TODO
        break;

      case TSESTree.AST_NODE_TYPES.TemplateLiteral:
        classNameExtractions.concat(
          ...childNode.expressions.map((expression) => goDeep(node, expression))
        );
        classNameExtractions.concat(
          ...childNode.quasis.map((quasis) => goDeep(node, quasis))
        );
        break;

      case TSESTree.AST_NODE_TYPES.ConditionalExpression:
        classNameExtractions.concat(goDeep(node, childNode.consequent));
        classNameExtractions.concat(goDeep(node, childNode.alternate));
        break;

      case TSESTree.AST_NODE_TYPES.LogicalExpression:
        classNameExtractions.concat(goDeep(node, childNode.right));
        break;

      case TSESTree.AST_NODE_TYPES.ArrayExpression:
        classNameExtractions.concat(
          ...childNode.elements.map((element) => goDeep(node, element))
        );
        break;

      default:
      // do nothing
    }
  }

  return classNameExtractions;
}

function getLiteralValue(node: TSESTree.Literal): TClassNameExtractionObject {
  const range = extractRangeFromNode(node);
  return {
    start: range[0] + 1,
    end: range[1] - 1,
    value: `${node.value}`,
    node,
    children: [],
  };
}

function handleTemplateLiteral(
  node: TSESTree.TemplateLiteral
): TClassNameExtractionObject[] {
  // TODO go deep

  return [];
}

/**
 * Extract class names from JSXAttribute Node that need to be sorted.
 *
 * @param node - JSXAttribute Node
 */
export function extractClassNamesFromJSXAttribute(
  node: TSESTree.JSXAttribute
): TClassNameExtractionObject[] {
  // Extract Literal from JSXAttribute Node
  const literal = getLiteralFromJSXAttribute(node);

  // Extract value and its position from the Literal
  const classNameExtractions: TClassNameExtractionObject[] = [];
  if (literal?.type === TSESTree.AST_NODE_TYPES.Literal) {
    classNameExtractions.push(getLiteralValue(literal));
  } else if (literal?.type === TSESTree.AST_NODE_TYPES.TemplateLiteral) {
    classNameExtractions.concat(handleTemplateLiteral(literal));
  }

  return classNameExtractions;
}

/**
 * Extracts Literal from JSXAttribute Node
 *
 * @param node - JSXAttribute Node
 * @returns
 */
function getLiteralFromJSXAttribute(
  node: TSESTree.JSXAttribute
): TSESTree.Literal | TSESTree.TemplateLiteral | null {
  if (node.value != null) {
    switch (node.value.type) {
      // Case if "<div className='...' />"
      case TSESTree.AST_NODE_TYPES.Literal:
        return node.value;
      // Case if "<div className={...} />"
      case TSESTree.AST_NODE_TYPES.JSXExpressionContainer:
        // Case if "<div className={'...'} />"
        if (node.value.expression.type === TSESTree.AST_NODE_TYPES.Literal) {
          return node.value.expression;
        }
        // Case if "<div className={`...`} />"
        else if (
          node.value.expression.type === TSESTree.AST_NODE_TYPES.TemplateLiteral
        ) {
          return node.value.expression;
        }
        break;
      default:
    }
  }

  return null;
}

function extractValueFromNode(node: TSESTree.Literal) {
  // TODO support other Node types
  return node.value;
}

function extractRangeFromNode(node: TSESTree.Literal): TSESTree.Range {
  // TODO support other Node types
  return node.range;
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
