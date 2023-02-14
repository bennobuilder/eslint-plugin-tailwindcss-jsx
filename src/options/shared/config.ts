export function getConfig<
  TOptions extends Array<any>,
  TSettings extends Record<string, any>,
  TConfig extends Record<string, any>
>(options: TOptions, settings?: TSettings): TConfig {
  let config = {};
  if (settings != null) {
    config = { ...config, ...settings };
  }
  if (options.length > 0) {
    config = { ...config, ...options[0] };
  }
  return config as any;
}
