import { TSESTree } from '@typescript-eslint/utils';
import { hasAlphabeticChar, isBlank } from '../helper';

export class ExtractedClassNamesNode {
  public readonly node: TSESTree.Node;

  public isUsable: boolean;

  public readonly start: number;
  public readonly end: number;

  private value: string;
  private splitted: TSplittedClassNames | null = null;
  private resplit = true;

  public readonly prefix: string;
  public readonly suffix: string;

  constructor(options: {
    node: TSESTree.Node;
    start: number;
    end: number;
    value: string;
    prefix: string;
    suffix: string;
  }) {
    this.node = options.node;
    this.start = options.start;
    this.end = options.end;
    this.prefix = options.prefix;
    this.suffix = options.suffix;
    this.setValue(options.value);
  }

  public setValue(value: string) {
    this.value = value;
    this.isUsable = this.isValueUsable(this.value);
    this.resplit = true;
  }

  public getValue(): string {
    return this.value;
  }

  public split(): TSplittedClassNames | null {
    if (this.splitted != null && !this.resplit) return this.splitted;
    this.splitted = this.splitClassName(this.value);
    this.resplit = false;
    return this.splitted;
  }

  /**
   * Extracts the class names, whitespaces, suffix, and prefix from a given className string.
   * It returns the result as an object,
   * and returns null if className is not a string or blank.
   *
   * @param className - ClassName string to be splitted.
   */
  private splitClassName(className: string): TSplittedClassNames | null {
    if (!this.isUsable) return null;

    // Regex to detect each space beginning but ignore LogicalExpressions ("${xyz}")
    const SEPARATOR_REGEX = /(\$\{[^}]*\}|\s+)/;

    // Split className at each whitespace.
    // Note whitespaces are intensionally not removed during the split.
    const parts = className
      .split(SEPARATOR_REGEX)
      .filter((part) => part !== '');

    // Handle head & tail space which is relevant when having each class in a line
    const headSpace = SEPARATOR_REGEX.test(parts[0]);
    const tailSpace = SEPARATOR_REGEX.test(parts[parts.length - 1]);
    let prefix = '';
    if (headSpace) {
      prefix = `${parts.shift() ?? ''}`;
    }
    let suffix = '';
    if (tailSpace) {
      suffix = `${parts.pop() ?? ''}`;
    }

    // Separate classes from whitespaces
    const classes = parts.filter((_, i) => i % 2 === 0);
    const whitespaces = parts.filter((_, i) => i % 2 !== 0);

    return {
      classes,
      whitespaces,
      suffix,
      prefix,
    };
  }

  //------------------------------------------------------------------------------
  // Helper
  //------------------------------------------------------------------------------

  private isValueUsable(value: string): boolean {
    return (
      typeof this.value === 'string' &&
      !isBlank(this.value) &&
      hasAlphabeticChar(this.value) &&
      // Ignore class attributes containing `{{`, to match Prettier behavior:
      // https://github.com/prettier/prettier/blob/main/src/language-html/embed.js#L83-L88
      !value.includes('{{')
    );
  }
}

type TSplittedClassNames = {
  classes: string[];
  whitespaces: string[];
  suffix: string;
  prefix: string;
};
