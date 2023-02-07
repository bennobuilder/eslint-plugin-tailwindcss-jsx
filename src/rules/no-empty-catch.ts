/**
 * @fileoverview Rule to avoid empty catch blocks.
 * @author BennoDev
 *
 * Based on Blog: https://developers.mews.com/how-to-write-custom-eslint-rules/
 * and Docs: https://eslint.org/docs/latest/extend/custom-rules
 */

import { createEslintRule } from '../utils/create-eslint-rule';

//------------------------------------------------------------------------------
// Constants
//------------------------------------------------------------------------------

export const RULE_NAME = 'no-empty-catch';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

export default createEslintRule<TOptions, TMessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Force catch phrases to be not empty.',
      recommended: 'error',
    },
    schema: [], // No options
    messages: {
      emptyCatch: 'Empty catch block is not allowed.',
    },
    fixable: 'code',
  },
  defaultOptions: [],
  create(context) {
    return {
      // Start at the "CatchClause" AST Node Type,
      // as we know that the changes are near a try-catch-block
      CatchClause(node) {
        // Start at CatchClause and go down to BlockStatement's body
        if (node.body.body.length === 0) {
          context.report({
            node: node.body,
            messageId: 'emptyCatch', // https://eslint.org/docs/latest/extend/custom-rules#messageids
          });
        }
      },
    };
  },
});

//------------------------------------------------------------------------------
// Types
//------------------------------------------------------------------------------

type TMessageIds = 'emptyCatch';
type TOptions = [];
