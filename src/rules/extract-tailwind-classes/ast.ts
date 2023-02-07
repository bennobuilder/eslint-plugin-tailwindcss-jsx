import { TSESTree } from '@typescript-eslint/utils';
import { TClassNameExtractionObject } from './types';

function goDeep(node: TSESTree.BaseNode, childNode: TSESTree.BaseNode | null) {}

function getLiteralValue(node: TSESTree.Literal): TClassNameExtractionObject {
  const range = extractRangeFromNode(node);
  return {
    start: range[0] + 1,
    end: range[1] + 1,
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
 * @param node JSXAttribute Node
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

  // TODO after getting these classes, each array element will be reported and fixed inline
  // and if to extract reported and extracted
  // context.report({
  //      node: node,
  //      messageId: 'invalidOrder',
  //      fix: function (fixer) {
  //        return fixer.replaceTextRange([start, end], orderedClassNameValue);
  //      },
  //    });
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
