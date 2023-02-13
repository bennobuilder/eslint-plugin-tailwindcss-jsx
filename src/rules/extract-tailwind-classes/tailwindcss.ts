import { TTailwindContext } from 'tailwindcss/lib/lib/setupContextUtils';
import { EXTRACT_IDENTIFIER_REGEX } from './constants';
import { TGetIdentifierFromClassNameResponse } from './types';

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
