export class ClassNameBuilder {
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
  public buildInlineClassName(
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
  public buildOutsourcedClassName(
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
}
