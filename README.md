<img src="https://raw.githubusercontent.com/bennodev19/eslint-plugin-tailwindcss-jsx/master/.github/banner.png" alt="prettier-plugin-tailwindcss" />

An [ESLint](https://eslint.org/) plugin for [Tailwind CSS](https://tailwindcss.com/) v3.0+ that enforces best practices and consistency with focus on [ReactJS](https://reactjs.org/) (`.jsx` & `.tsx`).

## 📩 Installation

To get started, just install `eslint-plugin-tailwindcss-jsx` as a dev-dependency:
```sh
npm install -D eslint eslint-plugin-tailwindcss-jsx
```
It is also possible to install ESLint globally rather than locally (using `npm install -g eslint`). However, this is not recommended, and any plugins or shareable configs that you use must be installed locally in either case.

## ⚙️ Configuration 

### `.eslintrc.[js/json]`
Use our preset to get reasonable defaults:
```json
// ..
  "extends": [
    "eslint:recommended",
    "plugin:tailwindcss-jsx/recommended"
  ]
// ..
```

You should also specify settings that will be shared across all the plugin rules. ([More about eslint shared settings](https://eslint.org/docs/latest/use/configure/configuration-files#adding-shared-settings))
```json
{
  "settings": {
    "tailwindConfigPath": "tailwind.config.js", // Relative path to the TailwindCSS config file from the root directory
    "attributesRegex": /\b(class|className)\b/g.source, // Regex to match Attribute Nodes that contain TailwindCSS class names
    "calleesRegex": /\b(clsx|cls|classnames)\b/g.source, // Regex to match Call Expression Nodes that contain TailwindCSS class names
    "tagsRegex": /\b(tss)\b/g.source, // Regex to match Tag Expression Nodes that contain TailwindCSS class names
  }
}
```
If you do **not** use a preset you will need to specify individual rules and add extra configuration.

Add `tailwindcss-jsx` to the plugins section:
```json
// ..
  "plugins": [
    "tailwindcss-jsx",
  ]
// ..
```
Enable JSX support
```json
// ..
"parserOptions": {
    "ecmaFeatures": {
      "jsx": true
  }
}
// ..
```
Enable the rules that you would like to use:
```json
// ..
  "plugins": [
    "tailwindcss-jsx/sort-classes": "error",
  ]
// ..
```

#### Sharable configs

**Recommended**

This plugin exports a `recommended` configuration that enforces TailwindCSS best practices. To enable this configuration use the `extends` property in your `.eslintrc` config file:
```json
// ..
"extends": ["eslint:recommended", "plugin:tailwindcss-jsx/recommended"]
// ..
```
See [`eslint` documentation](https://eslint.org/docs/user-guide/configuring/configuration-files#extending-configuration-files) for more information about extending configuration files.

**Note:** These configurations will enable JSX in [parser options](https://eslint.org/docs/latest/use/configure/language-options#specifying-parser-options).

### `eslint.config.js`
> coming soon

## 📜 List of supported rules

- ☑️ Set in the `recommended` configuration
- 🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix)

| Name                                                                    | Description                                                                                                                                  | ☑️ | 🔧 |
| :---------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- | :- | :- |
| [sort-classes](docs/rules/sort-classes.md)                              | Enforces consistent order of TailwindCSS class names based on the officially recommended class name order.                                   | ☑️ | 🔧 |
| [extract-classes](docs/rules/extract-classes.md)                        | Enforces the extraction of TailwindCSS class names if an identifier like `extract-[Container]` is present.                                   |   | 🔧 | 

## 🆔 License
`eslint-plugin-tailwindcss-jsx` is licensed under the [MIT License](https://opensource.org/license/mit-license-php/).

## 🙏 Contribution
### 📒 Resources
- [ESLint Custom Rules Docs](https://eslint.org/docs/latest/extend/custom-rules)
- [Custom ESLint Rule with Typescript Blog](https://medium.com/bigpicture-one/writing-custom-typescript-eslint-rules-with-unit-tests-for-angular-project-f004482551db)
- [How to write custom ESLint RuleBlog](https://developers.mews.com/how-to-write-custom-eslint-rules/)
- [AST Explorer](https://astexplorer.net/)

### 🔴 Debug via Jest Test
- [StackOverflow](https://stackoverflow.com/questions/33247602/how-do-you-debug-jest-tests)

1. Start `Javascript Debug` Terminal
2. Set `🔴 Debug` Point
3. Run test via `pnpm run test --watch`, for example:
   ```sh
   pnpm run test -- extract-tailwind --watch
   ```

## 🌟 Credits
- [`prettier-plugin-tailwindcss`](https://github.com/tailwindlabs/prettier-plugin-tailwindcss) - Inspiration in terms of official sorting
- [eslint-plugin-react](https://www.npmjs.com/package/eslint-plugin-react) - Inspiration in terms of documentation
- [`eslint-plugin-tailwindcss`](https://github.com/francoismassart/eslint-plugin-tailwindcss) - Inspiration in terms of integration tests