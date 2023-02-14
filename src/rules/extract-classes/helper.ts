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
    className: string,
    extractIdentifierRegex: RegExp
  ): TGetIdentifierFromClassNameResponse {
    const response: TGetIdentifierFromClassNameResponse = {
      newClassName: className,
      identifier: null,
    };

    // Extract identifier value from className and remove it in newClassName
    if (extractIdentifierRegex.test(className)) {
      const identifiers = extractIdentifierRegex.exec(className);
      if (identifiers != null && identifiers.length > 0) {
        response.identifier = extractStringBetweenBrackets(identifiers[0]);
        response.newClassName = className.replace(extractIdentifierRegex, '');
      }
    }

    return response;
  }

  return { getIdentifierFromClassName };
})();

export type TGetIdentifierFromClassNameResponse = {
  newClassName: string;
  identifier: string | null;
};
