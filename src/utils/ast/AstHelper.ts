import { TSESTree } from '@typescript-eslint/utils';
import { RuleContext } from '@typescript-eslint/utils/dist/ts-eslint';
import { ExtractedClassNamesNode } from './ExtractedClassNamesNode';
import { ExtractedClassNamesTree } from './ExtractedClassNamesTree';

export class AstHelper<TMessageIds extends string, TOptions extends any[]> {
  private context: RuleContext<TMessageIds, TOptions>;

  constructor(context: RuleContext<TMessageIds, TOptions>) {
    this.context = context;
  }

  /**
   * Checks wether the JSXAttribute Node might contain TailwindCSS class names.
   *
   * @param node - JSXAttribute Node
   * @param classNameRegex - Regex the Node has to match
   */
  public isClassNameAttribute(
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

  /**
   * Extract class names in deep manner
   * and constructs a tree based on the extracted class names.
   * This tree basically contains all class names in hierarchical order.
   *
   * @param node - Node to find class names in.
   * @param parentNode - Parent Node to determine any special handling
   * for specific enclosures such as 'classnames'.
   * @param context - ESLint Rule Context for context information
   */
  public extractClassNamesDeep(
    node: TSESTree.Node,
    parentNode: TSESTree.Node | null = null
  ): ExtractedClassNamesTree | ExtractedClassNamesNode {
    const extractedClassNamesTree = new ExtractedClassNamesTree({
      node,
      children: [],
    });
    let extractedClassNamesNode: ExtractedClassNamesNode | null = null;

    // Handle special case 'classnames' where the class names are actually the object key
    // "{'flex container bg-red': isError}"
    // https://www.npmjs.com/package/classnames
    const extractObjectKey =
      parentNode?.type === TSESTree.AST_NODE_TYPES.CallExpression &&
      parentNode.callee.type === TSESTree.AST_NODE_TYPES.Identifier &&
      parentNode.callee.name === 'classnames';

    switch (node.type) {
      // "jeff"
      // .value: "jeff"
      case TSESTree.AST_NODE_TYPES.Literal:
        extractedClassNamesNode = this.getLiteralValue(node);
        break;

      case TSESTree.AST_NODE_TYPES.TemplateElement:
        extractedClassNamesNode = this.getTemplateElementValue(node);
        break;

      // `flex ${fullWidth ? 'w-4' : 'w-2'} container lg:py8`
      // .expressions: "${fullWidth ? 'w-4' : 'w-2'}"
      // .quasis: "flex", "container lg:py8"
      case TSESTree.AST_NODE_TYPES.TemplateLiteral:
        node.expressions.forEach((expression) => {
          extractedClassNamesTree.children.push(
            this.extractClassNamesDeep(expression, node)
          );
        });
        node.quasis.forEach((quasis) => {
          extractedClassNamesTree.children.push(
            this.extractClassNamesDeep(quasis, node)
          );
        });
        break;

      // "fullWidth ? 'w-4' : 'w-2'"
      // .test: "fullWidth"
      // .consequent: "w-4"
      // .alternate: "w-2"
      case TSESTree.AST_NODE_TYPES.ConditionalExpression:
        extractedClassNamesTree.children.push(
          this.extractClassNamesDeep(node.consequent, node)
        );
        extractedClassNamesTree.children.push(
          this.extractClassNamesDeep(node.alternate, node)
        );
        break;

      // "hasError && 'bg-red'"
      // .left: "hasError"
      // .operator: "&&"
      // .right: "b-red"
      case TSESTree.AST_NODE_TYPES.LogicalExpression:
        extractedClassNamesTree.children.push(
          this.extractClassNamesDeep(node.right, node)
        );
        break;

      // "['bg-green', 'w-4']"
      // .elements: "bg-green", "w-4"
      case TSESTree.AST_NODE_TYPES.ArrayExpression:
        node.elements.forEach((element) => {
          if (element != null) {
            extractedClassNamesTree.children.push(
              this.extractClassNamesDeep(element, node)
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
            extractedClassNamesTree.children.push(
              this.extractClassNamesDeep(
                extractObjectKey ? property.key : property.value,
                node
              )
            );
          }
        });
        break;

      default:
      // do nothing
    }

    return extractedClassNamesNode ?? extractedClassNamesTree;
  }

  /**
   * Extract class names from JSXAttribute Node that need to be sorted.
   * Thereby it goes deep and returns a constructed class name extraction tree.
   * This tree basically contains all class names in hierarchical order.
   *
   * Note that this only handles Template Attributes
   * as Call Expressions are handled differently.
   *
   * @param node - JSXAttribute Node
   */
  public extractClassNamesFromJSXAttribute(
    node: TSESTree.JSXAttribute
  ): ExtractedClassNamesNode | ExtractedClassNamesTree | null {
    // Extract Literal Node from JSXAttribute Node
    const literal = this.getLiteralNodeFromJSXAttribute(node);

    // Extract value and its position from the Literal Node deep
    // but only if its an Literal Node as non literals like CallExpressions are handled elsewhere
    return literal != null ? this.extractClassNamesDeep(literal) : null;
  }

  //------------------------------------------------------------------------------
  // Helper
  //------------------------------------------------------------------------------

  /**
   * Extracts Literal from JSXAttribute Node.
   *
   * @param node - JSXAttribute Node
   */
  private getLiteralNodeFromJSXAttribute(
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

  /**
   * Constructs ClassNameExtraction based on provided Literal Node.
   *
   * @param node - Literal Node
   */
  private getLiteralValue(node: TSESTree.Literal): ExtractedClassNamesNode {
    return new ExtractedClassNamesNode({
      start: node.range[0] + 1,
      end: node.range[1] - 1,
      value: `${node.value}`,
      prefix: '',
      suffix: '',
      node,
    });
  }

  /**
   * Constructs ClassNameExtraction based on provided Template Element Node.
   *
   * @param node - TemplateElement Node
   */
  private getTemplateElementValue(
    node: TSESTree.TemplateElement
  ): ExtractedClassNamesNode | null {
    const nodeValue = this.context?.getSourceCode().getText(node);
    const raw = node.value.raw;
    if (nodeValue == null || raw == null) return null;

    // https://github.com/eslint/eslint/issues/13360
    // The problem is that range computation includes the backticks
    // but value.raw does not include them, so there is a mismatch.
    // nodeValue: '`          w-full h-10 rounded          ${'
    // raw: '\n          w-full h-10 rounded\n          '
    // -> start/end does not include the backticks, therefore it matches value.raw.
    const prefix = this.getTemplateElementPrefix(nodeValue, raw);
    const suffix = this.getTemplateElementSuffix(nodeValue, raw);

    return new ExtractedClassNamesNode({
      start: node.range[0],
      end: node.range[1],
      value: raw,
      prefix,
      suffix,
      node,
    });
  }

  private getTemplateElementPrefix(value: string, raw: string): string {
    const idx = value.indexOf(raw);
    return idx === 0 ? '' : value.slice(0, idx);
  }

  private getTemplateElementSuffix(value: string, raw: string): string {
    const idx = value.indexOf(raw);
    return idx === -1 ? '' : value.slice(idx + raw.length);
  }
}
