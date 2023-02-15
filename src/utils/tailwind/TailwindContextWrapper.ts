import { RuleContext } from '@typescript-eslint/utils/dist/ts-eslint';
import escalade from 'escalade/sync';
import objectHash from 'object-hash';
import path from 'path';
import requireFresh from 'import-fresh';
import {
  createContext as createTailwindContext,
  TTailwindContext,
} from 'tailwindcss/lib/lib/setupContextUtils';
import resolveTailwindConfig from 'tailwindcss/resolveConfig';
import { DEFAULT_TAILWIND_CONFIG_FILE_NAME } from '../../constants';

// Based on: https://github.dev/tailwindlabs/prettier-plugin-tailwindcss
export class TailwindContextWrapper<
  TMessageIds extends string,
  TOptions extends any[]
> {
  private context: RuleContext<TMessageIds, TOptions>;
  private tailwindContextCache: TContextCache = new Map();

  constructor(context: RuleContext<TMessageIds, TOptions>) {
    this.context = context;
  }

  /**
   * Determines the TailwindCSS context by resolving the path to 'tailwind.config.js' and loading it.
   *
   * @param context - ESLint Rule Context for context information
   * @param config - Configuration object containing a TailwindCSS config path.
   * @returns
   */
  getTailwindContext(configPath?: string): TTailwindContext | null {
    const tailwindConfigPath = this.getTailwindConfigPath(
      configPath,
      this.context?.getCwd != null ? this.context.getCwd() : undefined
    );

    // Get TailwindCSS context
    let tailwindContext: TTailwindContext | null = null;
    if (tailwindConfigPath != null) {
      tailwindContext = this.resolveTailwindContext(tailwindConfigPath);
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

  //------------------------------------------------------------------------------
  // Helper
  //------------------------------------------------------------------------------

  private getTailwindConfigPath(
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
            if (names.includes(DEFAULT_TAILWIND_CONFIG_FILE_NAME)) {
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

  private resolveTailwindContext(
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
      this.tailwindContextCache.get(tailwindConfigPath);
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
      this.tailwindContextCache.set(tailwindConfigPath, {
        context: tailwindContext,
        hash: tailwindConfigHash,
      });
    }

    return tailwindContext;
  }
}

type TContextCache = Map<string, TContextCacheElement>;

type TContextCacheElement = {
  context: TTailwindContext;
  hash: string;
};
