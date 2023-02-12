import { RuleTester } from 'eslint';
import rule, { RULE_NAME } from '../../src/rules/no-empty-catch';

const ruleTester: RuleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run(RULE_NAME, rule as any, {
  valid: [
    {
      code: 'try { foo() } catch (e) { bar() }',
    },
  ],
  invalid: [
    {
      code: 'try { foo() } catch (e) {}',
      // We can use messageId from the rule object
      errors: [{ messageId: 'emptyCatch' }],
    },
  ],
});
