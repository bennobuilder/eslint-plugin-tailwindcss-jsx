import { TSESTree } from '@typescript-eslint/utils';

function goDeep(node: TSESTree.BaseNode, childNode: TSESTree.BaseNode | null) {}

function getLiteralValue(node: TSESTree.Literal): {
  start: number;
  end: number;
  value: any;
} {
  const range = extractRangeFromNode(node);
  const start = range[0] + 1;
  const end = range[1] + 1;

  return { start, end, value: node.value };
}

function handleTemplateLiteral(
  node: TSESTree.TemplateLiteral
): { start: number; end: number; value: any }[] {
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
): {
  start: number;
  end: number;
  value: any;
}[] {
  // Extract Literal from JSXAttribute Node
  const literal = getLiteralFromJSXAttribute(node);

  // Extract value and its position from the Literal
  const literalValues: { start: number; end: number; value: any }[] = [];
  if (literal?.type === TSESTree.AST_NODE_TYPES.Literal) {
    literalValues.push(getLiteralValue(literal));
  } else if (literal?.type === TSESTree.AST_NODE_TYPES.TemplateLiteral) {
    literalValues.concat(handleTemplateLiteral(literal));
  }

  // TODO split literalValues to classes and stuff
  // or do this in separate function is better I suppose

  return [];

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
