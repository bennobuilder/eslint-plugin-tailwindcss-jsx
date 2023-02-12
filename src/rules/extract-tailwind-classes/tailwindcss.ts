import path from 'path';
import objectHash from 'object-hash';
import {
  createContext as createTailwindContext,
  TTailwindContext,
} from 'tailwindcss/lib/lib/setupContextUtils';
import resolveTailwindConfig from 'tailwindcss/resolveConfig';
import escalade from 'escalade/sync';
import requireFresh from 'import-fresh';
import {
  DEFAULT_TAILWIND_CONFIG_FILE_NAME,
  EXTRACT_IDENTIFIER_REGEX,
} from './constants';
import { isBlank } from '../../utils/helper';
import { RuleContext } from '@typescript-eslint/utils/dist/ts-eslint';
import {
  TConfig,
  TGetIdentifierFromClassNameResponse,
  TMessageIds,
  TOptions,
} from './types';

// Based on: https://github.dev/tailwindlabs/prettier-plugin-tailwindcss
export const { resolveTailwindContext } = (() => {
  const tailwindContextCache = new Map<
    string,
    { context: any; hash: string }
  >();

  function getTailwindConfigPath(
    tailwindConfigPathFromConfig?: string,
    eslintCWD?: string
  ): string | null {
    let tailwindConfigPath: string | null = null;
    const baseDir = eslintCWD != null ? eslintCWD : process.cwd();

    // Resolve TailwindCSS config path based on config
    if (tailwindConfigPathFromConfig != null) {
      tailwindConfigPath = path.resolve(baseDir, tailwindConfigPathFromConfig);
    }
    // Try to find TailwindCSS config path starting from the baseDir
    // and scaling to the parent directory if not found there
    else {
      try {
        tailwindConfigPath =
          escalade(baseDir, (_dir, names) => {
            if (names.includes('tailwind.config.js')) {
              // Will be resolved into absolute
              return DEFAULT_TAILWIND_CONFIG_FILE_NAME;
            }
          }) ?? null;
      } catch {
        // throw silent
      }
    }

    return tailwindConfigPath;
  }

  function getTailwindContext(
    tailwindConfigPath: string
  ): TTailwindContext | null {
    let tailwindContext: TTailwindContext | null = null;

    // Get fresh TailwindCSS config so that its not falsified due to caching
    // https://nodejs.org/api/modules.html#modules_caching
    const tailwindConfig: any = requireFresh(tailwindConfigPath);

    // Suppress "empty content" warning
    if (tailwindConfig == null) {
      tailwindConfig['content'] = ['no-op'];
    }

    const existingTailwindContext =
      tailwindContextCache.get(tailwindConfigPath);
    const tailwindConfigHash = objectHash(tailwindConfig);

    // Check wether the context of the exact TailwindCSS config was already loaded
    if (
      existingTailwindContext != null &&
      existingTailwindContext.hash === tailwindConfigHash
    ) {
      tailwindContext = existingTailwindContext.context;
    }
    // Otherwise, load new TailwindCSS context from the resolved TailwindCSS config
    // and cache it
    else {
      tailwindContext = createTailwindContext(
        resolveTailwindConfig(tailwindConfig)
      );
      tailwindContextCache.set(tailwindConfigPath, {
        context: tailwindContext,
        hash: tailwindConfigHash,
      });
    }

    return tailwindContext;
  }

  /**
   * Determines the TailwindCSS context by resolving the path to 'tailwind.config.js' and loading it.
   *
   * @param context - ESLint Rule Context for context information
   * @param config - Configuration object containing a TailwindCSS config path.
   * @returns
   */
  function resolveTailwindContext(
    context: RuleContext<TMessageIds, TOptions>,
    config?: TConfig
  ): TTailwindContext | null {
    const tailwindConfigPath = getTailwindConfigPath(
      config?.tailwindConfigPath,
      context?.getCwd != null ? context.getCwd() : undefined
    );

    // Get TailwindCSS context
    let tailwindContext: TTailwindContext | null = null;
    if (tailwindConfigPath != null) {
      tailwindContext = getTailwindContext(tailwindConfigPath);
    } else {
      console.warn("Failed to resolve path to 'tailwind.config.js'!");
    }

    if (tailwindContext == null) {
      console.warn(
        `Failed to load 'tailwind.config.js' from '${tailwindConfigPath}'!`
      );
    }

    return tailwindContext;
  }

  return { resolveTailwindContext };
})();

export const { getIdentifierFromClassName } = (() => {
  function extractStringBetweenBrackets(value: string): string {
    const startIndex = value.indexOf('[') + 1;
    const endIndex = value.indexOf(']');
    return value.substring(startIndex, endIndex);
  }

  /**
   * Determines the identifier value from a given className
   * and returns an object containing the updated className
   * and extracted identifier.
   *
   * @param className - ClassName string to extract the identifier from.
   * @returns
   */
  function getIdentifierFromClassName(
    className: string
  ): TGetIdentifierFromClassNameResponse {
    const response: TGetIdentifierFromClassNameResponse = {
      newClassName: className,
      identifier: null,
    };

    // Extract identifier value from className and remove it in newClassName
    if (EXTRACT_IDENTIFIER_REGEX.test(className)) {
      const identifiers = EXTRACT_IDENTIFIER_REGEX.exec(className);
      if (identifiers != null && identifiers.length > 0) {
        response.identifier = extractStringBetweenBrackets(identifiers[0]);
        response.newClassName = className.replace(EXTRACT_IDENTIFIER_REGEX, '');
      }
    }

    return response;
  }

  return { getIdentifierFromClassName };
})();

export const { sortTailwindClassList } = (() => {
  function bigSign(bigIntValue: number) {
    // @ts-ignore
    return (bigIntValue > 0n) - (bigIntValue < 0n);
  }

  /**
   * Sort class list of class names based on the recommended TailwindCSS class order.
   *
   * @param classList - Class list with class names to sort.
   * @param tailwindContext - TailwindCSS context to access the recommended TailwindCSS class order.
   * @returns
   */
  function sortTailwindClassList(
    classList: string[],
    tailwindContext: TTailwindContext
  ) {
    if (tailwindContext.getClassOrder == null) {
      console.warn(
        "No sorting applied! You've a too old TailwindCSS version which is not supported by this eslint-plugin."
      );
      return classList;
    }

    // Get TailwindCSS suggested class name order: [className, order/weight]
    const classNamesWithOrder = tailwindContext.getClassOrder(classList);

    // Order class names based on 'order/weight' value
    return classNamesWithOrder
      .sort(([, a], [, z]) => {
        if (a === z) return 0;
        // if (a === null) return options.unknownClassPosition === 'start' ? -1 : 1
        // if (z === null) return options.unknownClassPosition === 'start' ? 1 : -1
        if (a === null) return -1;
        if (z === null) return 1;
        return bigSign(a - z);
      })
      .map(([className]) => className);
  }

  return { sortTailwindClassList };
})();

/**
 * Extracts the class names, whitespaces, suffix, and prefix from a given className string.
 * It returns the result as an object,
 * and returns null if className is not a string or blank.
 *
 * @param className - ClassName string to be splitted.
 */
export function splitClassName(className: string): {
  classes: string[];
  whitespaces: string[];
  suffix: string;
  prefix: string;
} | null {
  // Check wether there are any classes to split
  if (typeof className !== 'string' || isBlank(className)) {
    return null;
  }

  // Ignore class attributes containing `{{`, to match Prettier behavior:
  // https://github.com/prettier/prettier/blob/main/src/language-html/embed.js#L83-L88
  if (className.includes('{{')) {
    return null;
  }

  // Regex to detect each space beginning but ignore LogicalExpressions ("${xyz}")
  const SEPARATOR_REGEX = /(\$\{[^}]*\}|\s+)/;

  // Split className at each whitespace.
  // Note whitespaces are intensionally not removed during the split.
  const parts = className.split(SEPARATOR_REGEX).filter((part) => part !== '');

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

/**
 * Builds a className string from an array of class names, corresponding whitespaces
 * and the provided suffix & prefix.
 *
 * @param classes - An array of class names to build the className string from.
 * @param whitespaces - An array of whitespaces to be inserted between each class name.
 * @param prefix - A prefix string to be added to the front of the built className string.
 * @param suffix - A suffix string to be added at the end of the built className string.
 * @returns
 */
export function buildInlineClassName(
  classes: string[],
  whitespaces: string[] = [],
  prefix = '',
  suffix = ''
) {
  let result = '';
  for (let i = 0; i < classes.length; i++) {
    result += `${classes[i]}${whitespaces[i] ?? ''}`;
  }
  return prefix + result + suffix;
}

/**
 * TODO
 *
 * @param classes
 * @param identifier
 * @param columnSpaceLeft
 * @returns
 */
export function buildOutsourcedClassName(
  classes: string[],
  identifier: string,
  columnSpaceLeft: number
): string {
  const columnSpaceLeftConst = Array(columnSpaceLeft).join(' ');
  const columnSpaceLeftClassName = Array(columnSpaceLeft + 2).join(' ');

  // TODO Create as extraction Parser and create a advanced one
  // and some presets based on the advanced one. Presets Examples:
  // const Jeff = "flex items-center";
  // const Jeff = `
  //  flex
  //  items-center
  // `;
  // const Jeff = tss`
  //   flex
  //   items-center
  // `;
  return `${columnSpaceLeftConst}const ${identifier} = \`\n${columnSpaceLeftClassName}${classes.join(
    `\n${columnSpaceLeftClassName}`
  )}\n${columnSpaceLeftConst}\`;`;
}
