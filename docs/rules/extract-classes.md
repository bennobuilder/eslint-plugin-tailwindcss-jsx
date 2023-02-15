# Enforces extraction if identifier present (`tailwindcss-jsx/extract-classes`)

Allows you to enforce the extraction of TailwindCSS class names if an identifier is specified. The identifier consists of the keyword extract followed by a name that specifies where to store the extracted class names.
```
extract-[<name>]
```

This feature can be useful for projects that need to separate CSS classes from the main application code or to generate a separate CSS file with Tailwind classes.

To use this feature, add the extract identifier followed by a name to your class names, and the plugin will extract any Tailwind CSS classes used in that class names block and store them at the end of the file.

- ☑️ Set in the `recommended` configuration to `warning`
- 🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix)

## Rule Details

Examples of **incorrect** code for this rule (before):
```jsx
import React from 'react';

const About: React.FC = () => {
  return (
    <div className="sm:p-0 p-0 container">
      <p id="text1" className="text-xl p-4 lg:p-8 font-bold extract-[Text1]">${dummyText}</p>
    </div>
  );
};

export default About;
```

Examples of **correct** code for this rule (after):
```jsx
import React from 'react';

const About: React.FC = () => {
  return (
    <div className="container p-0 sm:p-0">
      <p id="text1" className={Text1}>${dummyText}</p>
    </div>
  );
};

export default About;

const Text1 = \`
  p-4
  text-xl
  font-bold
  lg:p-8
\`;
```

## Rule Options
```js
// ...
"tailwindcss-jsx/sort-classes": [<enabled>, {
  "sort": <boolean>,
  "tailwindConfigPath: <string>,
  "attributesRegex": <string>,
  "calleesRegex": <string>,
  "tagsRegex": <string>,
}]
// ...
```

### `sort`
> Default: `true`

Whether to sort the TalwindCSS class names in the same step as the extraction takes place. The sorting is the same as in the [`sort-classes`](sort-classes.md) rule.


### `tailwindConfigPath`
> Default: ([Shared settings](https://eslint.org/docs/latest/use/configure/configuration-files#adding-shared-settings)), if not set: `tailwind.config.js`

The plugin will attempt to load the `tailwind.config.js` file at the root of your project by default. This file contains your customized colors, spacing, and screens which are used by the plugin.

If you prefer to use a Tailwind CSS config file with a different name or in a different location, you can provide a custom file path using the plugin's configuration options. For example, you can set the file path to `myConfigurations/myTailwindConfig.js`.

### `attributesRegex`
> Default: ([Shared settings](https://eslint.org/docs/latest/use/configure/configuration-files#adding-shared-settings)), if not set: `/\b(class|className)\b/g.source`

If you use custom attributes to specify class names besides the typical `class` or `className` you should ad its name to the regex of known attributes to ensure that it is noted by the rule.

### `calleesRegex`
> Default: ([Shared settings](https://eslint.org/docs/latest/use/configure/configuration-files#adding-shared-settings)), if not set: `/\b(clsx|cls|classnames)\b/g.source`

If you use a utility library like `clsx` or `cls`, you should add its name to the regex of known utility functions to ensure that it is noted by the rule. 

For best results, we recommend gathering all declarative classnames together and avoiding mixing them with conditional class names. Additionally, we recommend placing all conditional classnames at the end of the list to improve readability and maintainability of your code.

```js
// Not so good
const buttonClasses = ctl(`
  ${fullWidth ? "w-full" : "w-10 p-8"}
  flex
  container
  ${hasError && "bg-red p-4"}
  lg:py-4
  sm:py-6
`);

// Better 
const buttonClasses = ctl(`
  flex
  container
  lg:py-4
  sm:py-6
  ${fullWidth ? "w-full" : "w-10 p-8"}
  ${hasError && "bg-red p-4"}
`);
```

### `tagsRegex`
> Default: ([Shared settings](https://eslint.org/docs/latest/use/configure/configuration-files#adding-shared-settings)), if not set: `/\b(tss)\b/g.source`

If you use a tagged templates, you should add its name to the regex of known utility tags to ensure that it is noted by the rule. 

For best results, we recommend gathering all declarative classnames together and avoiding mixing them with conditional class names. Additionally, we recommend placing all conditional classnames at the end of the list to improve readability and maintainability of your code.

```js
// Not so good
const Button = tss`
  ${fullWidth ? "w-full" : "w-10 p-8"}
  flex
  container
  ${hasError && "bg-red p-4"}
  lg:py-4
  sm:py-6
`;

// Better 
const Button = tss`
  flex
  container
  lg:py-4
  sm:py-6
  ${fullWidth ? "w-full" : "w-10 p-8"}
  ${hasError && "bg-red p-4"}
`;
```
