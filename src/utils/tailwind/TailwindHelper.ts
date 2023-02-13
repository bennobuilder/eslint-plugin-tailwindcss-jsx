import { RuleContext } from '@typescript-eslint/utils/dist/ts-eslint';
import { TTailwindContext } from 'tailwindcss/lib/lib/setupContextUtils';
import { TailwindContextWrapper } from './TailwindContextWrapper';

export class TailwindHelper<
  TMessageIds extends string,
  TOptions extends any[]
> {
  private context: RuleContext<TMessageIds, TOptions>;
  private tailwindContextWrapper: TailwindContextWrapper<TMessageIds, TOptions>;

  constructor(context: RuleContext<TMessageIds, TOptions>) {
    this.context = context;
    this.tailwindContextWrapper = new TailwindContextWrapper(this.context);
  }

  /**
   * Determines the TailwindCSS context by resolving the path to 'tailwind.config.js' and loading it.
   *
   * @param context - ESLint Rule Context for context information
   * @param config - Configuration object containing a TailwindCSS config path.
   * @returns
   */
  getTailwindContext(configPath?: string): TTailwindContext | null {
    return this.tailwindContextWrapper.getTailwindContext(configPath);
  }
}
