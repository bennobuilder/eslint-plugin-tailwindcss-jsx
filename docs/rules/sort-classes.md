# Enforces consistent order (`tailwindcss-jsx/sort-classes`)

Allows you to enforce a consistent order of TailwindCSS class names based on the [officially recommended class name order](https://tailwindcss.com/docs/editor-setup#automatic-class-sorting-with-prettier).

- ☑️ Set in the `recommended` configuration to `warning`
- 🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix)

## Rule Details

Examples of **incorrect** code for this rule (before):
```jsx
<button class="text-white px-4 sm:px-8 py-2 sm:py-3 bg-sky-700 hover:bg-sky-800">...</button>
```

Examples of **correct** code for this rule (after):
```jsx
<button class="bg-sky-700 px-4 py-2 text-white hover:bg-sky-800 sm:px-8 sm:py-3">...</button>
```

## Rule Options
```js
// ...
"tailwindcss-jsx/sort-classes": [<enabled>, {
  "tailwindConfigPath: <string>,
  "attributesRegex": <string>,
  "calleesRegex": <string>,
  "tagsRegex": <string>,
}]
// ...
```

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
