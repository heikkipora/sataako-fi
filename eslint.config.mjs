import {fixupPluginRules} from '@eslint/compat'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

// eslint-plugin-react 7.x still uses context APIs removed in ESLint 10; fixupPluginRules shims them.
const reactRecommended = {
  ...react.configs.flat.recommended,
  plugins: {
    react: fixupPluginRules(react)
  }
}

export default [
  ...tseslint.configs.recommended,
  reactRecommended,
  reactHooks.configs.flat.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
]
