export type TMessageIds = 'invalidInline' | 'invalidOrder';
export type TConfig = {
  /**
   * Path to the TailwindCSS configuration file.
   * If no TailwindCSS file could be found, the sorting functionality won't work.
   *
   * @default {root}/tailwind.config.js
   */
  tailwindConfigPath?: string;
  /**
   * Regex to identify relevant JSXAttribute Nodes to lint.
   * By default it matches "class" and "className"
   *
   * @default /\b(class|className)\b/g
   */
  classNameRegex?: { regex: RegExp[]; overwrite?: boolean } | RegExp;
  /**
   * Callees that work with TailwindCSS class names and should be matched and sorted
   * besides the raw class names found in JSXAttribute Nodes.
   * @default ["clsx", "ctl", "classnames"]
   */
  callees?: string[];
  /**
   * Tags that work with TailwindCSS class names and should be matched and sorted
   * besides the raw class names found in JSXAttribute Nodes.
   *
   * @default ["tss"]
   */
  tags?: string[];

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
  type: 'Node';
};

export type TClassNameExtractionTree = {
  type: 'NodeTree';
};

export type TGetIdentifierFromClassNameResponse = {
  newClassName: string;
  identifier: string | null;
};
