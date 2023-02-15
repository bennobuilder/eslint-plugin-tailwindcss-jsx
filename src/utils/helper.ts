/**
 * Checks whether a string is blank.
 *
 * @param value - String to be checked.
 */
export function isBlank(value: string): boolean {
  return !value || /^\s*$/.test(value);
}

export function hasAlphabeticChar(value: string): boolean {
  return !value || /.*[a-zA-Z]+.*/.test(value);
}

/**
 * Checks whether two arrays are equal.
 *
 * @param arr1 - First array to be compared.
 * @param arr2 - Second array to be compared.
 */
export function areArraysEquals(arr1: any[], arr2: any[]): boolean {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

export function matchesRegex(name: string, regex: RegExp[] | RegExp): boolean {
  const regexArray = Array.isArray(regex) ? regex : [regex];
  let match = false;
  for (const regex of regexArray) {
    match = new RegExp(regex).test(name);
    if (match) break;
  }
  return match;
}
