import { JSONSchema4 } from '@typescript-eslint/utils/dist/json-schema';

export const TAILWIND_SCHEMA_DEFAULTS = {
  tailwindConfigPath: 'tailwind.config.js',
  classNameRegex: /\b(class|className)\b/g.source,
  calleesRegex: /\b(clsx|cls|classnames)\b/g.source,
  tagsRegex: /\b(tss)\b/g.source,
};

export const SHARED_TAILWIND_SCHEMA: JSONSchema4 = {
  type: 'object',
  // required: [],
  properties: {
    tailwindConfigPath: {
      type: 'string',
      default: TAILWIND_SCHEMA_DEFAULTS.tailwindConfigPath,
    },
    classNameRegex: {
      type: 'string',
      format: 'regex',
      default: TAILWIND_SCHEMA_DEFAULTS.classNameRegex,
    },
    calleesRegex: {
      type: 'string',
      format: 'regex',
      default: TAILWIND_SCHEMA_DEFAULTS.calleesRegex,
    },
    tagsRegex: {
      type: 'string',
      format: 'regex',
      default: TAILWIND_SCHEMA_DEFAULTS.tagsRegex,
    },
  },
  additionalProperties: false,
};

export type TSharedTailwindSchema = {
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
  classNameRegex?: string;
  /**
   * Regex to identify relevant Callees
   * that work with TailwindCSS class names and should be matched and sorted
   * besides the raw class names found in JSXAttribute Nodes.
   * @default /\b(clsx|cls|classnames)\b/g
   */
  calleesRegex?: string;
  /**
   * Regex to identify relevant Tags
   * that work with TailwindCSS class names and should be matched and sorted
   * besides the raw class names found in JSXAttribute Nodes.
   *
   * @default /\b(tss)\b/g
   */
  tagsRegex?: string;
};
