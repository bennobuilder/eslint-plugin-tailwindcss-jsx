export function mergeOptionsWithSharedSettings<
  TConfig extends Record<string, any>
>(
  options: Array<any>,
  settings: Record<string, any> = {},
  defaultConfig: Record<string, any> = {}
): TConfig {
  let config = { ...defaultConfig, ...settings };
  if (options.length > 0) {
    config = { ...config, ...options[0] };
  }
  return config as any;
}
