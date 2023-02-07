export function isBlank(value: string): boolean {
  return !value || /^\s*$/.test(value);
}
