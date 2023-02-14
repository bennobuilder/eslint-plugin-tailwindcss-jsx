import { TSESTree } from '@typescript-eslint/utils';
import { ExtractedClassNamesNode } from './ExtractedClassNamesNode';

export class ExtractedClassNamesTree {
  public node: TSESTree.Node;
  public children: (ExtractedClassNamesTree | ExtractedClassNamesNode)[];
  private flattened: ExtractedClassNamesNode[] | null = null;

  constructor(options: {
    node: TSESTree.Node;
    children: (ExtractedClassNamesTree | ExtractedClassNamesNode)[];
  }) {
    this.node = options.node;
    this.children = options.children;
  }

  /**
   * Flattens a tree of class name extractions into a linear array.
   */
  public flatten(): ExtractedClassNamesNode[] {
    if (this.flattened != null) return this.flattened;
    const flattened = ExtractedClassNamesTree.flattenDeep(this);
    this.flattened = flattened;
    return flattened;
  }

  //------------------------------------------------------------------------------
  // Helper
  //------------------------------------------------------------------------------

  /**
   * Flattens a tree of class name extractions into a linear array.
   *
   * @param value - ClassNameExtractionTree or ClassNameExtraction
   */
  static flattenDeep(
    value: ExtractedClassNamesTree | ExtractedClassNamesNode | null
  ): ExtractedClassNamesNode[] {
    if (value == null) return [];

    const extractedNodes: ExtractedClassNamesNode[] = [];

    if (value instanceof ExtractedClassNamesTree) {
      for (const child of value.children) {
        extractedNodes.push(...this.flattenDeep(child));
      }
    } else {
      if (value.isUsable) extractedNodes.push(value);
    }

    return extractedNodes;
  }
}
