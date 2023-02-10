import { TSESTree } from '@typescript-eslint/utils';

export type TMessageIds = 'invalidInline' | 'invalidOrder';
export type TConfig = {
  /**
   * Path to the TailwindCSS configuration file.
   * If no TailwindCSS file could be found, the sorting functionality won't work.
   * @default {root}/tailwind.config.js
   */
  tailwindConfigPath?: string;
  /**
   * Regex to identify relevant JSXAttribute Nodes to lint.
   * By default it matches "class" and "className"
   * @default /\b(class|className)\b/g
   */
  classNameRegex?: { regex: RegExp[]; overwrite?: boolean } | RegExp;
  /**
   * Callees that work with class names and should be matched and sorted
   * besides the raw class names found in JSXAttribute Nodes.
   * @default ["clsx", "ctl", "classnames"]
   */
  callees?: string[];

  /**
   *
   */
  extract?:
    | {
        extractionParser?: (classNames: string) => string;
        extractDeep?: boolean;
      }
    | boolean;
};
export type TOptions = [TConfig];

export type TClassNameExtraction = {
  type: 'ClassNameExtraction';
  start: number;
  end: number;
  value: string;
  prefix: string;
  suffix: string;
  node: TSESTree.Node;
};

export type TClassNameExtractionTree = {
  type: 'ClassNameExtractionTree';
  node: TSESTree.Node;
  children: (TClassNameExtractionTree | TClassNameExtraction)[];
};
