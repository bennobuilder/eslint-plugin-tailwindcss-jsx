<img src="https://raw.githubusercontent.com/bennodev19/eslint-plugin-tailwindcss-jsx/master/.github/banner.png" alt="prettier-plugin-tailwindcss" />

An [ESLint](https://eslint.org/) plugin for [Tailwind CSS](https://tailwindcss.com/) v3.0+ that enforces best practices and consistency with focus on [ReactJS](https://reactjs.org/) (`.jsx` & `.tsx`).

## 📩 Installation

To get started, just install `eslint-plugin-tailwindcss-jsx` as a dev-dependency:
```sh
npm install -D eslint eslint-plugin-tailwindcss-jsx
```
It is also possible to install ESLint globally rather than locally (using `npm install -g eslint`). However, this is not recommended, and any plugins or shareable configs that you use must be installed locally in either case.

## ⚙️ Configuration (`.eslintrc.[js/json]`)
Use our preset to get reasonable defaults:
```json
// ..
  "extends": [
    "eslint:recommended",
    "plugin:tailwindcss-jsx/recommended"
  ]
// ..
```

If you do not use a preset you will need to specify individual rules and add extra configuration.

Add `tailwindcss-jsx` to the plugins section:
```json
// ..
  "plugins": [
    "tailwindcss-jsx",
  ]
// ..
```
Enable the rules that you would like to use:
```json
// ..
  "plugins": [
    "tailwindcss-jsx/extract-tailwind-classes": "error",
  ]
// ..
```

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
- [`eslint-plugin-tailwindcss`](https://github.com/francoismassart/eslint-plugin-tailwindcss)
- [`prettier-plugin-tailwindcss`](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)